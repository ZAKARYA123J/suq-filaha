# Security Best Practices for Phoenix LiveView

## 1. JWT Validation from Node.js

### Secure JWT Validator Service

```elixir
defmodule RealtimeGateway.Services.JwtValidator do
  @moduledoc """
  Validates JWT tokens issued by Node.js backend.
  CRITICAL: Must use the SAME secret as Node.js.
  """

  use Joken.Config
  require Logger

  @secret_key System.get_env("JWT_SECRET") || 
    raise "JWT_SECRET environment variable not set!"

  @token_lifetime_seconds 86_400  # 24 hours

  def validate_and_decode(token) when is_binary(token) do
    with {:ok, claims} <- verify_and_validate(token, signer()),
         :ok <- validate_expiration(claims),
         :ok <- validate_issuer(claims) do
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

  def extract_user(claims) when is_map(claims) do
    case claims do
      %{"user" => user} when is_map(user) -> {:ok, user}
      %{"userId" => user_id} -> {:ok, %{"id" => user_id}}
      _ -> {:error, :invalid_claims}
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

  defp validate_issuer(%{"iss" => "suq-l-filaha"}), do: :ok
  defp validate_issuer(_), do: {:error, :invalid_issuer}

  defp signer do
    Joken.Signer.create("HS256", @secret_key)
  end
end
```

---

## 2. Protecting LiveView Routes

### Authentication Plug

```elixir
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
```

### LiveView Authentication Hook

```elixir
defmodule RealtimeGatewayWeb.LiveAuth do
  @moduledoc """
  LiveView hook for authentication.
  Use in mount/3 of protected LiveViews.
  """

  import Phoenix.LiveView

  alias RealtimeGateway.Services.JwtValidator

  def on_mount(:require_authenticated_user, _params, session, socket) do
    case authenticate_user(session) do
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
```

### Update Router with Authentication

```elixir
defmodule RealtimeGatewayWeb.Router do
  use RealtimeGatewayWeb, :router

  import Phoenix.LiveView.Router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {RealtimeGatewayWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :require_auth do
    plug RealtimeGatewayWeb.Plugs.RequireAuth
  end

  # Public routes
  scope "/", RealtimeGatewayWeb do
    pipe_through :browser

    live "/login", LoginLive, :index
    live "/register", RegisterLive, :index
  end

  # Protected routes
  scope "/", RealtimeGatewayWeb do
    pipe_through [:browser, :require_auth]

    live_session :authenticated,
      on_mount: {RealtimeGatewayWeb.LiveAuth, :require_authenticated_user} do
      live "/dashboard", DashboardLive, :index
      live "/products", ProductListLive, :index
      live "/products/:id", ProductDetailLive, :show
      live "/negotiations/:id", NegotiationLive, :show
    end
  end

  # Farmer-only routes
  scope "/farmer", RealtimeGatewayWeb.Farmer do
    pipe_through [:browser, :require_auth]

    live_session :farmer,
      on_mount: {RealtimeGatewayWeb.LiveAuth, :require_farmer} do
      live "/products/new", ProductFormLive, :new
      live "/products/:id/edit", ProductFormLive, :edit
    end
  end

  # Buyer-only routes
  scope "/buyer", RealtimeGatewayWeb.Buyer do
    pipe_through [:browser, :require_auth]

    live_session :buyer,
      on_mount: {RealtimeGatewayWeb.LiveAuth, :require_buyer} do
      live "/orders", OrderListLive, :index
      live "/cart", CartLive, :index
    end
  end
end
```

---

## 3. Preventing Unauthorized WebSocket Connections

### Secure UserSocket

```elixir
defmodule RealtimeGatewayWeb.UserSocket do
  use Phoenix.Socket

  require Logger

  alias RealtimeGateway.Services.JwtValidator

  ## Channels
  channel "negotiation:*", RealtimeGatewayWeb.NegotiationChannel
  channel "user:*", RealtimeGatewayWeb.UserChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    case JwtValidator.validate_and_decode(token) do
      {:ok, claims} ->
        case JwtValidator.extract_user(claims) do
          {:ok, user} ->
            Logger.info("User #{user["id"]} connected to WebSocket")

            {:ok,
             socket
             |> assign(:user_id, user["id"])
             |> assign(:user, user)
             |> assign(:user_type, user["userType"])}

          {:error, reason} ->
            Logger.warning("Invalid user claims: #{inspect(reason)}")
            :error
        end

      {:error, reason} ->
        Logger.warning("WebSocket connection rejected: #{inspect(reason)}")
        :error
    end
  end

  @impl true
  def connect(_params, _socket, _connect_info) do
    Logger.warning("WebSocket connection rejected: missing token")
    :error
  end

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.user_id}"
end
```

### Secure Channel Join

