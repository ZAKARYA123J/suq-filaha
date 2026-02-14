# LiveView Negotiation with Phoenix Channels Integration

## Complete Negotiation LiveView Example

This example shows how to integrate Phoenix Channels real-time updates into a LiveView page.

### Create `lib/realtime_gateway_web/live/negotiation_live.ex`

```elixir
defmodule RealtimeGatewayWeb.NegotiationLive do
  use RealtimeGatewayWeb, :live_view

  alias RealtimeGateway.Services.ApiClient
  alias Phoenix.PubSub

  @impl true
  def mount(%{"id" => negotiation_id}, session, socket) do
    jwt = session["jwt"]
    user = session["user"]

    # Subscribe to Phoenix Channel updates via PubSub
    if connected?(socket) do
      topic = "negotiation:#{negotiation_id}"
      PubSub.subscribe(RealtimeGateway.PubSub, topic)
      
      # Also subscribe to user-specific updates
      PubSub.subscribe(RealtimeGateway.PubSub, "user:#{user["id"]}")
    end

    case ApiClient.get_negotiation(jwt, negotiation_id) do
      {:ok, negotiation} ->
        {:ok,
         socket
         |> assign(:jwt, jwt)
         |> assign(:user, user)
         |> assign(:negotiation_id, negotiation_id)
         |> assign(:negotiation, negotiation)
         |> assign(:messages, negotiation["messages"] || [])
         |> assign(:new_message, "")
         |> assign(:typing_users, MapSet.new())
         |> assign(:online_users, MapSet.new())
         |> assign(:loading, false)
         |> assign(:sending, false)}

      {:error, :unauthorized} ->
        {:ok,
         socket
         |> put_flash(:error, "Unauthorized")
         |> redirect(to: ~p"/login")}

      {:error, _reason} ->
        {:ok,
         socket
         |> put_flash(:error, "Negotiation not found")
         |> redirect(to: ~p"/dashboard")}
    end
  end

  # Handle new messages from Phoenix Channel
  @impl true
  def handle_info(%{event: "new_message", payload: message}, socket) do
    {:noreply,
     socket
     |> update(:messages, fn messages -> messages ++ [message] end)
     |> scroll_to_bottom()}
  end

  # Handle typing indicators
  @impl true
  def handle_info(%{event: "typing", payload: %{"userId" => user_id, "typing" => true}}, socket) do
    if user_id != socket.assigns.user["id"] do
      {:noreply,
       socket
       |> update(:typing_users, &MapSet.put(&1, user_id))}
    else
      {:noreply, socket}
    end
  end

  @impl true
  def handle_info(%{event: "typing", payload: %{"userId" => user_id, "typing" => false}}, socket) do
    {:noreply,
     socket
     |> update(:typing_users, &MapSet.delete(&1, user_id))}
  end

  # Handle user presence
  @impl true
  def handle_info(%{event: "user_joined", payload: %{"userId" => user_id}}, socket) do
    {:noreply,
     socket
     |> update(:online_users, &MapSet.put(&1, user_id))
     |> put_flash(:info, "User joined the negotiation")}
  end

  @impl true
  def handle_info(%{event: "user_left", payload: %{"userId" => user_id}}, socket) do
    {:noreply,
     socket
     |> update(:online_users, &MapSet.delete(&1, user_id))}
  end

  # Handle negotiation status updates
  @impl true
  def handle_info(%{event: "negotiation_ended", payload: payload}, socket) do
    {:noreply,
     socket
     |> assign(:negotiation, Map.put(socket.assigns.negotiation, "status", payload["status"]))
     |> put_flash(:info, "Negotiation #{payload["status"]}")}
  end

  # Handle queued messages delivery
  @impl true
  def handle_info(%{event: "queued_messages", payload: %{"messages" => messages}}, socket) do
    {:noreply,
     socket
     |> update(:messages, fn existing -> existing ++ messages end)
     |> put_flash(:info, "#{length(messages)} offline messages delivered")}
  end

  # Handle message input changes
  @impl true
  def handle_event("message_changed", %{"message" => message}, socket) do
    # Broadcast typing indicator via PubSub (will be picked up by Channel)
    if String.length(message) > 0 do
      broadcast_typing(socket.assigns.negotiation_id, socket.assigns.user["id"], true)
    else
      broadcast_typing(socket.assigns.negotiation_id, socket.assigns.user["id"], false)
    end

    {:noreply, assign(socket, :new_message, message)}
  end

  # Handle send message
  @impl true
  def handle_event("send_message", %{"message" => message}, socket) do
    if String.trim(message) == "" do
      {:noreply, socket}
    else
      socket = assign(socket, :sending, true)

      case ApiClient.send_negotiation_message(
             socket.assigns.jwt,
             socket.assigns.negotiation_id,
             message
           ) do
        {:ok, _response} ->
          # Message will be broadcast via Channel and received in handle_info
          broadcast_typing(socket.assigns.negotiation_id, socket.assigns.user["id"], false)

          {:noreply,
           socket
           |> assign(:new_message, "")
           |> assign(:sending, false)}

        {:error, reason} ->
          {:noreply,
           socket
           |> assign(:sending, false)
           |> put_flash(:error, "Failed to send message: #{reason}")}
      end
    end
  end

  # Handle accept offer
  @impl true
  def handle_event("accept_offer", _params, socket) do
    case ApiClient.update_negotiation_status(
           socket.assigns.jwt,
           socket.assigns.negotiation_id,
           "ACCEPTED"
         ) do
      {:ok, _} ->
        {:noreply,
         socket
         |> put_flash(:info, "Offer accepted!")
         |> assign(:negotiation, Map.put(socket.assigns.negotiation, "status", "ACCEPTED"))}

      {:error, reason} ->
        {:noreply, put_flash(socket, :error, "Failed to accept: #{reason}")}
    end
  end

  # Handle reject offer
  @impl true
  def handle_event("reject_offer", _params, socket) do
    case ApiClient.update_negotiation_status(
           socket.assigns.jwt,
           socket.assigns.negotiation_id,
           "REJECTED"
         ) do
      {:ok, _} ->
        {:noreply,
         socket
         |> put_flash(:info, "Offer rejected")
         |> assign(:negotiation, Map.put(socket.assigns.negotiation, "status", "REJECTED"))}

      {:error, reason} ->
        {:noreply, put_flash(socket, :error, "Failed to reject: #{reason}")}
    end
  end

  # Handle counter offer
  @impl true
  def handle_event("counter_offer", %{"amount" => amount}, socket) do
    message = "Counter offer: #{amount} MAD"

    case ApiClient.send_negotiation_message(
           socket.assigns.jwt,
           socket.assigns.negotiation_id,
           message
         ) do
      {:ok, _} ->
        {:noreply, put_flash(socket, :info, "Counter offer sent")}

      {:error, reason} ->
        {:noreply, put_flash(socket, :error, "Failed to send counter offer: #{reason}")}
    end
  end

  # Private helper functions

  defp broadcast_typing(negotiation_id, user_id, typing) do
    PubSub.broadcast(
      RealtimeGateway.PubSub,
      "negotiation:#{negotiation_id}",
      %{event: "typing_indicator", payload: %{userId: user_id, typing: typing}}
    )
  end

  defp scroll_to_bottom(socket) do
    push_event(socket, "scroll-to-bottom", %{})
  end

  defp format_timestamp(timestamp) do
    # Simple formatting - enhance with proper datetime library
    timestamp
  end

  defp is_own_message?(message, user_id) do
    message["senderId"] == user_id
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="flex flex-col h-screen bg-gray-100" phx-hook="ScrollToBottom" id="negotiation-container">
      <!-- Header -->
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                Negotiation #<%= @negotiation["id"] %>
              </h1>
              <p class="text-sm text-gray-600">
                Product: <%= @negotiation["product"]["name"] %>
              </p>
            </div>
            <div class="flex items-center space-x-4">
              <!-- Online Status -->
              <div class="flex items-center">
                <span class={[
                  "h-3 w-3 rounded-full mr-2",
                  if(MapSet.size(@online_users) > 0, do: "bg-green-500", else: "bg-gray-400")
                ]}></span>
                <span class="text-sm text-gray-600">
                  <%= MapSet.size(@online_users) %> online
                </span>
              </div>

              <!-- Status Badge -->
              <span class={[
                "px-3 py-1 rounded-full text-sm font-medium",
                case @negotiation["status"] do
                  "PENDING" -> "bg-yellow-100 text-yellow-800"
                  "ACCEPTED" -> "bg-green-100 text-green-800"
                  "REJECTED" -> "bg-red-100 text-red-800"
                  "CANCELLED" -> "bg-gray-100 text-gray-800"
                  _ -> "bg-gray-100 text-gray-800"
                end
              ]}>
                <%= @negotiation["status"] %>
              </span>
            </div>
          </div>
        </div>
      </header>

      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto px-4 py-6 space-y-4" id="messages-container">
        <%= for message <- @messages do %>
          <div class={[
            "flex",
            if(is_own_message?(message, @user["id"]), do: "justify-end", else: "justify-start")
          ]}>
            <div class={[
              "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
              if(is_own_message?(message, @user["id"]),
                do: "bg-green-600 text-white",
                else: "bg-white text-gray-900"
              )
            ]}>
              <p class="text-sm"><%= message["content"] %></p>
              <p class={[
                "text-xs mt-1",
                if(is_own_message?(message, @user["id"]), do: "text-green-100", else: "text-gray-500")
              ]}>
                <%= format_timestamp(message["createdAt"]) %>
              </p>
            </div>
          </div>
        <% end %>

        <!-- Typing Indicator -->
        <%= if MapSet.size(@typing_users) > 0 do %>
          <div class="flex justify-start">
            <div class="bg-gray-200 rounded-lg px-4 py-2">
              <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              </div>
            </div>
          </div>
        <% end %>
      </div>

      <!-- Action Buttons (if pending) -->
      <%= if @negotiation["status"] == "PENDING" do %>
        <div class="bg-white border-t border-gray-200 px-4 py-3">
          <div class="flex space-x-2 mb-3">
            <button
              phx-click="accept_offer"
              class="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Accept Offer
            </button>
            <button
              phx-click="reject_offer"
              class="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Reject Offer
            </button>
          </div>
        </div>
      <% end %>

      <!-- Message Input -->
      <%= if @negotiation["status"] == "PENDING" do %>
        <div class="bg-white border-t border-gray-200 px-4 py-4">
          <form phx-submit="send_message" class="flex space-x-2">
            <input
              type="text"
              name="message"
              value={@new_message}
              phx-change="message_changed"
              placeholder="Type your message..."
              disabled={@sending}
              class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={@sending || String.trim(@new_message) == ""}
              class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <%= if @sending, do: "Sending...", else: "Send" %>
            </button>
          </form>
        </div>
      <% end %>
    </div>
    """
  end
end
```

