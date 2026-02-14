# Phoenix LiveView Folder Structure

## Recommended Directory Organization

```
realtime_gateway/
├── lib/
│   ├── realtime_gateway/
│   │   ├── application.ex
│   │   ├── services/
│   │   │   ├── api_client.ex          # HTTP client for Node.js API
│   │   │   └── jwt_validator.ex       # JWT validation service
│   │   └── offline_message_queue.ex
│   │
│   └── realtime_gateway_web/
│       ├── channels/
│       │   ├── negotiation_channel.ex  # Real-time for mobile
│       │   ├── chat_channel.ex
│       │   └── user_socket.ex
│       │
│       ├── controllers/
│       │   ├── health_controller.ex
│       │   └── page_controller.ex
│       │
│       ├── live/
│       │   ├── login_live.ex           # Authentication
│       │   ├── register_live.ex
│       │   │
│       │   ├── dashboard_live.ex       # Farmer dashboard
│       │   │
│       │   ├── product_list_live.ex    # Buyer product browsing
│       │   ├── product_detail_live.ex
│       │   │
│       │   ├── negotiation_live.ex     # Real-time negotiation
│       │   │
│       │   └── components/             # Reusable LiveView components
│       │       ├── product_card.ex
│       │       ├── message_bubble.ex
│       │       └── stats_card.ex
│       │
│       ├── components/
│       │   ├── core_components.ex      # Phoenix default components
│       │   └── layouts.ex              # App layouts
│       │
│       ├── plugs/
│       │   └── jwt_auth.ex             # JWT authentication plug
│       │
│       ├── endpoint.ex
│       ├── gettext.ex
│       ├── presence.ex
│       ├── router.ex
│       ├── telemetry.ex
│       └── realtime_gateway_web.ex
│
├── assets/
│   ├── css/
│   │   └── app.css                     # Tailwind CSS
│   ├── js/
│   │   ├── app.js                      # Main JS entry
│   │   └── hooks.js                    # LiveView hooks
│   └── vendor/
│       └── topbar.js
│
├── priv/
│   ├── static/
│   └── gettext/
│
├── config/
│   ├── config.exs
│   ├── dev.exs
│   ├── prod.exs
│   ├── runtime.exs
│   └── test.exs
│
├── test/
│   ├── realtime_gateway_web/
│   │   ├── live/
│   │   │   ├── login_live_test.exs
│   │   │   ├── dashboard_live_test.exs
│   │   │   └── negotiation_live_test.exs
│   │   └── channels/
│   └── support/
│
├── mix.exs
└── mix.lock
```

---

## Detailed File Descriptions

### Core Services

#### `lib/realtime_gateway/services/api_client.ex`
- HTTP client wrapper for Node.js REST API
- Handles JWT authentication headers
- Provides typed functions for all API endpoints
- Error handling and logging

#### `lib/realtime_gateway/services/jwt_validator.ex`
```elixir
defmodule RealtimeGateway.Services.JwtValidator do
  @moduledoc """
  Validates JWT tokens issued by Node.js backend.
  Does NOT create tokens - only validates them.
  """

  use Joken.Config

  @secret System.get_env("JWT_SECRET", "your-secret-key")

  def validate(token) do
    with {:ok, claims} <- verify_and_validate(token, signer()) do
      {:ok, claims}
    else
      {:error, reason} -> {:error, reason}
    end
  end

  def get_user_from_token(token) do
    case validate(token) do
      {:ok, claims} -> {:ok, claims["user"]}
      error -> error
    end
  end

  defp signer do
    Joken.Signer.create("HS256", @secret)
  end
end
```

---

### LiveView Modules

#### `lib/realtime_gateway_web/live/login_live.ex`
- User authentication form
- Calls Node.js `/api/auth/login`
- Stores JWT in session
- Redirects to dashboard on success

#### `lib/realtime_gateway_web/live/dashboard_live.ex`
- Role-specific dashboard (Farmer/Buyer)
- Fetches data from Node.js API
- Subscribes to real-time updates via PubSub
- Displays stats, products, negotiations

