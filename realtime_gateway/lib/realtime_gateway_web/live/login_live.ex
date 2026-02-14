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
      {:ok, %{"token" => jwt}} ->
        {:noreply,
         socket
         |> redirect(to: ~p"/auth/login_token?token=#{jwt}")}

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
