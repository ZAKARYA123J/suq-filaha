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
     |> assign(:displayed_products, [])
     |> assign(:search_query, "")
     |> assign(:page, 1)
     |> assign(:per_page, 6)
     |> assign(:total_pages, 1)
     |> assign(:loading, true)
     |> load_profile()
     |> load_products()}
  end

  defp load_profile(socket) do
    case ApiClient.get_user_profile(socket.assigns.jwt) do
      {:ok, profile} -> assign(socket, profile: profile, current_user: profile)
      _ -> assign(socket, profile: socket.assigns.current_user)
    end
  end

  @impl true
  def handle_event("search", %{"query" => query}, socket) do
    {:noreply,
     socket
     |> assign(:search_query, query)
     |> assign(:page, 1)
     |> load_products()}
  end

  @impl true
  def handle_event("change_page", %{"page" => page}, socket) do
    page = String.to_integer(page)

    {:noreply,
     socket
     |> assign(:page, page)
     |> update_pagination()}
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
        socket
        |> assign(:products, products)
        |> assign(:loading, false)
        |> update_pagination()

      _ ->
        socket
        |> assign(:products, [])
        |> assign(:loading, false)
        |> update_pagination()
    end
  end

  defp update_pagination(socket) do
    products = socket.assigns.products
    page = socket.assigns.page
    per_page = socket.assigns.per_page

    total = length(products)
    total_pages = max(1, ceil(total / per_page))

    displayed =
      products
      |> Enum.drop((page - 1) * per_page)
      |> Enum.take(per_page)

    socket
    |> assign(:displayed_products, displayed)
    |> assign(:total_pages, total_pages)
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="min-h-screen bg-gray-50">
      <RealtimeGatewayWeb.Layouts.navbar profile={@profile} active_tab={:marketplace} notifications={@notifications} />
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
              <%= for product <- @displayed_products do %>
                <.link navigate={~p"/products/#{product["id"]}"} class="block bg-white overflow-hidden shadow rounded-2xl hover:shadow-lg transition-all duration-300 ring-1 ring-gray-100 group">
                  <div class="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                    <%= if product["images"] && length(product["images"]) > 0 do %>
                      <img src={hd(product["images"])} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <% else %>
                      <div class="w-full h-full flex items-center justify-center text-gray-400">
                         <svg class="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                    <% end %>
                    <div class="absolute top-3 right-3">
                      <span class={"px-2.5 py-1 rounded-full text-xs font-bold shadow-sm #{if product["isAvailable"], do: "bg-green-500 text-white", else: "bg-gray-500 text-white"}"}>
                        <%= if product["isAvailable"], do: "Available", else: "Sold Out" %>
                      </span>
                    </div>
                  </div>
                  <div class="px-5 py-5">
                    <div class="flex items-start justify-between gap-2 mb-1">
                      <h3 class="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-1"><%= product["name"] %></h3>
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 uppercase tracking-wider border border-green-100 whitespace-nowrap"><%= product["category"] %></span>
                    </div>
                    <div class="flex items-baseline gap-1 mb-3">
                      <span class="text-2xl font-extrabold text-gray-900"><%= product["price"] %></span>
                      <span class="text-xs font-semibold text-gray-500">MAD / <%= product["unit"] %></span>
                    </div>
                    <p class="text-sm text-gray-500 line-clamp-2 mb-4"><%= product["description"] || "No description provided." %></p>

                    <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
                       <div class="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                         <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                         Stock: <span class="text-gray-900"><%= product["quantity"] %> <%= product["unit"] %></span>
                       </div>
                       <div class="flex items-center gap-1.5 text-xs text-gray-500 font-medium truncate max-w-[50%]">
                         <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                         <span class="truncate"><%= product["user"]["name"] || (product["farmer"] && product["farmer"]["name"]) || "Seller" %></span>
                       </div>
                    </div>
                  </div>
                </.link>
              <% end %>
            </div>

            <%!-- Pagination Controls --%>
            <%= if @total_pages > 1 do %>
              <div class="mt-10 flex items-center justify-center gap-2">
                <button phx-click="change_page" phx-value-page={@page - 1} disabled={@page == 1} class="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div class="flex items-center gap-1">
                  <%= for p <- max(1, @page - 2)..min(@total_pages, @page + 2) do %>
                    <button phx-click="change_page" phx-value-page={p} class={"w-10 h-10 rounded-lg text-sm font-semibold transition #{if p == @page, do: "bg-green-600 text-white shadow-sm ring-1 ring-green-600", else: "text-gray-700 hover:bg-gray-100"}"}>
                      <%= p %>
                    </button>
                  <% end %>
                </div>
                <button phx-click="change_page" phx-value-page={@page + 1} disabled={@page == @total_pages} class="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            <% end %>

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