#### `lib/realtime_gateway_web/live/product_list_live.ex`
- Product browsing with search/filters
- Calls Node.js `/api/products`
- Real-time product updates
- Navigation to product details

#### `lib/realtime_gateway_web/live/product_detail_live.ex`
- Single product view
- Make offer functionality
- Calls Node.js `/api/offers`

#### `lib/realtime_gateway_web/live/negotiation_live.ex`
- Real-time chat interface
- Subscribes to Phoenix Channel updates via PubSub
- Sends messages via Node.js API
- Displays typing indicators, online status
- Accept/Reject/Counter offer actions

---

### LiveView Components

#### `lib/realtime_gateway_web/live/components/product_card.ex`
```elixir
defmodule RealtimeGatewayWeb.Components.ProductCard do
  use Phoenix.LiveComponent

  def render(assigns) do
    ~H"""
    <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 class="text-lg font-semibold text-gray-900"><%= @product["name"] %></h3>
      <p class="mt-2 text-sm text-gray-600"><%= @product["description"] %></p>
      <div class="mt-4 flex justify-between items-center">
        <span class="text-2xl font-bold text-green-600">
          <%= @product["price"] %> MAD
        </span>
        <button
          phx-click="view_product"
          phx-value-id={@product["id"]}
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          View Details
        </button>
      </div>
    </div>
    """
  end
end
```

#### `lib/realtime_gateway_web/live/components/message_bubble.ex`
```elixir
defmodule RealtimeGatewayWeb.Components.MessageBubble do
  use Phoenix.Component

  def message_bubble(assigns) do
    ~H"""
    <div class={[
      "flex",
      if(@is_own, do: "justify-end", else: "justify-start")
    ]}>
      <div class={[
        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
        if(@is_own, do: "bg-green-600 text-white", else: "bg-gray-200 text-gray-900")
      ]}>
        <p class="text-sm"><%= @message["content"] %></p>
        <p class={[
          "text-xs mt-1",
          if(@is_own, do: "text-green-100", else: "text-gray-500")
        ]}>
          <%= format_time(@message["createdAt"]) %>
        </p>
      </div>
    </div>
    """
  end

  defp format_time(timestamp) do
    # Format timestamp appropriately
    timestamp
  end
end
```

#### `lib/realtime_gateway_web/live/components/stats_card.ex`
```elixir
defmodule RealtimeGatewayWeb.Components.StatsCard do
  use Phoenix.Component

  def stats_card(assigns) do
    ~H"""
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <%= render_slot(@icon) %>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">
                <%= @label %>
              </dt>
              <dd class="text-lg font-medium text-gray-900">
                <%= @value %>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
    """
  end
end
```

---

### Layouts

#### `lib/realtime_gateway_web/components/layouts.ex`
```elixir
defmodule RealtimeGatewayWeb.Layouts do
  use RealtimeGatewayWeb, :html

  embed_templates "layouts/*"
end
```

#### `lib/realtime_gateway_web/components/layouts/root.html.heex`
```heex
<!DOCTYPE html>
<html lang="en" class="h-full bg-gray-100">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="csrf-token" content={get_csrf_token()} />
    <.live_title suffix=" · Sūq l-Filāḥa">
      <%= assigns[:page_title] || "Sūq l-Filāḥa" %>
    </.live_title>
    <link phx-track-static rel="stylesheet" href={~p"/assets/app.css"} />
    <script defer phx-track-static type="text/javascript" src={~p"/assets/app.js"}>
    </script>
  </head>
  <body class="h-full">
    <%= @inner_content %>
  </body>
</html>
```

