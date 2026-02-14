defmodule RealtimeGatewayWeb.Presence do
  @moduledoc """
  Provides presence tracking for negotiation channels
  """
  use Phoenix.Presence,
    otp_app: :realtime_gateway,
    pubsub_server: RealtimeGateway.PubSub

  require Logger

  @doc """
  Tracks a user's presence in a negotiation
  """
  def track_user(socket, negotiation_id, user_metadata \\ %{}) do
    user_id = socket.assigns.userId
    pid = socket.channel_pid || self()
    default_metadata = %{
      userId: user_id,
      name: socket.assigns.name,
      phoneNumber: socket.assigns.phoneNumber,
      onlineAt: DateTime.utc_now()
    }

    metadata = Map.merge(default_metadata, user_metadata)

    case track(pid, "negotiation:#{negotiation_id}", user_id, metadata) do
      {:ok, _} ->
        Logger.info("User #{user_id} tracked in negotiation #{negotiation_id}")
        :ok
      {:error, reason} ->
        Logger.error("Failed to track user #{user_id}: #{inspect(reason)}")
        {:error, reason}
    end
  end

  @doc """
  Untracks a user's presence
  """
  def untrack_user(socket, negotiation_id) do
    user_id = socket.assigns.userId
    pid = socket.channel_pid || self()

    if is_binary(negotiation_id) and negotiation_id != "" do
      untrack(pid, "negotiation:#{negotiation_id}", user_id)
      Logger.info("User #{user_id} untracked from negotiation #{negotiation_id}")
    else
      Logger.warning("Skipping untrack for user #{user_id}: missing negotiation_id")
    end
  end

  @doc """
  Gets list of online users in a negotiation
  """
  def get_online_users(negotiation_id) do
    case list("negotiation:#{negotiation_id}") do
      presences when is_map(presences) ->
        users =
          Enum.map(presences, fn {user_id, %{metas: [meta | _]}} ->
            %{
              userId: user_id,
              name: meta.name,
              phoneNumber: meta.phoneNumber,
              onlineAt: meta.onlineAt
            }
          end)

        {:ok, users}

      {:ok, presences} when is_map(presences) ->
        users =
          Enum.map(presences, fn {user_id, %{metas: [meta | _]}} ->
            %{
              userId: user_id,
              name: meta.name,
              phoneNumber: meta.phoneNumber,
              onlineAt: meta.onlineAt
            }
          end)

        {:ok, users}

      {:error, reason} ->
        {:error, reason}

      other ->
        {:error, {:unexpected_presence_list, other}}
    end
  end

  @doc """
  Checks if a user is online in a negotiation
  """
  def user_online?(negotiation_id, user_id) do
    case get_online_users(negotiation_id) do
      {:ok, users} ->
        Enum.any?(users, &(&1.userId == user_id))
      {:error, _} ->
        false
    end
  end

  @doc """
  Gets offline users for a negotiation (buyer and farmer who are not online)
  """
  def get_offline_users(negotiation_id, buyer_id, farmer_id) do
    case get_online_users(negotiation_id) do
      {:ok, online_users} ->
        online_user_ids = Enum.map(online_users, & &1.userId)

        offline_users = []
        |> maybe_add_offline_user(buyer_id, online_user_ids, "BUYER")
        |> maybe_add_offline_user(farmer_id, online_user_ids, "FARMER")

        {:ok, offline_users}
      {:error, _} ->
        # If we can't determine online users, assume both are offline
        {:ok, [%{userId: buyer_id, userType: "BUYER"}, %{userId: farmer_id, userType: "FARMER"}]}
    end
  end

  defp maybe_add_offline_user(offline_users, user_id, online_user_ids, user_type) do
    if user_id not in online_user_ids do
      [%{userId: user_id, userType: user_type} | offline_users]
    else
      offline_users
    end
  end

  @doc """
  Handles presence diff events for offline message queuing
  """
  def handle_presence_diff(%{joins: joins, leaves: leaves}, negotiation_id) do
    # Handle users who went offline
    for {user_id, %{metas: [_meta | _]}} <- leaves do
      Logger.info("User #{user_id} went offline from negotiation #{negotiation_id}")
      # Trigger offline message queue processing if needed
      RealtimeGateway.OfflineMessageQueue.process_user_offline(negotiation_id, user_id)
    end

    # Handle users who came back online
    for {user_id, %{metas: [_meta | _]}} <- joins do
      Logger.info("User #{user_id} came online to negotiation #{negotiation_id}")
      # Deliver queued messages to this user
      RealtimeGateway.OfflineMessageQueue.deliver_queued_messages(negotiation_id, user_id)
    end
  end
end