---

## JavaScript Hook for Auto-Scroll

### Create `assets/js/hooks.js`

```javascript
// Phoenix LiveView Hooks
export const Hooks = {
  ScrollToBottom: {
    mounted() {
      this.scrollToBottom();
      
      // Listen for scroll-to-bottom events from LiveView
      this.handleEvent("scroll-to-bottom", () => {
        this.scrollToBottom();
      });
    },
    
    updated() {
      this.scrollToBottom();
    },
    
    scrollToBottom() {
      const container = document.getElementById("messages-container");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }
};
```

### Update `assets/js/app.js`

```javascript
import "phoenix_html"
import {Socket} from "phoenix"
import {LiveSocket} from "phoenix_live_view"
import topbar from "../vendor/topbar"
import {Hooks} from "./hooks"

let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")
let liveSocket = new LiveSocket("/live", Socket, {
  params: {_csrf_token: csrfToken},
  hooks: Hooks
})

// Show progress bar on live navigation and form submits
topbar.config({barColors: {0: "#29d"}, shadowColor: "rgba(0, 0, 0, .3)"})
window.addEventListener("phx:page-loading-start", info => topbar.show())
window.addEventListener("phx:page-loading-stop", info => topbar.hide())

// connect if there are any LiveViews on the page
liveSocket.connect()

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket
```