```elixir
defmodule RealtimeGatewayWeb.NegotiationChannel do
  use RealtimeGatewayWeb, :channel

  require Logger

  alias RealtimeGateway.Services.ApiClient

  @impl true
  def join("negotiation:" <> negotiation_id, _payload, socket) do
    user_id = socket.assigns.user_id
    jwt = get_jwt_from_socket(socket)

    # Verify user has access to this negotiation via Node.js API
    case ApiClient.get_negotiation(jwt, negotiation_id) do
      {:ok, negotiation} ->
        if authorized_for_negotiation?(negotiation, user_id) do
          Logger.info("User #{user_id} joined negotiation #{negotiation_id}")

          send(self(), :after_join)

          {:ok,
           socket
           |> assign(:negotiation_id, negotiation_id)
           |> assign(:negotiation, negotiation)}
        else
          Logger.warning("User #{user_id} unauthorized for negotiation #{negotiation_id}")
          {:error, %{reason: "unauthorized"}}
        end

      {:error, :unauthorized} ->
        {:error, %{reason: "unauthorized"}}

      {:error, _reason} ->
        {:error, %{reason: "negotiation not found"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    # Track presence
    {:ok, _} =
      RealtimeGatewayWeb.Presence.track(socket, socket.assigns.user_id, %{
        online_at: inspect(System.system_time(:second)),
        user_type: socket.assigns.user_type
      })

    # Send presence state
    push(socket, "presence_state", RealtimeGatewayWeb.Presence.list(socket))

    # Load and send previous messages
    load_previous_messages(socket)

    {:noreply, socket}
  end

  defp authorized_for_negotiation?(negotiation, user_id) do
    buyer_id = get_in(negotiation, ["buyerId"])
    farmer_id = get_in(negotiation, ["product", "userId"])

    user_id in [buyer_id, farmer_id]
  end

  defp get_jwt_from_socket(socket) do
    # JWT should be passed during socket connection
    # Store it in socket assigns for channel use
    socket.assigns[:jwt]
  end

  defp load_previous_messages(socket) do
    # Implementation
    {:noreply, socket}
  end
end
```

---

## 4. Input Validation and Sanitization

### Message Content Validation

```elixir
defmodule RealtimeGateway.Validators.MessageValidator do
  @moduledoc """
  Validates and sanitizes user input.
  """

  @max_message_length 1000
  @min_message_length 1

  def validate_message(content) when is_binary(content) do
    content = String.trim(content)

    cond do
      String.length(content) < @min_message_length ->
        {:error, "Message cannot be empty"}

      String.length(content) > @max_message_length ->
        {:error, "Message too long (max #{@max_message_length} characters)"}

      contains_malicious_content?(content) ->
        {:error, "Message contains prohibited content"}

      true ->
        {:ok, sanitize(content)}
    end
  end

  def validate_message(_), do: {:error, "Invalid message format"}

  defp sanitize(content) do
    content
    |> HtmlSanitizeEx.strip_tags()
    |> String.trim()
  end

  defp contains_malicious_content?(content) do
    # Check for script tags, SQL injection patterns, etc.
    patterns = [
      ~r/<script/i,
      ~r/javascript:/i,
      ~r/on\w+\s*=/i,
      ~r/DROP\s+TABLE/i,
      ~r/DELETE\s+FROM/i
    ]

    Enum.any?(patterns, &Regex.match?(&1, content))
  end
end
```

### Use in Channel

```elixir
def handle_in("new_message", %{"content" => content}, socket) do
  case MessageValidator.validate_message(content) do
    {:ok, sanitized_content} ->
      # Proceed with saving message
      save_and_broadcast_message(socket, sanitized_content)

    {:error, reason} ->
      {:reply, {:error, %{message: reason}}, socket}
  end
end
```

---

## 5. Rate Limiting

### Rate Limiter GenServer

```elixir
defmodule RealtimeGateway.RateLimiter do
  use GenServer

  @max_requests_per_minute 60
  @cleanup_interval :timer.minutes(5)

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def check_rate_limit(user_id, action) do
    GenServer.call(__MODULE__, {:check, user_id, action})
  end

  @impl true
  def init(state) do
    schedule_cleanup()
    {:ok, state}
  end

  @impl true
  def handle_call({:check, user_id, action}, _from, state) do
    key = "#{user_id}:#{action}"
    now = System.system_time(:second)
    minute_ago = now - 60

    requests = Map.get(state, key, [])
    recent_requests = Enum.filter(requests, &(&1 > minute_ago))

    if length(recent_requests) >= @max_requests_per_minute do
      {:reply, {:error, :rate_limit_exceeded}, state}
    else
      new_requests = [now | recent_requests]
      new_state = Map.put(state, key, new_requests)
      {:reply, :ok, new_state}
    end
  end

  @impl true
  def handle_info(:cleanup, state) do
    now = System.system_time(:second)
    minute_ago = now - 60

    new_state =
      state
      |> Enum.map(fn {key, requests} ->
        {key, Enum.filter(requests, &(&1 > minute_ago))}
      end)
      |> Enum.reject(fn {_key, requests} -> Enum.empty?(requests) end)
      |> Map.new()

    schedule_cleanup()
    {:noreply, new_state}
  end

  defp schedule_cleanup do
    Process.send_after(self(), :cleanup, @cleanup_interval)
  end
end
```

