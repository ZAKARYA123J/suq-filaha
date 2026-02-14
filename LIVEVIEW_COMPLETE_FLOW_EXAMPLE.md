# Complete End-to-End Flow Example

This document shows a complete user journey through the system, demonstrating how Phoenix LiveView, Phoenix Channels, and Node.js work together.

---

## Scenario: Buyer Makes an Offer and Negotiates

### Step-by-Step Flow

```
User Action → LiveView → Node.js API → Phoenix Channel → LiveView Update
```

---

## 1. User Logs In

### Browser → LiveView
```
User visits: https://yourdomain.com/login
```

### LiveView: `login_live.ex`
```elixir
def mount(_params, _session, socket) do
  {:ok, assign(socket, phone: "", password: "", error: nil)}
end

def handle_event("login", %{"phone" => phone, "password" => password}, socket) do
  case ApiClient.login(phone, password) do
    {:ok, %{"token" => jwt, "user" => user}} ->
      {:noreply,
       socket
       |> put_session(:jwt, jwt)
       |> put_session(:user, user)
       |> redirect(to: ~p"/dashboard")}
  end
end
```

### LiveView → Node.js API
```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "phone": "+212600000000",
  "password": "securepassword"
}
```

### Node.js Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "name": "Ahmed",
    "userType": "BUYER",
    "phone": "+212600000000"
  }
}
```

### Result
- JWT stored in Phoenix session
- User redirected to `/dashboard`

---

## 2. User Browses Products

### Browser → LiveView
```
User visits: https://yourdomain.com/products
```

### LiveView: `product_list_live.ex`
```elixir
def mount(_params, session, socket) do
  jwt = session["jwt"]
  
  {:ok,
   socket
   |> assign(:jwt, jwt)
   |> load_products()}
end

defp load_products(socket) do
  case ApiClient.get_products(socket.assigns.jwt, %{}) do
    {:ok, products} ->
      assign(socket, :products, products)
  end
end
```

### LiveView → Node.js API
```http
GET http://localhost:3001/api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Node.js Response
```json
[
  {
    "id": "prod123",
    "name": "Fresh Tomatoes",
    "description": "Organic tomatoes from Agadir",
    "price": 15.00,
    "unit": "kg",
    "quantity": 500,
    "userId": "farmer456",
    "user": {
      "id": "farmer456",
      "name": "Mohammed",
      "userType": "FARMER"
    }
  }
]
```

### Result
- Products displayed in grid
- User can search and filter

---

## 3. User Makes an Offer

### Browser → LiveView
```
User clicks "Make Offer" on product prod123
User enters offer: 1000 MAD for 100kg
```

### LiveView: `product_detail_live.ex`
```elixir
def handle_event("make_offer", %{"amount" => amount, "quantity" => qty}, socket) do
  product_id = socket.assigns.product["id"]
  
  offer_data = %{
    amount: String.to_float(amount),
    quantity: String.to_integer(qty),
    message: "Initial offer"
  }
  
  case ApiClient.create_offer(socket.assigns.jwt, product_id, offer_data) do
    {:ok, negotiation} ->
      {:noreply,
       socket
       |> put_flash(:info, "Offer sent!")
       |> redirect(to: ~p"/negotiations/#{negotiation["id"]}")}
  end
end
```

### LiveView → Node.js API
```http
POST http://localhost:3001/api/offers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "productId": "prod123",
  "amount": 1000.00,
  "quantity": 100,
  "message": "Initial offer"
}
```

### Node.js Processing
```javascript
// backend-core/src/controllers/offer.controller.ts
async createOffer(req, res) {
  const { productId, amount, quantity, message } = req.body;
  const buyerId = req.user.id; // From JWT
  
  // 1. Validate product exists
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });
  
  // 2. Create negotiation
  const negotiation = await prisma.negotiation.create({
    data: {
      productId,
      buyerId,
      status: 'PENDING',
      messages: {
        create: {
          senderId: buyerId,
          content: message,
          offerAmount: amount,
          offerQuantity: quantity
        }
      }
    },
    include: {
      product: true,
      buyer: true,
      messages: true
    }
  });
  
  // 3. Notify farmer via Phoenix Channel
  await notifyFarmer(product.userId, negotiation);
  
  return res.json(negotiation);
}

async notifyFarmer(farmerId, negotiation) {
  // Send HTTP request to Phoenix to trigger Channel broadcast
  await axios.post('http://localhost:4000/api/internal/notify', {
    userId: farmerId,
    event: 'new_negotiation',
    data: negotiation
  });
}
```

