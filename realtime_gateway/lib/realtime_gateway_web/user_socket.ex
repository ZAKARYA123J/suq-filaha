defmodule RealtimeGatewayWeb.UserSocket do
  use Phoenix.Socket

  # Make sure this line is UNCOMMENTED:
  channel "events:*", RealtimeGatewayWeb.EventsChannel

  def connect(_params, socket, _connect_info) do
    {:ok, socket}
  end

  def id(_socket), do: nil
end