---

## Integration with Existing Phoenix Channel

### Update `lib/realtime_gateway_web/channels/negotiation_channel.ex`

Add PubSub broadcasting to notify LiveView:

```elixir
defmodule RealtimeGatewayWeb.NegotiationChannel do
  use RealtimeGatewayWeb, :channel

  alias Phoenix.PubSub

  # ... existing code ...

  def handle_in("new_message", %{"content" => content}, socket) do
    negotiation_id = socket.assigns.negotiation_id
    user_id = socket.assigns.user_id

    # Save message via Node.js API
    case save_message_to_api(negotiation_id, user_id, content) do
      {:ok, message} ->
        # Broadcast to Channel subscribers (mobile app)
        broadcast!(socket, "new_message", message)
        
        # ALSO broadcast to PubSub for LiveView subscribers
        PubSub.broadcast(
          RealtimeGateway.PubSub,
          "negotiation:#{negotiation_id}",
          %{event: "new_message", payload: message}
        )
        
        {:reply, {:ok, message}, socket}

      {:error, reason} ->
        {:reply, {:error, %{message: reason}}, socket}
    end
  end

  def handle_in("typing", %{"typing" => typing}, socket) do
    negotiation_id = socket.assigns.negotiation_id
    user_id = socket.assigns.user_id

    payload = %{
      userId: user_id,
      negotiationId: negotiation_id,
      typing: typing
    }

    # Broadcast to Channel
    broadcast!(socket, "typing", payload)
    
    # Broadcast to PubSub for LiveView
    PubSub.broadcast(
      RealtimeGateway.PubSub,
      "negotiation:#{negotiation_id}",
      %{event: "typing", payload: payload}
    )

    {:noreply, socket}
  end

  def handle_in("end_negotiation", %{"status" => status}, socket) do
    negotiation_id = socket.assigns.negotiation_id
    user_id = socket.assigns.user_id

    case update_negotiation_status(negotiation_id, status) do
      {:ok, _} ->
        payload = %{
          negotiationId: negotiation_id,
          status: status,
          endedBy: user_id,
          endedAt: DateTime.utc_now()
        }

        # Broadcast to Channel
        broadcast!(socket, "negotiation_ended", payload)
        
        # Broadcast to PubSub for LiveView
        PubSub.broadcast(
          RealtimeGateway.PubSub,
          "negotiation:#{negotiation_id}",
          %{event: "negotiation_ended", payload: payload}
        )

        {:reply, {:ok, payload}, socket}

      {:error, reason} ->
        {:reply, {:error, %{message: reason}}, socket}
    end
  end

  # ... rest of existing code ...
end
```