### Node.js Response
```json
{
  "id": "neg789",
  "productId": "prod123",
  "buyerId": "user123",
  "status": "PENDING",
  "product": {
    "id": "prod123",
    "name": "Fresh Tomatoes",
    "userId": "farmer456"
  },
  "messages": [
    {
      "id": "msg001",
      "senderId": "user123",
      "content": "Initial offer",
      "offerAmount": 1000.00,
      "offerQuantity": 100,
      "createdAt": "2026-02-14T13:45:00Z"
    }
  ]
}
```

### Phoenix Internal Controller
```elixir
# lib/realtime_gateway_web/controllers/internal_controller.ex
def notify(conn, %{"userId" => user_id, "event" => event, "data" => data}) do
  # Broadcast to both Channel (mobile) and PubSub (web)
  
  # For mobile app
  RealtimeGatewayWeb.Endpoint.broadcast(
    "user:#{user_id}",
    event,
    data
  )
  
  # For web app (LiveView)
  Phoenix.PubSub.broadcast(
    RealtimeGateway.PubSub,
    "user:#{user_id}",
    %{event: event, payload: data}
  )
  
  json(conn, %{success: true})
end
```

### Result
- Negotiation created in database
- Farmer notified on mobile app
- Farmer notified on web app (if online)
- Buyer redirected to negotiation page

---

## 4. Real-time Negotiation Chat

### Browser → LiveView
```
Buyer navigates to: https://yourdomain.com/negotiations/neg789
```

### LiveView: `negotiation_live.ex`
```elixir
def mount(%{"id" => negotiation_id}, session, socket) do
  jwt = session["jwt"]
  user = session["user"]
  
  # Subscribe to real-time updates
  if connected?(socket) do
    Phoenix.PubSub.subscribe(
      RealtimeGateway.PubSub,
      "negotiation:#{negotiation_id}"
    )
  end
  
  # Load negotiation data
  case ApiClient.get_negotiation(jwt, negotiation_id) do
    {:ok, negotiation} ->
      {:ok,
       socket
       |> assign(:jwt, jwt)
       |> assign(:user, user)
       |> assign(:negotiation, negotiation)
       |> assign(:messages, negotiation["messages"])}
  end
end
```

### LiveView → Node.js API
```http
GET http://localhost:3001/api/negotiations/neg789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Node.js Response
```json
{
  "id": "neg789",
  "productId": "prod123",
  "buyerId": "user123",
  "status": "PENDING",
  "product": {
    "id": "prod123",
    "name": "Fresh Tomatoes",
    "userId": "farmer456",
    "user": {
      "id": "farmer456",
      "name": "Mohammed"
    }
  },
  "messages": [
    {
      "id": "msg001",
      "senderId": "user123",
      "content": "Initial offer: 1000 MAD for 100kg",
      "createdAt": "2026-02-14T13:45:00Z"
    }
  ]
}
```

### Result
- Negotiation page loaded
- Previous messages displayed
- LiveView subscribed to real-time updates

---

## 5. Farmer Responds (Mobile App)

### Mobile App → Phoenix Channel
```javascript
// Mobile app sends message via Phoenix Channel
channel.push("new_message", {
  content: "Counter offer: 1200 MAD for 100kg"
})
```

### Phoenix Channel: `negotiation_channel.ex`
```elixir
def handle_in("new_message", %{"content" => content}, socket) do
  negotiation_id = socket.assigns.negotiation_id
  user_id = socket.assigns.user_id
  jwt = socket.assigns.jwt
  
  # Save message via Node.js API
  case save_message_to_api(jwt, negotiation_id, user_id, content) do
    {:ok, message} ->
      # Broadcast to Channel subscribers (mobile)
      broadcast!(socket, "new_message", message)
      
      # Broadcast to PubSub subscribers (web)
      Phoenix.PubSub.broadcast(
        RealtimeGateway.PubSub,
        "negotiation:#{negotiation_id}",
        %{event: "new_message", payload: message}
      )
      
      {:reply, {:ok, message}, socket}
  end
end

