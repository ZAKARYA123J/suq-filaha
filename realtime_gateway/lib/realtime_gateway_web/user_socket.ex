# lib/realtime_gateway_web/channels/user_socket.ex
defmodule RealtimeGatewayWeb.UserSocket do
  require Logger
  use Phoenix.Socket

  # Channels
  channel "chat:*", RealtimeGatewayWeb.ChatChannel

  # Connect function - authenticate users here
  def connect(%{"token" => token}, socket, _connect_info) do
    # Verify user token
   case RealtimeGateway.Auth.JWTVerifier.verify_token(token) do
    {:ok,claims} ->
      Logger.info("User authenticate via JWt: #{claims["userId"]}")
      socket=socket
      |> assign(:userId,claims["userId"])
      |> assign(:name,claims["name"])
      |> assign(:phoneNumber,claims["phoneNumber"])
      {:ok,socket}
      {:error, reason} ->
        Logger.error("JWT Verification failed #{inspect(reason)}")
        :error
   end
  end

  # Allow connection without token (for testing/development)
  def connect(params, socket, _connect_info) do
    # Generate a temporary user_id for anonymous users
  Logger.warning("Connection without token : #{inspect(params)}")
  :error
  end

  # Return socket id - now safely handles missing user_id
  def id(socket), do: "user_socket:#{socket.assigns.userId}"
  # defp verify_token(token) do
  #   # Add your token verification logic
  #   # Example: Phoenix.Token.verify(...)
  #   {:ok, "user_123"}
  # end
end
