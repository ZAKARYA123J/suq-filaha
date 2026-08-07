defmodule RealtimeGateway.OfflineMessageQueue do
  @moduledoc """
  Handles offline message queuing and delivery for negotiations
  """
  require Logger

  use GenServer
  alias RealtimeGatewayWeb.Presence

  # Client API

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @doc """
  Queues a message for offline users in a negotiation
  """
  def queue_message(negotiation_id, message, buyer_id, farmer_id) do
    GenServer.call(__MODULE__, {:queue_message, negotiation_id, message, buyer_id, farmer_id})
  end

  @doc """
  Gets queued messages for a user in a negotiation
  """
  def get_queued_messages(negotiation_id, user_id) do
    GenServer.call(__MODULE__, {:get_queued_messages, negotiation_id, user_id})
  end

  @doc """
  Marks queued messages as delivered for a user
  """
  def mark_messages_delivered(negotiation_id, user_id, message_ids) do
    GenServer.call(__MODULE__, {:mark_delivered, negotiation_id, user_id, message_ids})
  end

  @doc """
  Processes user going offline - ensures any pending messages are queued
  """
  def process_user_offline(negotiation_id, user_id) do
    GenServer.cast(__MODULE__, {:process_user_offline, negotiation_id, user_id})
  end

  @doc """
  Delivers queued messages when user comes online
  """
  def deliver_queued_messages(negotiation_id, user_id) do
    GenServer.cast(__MODULE__, {:deliver_messages, negotiation_id, user_id})
  end

  # GenServer Callbacks

  @impl true
  def init(_opts) do
    # In a production app, you'd use a proper database like Redis or ETS
    # For now, we'll use an in-memory state
    state = %{
      # %{negotiation_id => %{user_id => [messages]}}
      message_queues: %{},
      # %{negotiation_id => %{user_id => %{message_id => delivered}}}
      delivery_status: %{}
    }

    {:ok, state}
  end

  @impl true
  def handle_call({:queue_message, negotiation_id, message, buyer_id, farmer_id}, _from, state) do
    case Presence.get_offline_users(negotiation_id, buyer_id, farmer_id) do
      {:ok, offline_users} ->
        new_state = queue_for_users(state, negotiation_id, message, offline_users)
        {:reply, :ok, new_state}

      {:error, reason} ->
        Logger.error("Failed to get offline users: #{reason}")
        # Queue for both users if we can't determine who's offline
        all_users = [%{userId: buyer_id}, %{userId: farmer_id}]
        new_state = queue_for_users(state, negotiation_id, message, all_users)
        {:reply, :ok, new_state}
    end
  end

  @impl true
  def handle_call({:get_queued_messages, negotiation_id, user_id}, _from, state) do
    messages = get_user_messages(state, negotiation_id, user_id)
    {:reply, {:ok, messages}, state}
  end

  @impl true
  def handle_call({:mark_delivered, negotiation_id, user_id, message_ids}, _from, state) do
    new_state = mark_as_delivered(state, negotiation_id, user_id, message_ids)
    {:reply, :ok, new_state}
  end

  @impl true
  def handle_cast({:process_user_offline, negotiation_id, user_id}, state) do
    Logger.info("Processing user #{user_id} going offline for negotiation #{negotiation_id}")
    # No specific action needed - messages will be queued as they're sent
    {:noreply, state}
  end

  @impl true
  def handle_cast({:deliver_messages, negotiation_id, user_id}, state) do
    Logger.info("Delivering queued messages for user #{user_id} in negotiation #{negotiation_id}")

    messages = get_user_messages(state, negotiation_id, user_id)

    if length(messages) > 0 do
      # In a real implementation, you would push these messages to the user's socket
      # For now, we'll just log and mark them as delivered
      message_ids = Enum.map(messages, & &1.id)

      Logger.info("Delivering #{length(messages)} queued messages to user #{user_id}")

      # You would typically use Phoenix.PubSub to push to the user's socket
      # RealtimeGatewayWeb.Endpoint.broadcast!("user:#{user_id}", "queued_messages", %{messages: messages})

      new_state = mark_as_delivered(state, negotiation_id, user_id, message_ids)
      {:noreply, new_state}
    else
      {:noreply, state}
    end
  end

  # Private helper functions

  defp queue_for_users(state, negotiation_id, message, users) do
    negotiation_queues = Map.get(state.message_queues, negotiation_id, %{})

    updated_queues =
      Enum.reduce(users, negotiation_queues, fn user, acc ->
        user_id = user.userId
        user_messages = Map.get(acc, user_id, [])

        # Check if message is already queued for this user
        message_already_queued = Enum.any?(user_messages, &(&1.id == message.id))

        if message_already_queued do
          acc
        else
          queued_message = Map.put(message, :queuedAt, DateTime.utc_now())
          Map.put(acc, user_id, [queued_message | user_messages])
        end
      end)

    updated_state = put_in(state.message_queues[negotiation_id], updated_queues)

    Logger.info(
      "Queued message #{message.id} for #{length(users)} offline users in negotiation #{negotiation_id}"
    )

    updated_state
  end

  defp get_user_messages(state, negotiation_id, user_id) do
    negotiation_queues = Map.get(state.message_queues, negotiation_id, %{})
    user_messages = Map.get(negotiation_queues, user_id, [])

    # Filter out already delivered messages
    delivery_statuses = get_in(state.delivery_status, [negotiation_id, user_id]) || %{}

    Enum.filter(user_messages, fn message ->
      Map.get(delivery_statuses, message.id) != true
    end)
  end

  defp mark_as_delivered(state, negotiation_id, user_id, message_ids) do
    delivery_statuses = get_in(state.delivery_status, [negotiation_id, user_id]) || %{}

    updated_statuses =
      Enum.reduce(message_ids, delivery_statuses, fn message_id, acc ->
        Map.put(acc, message_id, true)
      end)

    updated_state = put_in(state.delivery_status[negotiation_id][user_id], updated_statuses)

    Logger.info("Marked #{length(message_ids)} messages as delivered for user #{user_id}")

    updated_state
  end

  # Cleanup functions for production use

  @doc """
  Cleans up old delivered messages (should be called periodically)
  """
  def cleanup_old_messages do
    GenServer.cast(__MODULE__, :cleanup_old_messages)
  end

  @impl true
  def handle_cast(:cleanup_old_messages, state) do
    # In production, you would remove old delivered messages to prevent memory bloat
    # For now, we'll keep them in memory
    Logger.info("Cleanup old messages called (no-op in current implementation)")
    {:noreply, state}
  end
end