defp save_message_to_api(jwt, negotiation_id, user_id, content) do
  case Req.post(
    "#{@node_api_url}/api/negotiations/#{negotiation_id}/messages",
    json: %{content: content},
    headers: [{"authorization", "Bearer #{jwt}"}]
  ) do
    {:ok, %{status: 201, body: message}} -> {:ok, message}
    _ -> {:error, "Failed to save message"}
  end
end
```

### Channel → Node.js API
```http
POST http://localhost:3001/api/negotiations/neg789/messages
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "content": "Counter offer: 1200 MAD for 100kg"
}
```

### Node.js Processing
```javascript
async createMessage(req, res) {
  const { negotiationId } = req.params;
  const { content } = req.body;
  const senderId = req.user.id;
  
  // Save to database
  const message = await prisma.negotiationMessage.create({
    data: {
      negotiationId,
      senderId,
      content
    },
    include: {
      sender: true
    }
  });
  
  return res.status(201).json(message);
}
```

### Node.js Response
```json
{
  "id": "msg002",
  "negotiationId": "neg789",
  "senderId": "farmer456",
  "content": "Counter offer: 1200 MAD for 100kg",
  "createdAt": "2026-02-14T13:46:00Z",
  "sender": {
    "id": "farmer456",
    "name": "Mohammed",
    "userType": "FARMER"
  }
}
```

### Phoenix Channel Broadcasts
```elixir
# To mobile app (Channel)
broadcast!(socket, "new_message", message)

# To web app (PubSub)
Phoenix.PubSub.broadcast(
  RealtimeGateway.PubSub,
  "negotiation:#{negotiation_id}",
  %{event: "new_message", payload: message}
)
```

---

## 6. Buyer Receives Message (Web)

### LiveView: `negotiation_live.ex`
```elixir
# This runs automatically when PubSub broadcast is received
def handle_info(%{event: "new_message", payload: message}, socket) do
  {:noreply,
   socket
   |> update(:messages, fn messages -> messages ++ [message] end)
   |> push_event("scroll-to-bottom", %{})}
end
```

### Browser Updates
```
New message appears in chat:
┌─────────────────────────────────────┐
│ Mohammed (Farmer)                   │
│ Counter offer: 1200 MAD for 100kg   │
│ 13:46                               │
└─────────────────────────────────────┘
```

### Result
- Message appears instantly in buyer's browser
- No page refresh needed
- Smooth real-time experience

---

## 7. Buyer Accepts Offer

### Browser → LiveView
```
User clicks "Accept Offer" button
```

### LiveView: `negotiation_live.ex`
```elixir
def handle_event("accept_offer", _params, socket) do
  negotiation_id = socket.assigns.negotiation_id
  jwt = socket.assigns.jwt
  
  case ApiClient.update_negotiation_status(jwt, negotiation_id, "ACCEPTED") do
    {:ok, _} ->
      {:noreply,
       socket
       |> assign(:negotiation, %{socket.assigns.negotiation | "status" => "ACCEPTED"})
       |> put_flash(:info, "Offer accepted! Order created.")}
  end
