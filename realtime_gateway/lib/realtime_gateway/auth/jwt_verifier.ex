defmodule RealtimeGateway.Auth.JWTVerifier do
  use Joken.Config
  require Logger
  @impl true
  def token_config do
    default_claims(skip: [:aud, :iss])
  end
  def verify_token(token)do
    secret = Application.get_env(:realtime_gateway, :jwt_secret)
    if  !secret do
      Logger.error("JWT_SECRET not configured!")
      {:error, :no_secret}
    else
      signer=Joken.Signer.create("HS256",secret)
      case Joken.verify_and_validate(token_config(),token,signer)do
        {:ok,claims} ->
          Logger.info("Token verified successfuly for user:#{claims["userId"]} ")
          {:ok,claims}
          {:error,reason} ->
            Logger.error("Token verification failed: #{inspect(reason)}")
            {:error, reason}
      end
    end
  end
  def generate_token(userId,name,phoneNumber) do
    secret= Application.get_env(:realtime_gateway, :jwt_secret)
     signer= Joken.Signer.create("HS256",secret)
     extra_claims=%{
      "userId"=>userId,
      "name"=>name,
      "phoneNumber"=>phoneNumber,
      "exp"=>DateTime.utc_now() |> DateTime.add(24 * 3600)
     }
  end
end