#### `lib/realtime_gateway_web/components/layouts/app.html.heex`
```heex
<div class="min-h-screen bg-gray-100">
  <!-- Navigation -->
  <nav class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <a href="/" class="text-xl font-bold text-green-600">
              Sūq l-Filāḥa
            </a>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <a href="/dashboard" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              Dashboard
            </a>
            <a href="/products" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              Products
            </a>
          </div>
        </div>
        <div class="flex items-center">
          <button
            phx-click="logout"
            class="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>

  <!-- Flash Messages -->
  <.flash_group flash={@flash} />

  <!-- Page Content -->
  <main>
    <%= @inner_content %>
  </main>
</div>
```

---

### Plugs

#### `lib/realtime_gateway_web/plugs/jwt_auth.ex`
```elixir
defmodule RealtimeGatewayWeb.Plugs.JwtAuth do
  import Plug.Conn
  import Phoenix.Controller

  alias RealtimeGateway.Services.JwtValidator

  def init(opts), do: opts

  def call(conn, _opts) do
    jwt = get_session(conn, :jwt)

    case jwt && JwtValidator.validate(jwt) do
      {:ok, claims} ->
        assign(conn, :current_user, claims["user"])

      _ ->
        conn
        |> put_flash(:error, "You must be logged in")
        |> redirect(to: "/login")
        |> halt()
    end
  end
end
```

---

### Assets

#### `assets/js/hooks.js`
```javascript
export const Hooks = {
  ScrollToBottom: {
    mounted() {
      this.scrollToBottom();
      this.handleEvent("scroll-to-bottom", () => this.scrollToBottom());
    },
    updated() {
      this.scrollToBottom();
    },
    scrollToBottom() {
      const container = this.el.querySelector("#messages-container");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  },

  AutoFocus: {
    mounted() {
      this.el.focus();
    }
  },

  InfiniteScroll: {
    mounted() {
      this.pending = this.page;
      this.el.addEventListener("scroll", e => {
        if (this.pending && e.target.scrollTop === 0) {
          this.pending = false;
          this.pushEvent("load-more", {});
        }
      });
    },
    updated() {
      this.pending = this.page;
    }
  }
};
```

#### `assets/css/app.css`
```css
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

/* Custom animations */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

---

## Configuration Files

### `config/dev.exs`
Add LiveView configuration:

```elixir
config :realtime_gateway, RealtimeGatewayWeb.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "your-secret-key-base",
  watchers: [
    esbuild: {Esbuild, :install_and_run, [:default, ~w(--sourcemap=inline --watch)]},
    tailwind: {Tailwind, :install_and_run, [:default, ~w(--watch)]}
  ],
  live_reload: [
    patterns: [
      ~r"priv/static/.*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"priv/gettext/.*(po)$",
      ~r"lib/realtime_gateway_web/(controllers|live|components)/.*(ex|heex)$"
    ]
  ]
```

### `config/runtime.exs`
```elixir
import Config

if config_env() == :prod do
  config :realtime_gateway, RealtimeGatewayWeb.Endpoint,
    url: [host: System.get_env("PHX_HOST"), port: 443, scheme: "https"],
    http: [
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: String.to_integer(System.get_env("PORT") || "4000")
    ],
    secret_key_base: System.get_env("SECRET_KEY_BASE")
end

# Node.js API URL
config :realtime_gateway,
  node_api_url: System.get_env("NODE_API_URL", "http://localhost:3001")

# JWT Secret (must match Node.js)
config :joken,
  default_signer: System.get_env("JWT_SECRET")
```

---

## Testing Structure

### `test/realtime_gateway_web/live/login_live_test.exs`
```elixir
defmodule RealtimeGatewayWeb.LoginLiveTest do
  use RealtimeGatewayWeb.ConnCase

  import Phoenix.LiveViewTest

  test "renders login page", %{conn: conn} do
    {:ok, _view, html} = live(conn, "/login")
    assert html =~ "Sign in to your account"
  end

  test "successful login redirects to dashboard", %{conn: conn} do
    {:ok, view, _html} = live(conn, "/login")

    # Mock API response
    # ... test implementation
  end
end
```

This structure provides:
- Clear separation of concerns
- Reusable components
- Proper service layer
- Test coverage
- Asset organization
