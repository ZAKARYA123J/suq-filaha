defmodule RealtimeGatewayWeb.ProductDetailLive do
  use RealtimeGatewayWeb, :live_view

  alias RealtimeGateway.Services.ApiClient

  @impl true
  def mount(%{"id" => id}, _session, socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(
        RealtimeGateway.PubSub,
        "user:#{socket.assigns.current_user["id"]}"
      )
    end

    socket =
      socket
      |> assign(:product, nil)
      |> assign(:loading, true)
      |> assign(:error, nil)
      |> load_profile()
      |> load_product(id)

    {:ok, socket}
  end

  defp load_profile(socket) do
    case ApiClient.get_user_profile(socket.assigns.jwt) do
      {:ok, profile} -> assign(socket, profile: profile, current_user: profile)
      _ -> assign(socket, profile: socket.assigns.current_user)
    end
  end

  defp load_product(socket, id) do
    case ApiClient.get_product(socket.assigns.jwt, id) do
      {:ok, product} ->
        socket
        |> assign(:product, product)
        |> assign(:page_title, product["name"] || "Product Details")
        |> assign(:loading, false)

      {:error, msg} ->
        socket
        |> assign(:error, msg)
        |> assign(:loading, false)
    end
  end

  @impl true
  def handle_event("start_negotiation", %{"product_id" => _product_id}, socket) do
    {:noreply, put_flash(socket, :info, "Offer functionality coming soon!")}
  end
end
