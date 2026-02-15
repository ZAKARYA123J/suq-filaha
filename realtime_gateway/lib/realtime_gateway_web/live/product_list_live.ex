defmodule RealtimeGatewayWeb.ProductListLive do
  use RealtimeGatewayWeb, :live_view

  alias RealtimeGateway.Services.ApiClient

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(:jwt, socket.assigns.jwt)
     |> assign(:current_user, socket.assigns.current_user)
     |> assign(:products, [])
     |> assign(:search_query, "")
     |> assign(:loading, true)
     |> load_products()}
  end

  @impl true
  def handle_event("search", %{"query" => query}, socket) do
    {:noreply,
     socket
     |> assign(:search_query, query)
     |> load_products()}
  end

  @impl true
  def handle_event("start_negotiation", %{"product_id" => _product_id}, socket) do
    # Placeholder for starting negotiation
    # In a real app, this would call ApiClient.create_offer or redirect to an offer form
    {:noreply, put_flash(socket, :info, "Offer functionality coming soon!")}
  end

  defp load_products(socket) do
    jwt = socket.assigns.jwt
    query = socket.assigns.search_query

    params = if query != "", do: %{"search" => query}, else: %{}

    case ApiClient.get_products(jwt, params) do
      {:ok, products} ->
        assign(socket, :products, products)
        |> assign(:loading, false)

      _ ->
        assign(socket, :products, [])
        |> assign(:loading, false)
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="min-h-screen bg-gray-50">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <!-- Search Bar -->
          <div class="mb-6">
            <form phx-change="search" phx-submit="search" onsubmit="return false;">
              <div class="relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="query"
                  value={@search_query}
                  class="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="Search products..."
                  debounce="300"
                />
              </div>
            </form>
          </div>

          <!-- Product Grid -->
          <%= if @loading do %>
            <div class="text-center py-12">
              <p class="text-gray-500">Loading products...</p>
            </div>
          <% else %>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <%= for product <- @products do %>
                <div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
                  <div class="px-4 py-5 sm:p-6">
                    <div class="flex items-center justify-between">
                      <h3 class="text-lg leading-6 font-medium text-gray-900 truncate">
                        <%= product["name"] %>
                      </h3>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <%= product["price"] %> MAD / <%= product["unit"] %>
                      </span>
                    </div>
                    <p class="mt-2 text-sm text-gray-500 line-clamp-2">
                       <%= product["description"] || "No description available" %>
                    </p>
                    <div class="mt-4 flex items-center justify-between">
                      <div class="text-sm text-gray-500">
                        Available: <span class="font-medium text-gray-900"><%= product["quantity"] %> <%= product["unit"] %></span>
                      </div>
                      <div class="text-sm text-gray-500">
                         Seller: <%= product["user"]["name"] || "Unknown" %>
                      </div>
                    </div>
                  </div>
                  <div class="bg-gray-50 px-4 py-4 sm:px-6">
                    <button
                      class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      phx-click="start_negotiation"
                      phx-value-product_id={product["id"]}
                    >
                      Make Offer
                    </button>
                  </div>
                </div>
              <% end %>
            </div>

            <%= if Enum.empty?(@products) do %>
              <div class="text-center py-12">
                <p class="text-gray-500">No products found matching your search.</p>
              </div>
            <% end %>
          <% end %>
        </div>
      </main>
    </div>
    """
  end
end
