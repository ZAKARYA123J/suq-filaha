defmodule RealtimeGatewayWeb.Plugs.RequireAuth do
  @moduledoc """
  Ensures user is authenticated before accessing protected routes.
  Validates JWT from session and assigns current_user.
  """

  import Plug.Conn
  import Phoenix.Controller

  alias RealtimeGateway.Services.JwtValidator

  def init(opts), do: opts

  def call(conn, _opts) do
    with jwt when is_binary(jwt) <- get_session(conn, :jwt),
         {:ok, claims} <- JwtValidator.validate_and_decode(jwt),
         {:ok, user} <- JwtValidator.extract_user(claims) do
      conn
      |> assign(:current_user, user)
      |> assign(:jwt, jwt)
    else
      _ ->
        conn
        |> clear_session()
        |> put_flash(:error, "You must be logged in to access this page")
        |> redirect(to: "/login")
        |> halt()
    end
  end
end
