defmodule RealtimeGatewayWeb.Plugs.ApiKeyAuth do  # Changed ApikeyAuth to ApiKeyAuth
  import Plug.Conn
  import Phoenix.Controller
  require Logger

  def init(opts), do: opts

  def call(conn, _opts) do
    api_key = get_req_header(conn, "x-api-key") |> List.first()
    expected_key = Application.get_env(:realtime_gateway, :phoenix_api_key)

    if api_key && api_key === expected_key do
      conn
    else
      Logger.warning("Invalid api key from #{get_peer_ip(conn)}")
      conn
      |> put_status(:unauthorized)
      |> json(%{error: "Invalid api key"})
      |> halt()
    end
  end

  defp get_peer_ip(conn) do
    case get_req_header(conn, "x-forwarded-for") do
      [ip | _] -> ip
      [] -> to_string(:inet_parse.ntoa(conn.remote_ip))
    end
  end
end
