defmodule RealtimeGatewayWeb.NegotiationLive do
  use RealtimeGatewayWeb, :live_view

  alias RealtimeGateway.Services.ApiClient
  alias Phoenix.PubSub

  @impl true
  def mount(%{"id" => negotiation_id}, _session, socket) do
    jwt = socket.assigns.jwt
    user = socket.assigns.current_user

    if connected?(socket) do
      # Subscribe via PubSub – NegotiationChannel broadcasts on this topic
      PubSub.subscribe(RealtimeGateway.PubSub, "negotiation:#{negotiation_id}")
    end

    socket =
      socket
      |> assign(:jwt, jwt)
      |> assign(:current_user, user)
      |> assign(:user, user)
      |> assign(:negotiation_id, negotiation_id)
      |> assign(:page_title, "Negotiation")
      |> assign(:loading, true)
      |> assign(:sending, false)
      |> assign(:negotiation, nil)
      |> assign(:messages, [])
      |> assign(:new_message, "")
      |> assign(:typing_users, %{})
      |> load_negotiation()

    {:ok, socket}
  end

  @impl true
  def handle_params(_params, _url, socket) do
    {:noreply, socket}
  end

  # ── Load negotiation + messages ─────────────────────────────────────────────

  defp load_negotiation(socket) do
    jwt = socket.assigns.jwt
    negotiation_id = socket.assigns.negotiation_id

    case ApiClient.get_negotiation(jwt, negotiation_id) do
      {:ok, negotiation} ->
        messages = negotiation["messages"] || []

        # Also fetch messages separately if not embedded
        messages =
          if messages == [] do
            case ApiClient.get_negotiation_messages(jwt, negotiation_id) do
              {:ok, msgs} -> msgs
              _ -> []
            end
          else
            messages
          end

        socket
        |> assign(:negotiation, negotiation)
        |> assign(:messages, messages)
        |> assign(:loading, false)
        |> assign(
          :page_title,
          "Negotiation · #{negotiation["product"]["name"] || negotiation_id}"
        )

      {:error, _reason} ->
        socket
        |> put_flash(:error, "Failed to load negotiation")
        |> assign(:loading, false)
        |> redirect(to: ~p"/dashboard/negotiations")
    end
  end

  # ── Events ──────────────────────────────────────────────────────────────────

  @impl true
  def handle_event("send_message", %{"message" => content}, socket) do
    content = String.trim(content)

    if content == "" do
      {:noreply, socket}
    else
      negotiation_id = socket.assigns.negotiation_id
      jwt = socket.assigns.jwt
      user = socket.assigns.user

      socket = assign(socket, :sending, true)

      case ApiClient.send_negotiation_message(jwt, negotiation_id, content) do
        {:ok, message} ->
          # Optimistically add own message directly (channel will broadcast to others)
          own_message = %{
            "id" => message["id"] || generate_temp_id(),
            "content" => content,
            "senderId" => user["id"],
            "createdAt" => message["createdAt"] || DateTime.utc_now() |> DateTime.to_iso8601()
          }

          {:noreply,
           socket
           |> assign(:new_message, "")
           |> assign(:sending, false)
           |> update(:messages, fn msgs -> msgs ++ [own_message] end)
           |> push_event("scroll_to_bottom", %{})
           |> push_event("clear_chat_input", %{})}

        {:error, _reason} ->
          {:noreply,
           socket
           |> assign(:sending, false)
           |> put_flash(:error, "Failed to send message")}
      end
    end
  end

  @impl true
  def handle_event("update_status", %{"status" => status}, socket) do
    negotiation_id = socket.assigns.negotiation_id
    jwt = socket.assigns.jwt

    case ApiClient.update_negotiation_status(jwt, negotiation_id, status) do
      {:ok, updated} ->
        {:noreply,
         socket
         |> assign(:negotiation, updated)
         |> put_flash(:info, "Negotiation #{String.downcase(status)}")}

      {:error, _} ->
        {:noreply, put_flash(socket, :error, "Failed to update negotiation status")}
    end
  end

  @impl true
  def handle_event("typing", _params, socket) do
    # Broadcast typing via PubSub
    negotiation_id = socket.assigns.negotiation_id
    user_id = socket.assigns.user["id"]

    RealtimeGatewayWeb.Endpoint.broadcast("negotiation:#{negotiation_id}", "user_typing", %{
      userId: user_id,
      typing: true
    })

    {:noreply, socket}
  end

  # ── PubSub handlers ─────────────────────────────────────────────────────────

  @impl true
  def handle_info(
        %Phoenix.Socket.Broadcast{event: "new_message", payload: message},
        socket
      ) do
    user_id = socket.assigns.user["id"]

    # Normalize payload keys (channel sends atom keys, API returns string keys)
    normalized = %{
      "id" => message[:id] || message["id"],
      "content" => message[:content] || message["content"],
      "senderId" => message[:senderId] || message["senderId"],
      "createdAt" =>
        message[:createdAt] || message["createdAt"] || DateTime.utc_now() |> DateTime.to_iso8601()
    }

    # Skip if this is our own message (we add it optimistically on send)
    if normalized["senderId"] == user_id do
      {:noreply, socket}
    else
      {:noreply,
       socket
       |> update(:messages, fn msgs -> msgs ++ [normalized] end)
       |> push_event("scroll_to_bottom", %{})}
    end
  end

  def handle_info(
        %Phoenix.Socket.Broadcast{event: "user_typing", payload: %{userId: uid, typing: typing}},
        socket
      ) do
    {:noreply,
     assign(socket, :typing_users, update_typing(socket.assigns.typing_users, uid, typing))}
  end

  def handle_info(
        %Phoenix.Socket.Broadcast{
          event: "user_typing",
          payload: %{"userId" => uid, "typing" => typing}
        },
        socket
      ) do
    {:noreply,
     assign(socket, :typing_users, update_typing(socket.assigns.typing_users, uid, typing))}
  end

  def handle_info(%Phoenix.Socket.Broadcast{event: "negotiation_ended", payload: payload}, socket) do
    status = payload[:status] || payload["status"]

    updated_neg =
      if socket.assigns.negotiation do
        Map.put(socket.assigns.negotiation, "status", status)
      else
        socket.assigns.negotiation
      end

    {:noreply,
     socket
     |> assign(:negotiation, updated_neg)
     |> put_flash(:info, "Negotiation has been #{String.downcase(status || "ended")}")}
  end

  def handle_info(_msg, socket), do: {:noreply, socket}

  # ── Helpers ─────────────────────────────────────────────────────────────────

  defp update_typing(typing_users, uid, true), do: Map.put(typing_users, uid, true)
  defp update_typing(typing_users, uid, false), do: Map.delete(typing_users, uid)
  defp update_typing(typing_users, _, _), do: typing_users

  defp generate_temp_id, do: "tmp-#{System.unique_integer([:positive])}"

  defp format_time(nil), do: ""

  defp format_time(iso_string) when is_binary(iso_string) do
    case DateTime.from_iso8601(iso_string) do
      {:ok, dt, _offset} -> Calendar.strftime(dt, "%H:%M")
      _ -> iso_string
    end
  end

  defp format_time(_), do: ""

  defp status_badge("ACCEPTED"), do: "bg-green-100 text-green-800"
  defp status_badge("REJECTED"), do: "bg-red-100 text-red-800"
  defp status_badge("CANCELLED"), do: "bg-gray-100 text-gray-500"
  defp status_badge("PENDING"), do: "bg-yellow-100 text-yellow-800"
  defp status_badge(_), do: "bg-gray-100 text-gray-500"

  defp can_send_message?(negotiation) do
    status = negotiation && negotiation["status"]
    status in [nil, "PENDING"]
  end

  defp is_farmer?(user, negotiation) do
    negotiation && user["id"] == negotiation["farmerId"]
  end

  # ── Render ──────────────────────────────────────────────────────────────────

  @impl true
  def render(assigns) do
    ~H"""
    <div class="flex flex-col" style="height: calc(100vh - 4rem);">

      <!-- Negotiation Header -->
      <div class="bg-white border-b border-gray-200 px-4 py-3 flex-none">
        <div class="max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-3">
            <.link navigate={~p"/dashboard/negotiations"} class="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
              </svg>
            </.link>

            <div>
              <%= if @loading do %>
                <div class="text-sm font-semibold text-gray-500">Loading...</div>
              <% else %>
                <div class="text-sm font-semibold text-gray-900">
                  <%= @negotiation && @negotiation["product"]["name"] %>
                </div>
                <div class="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                  <span>
                    <%= if @negotiation["proposedPrice"] do %>
                      Offer: <strong><%= @negotiation["proposedPrice"] %> MAD</strong>
                      for listed <strong><%= @negotiation["product"]["price"] %> MAD</strong>
                    <% end %>
                  </span>
                  <span class={"px-2 py-0.5 rounded-full text-[10px] font-bold #{status_badge(@negotiation && @negotiation["status"])}"}>
                    <%= @negotiation && @negotiation["status"] %>
                  </span>
                </div>
              <% end %>
            </div>
          </div>

          <!-- Action buttons for farmer -->
          <%= if !@loading && @negotiation && @negotiation["status"] == "PENDING" && is_farmer?(@user, @negotiation) do %>
            <div class="flex gap-2">
              <button
                phx-click="update_status"
                phx-value-status="ACCEPTED"
                data-confirm="Accept this negotiation?"
                class="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                ✓ Accept
              </button>
              <button
                phx-click="update_status"
                phx-value-status="REJECTED"
                data-confirm="Reject this negotiation?"
                class="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                ✗ Reject
              </button>
            </div>
          <% end %>

          <!-- Cancel for either party -->
          <%= if !@loading && @negotiation && @negotiation["status"] == "PENDING" && !is_farmer?(@user, @negotiation) do %>
            <button
              phx-click="update_status"
              phx-value-status="CANCELLED"
              data-confirm="Cancel this negotiation?"
              class="px-3 py-1.5 text-xs font-semibold bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          <% end %>
        </div>
      </div>

      <!-- Messages Area -->
      <div
        class="flex-1 overflow-y-auto px-4 py-4"
        id="messages-container"
        phx-hook="ScrollToBottom"
      >
        <div class="max-w-3xl mx-auto space-y-3">
          <%= if @loading do %>
            <div class="flex justify-center items-center h-32">
              <div class="text-gray-400 text-sm flex items-center gap-2">
                <svg class="animate-spin h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Loading conversation…
              </div>
            </div>
          <% else %>
            <%= if Enum.empty?(@messages) do %>
              <div class="flex flex-col items-center justify-center py-16 text-center">
                <div class="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"/>
                  </svg>
                </div>
                <p class="text-sm text-gray-500">No messages yet.</p>
                <p class="text-xs text-gray-400 mt-1">Start the negotiation!</p>
              </div>
            <% end %>

            <%= for message <- @messages do %>
              <% is_mine = message["senderId"] == @user["id"] %>
              <div class={"flex #{if is_mine, do: "justify-end", else: "justify-start"}"}>
                <div class={"max-w-sm lg:max-w-md"}>
                  <div class={"px-4 py-2.5 rounded-2xl shadow-sm text-sm #{if is_mine, do: "bg-green-600 text-white rounded-br-sm", else: "bg-white text-gray-900 border border-gray-100 rounded-bl-sm"}"}>
                    <%= message["content"] %>
                  </div>
                  <p class={"text-[10px] mt-0.5 #{if is_mine, do: "text-right text-gray-400", else: "text-gray-400"}"}>
                    <%= format_time(message["createdAt"]) %>
                  </p>
                </div>
              </div>
            <% end %>

            <!-- Typing indicator -->
            <%= if Enum.any?(@typing_users, fn {uid, _} -> uid != @user["id"] end) do %>
              <div class="flex justify-start">
                <div class="px-4 py-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div class="flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay:0ms"></span>
                    <span class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay:150ms"></span>
                    <span class="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style="animation-delay:300ms"></span>
                  </div>
                </div>
              </div>
            <% end %>
          <% end %>
        </div>
      </div>

      <!-- Input Area -->
      <footer class="bg-white border-t border-gray-200 px-4 py-3 flex-none">
        <div class="max-w-3xl mx-auto">
          <%= if !@loading && @negotiation && can_send_message?(@negotiation) do %>
            <form phx-submit="send_message" phx-change="typing" id="chat-form">
              <div class="flex items-center gap-3">
                <input
                  id="chat-input"
                  type="text"
                  name="message"
                  value={@new_message}
                  class="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                  placeholder="Type your offer or message…"
                  autocomplete="off"
                  phx-hook="ChatInput"
                />
                <button
                  type="submit"
                  disabled={@sending}
                  class="flex-none w-10 h-10 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <%= if @sending do %>
                    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  <% else %>
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  <% end %>
                </button>
              </div>
            </form>
          <% else %>
            <div class="text-center text-sm text-gray-400 py-1">
              <%= cond do %>
                <% @loading -> %>
                <% @negotiation && @negotiation["status"] == "ACCEPTED" -> %>
                  🎉 Negotiation accepted — deal is closed.
                <% @negotiation && @negotiation["status"] in ["REJECTED", "CANCELLED"] -> %>
                  This negotiation is closed.
                <% true -> %>
              <% end %>
            </div>
          <% end %>
        </div>
      </footer>
    </div>
    """
  end
end
