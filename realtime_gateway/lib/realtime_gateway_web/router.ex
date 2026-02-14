defmodule RealtimeGatewayWeb.Router do
  use RealtimeGatewayWeb, :router

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_live_flash)
    plug(:put_root_layout, html: {RealtimeGatewayWeb.Layouts, :root})
    plug(:protect_from_forgery)
    plug(:put_secure_browser_headers)
  end

  pipeline :require_auth do
    plug(RealtimeGatewayWeb.Plugs.RequireAuth)
  end

  pipeline :api do
    plug(:accepts, ["json"])
    plug(RealtimeGatewayWeb.Plugs.ApiKeyAuth)
  end

  # Public routes
  scope "/", RealtimeGatewayWeb do
    pipe_through(:browser)

    live("/login", LoginLive, :index)
    get("/auth/login_token", AuthController, :login)
  end

  # Protected routes - require authentication
  scope "/", RealtimeGatewayWeb do
    pipe_through([:browser, :require_auth])

    live_session :authenticated,
      on_mount: {RealtimeGatewayWeb.LiveAuth, :require_authenticated_user} do
      live("/dashboard", DashboardLive, :index)
      live("/products", ProductListLive, :index)
      live("/negotiations/:id", NegotiationLive, :show)
    end
  end

  scope "/api", RealtimeGatewayWeb do
    pipe_through(:api)
    post("/webhooks/chat-event", WebhookController, :chat_event)
  end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:realtime_gateway, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through([:fetch_session, :protect_from_forgery])

      live_dashboard("/dashboard", metrics: RealtimeGatewayWeb.Telemetry)
      forward("/mailbox", Plug.Swoosh.MailboxPreview)
    end
  end
end