### Use in Channel

```elixir
def handle_in("new_message", %{"content" => content}, socket) do
  user_id = socket.assigns.user_id

  case RateLimiter.check_rate_limit(user_id, :send_message) do
    :ok ->
      # Proceed with message handling
      handle_message(socket, content)

    {:error, :rate_limit_exceeded} ->
      {:reply, {:error, %{message: "Too many messages. Please slow down."}}, socket}
  end
end
```

---

## 6. CSRF Protection

### Ensure CSRF Token in Forms

```elixir
def render(assigns) do
  ~H"""
  <form phx-submit="login">
    <input type="hidden" name="_csrf_token" value={get_csrf_token()} />
    <!-- rest of form -->
  </form>
  """
end
```

### Validate CSRF in Endpoint

Already configured in `endpoint.ex`:

```elixir
plug Plug.Session, @session_options
plug :protect_from_forgery
plug :put_secure_browser_headers
```

---

## 7. Secure Session Configuration

### Update `config/config.exs`

```elixir
config :realtime_gateway, RealtimeGatewayWeb.Endpoint,
  live_view: [signing_salt: "secure-random-salt"],
  secret_key_base: "your-very-long-secret-key-base"

# Session configuration
config :realtime_gateway, RealtimeGatewayWeb.Endpoint,
  session: [
    store: :cookie,
    key: "_realtime_gateway_key",
    signing_salt: "another-secure-salt",
    encryption_salt: "encryption-salt",
    # Secure cookie settings
    secure: true,  # HTTPS only in production
    http_only: true,  # Prevent JavaScript access
    same_site: "Lax",  # CSRF protection
    max_age: 86400  # 24 hours
  ]
```

### Production Security Headers

```elixir
defmodule RealtimeGatewayWeb.Plugs.SecurityHeaders do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    conn
    |> put_resp_header("x-frame-options", "DENY")
    |> put_resp_header("x-content-type-options", "nosniff")
    |> put_resp_header("x-xss-protection", "1; mode=block")
    |> put_resp_header(
      "content-security-policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    )
    |> put_resp_header("strict-transport-security", "max-age=31536000; includeSubDomains")
  end
end
```

Add to endpoint:

```elixir
plug RealtimeGatewayWeb.Plugs.SecurityHeaders
```

---

## 8. Environment Variables

### `.env.example`

```bash
# JWT Secret (MUST match Node.js backend)
JWT_SECRET=your-super-secret-jwt-key-here

# Node.js API URL
NODE_API_URL=http://localhost:3001

# Phoenix Secret Key Base
SECRET_KEY_BASE=generate-with-mix-phx-gen-secret

# Database (if needed)
DATABASE_URL=postgresql://user:pass@localhost/db

# Production settings
PHX_HOST=yourdomain.com
PORT=4000
```

### Load in `config/runtime.exs`

```elixir
import Config

if config_env() == :prod do
  # Validate required environment variables
  required_vars = ["JWT_SECRET", "SECRET_KEY_BASE", "NODE_API_URL"]

  Enum.each(required_vars, fn var ->
    unless System.get_env(var) do
      raise "Environment variable #{var} is missing!"
    end
  end)

  config :joken, default_signer: System.fetch_env!("JWT_SECRET")

  config :realtime_gateway,
    node_api_url: System.fetch_env!("NODE_API_URL")

  config :realtime_gateway, RealtimeGatewayWeb.Endpoint,
    url: [host: System.fetch_env!("PHX_HOST"), port: 443, scheme: "https"],
    http: [port: String.to_integer(System.get_env("PORT") || "4000")],
    secret_key_base: System.fetch_env!("SECRET_KEY_BASE")
end
```

---

## Security Checklist

- [ ] JWT secret matches Node.js backend
- [ ] All protected routes use authentication
- [ ] WebSocket connections validate JWT
- [ ] Channel joins verify user authorization
- [ ] User input is validated and sanitized
- [ ] Rate limiting implemented
- [ ] CSRF protection enabled
- [ ] Secure session configuration
- [ ] Security headers in production
- [ ] Environment variables properly configured
- [ ] HTTPS enforced in production
- [ ] Sensitive data not logged
- [ ] Error messages don't leak information
- [ ] Dependencies regularly updated