end
```

### LiveView → Node.js API
```http
PATCH http://localhost:3001/api/negotiations/neg789
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "ACCEPTED"
}
```

### Node.js Processing
```javascript
async updateNegotiation(req, res) {
  const { negotiationId } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  
  // Update negotiation
  const negotiation = await prisma.negotiation.update({
    where: { id: negotiationId },
    data: { status }
  });
  
  // Create order if accepted
  if (status === 'ACCEPTED') {
    const order = await prisma.order.create({
      data: {
        negotiationId,
        buyerId: negotiation.buyerId,
        farmerId: negotiation.product.userId,
        productId: negotiation.productId,
        quantity: negotiation.finalQuantity,
        totalAmount: negotiation.finalAmount,
        status: 'PENDING'
      }
    });
    
    // Notify both parties
    await notifyUsers([negotiation.buyerId, negotiation.product.userId], {
      event: 'negotiation_ended',
      data: { negotiation, order }
    });
  }
  
  return res.json(negotiation);
}
```

### Phoenix Broadcasts
```elixir
# Both mobile and web receive update
Phoenix.PubSub.broadcast(
  RealtimeGateway.PubSub,
  "negotiation:neg789",
  %{
    event: "negotiation_ended",
    payload: %{
      negotiationId: "neg789",
      status: "ACCEPTED",
      orderId: "order123"
    }
  }
)
```

### Result
- Negotiation status updated to ACCEPTED
- Order created in database
- Both buyer and farmer notified
- UI updates to show accepted status

---

## Complete Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (Buyer)    │
└──────┬──────┘
       │ 1. Login
       ↓
┌─────────────────────────────────────┐
│     Phoenix LiveView                │
│  ┌─────────────────────────────┐   │
│  │ LoginLive.handle_event()    │   │
│  └─────────────┬───────────────┘   │
└────────────────┼───────────────────┘
                 │ 2. POST /api/auth/login
                 ↓
┌─────────────────────────────────────┐
│        Node.js API                  │
│  ┌─────────────────────────────┐   │
│  │ AuthController.login()      │   │
│  │ - Validate credentials      │   │
│  │ - Generate JWT              │   │
│  │ - Return user + token       │   │
│  └─────────────┬───────────────┘   │
└────────────────┼───────────────────┘
                 │ 3. JWT Response
                 ↓
┌─────────────────────────────────────┐
│     Phoenix LiveView                │
│  ┌─────────────────────────────┐   │
│  │ Store JWT in session        │   │
│  │ Redirect to /dashboard      │   │
│  └─────────────┬───────────────┘   │
└────────────────┼───────────────────┘
                 │ 4. Navigate
                 ↓
┌─────────────────────────────────────┐
│     Phoenix LiveView                │
│  ┌─────────────────────────────┐   │
│  │ DashboardLive.mount()       │   │
│  │ - Subscribe to PubSub       │   │
│  │ - Load data from API        │   │
│  └─────────────┬───────────────┘   │
└────────────────┼───────────────────┘
                 │ 5. GET /api/products
                 ↓
┌─────────────────────────────────────┐
│        Node.js API                  │
│  ┌─────────────────────────────┐   │
│  │ ProductController.list()    │   │
│  │ - Validate JWT              │   │
│  │ - Query database            │   │
│  │ - Return products           │   │
│  └─────────────┬───────────────┘   │
└────────────────┼───────────────────┘
                 │ 6. Products JSON
                 ↓
┌─────────────────────────────────────┐
│     Phoenix LiveView                │
│  ┌─────────────────────────────┐   │
│  │ Render products in UI       │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

... (User makes offer) ...

┌─────────────┐
│ Mobile App  │
│  (Farmer)   │
└──────┬──────┘
       │ 7. Send message
       ↓
┌─────────────────────────────────────┐
│     Phoenix Channel                 │
│  ┌─────────────────────────────┐   │
│  │ NegotiationChannel          │   │
│  │   .handle_in("new_message") │   │
│  └─────────────┬───────────────┘   │
└────────────────┼───────────────────┘
                 │ 8. POST /api/negotiations/:id/messages
                 ↓
┌─────────────────────────────────────┐
│        Node.js API                  │
│  ┌─────────────────────────────┐   │
│  │ Save message to database    │   │
│  └─────────────┬───────────────┘   │
└────────────────┼───────────────────┘
                 │ 9. Message saved
                 ↓
┌─────────────────────────────────────┐
│     Phoenix Channel                 │
│  ┌─────────────────────────────┐   │
│  │ broadcast! to Channel       │───┼──→ Mobile App
│  │ broadcast to PubSub         │───┼──→ LiveView
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│     Phoenix LiveView                │
│  ┌─────────────────────────────┐   │
│  │ handle_info(%{event:        │   │
│  │   "new_message"})           │   │
│  │ - Update messages list      │   │
│  │ - Re-render UI              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
                 │
                 ↓
┌─────────────┐
│   Browser   │
│  (Updated)  │
└─────────────┘
```

---

## Key Takeaways

1. **Phoenix LiveView NEVER writes to database**
   - All mutations go through Node.js API
   - LiveView only reads and displays

2. **Real-time works both ways**
   - Mobile → Channel → PubSub → LiveView
   - LiveView → API → Channel → Mobile

3. **JWT is the key**
   - Stored in Phoenix session
   - Sent with every API request
   - Validated by Node.js

4. **PubSub bridges Channel and LiveView**
   - Channels broadcast to both
   - LiveView subscribes in mount/3
   - Updates received in handle_info/2

5. **Node.js is always the source of truth**
   - Validates all requests
   - Enforces business rules
   - Manages database transactions

This architecture ensures:
- ✅ Consistent data across mobile and web
- ✅ Real-time updates everywhere
- ✅ Single source of truth (Node.js)
- ✅ Scalable and maintainable
- ✅ Secure and validated