---

## Key Integration Points

### 1. **LiveView subscribes to PubSub in mount/3**
```elixir
if connected?(socket) do
  PubSub.subscribe(RealtimeGateway.PubSub, "negotiation:#{negotiation_id}")
end
```

### 2. **Channel broadcasts to both Channel and PubSub**
```elixir
# For mobile app (Channel)
broadcast!(socket, "new_message", message)

# For web app (LiveView via PubSub)
PubSub.broadcast(RealtimeGateway.PubSub, "negotiation:#{negotiation_id}", 
  %{event: "new_message", payload: message})
```

### 3. **LiveView receives updates in handle_info/2**
```elixir
def handle_info(%{event: "new_message", payload: message}, socket) do
  {:noreply, update(socket, :messages, fn messages -> messages ++ [message] end)}
end
```

### 4. **LiveView sends updates via API, Channel broadcasts**
```elixir
# LiveView calls Node.js API
ApiClient.send_negotiation_message(jwt, negotiation_id, message)

# Node.js returns success, Channel picks up and broadcasts
# Both mobile and web receive the update
```

This creates a unified real-time system where:
- Mobile app uses Phoenix Channels directly
- Web app uses LiveView with PubSub subscriptions
- Both receive the same real-time updates
- All business logic stays in Node.js
