# Phoenix LiveView Integration Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Phoenix LiveView (UI Layer)                   │   │
│  │  - Renders HTML                                       │   │
│  │  - Handles user interactions                          │   │
│  │  - Manages WebSocket state                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕ WebSocket
┌─────────────────────────────────────────────────────────────┐
│              Phoenix Server (Presentation Layer)             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LiveView Modules                                     │   │
│  │  - mount/3: Initialize state, validate JWT            │   │
│  │  - handle_event/3: User actions                       │   │
│  │  - handle_info/2: Real-time updates from Channels     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Client Service (lib/services/api_client.ex)     │   │
│  │  - HTTP calls to Node.js                              │   │
│  │  - JWT forwarding                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Phoenix Channels (Real-time)                         │   │
│  │  - negotiation:ID                                     │   │
│  │  - Broadcasts updates to LiveView via PubSub          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↕ HTTP REST
┌─────────────────────────────────────────────────────────────┐
│           Node.js Backend (Business Logic Layer)             │
│  - Authentication (JWT)                                      │
│  - Products CRUD                                             │
│  - Orders, Offers, Negotiations                              │
│  - PostgreSQL Database                                       │
└─────────────────────────────────────────────────────────────┘
```

## Key Principles

1. **Phoenix = Presentation Layer Only**
   - No business logic in LiveView
   - All CRUD via Node.js REST API
   - LiveView only renders and handles UI state

2. **Node.js = Single Source of Truth**
   - All data mutations go through Node.js
   - JWT authentication managed by Node.js
   - Database access only from Node.js

3. **Phoenix Channels = Real-time Updates**
   - Channels broadcast events to LiveView via PubSub
   - LiveView subscribes to topics in mount/3
   - handle_info/2 receives broadcasts and updates UI

---

## Step 1: Add LiveView Dependencies

### Update `mix.exs`

```elixir
defp deps do
  [
    {:phoenix, "~> 1.8.0"},
    {:phoenix_live_view, "~> 0.20.0"},  # ADD THIS
    {:phoenix_html, "~> 4.0"},           # ADD THIS
    {:phoenix_live_dashboard, "~> 0.8.3"},
    {:floki, ">= 0.30.0", only: :test},  # ADD THIS for testing
    {:swoosh, "~> 1.16"},
    {:req, "~> 0.5"},
    {:telemetry_metrics, "~> 1.0"},
    {:telemetry_poller, "~> 1.0"},
    {:gettext, "~> 0.26"},
    {:jason, "~> 1.2"},
    {:dns_cluster, "~> 0.2.0"},
    {:bandit, "~> 1.5"},
    {:plug_cowboy, "~> 2.5"},
    {:cors_plug, "~> 3.0"},
    {:httpoison, "~> 2.0"},
    {:joken, "~> 2.6"},
    {:uuid, "~> 1.1"}
  ]
end
```

### Install Dependencies

```bash
cd realtime_gateway
mix deps.get
mix deps.compile
```

---

## Step 2: Configure Endpoint for LiveView

### Update `lib/realtime_gateway_web/endpoint.ex`

```elixir
defmodule RealtimeGatewayWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :realtime_gateway

  # The session will be stored in the cookie and signed,
  # this means its contents can be read but not tampered with.
  @session_options [
    store: :cookie,
    key: "_realtime_gateway_key",
    signing_salt: "your-signing-salt-here",  # CHANGE THIS
    same_site: "Lax"
  ]

  socket "/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: @session_options]]

  socket "/socket", RealtimeGatewayWeb.UserSocket,
    websocket: true,
    longpoll: false

  # Serve at "/" the static files from "priv/static" directory.
  plug Plug.Static,
    at: "/",
    from: :realtime_gateway,
    gzip: false,
    only: RealtimeGatewayWeb.static_paths()

  # Code reloading can be explicitly enabled under the
  # :code_reloader configuration of your endpoint.
  if code_reloading? do
    socket "/phoenix/live_reload/socket", Phoenix.LiveReloader.Socket
    plug Phoenix.LiveReloader
    plug Phoenix.CodeReloader
  end

  plug Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options
  plug RealtimeGatewayWeb.Router
end
```

---

## Step 3: Update Router

### Update `lib/realtime_gateway_web/router.ex`

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

  pipeline :api do
    plug :accepts, ["json"]
  end

  # Public routes
  scope "/", RealtimeGatewayWeb do
    pipe_through :browser

    live "/login", LoginLive, :index
    live "/register", RegisterLive, :index
  end

  # Protected routes - require authentication
  scope "/", RealtimeGatewayWeb do
    pipe_through [:browser, :require_authenticated_user]

    live "/dashboard", DashboardLive, :index
    live "/products", ProductListLive, :index
    live "/products/:id", ProductDetailLive, :show
    live "/negotiations/:id", NegotiationLive, :show
  end

  # API routes (for health checks, etc.)
  scope "/api", RealtimeGatewayWeb do
    pipe_through :api

    get "/health", HealthController, :index
  end

  # Enable LiveDashboard in development
  if Application.compile_env(:realtime_gateway, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: RealtimeGatewayWeb.Telemetry
    end
  end

  # Authentication plug
  defp require_authenticated_user(conn, _opts) do
    jwt = get_session(conn, :jwt)

    if jwt do
      conn
    else
      conn
      |> Phoenix.Controller.redirect(to: "/login")
      |> halt()
    end
  end
end
```

