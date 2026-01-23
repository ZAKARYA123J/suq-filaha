defmodule RealtimeGatewayWeb.NegotiationChannel do
  use RealtimeGatewayWeb, :channel
  require Logger

  @backend_api_url System.get_env("BACKEND_API_URL", "http://localhost:3000")

  def join("negotiation:" <> negotiation_id, _params, socket) do
    user_id = socket.assigns.userId
    Logger.info("User #{user_id} attempting to join negotiation: #{negotiation_id}")

    case verify_negotiation_access(user_id, negotiation_id) do
      {:ok, negotiation} ->
        Logger.info("User #{user_id} authorized for negotiation: #{negotiation_id}")

        socket = socket
        |> assign(:negotiation_id, negotiation_id)
        |> assign(:negotiation, negotiation)

        send(self(), :after_join)
        {:ok, socket}

      {:error, reason} ->
        Logger.warn("User #{user_id} denied access to negotiation #{negotiation_id}: #{reason}")
        {:error, %{reason: reason}}
    end
  end

  def handle_info(:after_join, socket) do
    user_id = socket.assigns.userId
    negotiation_id = socket.assigns.negotiation_id

    # Track user presence
    RealtimeGatewayWeb.Presence.track_user(socket, negotiation_id)

    # Load previous messages
    case load_previous_messages(negotiation_id) do
      {:ok, messages} ->
        push(socket, "previous_messages", %{messages: messages})
      {:error, reason} ->
        Logger.error("Failed to load previous messages: #{reason}")
    end

    # Check for queued messages
    case RealtimeGateway.OfflineMessageQueue.get_queued_messages(negotiation_id, user_id) do
      {:ok, queued_messages} when length(queued_messages) > 0 ->
        push(socket, "queued_messages", %{messages: queued_messages})
        # Mark queued messages as delivered
        message_ids = Enum.map(queued_messages, & &1.id)
        RealtimeGateway.OfflineMessageQueue.mark_messages_delivered(negotiation_id, user_id, message_ids)
      {:ok, _} ->
        # No queued messages
        :ok
      {:error, reason} ->
        Logger.error("Failed to get queued messages: #{reason}")
    end

    # Broadcast user joined
    broadcast(socket, "user_joined", %{
      userId: user_id,
      negotiationId: negotiation_id,
      joinedAt: DateTime.utc_now()
    })

    {:noreply, socket}
  end

  def handle_in("new_message", %{"content" => content}, socket) do
    user_id = socket.assigns.userId
    negotiation_id = socket.assigns.negotiation_id
    user_type = get_user_type(user_id, socket.assigns.negotiation)

    # First persist message via Node.js API
    case create_message_api(negotiation_id, content, user_id, user_type) do
      {:ok, persisted_message} ->
        message = %{
          id: persisted_message["id"],
          content: content,
          senderId: user_id,
          senderType: user_type,
          createdAt: persisted_message["createdAt"] || DateTime.utc_now()
        }

        # Broadcast to all connected users
        broadcast(socket, "new_message", message)

        # Check for offline users and queue messages
        queue_message_for_offline_users(negotiation_id, message)

        {:reply, {:ok, message}, socket}

      {:error, reason} ->
        Logger.error("Failed to persist message: #{reason}")
        {:reply, {:error, %{reason: "Failed to save message"}}, socket}
    end
  end

  def handle_in("typing", %{"typing" => typing}, socket) do
    user_id = socket.assigns.userId
    negotiation_id = socket.assigns.negotiation_id

    broadcast_from(socket, "typing", %{
      userId: user_id,
      negotiationId: negotiation_id,
      typing: typing
    })

    {:noreply, socket}
  end

  def handle_in("end_negotiation", %{"status" => status}, socket) do
    user_id = socket.assigns.userId
    negotiation_id = socket.assigns.negotiation_id

    # Update negotiation status via API
    case update_negotiation_status_api(negotiation_id, status) do
      {:ok, _updated_negotiation} ->
        broadcast(socket, "negotiation_ended", %{
          negotiationId: negotiation_id,
          status: status,
          endedBy: user_id,
          endedAt: DateTime.utc_now()
        })

        {:reply, {:ok, %{status: status}}, socket}

      {:error, reason} ->
        Logger.error("Failed to end negotiation: #{reason}")
        {:reply, {:error, %{reason: "Failed to end negotiation"}}, socket}
    end
  end

  def terminate(_reason, socket) do
    user_id = socket.assigns.userId
    negotiation_id = socket.assigns.negotiation_id

    # Untrack user presence
    RealtimeGatewayWeb.Presence.untrack_user(socket, negotiation_id)

    broadcast(socket, "user_left", %{
      userId: user_id,
      negotiationId: negotiation_id,
      leftAt: DateTime.utc_now()
    })

    :ok
  end

  # Private helper functions

  defp verify_negotiation_access(user_id, negotiation_id) do
    case Req.get("#{@backend_api_url}/api/negotiations/#{negotiation_id}") do
      {:ok, %{status: 200, body: %{"data" => negotiation}}} ->
        buyer_id = negotiation["buyerId"]
        farmer_id = negotiation["farmerId"]

        if user_id == buyer_id or user_id == farmer_id do
          {:ok, negotiation}
        else
          {:error, "Unauthorized access to negotiation"}
        end

      {:ok, %{status: 404}} ->
        {:error, "Negotiation not found"}

      {:error, reason} ->
        Logger.error("Failed to verify negotiation access: #{inspect(reason)}")
        {:error, "Failed to verify access"}
    end
  end

  defp load_previous_messages(negotiation_id) do
    case Req.get("#{@backend_api_url}/api/negotiations/#{negotiation_id}/messages") do
      {:ok, %{status: 200, body: %{"data" => messages}}} ->
        {:ok, messages}

      {:ok, %{status: 404}} ->
        {:ok, []}

      {:error, reason} ->
        Logger.error("Failed to load previous messages: #{inspect(reason)}")
        {:error, "Failed to load messages"}
    end
  end

  defp create_message_api(negotiation_id, content, sender_id, sender_type) do
    case Req.post("#{@backend_api_url}/api/negotiations/#{negotiation_id}/messages",
          json: %{
            "content" => content,
            "senderId" => sender_id,
            "senderType" => sender_type
          }) do
      {:ok, %{status: 201, body: %{"data" => message}}} ->
        {:ok, message}

      {:error, reason} ->
        Logger.error("Failed to create message: #{inspect(reason)}")
        {:error, "Failed to create message"}
    end
  end

  defp update_negotiation_status_api(negotiation_id, status) do
    case Req.patch("#{@backend_api_url}/api/negotiations/#{negotiation_id}",
          json: %{"status" => status}) do
      {:ok, %{status: 200, body: %{"data" => negotiation}}} ->
        {:ok, negotiation}

      {:error, reason} ->
        Logger.error("Failed to update negotiation status: #{inspect(reason)}")
        {:error, "Failed to update status"}
    end
  end

  defp get_user_type(user_id, negotiation) do
    cond do
      user_id == negotiation["buyerId"] -> "BUYER"
      user_id == negotiation["farmerId"] -> "FARMER"
      true -> "UNKNOWN"
    end
  end

  defp queue_message_for_offline_users(negotiation_id, message) do
    negotiation = get_negotiation_from_cache(negotiation_id)
    if negotiation do
      buyer_id = negotiation["buyerId"]
      farmer_id = negotiation["farmerId"]

      RealtimeGateway.OfflineMessageQueue.queue_message(negotiation_id, message, buyer_id, farmer_id)
    else
      Logger.error("Failed to queue message: negotiation not found in cache")
    end
  end

  defp get_negotiation_from_cache(negotiation_id) do
    # In a real implementation, you might cache negotiations
    # For now, we'll fetch from the API
    case Req.get("#{@backend_api_url}/api/negotiations/#{negotiation_id}") do
      {:ok, %{status: 200, body: %{"data" => negotiation}}} ->
        negotiation
      _ ->
        nil
    end
  end
end
