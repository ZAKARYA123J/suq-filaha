# Real-Time Negotiation Chat System

A complete real-time negotiation chat system built with Phoenix Channels and React Native CLI.

## Architecture Overview

### Backend Components

1. **Phoenix Channels Real-time Service** (`realtime_gateway/`)
   - `NegotiationChannel`: Handles real-time negotiation sessions
   - `Presence`: Tracks online users in negotiations  
   - `OfflineMessageQueue`: Manages message queuing for offline users
   - JWT authentication integration with existing Node.js backend

2. **Node.js/Express Backend** (existing)
   - Prisma schema with `Negotiation` and `NegotiationMessage` models
   - REST API endpoints for negotiation CRUD operations
   - JWT authentication system

### Mobile App Components

1. **Phoenix Client Service** (`src/services/phoenix.ts`)
   - WebSocket connection management with auto-reconnect
   - Channel join/leave handling
   - Real-time message broadcasting
   - Typing indicators and presence tracking

2. **Negotiation Store** (`src/store/negotiationStore.ts`)
   - Zustand state management for negotiation chat
   - Real-time message updates
   - Online user tracking and typing indicators

3. **Negotiation Chat Screen** (`src/screens/NegotiationChatScreen.tsx`)
   - Complete chat UI with message bubbles
   - Real-time typing indicators
   - Negotiation status management (Accept/Reject)
   - Offline message handling

4. **Offline Message Queue** (`src/services/offlineMessageQueue.ts`)
   - Local message persistence with AsyncStorage
   - Automatic message queuing when offline
   - Message delivery on reconnection

## Features Implemented

### ✅ Phoenix Channels Real-time Service
- **Negotiation Channel**: `negotiation:<negotiationId>`
  - `join`: User joins negotiation session
  - `leave`: User leaves negotiation session  
  - `new_message`: Broadcast messages to all users
  - `typing`: Real-time typing indicators
  - `end_negotiation`: Broadcast negotiation completion
- **Authorization**: Only buyers/farmers can join their negotiations
- **Presence Tracking**: Online/offline user status
- **Message Persistence**: All messages saved via Node.js API before broadcasting

### ✅ Offline Message Queue
- **Automatic Queuing**: Messages queued when users are offline
- **Delivery on Reconnect**: Queued messages delivered when users come online
- **Local Persistence**: Messages stored in AsyncStorage
- **Cleanup**: Automatic cleanup of old messages (7 days)

### ✅ React Native Integration
- **Phoenix Client**: WebSocket connection with auto-reconnect logic
- **Chat UI**: Complete message display with timestamps and sender info
- **Typing Indicators**: Real-time typing status display
- **Negotiation Controls**: Accept/Reject/Cancel buttons for pending negotiations
- **Connection Status**: Visual online/offline indicators

## Setup Instructions

### 1. Start Phoenix Server
```bash
cd realtime_gateway
mix deps.get
mix compile
mix phx.server
```

### 2. Start Node.js Backend
```bash
cd backend-core
npm install
npm run dev
```

### 3. Run React Native App
```bash
cd mobile-app
npm install
npm run start  # Start Metro bundler
npm run android  # Run on Android
npm run ios  # Run on iOS
```

## Environment Configuration

### Phoenix Server
Set environment variable for backend API URL:
```bash
export BACKEND_API_URL="http://localhost:3001"
```

### React Native App
Update Phoenix server URL in `src/services/phoenix.ts`:
```typescript
const PHOENIX_URL = 'ws://localhost:4000/socket';
```

## API Events

### Phoenix Channel Events

#### Client → Server
- `new_message`: `{ content: string }`
- `typing`: `{ typing: boolean }`
- `end_negotiation`: `{ status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED' }`

#### Server → Client
- `previous_messages`: `{ messages: NegotiationMessage[] }`
- `new_message`: `NegotiationMessage`
- `queued_messages`: `{ messages: NegotiationMessage[] }`
- `user_joined`: `{ userId, negotiationId, joinedAt }`
- `user_left`: `{ userId, negotiationId, leftAt }`
- `typing`: `{ userId, negotiationId, typing }`
- `negotiation_ended`: `{ negotiationId, status, endedBy, endedAt }`

### REST API Endpoints

#### Negotiation Endpoints
- `GET /api/negotiations/:id` - Get negotiation details
- `GET /api/negotiations/:id/messages` - Get negotiation messages
- `POST /api/negotiations/:id/messages` - Create new message
- `PATCH /api/negotiations/:id` - Update negotiation status

## Testing

### Manual Testing Steps

1. **Start Services**: Run Phoenix server and Node.js backend
2. **Open App**: Navigate to a negotiation in the mobile app
3. **Test Connection**: Verify WebSocket connection establishes
4. **Send Messages**: Test real-time message delivery
5. **Test Typing**: Verify typing indicators work
6. **Test Offline**: Disconnect network and send messages (should queue)
7. **Test Reconnect**: Reconnect network (queued messages should deliver)

### Automated Testing

Run the Phoenix server tests:
```bash
cd realtime_gateway
mix test
```

## Production Considerations

### Security
- JWT token validation for all channel connections
- User authorization verification (buyer/farmer only)
- Message content validation and sanitization

### Performance
- Message pagination for large chat histories
- Connection pooling for high concurrent users
- Efficient cleanup of old offline messages

### Scalability
- Redis for distributed presence tracking
- Message queue clustering for high throughput
- Load balancing for multiple Phoenix instances

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check JWT token and Phoenix server URL
2. **Messages Not Delivering**: Verify backend API is accessible
3. **Typing Not Working**: Check presence tracking configuration
4. **Offline Messages Lost**: Verify AsyncStorage permissions

### Debug Mode

Enable debug logging:
```typescript
// In src/services/phoenix.ts
console.log('Phoenix connection:', { socket, channel, events });
```

```elixir
# In realtime_gateway/lib/realtime_gateway_web/channels/negotiation_channel.ex
Logger.configure(level: :debug)
```

## File Structure

```
realtime_gateway/
├── lib/
│   ├── realtime_gateway_web/
│   │   ├── channels/
│   │   │   ├── negotiation_channel.ex    # Main negotiation channel
│   │   │   └── chat_channel.ex          # Existing chat channel
│   │   ├── presence.ex                  # User presence tracking
│   │   └── user_socket.ex             # Socket authentication
│   └── offline_message_queue.ex         # Message queuing service
└── config/
    └── dev.exs                       # Development configuration

mobile-app/src/
├── services/
│   ├── phoenix.ts                    # Phoenix WebSocket client
│   ├── offlineMessageQueue.ts         # Local message queuing
│   └── api.ts                        # REST API client
├── store/
│   └── negotiationStore.ts           # Negotiation state management
├── screens/
│   └── NegotiationChatScreen.tsx     # Chat UI component
└── types/                              # TypeScript type definitions
```

## Next Steps

1. **Load Testing**: Test with multiple concurrent users
2. **Performance Monitoring**: Add metrics for message latency
3. **Error Handling**: Improve error recovery and user feedback
4. **Push Notifications**: Add notifications for offline messages
5. **Message History**: Implement pagination for long chat histories
