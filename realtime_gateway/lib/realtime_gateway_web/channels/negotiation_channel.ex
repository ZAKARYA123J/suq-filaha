defmodule RealtimeGatewayWeb.NegotiationChannel do
  use RealtimeGatewayWeb, :channel
  require Logger

  @backend_api_url System.get_env("BACKEND_API_URL", "http://localhost:3000")

  def join("negotiation:" <> negotiation_id, _params, socket) do
    user_id = socket.assigns.userId
    token = Map.get(socket.assigns, :token)
    Logger.info("User #{user_id} attempting to join negotiation: #{negotiation_id}")

    case verify_negotiation_access(user_id, token, negotiation_id) do
      {:ok, negotiation} ->
        # Allow access to all statuses except REJECTED
        # if negotiation["status"] != "REJECTED" do
        #   Logger.info("User #{user_id} authorized for negotiation: #{negotiation_id}")

        # else
        #   Logger.warning("Negotiation #{negotiation_id} is rejected")
        #   {:error, %{reason: "Negotiation has been rejected"}}
        # end
        socket =
          socket
          |> assign(:negotiation_id, negotiation_id)
          |> assign(:negotiation, negotiation)

        send(self(), :after_join)
        {:ok, socket}

      {:error, reason} ->
        Logger.warning(
          "User #{user_id} denied access to negotiation #{negotiation_id}: #{reason}"
        )

        {:error, %{reason: reason}}
    end
  end

  def handle_info(:after_join, socket) do
    user_id = socket.assigns.userId
    negotiation_id = socket.assigns.negotiation_id
    token = Map.get(socket.assigns, :token)

    # Track user presence
    RealtimeGatewayWeb.Presence.track_user(socket, negotiation_id)

    # Load previous messages
    case load_previous_messages(negotiation_id, token) do
      {:ok, messages} ->
        push(socket, "previous_messages", %{messages: messages})

      {:error, reason} ->
        Logger.error("Failed to load previous messages: #{reason}")
    end

    # Check for queued messages
    case RealtimeGateway.OfflineMessageQueue.get_queued_messages(negotiation_id, user_id) do
      {:ok, [_ | _] = queued_messages} ->
        push(socket, "queued_messages", %{messages: queued_messages})
        # Mark queued messages as delivered
        message_ids = Enum.map(queued_messages, & &1.id)

        RealtimeGateway.OfflineMessageQueue.mark_messages_delivered(
          negotiation_id,
          user_id,
          message_ids
        )

      {:ok, []} ->
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
    token = Map.get(socket.assigns, :token)
    negotiation = socket.assigns.negotiation

    # Check if negotiation is not REJECTED
    if negotiation["status"] == "REJECTED" do
      {:reply, {:error, %{reason: "Cannot send messages. Negotiation has been rejected"}}, socket}
    else
      user_type = get_user_type(user_id, negotiation)

      # First persist message via Node.js API
      case create_message_api(token, negotiation_id, content, user_id, user_type) do
        {:ok, persisted_message} ->
          message = %{
            id: persisted_message["id"],
            content: content,
            senderId: user_id,
            senderType: user_type,
            createdAt: persisted_message["createdAt"] || DateTime.utc_now()
          }

          broadcast(socket, "new_message", message)

          queue_message_for_offline_users(socket.assigns.negotiation, negotiation_id, message)

          {:reply, {:ok, message}, socket}

        {:error, reason} ->
          Logger.error("Failed to persist message: #{reason}")
          {:reply, {:error, %{reason: "Failed to save message"}}, socket}
      end
    end
  end

  def handle_in("end_negotiation", %{"status" => status}, socket)
      when status in ["REJECTED", "CANCELLED", "EXPIRED"] do
    user_id = socket.assigns.userId
    negotiation_id = socket.assigns.negotiation_id
    token = Map.get(socket.assigns, :token)

    # Update negotiation status via API
    case update_negotiation_status_api(token, negotiation_id, status) do
      {:ok, updated_negotiation} ->
        # Update socket with new negotiation state
        socket = assign(socket, :negotiation, updated_negotiation)

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

  def handle_in("end_negotiation", %{"status" => invalid_status}, socket) do
    {:reply, {:error, %{reason: "Invalid status: #{invalid_status}"}}, socket}
  end

  def handle_in("typing", %{"typing" => is_typing}, socket) do
    user_id = socket.assigns.userId
    negotiation_id = socket.assigns.negotiation_id

    # Broadcast typing status to other users
    broadcast_from(socket, "user_typing", %{
      userId: user_id,
      negotiationId: negotiation_id,
      typing: is_typing
    })

    {:noreply, socket}
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

  defp verify_negotiation_access(user_id, token, negotiation_id) do
    with {:ok, token} <- require_token(token),
         {:ok, resp} <- api_get("/api/negotiations/#{negotiation_id}", token) do
      case resp do
        %{status: 200, body: negotiation} when is_map(negotiation) ->
          buyer_id = negotiation["buyerId"]
          farmer_id = negotiation["farmerId"]

          if user_id == buyer_id or user_id == farmer_id do
            {:ok, negotiation}
          else
            {:error, "Unauthorized access to negotiation"}
          end

        %{status: 401} ->
          {:error, "Authentication required"}

        %{status: 403} ->
          {:error, "Unauthorized"}

        %{status: 404} ->
          {:error, "Negotiation not found"}

        %{status: status, body: body} ->
          Logger.error(
            "Unexpected verify negotiation response: status=#{status} body=#{inspect(body)}"
          )

          {:error, "Failed to verify access"}
      end
    else
      {:error, reason} ->
        {:error, reason}
    end
  end

  defp load_previous_messages(negotiation_id, token) do
    case api_get("/api/negotiations/#{negotiation_id}/messages", token) do
      {:ok, %{status: 200, body: messages}} when is_list(messages) ->
        {:ok, messages}

      {:ok, %{status: 401}} ->
        {:error, "Authentication required"}

      {:ok, %{status: 403}} ->
        {:error, "Unauthorized"}

      {:ok, %{status: 404}} ->
        {:ok, []}

      {:ok, %{status: status, body: body}} ->
        Logger.error("Unexpected load messages response: status=#{status} body=#{inspect(body)}")
        {:error, "Failed to load messages"}

      {:error, reason} ->
        Logger.error("Failed to load previous messages: #{inspect(reason)}")
        {:error, "Failed to load messages"}
    end
  end

  defp create_message_api(token, negotiation_id, content, sender_id, sender_type) do
    with {:ok, token} <- require_token(token),
         {:ok, resp} <-
           api_post(
             "/api/negotiations/#{negotiation_id}/messages",
             token,
             %{
               "content" => content,
               "senderId" => sender_id,
               "senderType" => sender_type
             }
           ) do
      case resp do
        %{status: 201, body: message} when is_map(message) ->
          {:ok, message}

        %{status: 401} ->
          {:error, "Authentication required"}

        %{status: 403} ->
          {:error, "Unauthorized"}

        %{status: status, body: body} ->
          Logger.error(
            "Unexpected create message response: status=#{status} body=#{inspect(body)}"
          )

          {:error, "Failed to create message"}
      end
    else
      {:error, reason} ->
        Logger.error("Failed to create message: #{inspect(reason)}")
        {:error, "Failed to create message"}
    end
  end

  defp update_negotiation_status_api(token, negotiation_id, status) do
    with {:ok, token} <- require_token(token),
         {:ok, resp} <-
           api_patch("/api/negotiations/#{negotiation_id}/status", token, %{"status" => status}) do
      case resp do
        %{status: 200, body: negotiation} when is_map(negotiation) ->
          {:ok, negotiation}

        %{status: 401} ->
          {:error, "Authentication required"}

        %{status: 403} ->
          {:error, "Unauthorized"}

        %{status: status, body: body} ->
          Logger.error(
            "Unexpected update negotiation status response: status=#{status} body=#{inspect(body)}"
          )

          {:error, "Failed to update status"}
      end
    else
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

  defp queue_message_for_offline_users(negotiation, negotiation_id, message) do
    if is_map(negotiation) do
      buyer_id = negotiation["buyerId"]
      farmer_id = negotiation["farmerId"]

      RealtimeGateway.OfflineMessageQueue.queue_message(
        negotiation_id,
        message,
        buyer_id,
        farmer_id
      )
    else
      Logger.error("Failed to queue message: negotiation missing on socket")
    end
  end

  defp require_token(nil), do: {:error, "Authentication token missing"}
  defp require_token(token) when is_binary(token) and token != "", do: {:ok, token}
  defp require_token(_), do: {:error, "Authentication token missing"}

  defp api_headers(nil), do: []
  defp api_headers(token), do: [{"authorization", "Bearer #{token}"}]

  defp api_get(path, token) do
    Req.get("#{@backend_api_url}#{path}", headers: api_headers(token))
  end

  defp api_post(path, token, json_body) do
    Req.post("#{@backend_api_url}#{path}", headers: api_headers(token), json: json_body)
  end

  defp api_patch(path, token, json_body) do
    Req.patch("#{@backend_api_url}#{path}", headers: api_headers(token), json: json_body)
  end
end
