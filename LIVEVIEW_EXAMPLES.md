# Phoenix LiveView Examples

## Example 1: Login Page

### Create `lib/realtime_gateway_web/live/login_live.ex`

```elixir
defmodule RealtimeGatewayWeb.LoginLive do
  use RealtimeGatewayWeb, :live_view

  alias RealtimeGateway.Services.ApiClient

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(:phone, "")
     |> assign(:password, "")
     |> assign(:error, nil)
     |> assign(:loading, false)}
  end

  @impl true
  def handle_event("validate", %{"phone" => phone, "password" => password}, socket) do
    {:noreply,
     socket
     |> assign(:phone, phone)
     |> assign(:password, password)
     |> assign(:error, nil)}
  end

  @impl true
  def handle_event("login", %{"phone" => phone, "password" => password}, socket) do
    socket = assign(socket, :loading, true)

    case ApiClient.login(phone, password) do
      {:ok, %{"token" => jwt, "user" => user}} ->
        {:noreply,
         socket
         |> put_session(:jwt, jwt)
         |> put_session(:user, user)
         |> put_flash(:info, "Welcome back, #{user["name"]}!")
         |> redirect(to: ~p"/dashboard")}

      {:error, message} ->
        {:noreply,
         socket
         |> assign(:loading, false)
         |> assign(:error, message)
         |> put_flash(:error, "Login failed: #{message}")}
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sūq l-Filāḥa
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        <form phx-submit="login" phx-change="validate" class="mt-8 space-y-6">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="phone" class="sr-only">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={@phone}
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Phone number (e.g., +212600000000)"
              />
            </div>
            <div>
              <label for="password" class="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={@password}
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <%= if @error do %>
            <div class="rounded-md bg-red-50 p-4">
              <p class="text-sm text-red-800"><%= @error %></p>
            </div>
          <% end %>

          <div>
            <button
              type="submit"
              disabled={@loading}
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <%= if @loading do %>
                <span>Signing in...</span>
              <% else %>
                <span>Sign in</span>
              <% end %>
            </button>
          </div>
        </form>
      </div>
    </div>
    """
  end
end
```

---

## Example 2: Farmer Dashboard

### Create `lib/realtime_gateway_web/live/dashboard_live.ex`

```elixir
defmodule RealtimeGatewayWeb.DashboardLive do
  use RealtimeGatewayWeb, :live_view

  alias RealtimeGateway.Services.ApiClient

  @impl true
  def mount(_params, session, socket) do
    jwt = session["jwt"]
    user = session["user"]

    if connected?(socket) do
      # Subscribe to real-time updates
      Phoenix.PubSub.subscribe(RealtimeGateway.PubSub, "user:#{user["id"]}")
    end

    case ApiClient.get_user_profile(jwt) do
      {:ok, profile} ->
        {:ok,
         socket
         |> assign(:jwt, jwt)
         |> assign(:user, user)
         |> assign(:profile, profile)
         |> assign(:loading, false)
         |> load_dashboard_data()}

      {:error, :unauthorized} ->
        {:ok,
         socket
         |> put_flash(:error, "Session expired. Please login again.")
         |> redirect(to: ~p"/login")}

      {:error, _reason} ->
        {:ok,
         socket
         |> assign(:loading, false)
         |> put_flash(:error, "Failed to load dashboard")}
    end
  end

  @impl true
  def handle_info({:new_order, order}, socket) do
    # Real-time order notification from Phoenix Channel
    {:noreply,
     socket
     |> update(:orders, fn orders -> [order | orders] end)
     |> put_flash(:info, "New order received!")}
  end

  @impl true
  def handle_info({:negotiation_update, negotiation}, socket) do
    # Real-time negotiation update
    {:noreply,
     socket
     |> update(:negotiations, fn negotiations ->
       Enum.map(negotiations, fn n ->
         if n["id"] == negotiation["id"], do: negotiation, else: n
       end)
     end)}
  end

  defp load_dashboard_data(socket) do
    jwt = socket.assigns.jwt

    with {:ok, products} <- ApiClient.get_products(jwt, %{userId: socket.assigns.user["id"]}),
         {:ok, negotiations} <- ApiClient.get_negotiations(jwt) do
      socket
      |> assign(:products, products)
      |> assign(:negotiations, negotiations)
      |> assign(:stats, calculate_stats(products, negotiations))
    else
      {:error, _} ->
        socket
        |> put_flash(:error, "Failed to load dashboard data")
    end
  end

  defp calculate_stats(products, negotiations) do
    %{
      total_products: length(products),
      active_negotiations: Enum.count(negotiations, &(&1["status"] == "PENDING")),
      total_revenue: Enum.reduce(products, 0, &(&2 + (&1["price"] * &1["quantity"] || 0)))
    }
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="min-h-screen bg-gray-100">
      <!-- Header -->
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold text-gray-900">
            Farmer Dashboard
          </h1>
          <p class="mt-1 text-sm text-gray-600">
            Welcome back, <%= @user["name"] %>
          </p>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Stats -->
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Total Products
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      <%= @stats.total_products %>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Active Negotiations
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      <%= @stats.active_negotiations %>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      <%= format_currency(@stats.total_revenue) %> MAD
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Products List -->
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              Your Products
            </h3>
          </div>
          <ul class="divide-y divide-gray-200">
            <%= for product <- @products do %>
              <li>
                <a href={~p"/products/#{product["id"]}"} class="block hover:bg-gray-50">
                  <div class="px-4 py-4 sm:px-6">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium text-green-600 truncate">
                        <%= product["name"] %>
                      </p>
                      <div class="ml-2 flex-shrink-0 flex">
                        <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <%= product["quantity"] %> <%= product["unit"] %>
                        </p>
                      </div>
                    </div>
                    <div class="mt-2 sm:flex sm:justify-between">
                      <div class="sm:flex">
                        <p class="flex items-center text-sm text-gray-500">
                          <%= product["price"] %> MAD / <%= product["unit"] %>
                        </p>
                      </div>
                      <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Listed <%= format_date(product["createdAt"]) %>
                        </p>
                      </div>
                    </div>
                  </div>
                </a>
              </li>
            <% end %>
          </ul>
        </div>
      </main>
    </div>
    """
  end

  defp format_currency(amount) do
    :erlang.float_to_binary(amount / 1, decimals: 2)
  end

  defp format_date(date_string) do
    # Simple date formatting - enhance as needed
    date_string
  end
end
```

