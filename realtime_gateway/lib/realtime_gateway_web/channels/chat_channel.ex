# lib/realtime_gateway_web/channels/chat_channel.ex
defmodule RealtimeGatewayWeb.ChatChannel do
  use RealtimeGatewayWeb, :channel
  require Logger

  def join("chat:" <> chat_id, _params, socket) do
    userId = Map.get(socket.assigns, :userId, "anonymous")
    Logger.info("User #{userId} joining chat: #{chat_id}")

    send(self(), :after_join)

    {:ok, assign(socket, :chat_id, chat_id)}
  end

  def handle_info(:after_join, socket) do
    userId = Map.get(socket.assigns, :userId, "anonymous")

    broadcast(socket, "user_joined", %{
      userId: userId,
      chat_id: socket.assigns.chat_id,
      joined_at: DateTime.utc_now()
    })

    {:noreply, socket}
  end

  def handle_in("new_message", %{"body" => body}, socket) do
    userId = Map.get(socket.assigns, :userId, "anonymous")

    message = %{
      id: generate_id(),
      body: body,
      userId: userId,
      chat_id: socket.assigns.chat_id,
      inserted_at: DateTime.utc_now()
    }

    broadcast(socket, "new_message", message)

    {:reply, {:ok, message}, socket}
  end

  def handle_in("typing", payload, socket) do
    userId = Map.get(socket.assigns, :userId, "anonymous")

    broadcast_from(socket, "typing", %{
      userId: userId,
      typing: payload["typing"]
    })

    {:noreply, socket}
  end

  def terminate(_reason, socket) do
    userId = Map.get(socket.assigns, :userId, "anonymous")

    broadcast(socket, "user_left", %{
      userId: userId,
      chat_id: socket.assigns.chat_id
    })

    :ok
  end

  defp generate_id do
    :crypto.strong_rand_bytes(16) |> Base.encode16(case: :lower)
  end
end
