defmodule RealtimeGateway.Services.JwtValidator do
  @moduledoc """
  Validates JWT tokens issued by Node.js backend.
  CRITICAL: Must use the SAME secret as Node.js.
  """

  use Joken.Config
  require Logger

  # Default secret for development - MUST be set in production
  @secret_key System.get_env("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production")

  @doc """
  Validates and decodes a JWT token.
  Returns {:ok, claims} or {:error, reason}
  """
  def validate_and_decode(token) when is_binary(token) do
    with {:ok, claims} <- verify_and_validate(token, signer()),
         :ok <- validate_expiration(claims) do
      {:ok, claims}
    else
      {:error, :token_expired} ->
        Logger.warning("JWT token expired")
        {:error, :unauthorized}

      {:error, reason} ->
        Logger.error("JWT validation failed: #{inspect(reason)}")
        {:error, :unauthorized}
    end
  end

  def validate_and_decode(_), do: {:error, :invalid_token}

  @doc """
  Extracts user information from JWT claims.
  """
  def extract_user(claims) when is_map(claims) do
    case claims do
      %{"user" => user} when is_map(user) ->
        {:ok, user}

      %{"userId" => user_id} ->
        {:ok, %{"id" => user_id}}

      _ ->
        {:error, :invalid_claims}
    end
  end

  defp validate_expiration(%{"exp" => exp}) do
    current_time = System.system_time(:second)

    if exp > current_time do
      :ok
    else
      {:error, :token_expired}
    end
  end

  defp validate_expiration(_), do: {:error, :missing_expiration}

  defp signer do
    Joken.Signer.create("HS256", @secret_key)
  end
end
