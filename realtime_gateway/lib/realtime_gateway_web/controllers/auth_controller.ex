defmodule RealtimeGatewayWeb.AuthController do
  use RealtimeGatewayWeb, :controller

  def login(conn, %{"token" => token}) do
    conn
    |> put_session(:jwt, token)
    |> configure_session(renew: true)
    |> put_flash(:info, "Welcome back!")
    |> redirect(to: ~p"/dashboard")
  end

  def logout(conn, _params) do
    conn
    |> clear_session()
    |> configure_session(drop: true)
    |> put_flash(:info, "Logged out")
    |> redirect(to: ~p"/login")
  end
end
