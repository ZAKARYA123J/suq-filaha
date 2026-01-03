defmodule RealtimeGatewayWeb.WebhookController do
  use RealtimeGatewayWeb,:controller
  require Logger

def chat_event(conn, params) do
  with {:ok, chat_id} <- Map.fetch(params, "chat_id"),
       {:ok, event} <- Map.fetch(params, "event"),
       {:ok, data} <- Map.fetch(params, "data") do
    case handle_chat_event(chat_id, event, data) do
      :ok ->
        conn
        |> put_status(:ok)
        |> json(%{success: true, message: "Event received"})

      {:error, reason} ->
        Logger.error("Failed to handle chat event: #{inspect(reason)}")
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{success: false, error: "Failed to process event"})
    end
  else
    :error ->
      conn
      |> put_status(:bad_request)
      |> json(%{success: false, error: "Missing required fields"})
  end
end

 defp handle_chat_event(chat_id, event, data) do
    IO.puts("Broadcasting #{event} to chat:#{chat_id}")
    Logger.info("Chat event received - Chat ID: #{chat_id}, Event: #{event}")
  RealtimeGatewayWeb.Endpoint.broadcast!("chat:#{chat_id}", event, data)
    # Add your event handling logic here
    # Examples:
    # case event do
    #   "message_sent" ->
    #     # Handle message sent event
    #     process_message(chat_id, data)

    #   "user_joined" ->
    #     # Handle user joined event
    #     process_user_joined(chat_id, data)

    #   "typing" ->
    #     # Handle typing indicator
    #     broadcast_typing(chat_id, data)

    #   _ ->
    #     Logger.warn("Unknown event type: #{event}")
    #     :ok
    # end
  end

  defp process_message(chat_id, data) do
    # Your message processing logic
    :ok
  end

  defp process_user_joined(chat_id, data) do
    # Your user joined logic
    :ok
  end

  # defp broadcast_typing(chat_id, data) do
  #   # Your typing broadcast logic
  #   :ok
  # end
  defp broadcast_typing(chat_id,data) do
    RealtimeGatewayWeb.Endpoint.broadcast("chat:#{chat_id}","typing",data)
  end
end
