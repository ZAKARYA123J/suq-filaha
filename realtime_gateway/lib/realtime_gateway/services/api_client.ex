defmodule RealtimeGateway.Services.ApiClient do
  @moduledoc """
  HTTP client for Node.js backend API.
  All business logic is handled by Node.js.
  This module only forwards requests with JWT authentication.
  """

  require Logger

  @base_url System.get_env("BACKEND_API_URL") || System.get_env("NODE_API_URL") ||
              "http://localhost:3000"

  # Use HTTPoison for multipart requests
  alias HTTPoison

  @doc """
  Authenticate user with phone and password.
  Returns {:ok, %{token: jwt, user: user_data}} or {:error, reason}
  """
  def login(phone, password) do
    body = %{phoneNumber: phone, password: password}
    Logger.info("Attempting login with payload: #{inspect(body)}")

    case Req.post("#{@base_url}/api/auth/login", json: body) do
      {:ok, %{status: 200, body: response}} ->
        {:ok, response}

      {:ok, %{status: status, body: body}} ->
        Logger.error("Login failed: #{status} - Full Body: #{inspect(body)}")
        {:error, get_error_message(body)}

      {:error, reason} ->
        Logger.error("Login request failed: #{inspect(reason)}")
        {:error, "Network error"}
    end
  end

  @doc """
  Fetch user profile using JWT token.
  """
  def get_user_profile(jwt) do
    get("/api/users/profile/me", jwt)
  end

  @doc """
  Fetch farmer's own products.
  """
  def get_my_products(jwt, params \\ %{}) do
    query_string = URI.encode_query(params)

    path =
      if query_string == "",
        do: "/api/products/my-products",
        else: "/api/products/my-products?#{query_string}"

    get(path, jwt)
  end

  @doc """
  Create a new product with images.
  `product_data` is a map of fields.
  `image_paths` is a list of local file paths.
  """
  def create_product(jwt, product_data, image_paths) do
    post_multipart("/api/products", jwt, product_data, image_paths)
  end

  @doc """
  Update a product.
  """
  def update_product(jwt, product_id, product_data, image_paths \\ []) do
    put_multipart("/api/products/#{product_id}", jwt, product_data, image_paths)
  end

  @doc """
  Delete a product.
  """
  def delete_product(jwt, product_id) do
    delete("/api/products/#{product_id}", jwt)
  end

  @doc """
  Fetch products with optional filters.
  """
  def get_products(jwt, params \\ %{}) do
    query_string = URI.encode_query(params)
    path = if query_string == "", do: "/api/products", else: "/api/products?#{query_string}"
    get(path, jwt)
  end

  @doc """
  Fetch single product by ID.
  """
  def get_product(jwt, product_id) do
    get("/api/products/#{product_id}", jwt)
  end

  @doc """
  Create new offer for a product.
  """
  def create_offer(jwt, product_id, offer_data) do
    post("/api/offers", jwt, Map.put(offer_data, :productId, product_id))
  end

  @doc """
  Fetch negotiations for current user.
  """
  def get_negotiations(jwt) do
    get("/api/negotiations", jwt)
  end

  @doc """
  Fetch single negotiation by ID.
  """
  def get_negotiation(jwt, negotiation_id) do
    get("/api/negotiations/#{negotiation_id}", jwt)
  end

  @doc """
  Fetch messages for a negotiation.
  """
  def get_negotiation_messages(jwt, negotiation_id) do
    get("/api/negotiations/#{negotiation_id}/messages", jwt)
  end

  @doc """
  Get farmer dashboard stats (product count, negotiations, revenue).
  """
  def get_farmer_stats(jwt) do
    get("/api/users/stats", jwt)
  end

  @doc """
  Send message in negotiation.
  """
  def send_negotiation_message(jwt, negotiation_id, content) do
    post("/api/negotiations/#{negotiation_id}/messages", jwt, %{content: content})
  end

  @doc """
  Update negotiation status (ACCEPTED, REJECTED, CANCELLED).
  """
  def update_negotiation_status(jwt, negotiation_id, status) do
    patch("/api/negotiations/#{negotiation_id}/status", jwt, %{status: status})
  end

  # Private helper functions

  defp get(path, jwt) do
    case Req.get("#{@base_url}#{path}",
           headers: [
             {"authorization", "Bearer #{jwt}"},
             {"content-type", "application/json"}
           ]
         ) do
      {:ok, %{status: 200, body: body}} ->
        {:ok, body}

      {:ok, %{status: 401}} ->
        {:error, :unauthorized}

      {:ok, %{status: status, body: body}} ->
        Logger.error("GET #{path} failed: #{status} - #{inspect(body)}")
        {:error, get_error_message(body)}

      {:error, reason} ->
        Logger.error("GET #{path} request failed: #{inspect(reason)}")
        {:error, "Network error"}
    end
  end

  defp post(path, jwt, body) do
    case Req.post("#{@base_url}#{path}",
           json: body,
           headers: [
             {"authorization", "Bearer #{jwt}"},
             {"content-type", "application/json"}
           ]
         ) do
      {:ok, %{status: status, body: response}} when status in 200..299 ->
        {:ok, response}

      {:ok, %{status: 401}} ->
        {:error, :unauthorized}

      {:ok, %{status: status, body: body}} ->
        Logger.error("POST #{path} failed: #{status} - #{inspect(body)}")
        {:error, get_error_message(body)}

      {:error, reason} ->
        Logger.error("POST #{path} request failed: #{inspect(reason)}")
        {:error, "Network error"}
    end
  end

  defp patch(path, jwt, body) do
    case Req.patch("#{@base_url}#{path}",
           json: body,
           headers: [
             {"authorization", "Bearer #{jwt}"},
             {"content-type", "application/json"}
           ]
         ) do
      {:ok, %{status: status, body: response}} when status in 200..299 ->
        {:ok, response}

      {:ok, %{status: 401}} ->
        {:error, :unauthorized}

      {:ok, %{status: status, body: body}} ->
        Logger.error("PATCH #{path} failed: #{status} - #{inspect(body)}")
        {:error, get_error_message(body)}

      {:error, reason} ->
        Logger.error("PATCH #{path} request failed: #{inspect(reason)}")
        {:error, "Network error"}
    end
  end

  defp delete(path, jwt) do
    case Req.delete("#{@base_url}#{path}",
           headers: [
             {"authorization", "Bearer #{jwt}"},
             {"content-type", "application/json"}
           ]
         ) do
      {:ok, %{status: 204}} ->
        {:ok, :deleted}

      {:ok, %{status: status, body: body}} ->
        Logger.error("DELETE #{path} failed: #{status} - #{inspect(body)}")
        {:error, get_error_message(body)}

      {:error, reason} ->
        Logger.error("DELETE #{path} request failed: #{inspect(reason)}")
        {:error, "Network error"}
    end
  end

  defp post_multipart(path, jwt, fields, file_paths) do
    multipart_body = build_multipart(fields, file_paths)

    case HTTPoison.post("#{@base_url}#{path}", {:multipart, multipart_body}, [
           {"Authorization", "Bearer #{jwt}"}
         ]) do
      {:ok, %HTTPoison.Response{status_code: status, body: body}} when status in 200..299 ->
        {:ok, Jason.decode!(body)}

      {:ok, %HTTPoison.Response{status_code: 401}} ->
        {:error, :unauthorized}

      {:ok, %HTTPoison.Response{status_code: status, body: body}} ->
        decoded = Jason.decode(body)

        error =
          case decoded do
            {:ok, map} -> get_error_message(map)
            _ -> "Request failed"
          end

        {:error, error}

      {:error, reason} ->
        Logger.error("Multipart POST #{path} failed: #{inspect(reason)}")
        {:error, "Network error"}
    end
  end

  defp put_multipart(path, jwt, fields, file_paths) do
    multipart_body = build_multipart(fields, file_paths)

    case HTTPoison.put("#{@base_url}#{path}", {:multipart, multipart_body}, [
           {"Authorization", "Bearer #{jwt}"}
         ]) do
      {:ok, %HTTPoison.Response{status_code: status, body: body}} when status in 200..299 ->
        {:ok, Jason.decode!(body)}

      {:ok, %HTTPoison.Response{status_code: 401}} ->
        {:error, :unauthorized}

      {:ok, %HTTPoison.Response{status_code: status, body: body}} ->
        decoded = Jason.decode(body)

        error =
          case decoded do
            {:ok, map} -> get_error_message(map)
            _ -> "Request failed"
          end

        {:error, error}

      {:error, reason} ->
        Logger.error("Multipart PUT #{path} failed: #{inspect(reason)}")
        {:error, "Network error"}
    end
  end

  defp build_multipart(fields, file_paths) do
    # Fields part
    field_parts =
      Enum.map(fields, fn {k, v} ->
        {to_string(k), to_string(v)}
      end)

    # Files part
    file_parts =
      Enum.map(file_paths, fn path ->
        {:file, path, {"form-data", [{"name", "images"}, {"filename", Path.basename(path)}]}, []}
      end)

    field_parts ++ file_parts
  end

  defp get_error_message(body) when is_map(body) do
    body["message"] || body["error"] || "Request failed"
  end

  defp get_error_message(_), do: "Request failed"
end
