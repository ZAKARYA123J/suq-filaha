defmodule RealtimeGatewayWeb.DashboardLive do
  use RealtimeGatewayWeb, :live_view

  alias RealtimeGateway.Services.ApiClient

  # ── Mount ───────────────────────────────────────────────────────────────────

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(
        RealtimeGateway.PubSub,
        "user:#{socket.assigns.current_user["id"]}"
      )
    end

    socket =
      socket
      |> assign(profile: nil, loading: true, stats: nil)
      |> assign(negotiations: [], products: [])
      |> assign(show_modal: false, editing_product: nil, form: to_form(%{}))
      |> assign(
        products_page: 1,
        products_per_page: 5,
        products_total_pages: 1,
        displayed_products: []
      )
      |> allow_upload(:images, accept: ~w(.jpg .jpeg .png), max_entries: 5)
      |> load_profile()
      |> apply_action(socket.assigns.live_action)

    {:ok, socket, temporary_assigns: [negotiations: []]}
  end

  @impl true
  def handle_params(_params, _uri, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action)}
  end

  # ── Actions (tab routing) ────────────────────────────────────────────────────

  defp apply_action(socket, :index) do
    socket
    |> assign(:page_title, "Dashboard · Overview")
    |> load_negotiations()
    |> load_products()
    |> compute_stats()
    |> assign(:loading, false)
  end

  defp apply_action(socket, :negotiations) do
    socket
    |> assign(:page_title, "Dashboard · Negotiations")
    |> load_negotiations()
    |> compute_stats()
    |> assign(:loading, false)
  end

  defp apply_action(socket, :products) do
    socket
    |> assign(:page_title, "Dashboard · Products")
    |> load_products()
    |> compute_stats()
    |> assign(:loading, false)
  end

  defp apply_action(socket, _), do: apply_action(socket, :index)

  # ── Data loaders ─────────────────────────────────────────────────────────────

  defp load_profile(socket) do
    case ApiClient.get_user_profile(socket.assigns.jwt) do
      {:ok, profile} -> assign(socket, profile: profile, user: profile)
      _ -> assign(socket, profile: socket.assigns.current_user, user: socket.assigns.current_user)
    end
  end

  defp load_negotiations(socket) do
    case ApiClient.get_negotiations(socket.assigns.jwt) do
      {:ok, data} -> assign(socket, :negotiations, data)
      _ -> assign(socket, :negotiations, [])
    end
  end

  defp load_products(socket) do
    profile = socket.assigns.profile || %{}

    if profile["userType"] == "FARMER" do
      case ApiClient.get_my_products(socket.assigns.jwt) do
        {:ok, data} ->
          socket
          |> assign(:products, data)
          |> update_products_pagination()

        _ ->
          socket
          |> assign(:products, [])
          |> update_products_pagination()
      end
    else
      socket
    end
  end

  defp update_products_pagination(socket) do
    products = socket.assigns.products || []
    page = socket.assigns.products_page
    per_page = socket.assigns.products_per_page

    total = length(products)
    total_pages = max(1, ceil(total / per_page))

    displayed =
      products
      |> Enum.drop((page - 1) * per_page)
      |> Enum.take(per_page)

    socket
    |> assign(:displayed_products, displayed)
    |> assign(:products_total_pages, total_pages)
  end

  # Compute stats locally from already-loaded data — no extra API call needed
  defp compute_stats(socket) do
    profile = socket.assigns.profile || %{}

    if profile["userType"] == "FARMER" do
      negs = socket.assigns.negotiations
      prods = socket.assigns.products

      stats = %{
        "productCount" => length(prods),
        "negotiationCount" => length(negs),
        "acceptedCount" => Enum.count(negs, &(&1["status"] == "ACCEPTED")),
        "rating" => profile["rating"] || "0.0"
      }

      assign(socket, :stats, stats)
    else
      socket
    end
  end

  # ── Product CRUD events ──────────────────────────────────────────────────────

  @impl true
  def handle_event("open_modal", params, socket) do
    product = params["id"] && Enum.find(socket.assigns.products, &(&1["id"] == params["id"]))

    form_params =
      if product,
        do: Map.take(product, ~w(name category price quantity unit description harvestDate)),
        else: %{}

    {:noreply,
     assign(socket, show_modal: true, editing_product: product, form: to_form(form_params))}
  end

  @impl true
  def handle_event("close_modal", _, socket) do
    {:noreply, assign(socket, show_modal: false, editing_product: nil)}
  end

  @impl true
  def handle_event("change_products_page", %{"page" => page}, socket) do
    page = String.to_integer(page)

    {:noreply,
     socket
     |> assign(:products_page, page)
     |> update_products_pagination()}
  end

  @impl true
  def handle_event("validate", params, socket) do
    {:noreply, assign(socket, :form, to_form(params))}
  end

  @impl true
  def handle_event("save_product", params, socket) do
    jwt = socket.assigns.jwt

    uploaded_files =
      consume_uploaded_entries(socket, :images, fn %{path: path}, _entry ->
        dest = Path.join(System.tmp_dir!(), Path.basename(path))
        File.cp!(path, dest)
        {:ok, dest}
      end)

    result =
      if product = socket.assigns.editing_product do
        ApiClient.update_product(jwt, product["id"], params, uploaded_files)
      else
        ApiClient.create_product(jwt, params, uploaded_files)
      end

    case result do
      {:ok, _} ->
        {:noreply,
         socket
         |> put_flash(:info, "Product saved successfully")
         |> assign(show_modal: false)
         |> load_profile()
         |> load_products()
         |> compute_stats()}

      {:error, msg} ->
        {:noreply, put_flash(socket, :error, "Error: #{msg}")}
    end
  end

  @impl true
  def handle_event("delete_product", %{"id" => id}, socket) do
    case ApiClient.delete_product(socket.assigns.jwt, id) do
      {:ok, _} ->
        {:noreply,
         socket
         |> put_flash(:info, "Product deleted")
         |> load_products()
         |> compute_stats()}

      {:error, msg} ->
        {:noreply, put_flash(socket, :error, "Error: #{msg}")}
    end
  end

  # ── Helpers (used in template) ───────────────────────────────────────────────

  def status_color("PENDING"), do: "bg-yellow-100 text-yellow-800"
  def status_color("ACCEPTED"), do: "bg-green-100 text-green-800"
  def status_color("REJECTED"), do: "bg-red-100 text-red-800"
  def status_color("CANCELLED"), do: "bg-gray-100 text-gray-500"
  def status_color(_), do: "bg-gray-100 text-gray-500"
end