---

## Example 3: Buyer Product Search

### Create `lib/realtime_gateway_web/live/product_list_live.ex`

```elixir
defmodule RealtimeGatewayWeb.ProductListLive do
  use RealtimeGatewayWeb, :live_view

  alias RealtimeGateway.Services.ApiClient

  @impl true
  def mount(_params, session, socket) do
    jwt = session["jwt"]

    {:ok,
     socket
     |> assign(:jwt, jwt)
     |> assign(:search_query, "")
     |> assign(:category, "all")
     |> assign(:min_price, "")
     |> assign(:max_price, "")
     |> assign(:products, [])
     |> assign(:loading, true)
     |> load_products()}
  end

  @impl true
  def handle_event("search", %{"query" => query}, socket) do
    {:noreply,
     socket
     |> assign(:search_query, query)
     |> assign(:loading, true)
     |> load_products()}
  end

  @impl true
  def handle_event("filter", params, socket) do
    {:noreply,
     socket
     |> assign(:category, params["category"] || "all")
     |> assign(:min_price, params["min_price"] || "")
     |> assign(:max_price, params["max_price"] || "")
     |> assign(:loading, true)
     |> load_products()}
  end

  @impl true
  def handle_event("make_offer", %{"product_id" => product_id}, socket) do
    {:noreply, push_navigate(socket, to: ~p"/products/#{product_id}")}
  end

  defp load_products(socket) do
    filters = build_filters(socket.assigns)

    case ApiClient.get_products(socket.assigns.jwt, filters) do
      {:ok, products} ->
        socket
        |> assign(:products, products)
        |> assign(:loading, false)

      {:error, :unauthorized} ->
        socket
        |> put_flash(:error, "Session expired")
        |> redirect(to: ~p"/login")

      {:error, _} ->
        socket
        |> assign(:loading, false)
        |> put_flash(:error, "Failed to load products")
    end
  end

  defp build_filters(assigns) do
    %{}
    |> maybe_add_filter(:search, assigns.search_query)
    |> maybe_add_filter(:category, assigns.category, "all")
    |> maybe_add_filter(:minPrice, assigns.min_price)
    |> maybe_add_filter(:maxPrice, assigns.max_price)
  end

  defp maybe_add_filter(map, _key, ""), do: map
  defp maybe_add_filter(map, _key, nil), do: map
  defp maybe_add_filter(map, key, value, skip_value \\ nil)
  defp maybe_add_filter(map, _key, value, value), do: map
  defp maybe_add_filter(map, key, value, _), do: Map.put(map, key, value)

  @impl true
  def render(assigns) do
    ~H"""
    <div class="min-h-screen bg-gray-100">
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold text-gray-900">Browse Products</h1>
        </div>
      </header>

      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Search and Filters -->
        <div class="bg-white p-6 rounded-lg shadow mb-6">
          <form phx-submit="search" class="space-y-4">
            <div>
              <input
                type="text"
                name="query"
                value={@search_query}
                placeholder="Search products..."
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </form>

          <form phx-change="filter" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              >
                <option value="all">All Categories</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="grains">Grains</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Min Price (MAD)</label>
              <input
                type="number"
                name="min_price"
                value={@min_price}
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Max Price (MAD)</label>
              <input
                type="number"
                name="max_price"
                value={@max_price}
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
          </form>
        </div>

        <!-- Products Grid -->
        <%= if @loading do %>
          <div class="text-center py-12">
            <p class="text-gray-500">Loading products...</p>
          </div>
        <% else %>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <%= for product <- @products do %>
              <div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                <div class="p-6">
                  <h3 class="text-lg font-medium text-gray-900">
                    <%= product["name"] %>
                  </h3>
                  <p class="mt-2 text-sm text-gray-500">
                    <%= product["description"] %>
                  </p>
                  <div class="mt-4 flex items-center justify-between">
                    <div>
                      <p class="text-2xl font-bold text-green-600">
                        <%= product["price"] %> MAD
                      </p>
                      <p class="text-sm text-gray-500">
                        per <%= product["unit"] %>
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium text-gray-900">
                        <%= product["quantity"] %> <%= product["unit"] %>
                      </p>
                      <p class="text-xs text-gray-500">available</p>
                    </div>
                  </div>
                  <button
                    phx-click="make_offer"
                    phx-value-product_id={product["id"]}
                    class="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Make Offer
                  </button>
                </div>
              </div>
            <% end %>
          </div>
        <% end %>
      </main>
    </div>
    """
  end
end
```

This file contains the first 3 LiveView examples. Let me create the negotiation example next.
