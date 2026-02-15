defmodule RealtimeGatewayWeb.NegotiationLive do
  use RealtimeGatewayWeb, :live_view

  alias RealtimeGateway.Services.ApiClient
  alias Phoenix.PubSub

  @impl true
  def mount(%{"id" => negotiation_id}, _session, socket) do
    jwt = socket.assigns.jwt
    user = socket.assigns.current_user

    if connected?(socket) do
      PubSub.subscribe(RealtimeGateway.PubSub, "negotiation:#{negotiation_id}")
    end

    socket =
      socket
      |> assign(:jwt, jwt)
      |> assign(:current_user, user)
      |> assign(:user, user)
      |> assign(:negotiation_id, negotiation_id)
      |> assign(:loading, true)
      |> assign(:messages, [])
      |> assign(:new_message, "")
      |> assign(:typing_users, %{})
      |> load_negotiation()

    {:ok, socket}
  end

  defp load_negotiation(socket) do
    jwt = socket.assigns.jwt
    negotiation_id = socket.assigns.negotiation_id

    case ApiClient.get_negotiation(jwt, negotiation_id) do
      {:ok, negotiation} ->
        # Assume negotiation includes messages field or we fetch them separately
        # If API returns messages separate, we would need another call.
        # Based on ApiClient, get_negotiation returns the negotiation object.
        # Ideally it includes messages. Let's assume it does or fetch them.
        # If not, let's just use what we have.
        messages = negotiation["messages"] || []

        socket
        |> assign(:negotiation, negotiation)
        |> assign(:messages, messages)
        |> assign(:loading, false)

      {:error, _reason} ->
        socket
        |> put_flash(:error, "Failed to load negotiation")
        |> assign(:loading, false)
        |> redirect(to: ~p"/dashboard")
    end
  end

  @impl true
  def handle_params(_params, _url, socket) do
    {:noreply, socket}
  end

  @impl true
  def handle_event("send_message", %{"message" => content}, socket) do
    if content == "" do
      {:noreply, socket}
    else
      negotiation_id = socket.assigns.negotiation_id
      jwt = socket.assigns.jwt

      # Optimistic update could happen here, but since valid message comes from channel/API
      # we wait for the broadcast or API response.
      case ApiClient.send_negotiation_message(jwt, negotiation_id, content) do
        {:ok, _message} ->
          # The message will be broadcasted by the channel/API backend and received via PubSub
          {:noreply, assign(socket, :new_message, "")}

        {:error, _reason} ->
          {:noreply, put_flash(socket, :error, "Failed to send message")}
      end
    end
  end

  @impl true
  def handle_event("typing", _params, socket) do
    user_id = socket.assigns.user["id"]
    negotiation_id = socket.assigns.negotiation_id

    RealtimeGatewayWeb.Endpoint.broadcast("negotiation:#{negotiation_id}", "user_typing", %{
      userId: user_id,
      typing: true
    })

    {:noreply, socket}
  end

  # Handle PubSub messages from Channel
  @impl true
  def handle_info(%Phoenix.Socket.Broadcast{event: "new_message", payload: message}, socket) do
    {:noreply,
     socket
     |> update(:messages, fn messages -> messages ++ [message] end)
     |> push_event("scroll_to_bottom", %{})}
  end

  # Handle typing events if broadcasted
  def handle_info(
        %Phoenix.Socket.Broadcast{
          event: "user_typing",
          payload: %{userId: user_id, typing: typing}
        },
        socket
      ) do
    typing_users = socket.assigns.typing_users

    new_typing_users =
      if typing do
        Map.put(typing_users, user_id, true)
      else
        Map.delete(typing_users, user_id)
      end

    {:noreply, assign(socket, :typing_users, new_typing_users)}
  end

  # Catch-all for other events
  def handle_info(_msg, socket), do: {:noreply, socket}

  @impl true
  def render(assigns) do
    ~H"""
    <div class="flex flex-col h-[calc(100vh-4rem)] bg-gray-100">

      <!-- Chat Area -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4" id="messages" phx-hook="ScrollToBottom">
        <div class="max-w-3xl mx-auto space-y-4">
          <%= if @loading do %>
            <div class="text-center py-10">
              <p class="text-gray-500">Loading conversation...</p>
            </div>
          <% else %>
            <%= for message <- @messages do %>
              <div class={"flex #{if message["senderId"] == @user["id"], do: "justify-end", else: "justify-start"}"}>
                <div class={"max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow #{if message["senderId"] == @user["id"], do: "bg-green-600 text-white", else: "bg-white text-gray-900"}"}>
                  <p class="text-sm"><%= message["content"] %></p>
                  <p class={"text-xs mt-1 text-right #{if message["senderId"] == @user["id"], do: "text-green-200", else: "text-gray-400"}"}>
                    <%= format_time(message["createdAt"]) %>
                  </p>
                </div>
              </div>
            <% end %>

            <%= if Enum.empty?(@messages) do %>
              <div class="text-center py-10">
                <p class="text-gray-500">No messages yet. Start the negotiation!</p>
              </div>
            <% end %>
          <% end %>
            <%= if Enum.any?(@typing_users, fn {uid, _} -> uid != @user["id"] end) do %>
              <div class="text-xs text-gray-500 italic px-4 py-2">
                Someone is typing...
              </div>
            <% end %>
        </div>
      </div>

      <!-- Input Area -->
      <footer class="bg-white border-t border-gray-200 p-4 flex-none">
        <div class="max-w-3xl mx-auto">
          <form phx-submit="send_message" phx-change="typing">
            <div class="flex space-x-4">
              <input
                type="text"
                name="message"
                value={@new_message}
                class="flex-1 focus:ring-green-500 focus:border-green-500 block w-full rounded-md sm:text-sm border-gray-300"
                placeholder="Type your offer or message..."
                autocomplete="off"
              />
              <button
                type="submit"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </footer>
    </div>
    """
  end

  defp status_color("PENDING"), do: "bg-yellow-100 text-yellow-800"
  defp status_color("ACCEPTED"), do: "bg-green-100 text-green-800"
  defp status_color("REJECTED"), do: "bg-red-100 text-red-800"
  defp status_color(_), do: "bg-gray-100 text-gray-800"

  defp format_time(nil), do: ""

  defp format_time(iso_string) do
    case DateTime.from_iso8601(iso_string) do
      {:ok, dt, _offset} -> Calendar.strftime(dt, "%H:%M")
      _ -> iso_string
    end
  end
end