---

## Step 4: Create API Client Service

### Create `lib/realtime_gateway/services/api_client.ex`

```elixir
defmodule RealtimeGateway.Services.ApiClient do
  @moduledoc """
  HTTP client for Node.js backend API.
  All business logic is handled by Node.js.
  This module only forwards requests with JWT authentication.
  """

  require Logger

  @base_url System.get_env("NODE_API_URL", "http://localhost:3001")

  @doc """
  Authenticate user with phone and password.
  Returns {:ok, %{token: jwt, user: user_data}} or {:error, reason}
  """
  def login(phone, password) do
    body = Jason.encode!(%{phone: phone, password: password})

    case Req.post("#{@base_url}/api/auth/login", 
      body: body,
      headers: [{"content-type", "application/json"}]
    ) do
      {:ok, %{status: 200, body: response}} ->
        {:ok, response}

      {:ok, %{status: status, body: body}} ->
        Logger.error("Login failed: #{status} - #{inspect(body)}")
        {:error, body["message"] || "Authentication failed"}

      {:error, reason} ->
        Logger.error("Login request failed: #{inspect(reason)}")
        {:error, "Network error"}
    end
  end

  @doc """
  Fetch user profile using JWT token.
  """
  def get_user_profile(jwt) do
    get("/api/users/profile", jwt)
  end

  @doc """
  Fetch products with optional filters.
  """
  def get_products(jwt, params \\ %{}) do
    query_string = URI.encode_query(params)
    get("/api/products?#{query_string}", jwt)
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
  Send message in negotiation.
  """
  def send_negotiation_message(jwt, negotiation_id, content) do
    post("/api/negotiations/#{negotiation_id}/messages", jwt, %{content: content})
  end

  @doc """
  Update negotiation status (ACCEPTED, REJECTED, CANCELLED).
  """
  def update_negotiation_status(jwt, negotiation_id, status) do
    patch("/api/negotiations/#{negotiation_id}", jwt, %{status: status})
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
        {:error, body["message"] || "Request failed"}

      {:error, reason} ->
        Logger.error("GET #{path} request failed: #{inspect(reason)}")
        {:error, "Network error"}
    end
  end

  defp post(path, jwt, body) do
    case Req.post("#{@base_url}#{path}",
      body: Jason.encode!(body),
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
        {:error, body["message"] || "Request failed"}

      {:error, reason} ->
        Logger.error("POST #{path} request failed: #{inspect(reason)}")
        {:error, "Network error"}
    end
  end

  defp patch(path, jwt, body) do
    case Req.patch("#{@base_url}#{path}",
      body: Jason.encode!(body),
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
        {:error, body["message"] || "Request failed"}

      {:error, reason} ->
        Logger.error("PATCH #{path} request failed: #{inspect(reason)}")
        {:error, "Network error"}
    end
  end
end
```

---

## Step 5: Update RealtimeGatewayWeb Module

### Update `lib/realtime_gateway_web.ex`

Add LiveView imports:

```elixir
defmodule RealtimeGatewayWeb do
  def static_paths, do: ~w(assets fonts images favicon.ico robots.txt)

  def router do
    quote do
      use Phoenix.Router, helpers: false

      import Plug.Conn
      import Phoenix.Controller
      import Phoenix.LiveView.Router
    end
  end

  def channel do
    quote do
      use Phoenix.Channel
    end
  end

  def controller do
    quote do
      use Phoenix.Controller,
        formats: [:html, :json],
        layouts: [html: RealtimeGatewayWeb.Layouts]

      import Plug.Conn
      import RealtimeGatewayWeb.Gettext

      unquote(verified_routes())
    end
  end

  def live_view do
    quote do
      use Phoenix.LiveView,
        layout: {RealtimeGatewayWeb.Layouts, :app}

      unquote(html_helpers())
    end
  end

  def live_component do
    quote do
      use Phoenix.LiveComponent

      unquote(html_helpers())
    end
  end

  def html do
    quote do
      use Phoenix.Component

      import Phoenix.Controller,
        only: [get_csrf_token: 0, view_module: 1, view_template: 1]

      unquote(html_helpers())
    end
  end

  defp html_helpers do
    quote do
      import Phoenix.HTML
      import RealtimeGatewayWeb.CoreComponents
      import RealtimeGatewayWeb.Gettext

      alias Phoenix.LiveView.JS

      unquote(verified_routes())
    end
  end

  def verified_routes do
    quote do
      use Phoenix.VerifiedRoutes,
        endpoint: RealtimeGatewayWeb.Endpoint,
        router: RealtimeGatewayWeb.Router,
        statics: RealtimeGatewayWeb.static_paths()
    end
  end

  @doc """
  When used, dispatch to the appropriate controller/view/etc.
  """
  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end
```

This is Part 1 of the guide. Let me create the remaining parts in separate files.
