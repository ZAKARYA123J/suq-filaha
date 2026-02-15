defmodule RealtimeGatewayWeb.DashboardLive do
  use RealtimeGatewayWeb, :live_view

  alias RealtimeGateway.Services.ApiClient
  require Logger

  @impl true
  def mount(_params, _session, socket) do
    user = socket.assigns.current_user

    socket =
      if connected?(socket) do
        Phoenix.PubSub.subscribe(RealtimeGateway.PubSub, "user:#{user["id"]}")
        socket
      else
        socket
      end

    socket =
      socket
      |> assign(:profile, nil)
      |> assign(:loading, true)
      |> assign(:negotiations, [])
      |> assign(:products, [])
      |> assign(:show_modal, false)
      |> assign(:editing_product, nil)
      |> assign(:form, to_form(%{}))
      |> allow_upload(:images, accept: ~w(.jpg .jpeg .png), max_entries: 5)
      |> load_profile()
      |> apply_action(socket.assigns.live_action)

    {:ok, socket, temporary_assigns: [negotiations: [], products: []]}
  end

  @impl true
  def handle_params(_params, _uri, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action)}
  end

  defp apply_action(socket, :profile) do
    socket
    |> assign(:page_title, "Dashboard · Profile")
    |> assign(:loading, false)
  end

  defp apply_action(socket, :negotiations) do
    socket
    |> assign(:page_title, "Dashboard · Negotiations")
    |> load_negotiations()
    |> assign(:loading, false)
  end

  defp apply_action(socket, :products) do
    socket
    |> assign(:page_title, "Dashboard · Products")
    |> load_products()
    |> assign(:loading, false)
  end

  defp apply_action(socket, _other), do: apply_action(socket, :profile)

  defp load_profile(socket) do
    jwt = socket.assigns.jwt

    profile =
      case ApiClient.get_user_profile(jwt) do
        {:ok, data} -> data
        _ -> socket.assigns.current_user
      end

    socket
    |> assign(:profile, profile)
    |> assign(:user, profile)
  end

  defp load_negotiations(socket) do
    jwt = socket.assigns.jwt

    negotiations =
      case ApiClient.get_negotiations(jwt) do
        {:ok, data} -> data
        _ -> []
      end

    assign(socket, :negotiations, negotiations)
  end

  defp load_products(socket) do
    jwt = socket.assigns.jwt
    profile = socket.assigns.profile || %{}

    products =
      if profile["userType"] == "FARMER" do
        case ApiClient.get_my_products(jwt) do
          {:ok, data} -> data
          _ -> []
        end
      else
        []
      end

    assign(socket, :products, products)
  end

  @impl true
  def handle_event("open_modal", params, socket) do
    product =
      if id = params["id"] do
        Enum.find(socket.assigns.products, &(&1["id"] == id))
      else
        nil
      end

    form_params =
      if product do
        %{
          "name" => product["name"],
          "category" => product["category"],
          "price" => product["price"],
          "quantity" => product["quantity"],
          "unit" => product["unit"],
          "description" => product["description"],
          "harvestDate" => product["harvestDate"]
        }
      else
        %{}
      end

    {:noreply,
     socket
     |> assign(:show_modal, true)
     |> assign(:editing_product, product)
     |> assign(:form, to_form(form_params))}
  end

  @impl true
  def handle_event("close_modal", _, socket) do
    {:noreply, socket |> assign(:show_modal, false) |> assign(:editing_product, nil)}
  end

  @impl true
  def handle_event("validate", params, socket) do
    {:noreply, assign(socket, :form, to_form(params))}
  end

  @impl true
  def handle_event("save_product", params, socket) do
    jwt = socket.assigns.jwt
    product_params = params

    # Handle uploads
    uploaded_files =
      consume_uploaded_entries(socket, :images, fn %{path: path}, _entry ->
        dest = Path.join(System.tmp_dir!(), Path.basename(path))
        File.cp!(path, dest)
        {:ok, dest}
      end)

    result =
      if product = socket.assigns.editing_product do
        ApiClient.update_product(jwt, product["id"], product_params, uploaded_files)
      else
        ApiClient.create_product(jwt, product_params, uploaded_files)
      end

    case result do
      {:ok, _} ->
        {:noreply,
         socket
         |> put_flash(:info, "Product saved successfully")
         |> assign(:show_modal, false)
         |> load_profile()
         |> load_products()}

      {:error, msg} ->
        {:noreply, put_flash(socket, :error, "Error saving product: #{msg}")}
    end
  end

  @impl true
  def handle_event("delete_product", %{"id" => id}, socket) do
    case ApiClient.delete_product(socket.assigns.jwt, id) do
      {:ok, _} ->
        {:noreply,
         socket
         |> put_flash(:info, "Product deleted")
         |> load_profile()
         |> load_products()}

      {:error, msg} ->
        {:noreply, put_flash(socket, :error, "Error deleting product: #{msg}")}
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="min-h-screen bg-gray-50 pb-12">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 space-y-8">
          <%= if @live_action == :profile do %>
            <!-- Profile Section -->
            <div class="bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden sm:rounded-xl">
              <div class="px-4 py-5 sm:px-6 flex justify-between items-start">
                <div>
                  <h3 class="text-lg leading-6 font-semibold text-gray-900">Profile</h3>
                  <p class="mt-1 max-w-2xl text-sm text-gray-500">Your personal details.</p>
                </div>
                <%= if @profile["profileInfo"] do %>
                  <div class="h-16 w-16 rounded-full overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                    <img src={@profile["profileInfo"]} alt="Avatar" class="h-full w-full object-cover" />
                  </div>
                <% else %>
                  <div class="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl font-bold ring-1 ring-gray-200">
                    <%= String.at(@profile["name"] || "U", 0) %>
                  </div>
                <% end %>
              </div>
              <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl class="sm:divide-y sm:divide-gray-200">
                  <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">Full name</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"><%= @profile["name"] %></dd>
                  </div>
                  <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">Phone number</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"><%= @profile["phoneNumber"] %></dd>
                  </div>
                  <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">Location</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"><%= @profile["location"] || "Not set" %></dd>
                  </div>
                  <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">Rating</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                      <span class="text-yellow-400 mr-1">★</span> <%= @profile["rating"] || "0.0" %>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          <% end %>

          <%= if @live_action == :negotiations do %>
            <!-- Negotiations / Stats -->
            <div class="bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden sm:rounded-xl">
              <div class="px-4 py-5 sm:px-6 flex items-center justify-between">
                <div>
                  <h3 class="text-lg leading-6 font-semibold text-gray-900">My Negotiations</h3>
                  <p class="mt-1 text-sm text-gray-500">Only negotiations related to your account.</p>
                </div>
              </div>
              <div class="border-t border-gray-200">
                <ul role="list" class="divide-y divide-gray-200">
                  <%= for negotiation <- @negotiations do %>
                    <li>
                      <.link navigate={~p"/negotiations/#{negotiation["id"]}"} class="block hover:bg-gray-50">
                        <div class="px-4 py-4 sm:px-6">
                          <div class="flex items-center justify-between">
                            <p class="text-sm font-medium text-green-700 truncate">
                              <%= negotiation["product"]["name"] %>
                            </p>
                            <div class="ml-2 flex-shrink-0 flex">
                              <p class={"px-2 inline-flex text-xs leading-5 font-semibold rounded-full #{status_color(negotiation["status"])}"}>
                                <%= negotiation["status"] %>
                              </p>
                            </div>
                          </div>
                          <div class="mt-2 text-sm text-gray-500">
                            Proposed: <%= negotiation["proposedPrice"] %> for <%= negotiation["product"]["price"] %>
                          </div>
                        </div>
                      </.link>
                    </li>
                  <% end %>
                  <%= if Enum.empty?(@negotiations) do %>
                    <li class="px-4 py-6 text-center text-gray-500">No negotiations found.</li>
                  <% end %>
                </ul>
              </div>
            </div>
          <% end %>

          <%= if @live_action == :products do %>
            <!-- Farmer Products Management -->
            <%= if @profile["userType"] == "FARMER" do %>
              <div class="bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-xl overflow-hidden">
                <div class="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
                  <div>
                    <h3 class="text-lg leading-6 font-semibold text-gray-900">My Products</h3>
                    <p class="mt-1 text-sm text-gray-500">Manage the items you sell.</p>
                  </div>
                  <button phx-click="open_modal" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium">
                    + Add Product
                  </button>
                </div>

                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" class="relative px-6 py-3">
                          <span class="sr-only">Edit</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <%= for product <- @products do %>
                        <tr>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <%= if product["images"] && length(product["images"]) > 0 do %>
                              <img src={hd(product["images"])} class="h-10 w-10 rounded object-cover" />
                            <% else %>
                              <div class="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Img</div>
                            <% end %>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"><%= product["name"] %></td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><%= product["category"] %></td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><%= product["price"] %></td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><%= product["quantity"] %> <%= product["unit"] %></td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span class={"px-2 inline-flex text-xs leading-5 font-semibold rounded-full #{if product["isAvailable"], do: "bg-green-100 text-green-800", else: "bg-red-100 text-red-800"}"}>
                              <%= if product["isAvailable"], do: "Available", else: "Sold Out" %>
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button phx-click="open_modal" phx-value-id={product["id"]} class="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                            <button phx-click="delete_product" phx-value-id={product["id"]} data-confirm="Are you sure?" class="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      <% end %>
                    </tbody>
                  </table>
                  <%= if Enum.empty?(@products) do %>
                    <div class="p-8 text-center text-gray-500">
                      You haven't listed any products yet.
                    </div>
                  <% end %>
                </div>
              </div>
            <% else %>
              <div class="bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-xl overflow-hidden">
                <div class="p-8 text-center text-gray-600">
                  Products management is available for farmers only.
                </div>
              </div>
            <% end %>
          <% end %>
        </main>

        <!-- Modal -->
        <%= if @live_action == :products && @show_modal do %>
          <div class="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" phx-click="close_modal"></div>

              <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    <%= if @editing_product, do: "Edit Product", else: "Add New Product" %>
                  </h3>
                  <div class="mt-4">
                    <.form for={@form} phx-submit="save_product" phx-change="validate" class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" name="name" value={@form[:name].value} required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Category</label>
                          <select name="category" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                            <%= for cat <- ["Vegetables", "Fruits", "Grains", "Dairy", "Seeds", "Equipment"] do %>
                              <option value={cat} selected={@form[:category].value == cat}><%= cat %></option>
                            <% end %>
                          </select>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Price</label>
                          <input type="number" step="0.01" name="price" value={@form[:price].value} required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Quantity</label>
                          <input type="number" step="0.01" name="quantity" value={@form[:quantity].value} required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Unit</label>
                          <input type="text" name="unit" value={@form[:unit].value || "kg"} required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="kg, piece, etc." />
                        </div>
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" rows="3" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><%= @form[:description].value %></textarea>
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700">Harvest Date</label>
                        <input type="date" name="harvestDate" value={@form[:harvestDate].value} class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700">Images (Max 5)</label>
                        <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div class="space-y-1 text-center">
                            <.live_file_input upload={@uploads.images} />
                          </div>
                        </div>

                        <%= for entry <- @uploads.images.entries do %>
                          <div class="text-sm text-gray-600">
                            <%= entry.client_name %> - <%= entry.progress %>%
                          </div>
                        <% end %>
                      </div>

                      <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse -mx-6 -mb-6 mt-6">
                        <button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                          <%= if @editing_product, do: "Save Changes", else: "Add Product" %>
                        </button>
                        <button type="button" phx-click="close_modal" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                          Cancel
                        </button>
                      </div>
                    </.form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        <% end %>
      </div>
    """
  end

  defp status_color("PENDING"), do: "bg-yellow-100 text-yellow-800"
  defp status_color("ACCEPTED"), do: "bg-green-100 text-green-800"
  defp status_color("REJECTED"), do: "bg-red-100 text-red-800"
  defp status_color("CANCELLED"), do: "bg-gray-100 text-gray-800"
  defp status_color(_), do: "bg-gray-100 text-gray-800"
end
