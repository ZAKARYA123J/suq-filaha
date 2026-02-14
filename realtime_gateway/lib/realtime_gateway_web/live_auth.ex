defmodule RealtimeGatewayWeb.LiveAuth do
  @moduledoc """
  LiveView hook for authentication.
  Use in mount/3 of protected LiveViews via live_session.
  """

  import Phoenix.LiveView
  import Phoenix.Component

  require Logger

  alias RealtimeGateway.Services.JwtValidator

  def on_mount(:require_authenticated_user, _params, session, socket) do
    Logger.info("LiveAuth checking session: #{inspect(session)}")
    auth_result = authenticate_user(session)
    Logger.info("LiveAuth result: #{inspect(auth_result)}")

    case auth_result do
      {:ok, user, jwt} ->
        {:cont,
         socket
         |> assign(:current_user, user)
         |> assign(:jwt, jwt)}

      {:error, _reason} ->
        {:halt,
         socket
         |> put_flash(:error, "You must be logged in")
         |> redirect(to: "/login")}
    end
  end

  def on_mount(:require_farmer, _params, session, socket) do
    case authenticate_user(session) do
      {:ok, %{"userType" => "FARMER"} = user, jwt} ->
        {:cont,
         socket
         |> assign(:current_user, user)
         |> assign(:jwt, jwt)}

      {:ok, _user, _jwt} ->
        {:halt,
         socket
         |> put_flash(:error, "Access denied: Farmers only")
         |> redirect(to: "/dashboard")}

      {:error, _reason} ->
        {:halt,
         socket
         |> put_flash(:error, "You must be logged in")
         |> redirect(to: "/login")}
    end
  end

  def on_mount(:require_buyer, _params, session, socket) do
    case authenticate_user(session) do
      {:ok, %{"userType" => "BUYER"} = user, jwt} ->
        {:cont,
         socket
         |> assign(:current_user, user)
         |> assign(:jwt, jwt)}

      {:ok, _user, _jwt} ->
        {:halt,
         socket
         |> put_flash(:error, "Access denied: Buyers only")
         |> redirect(to: "/dashboard")}

      {:error, _reason} ->
        {:halt,
         socket
         |> put_flash(:error, "You must be logged in")
         |> redirect(to: "/login")}
    end
  end

  defp authenticate_user(session) do
    with jwt when is_binary(jwt) <- session["jwt"],
         {:ok, claims} <- JwtValidator.validate_and_decode(jwt),
         {:ok, user} <- JwtValidator.extract_user(claims) do
      {:ok, user, jwt}
    else
      _ -> {:error, :unauthorized}
    end
  end
end
