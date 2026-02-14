# Phoenix LiveView Implementation Checklist

## Phase 1: Setup and Dependencies (Day 1)

### 1.1 Add LiveView Dependencies
- [ ] Update `mix.exs` with LiveView dependencies
  ```elixir
  {:phoenix_live_view, "~> 0.20.0"}
  {:phoenix_html, "~> 4.0"}
  {:floki, ">= 0.30.0", only: :test}
  ```
- [ ] Run `mix deps.get`
- [ ] Run `mix deps.compile`

### 1.2 Configure Endpoint
- [ ] Update `lib/realtime_gateway_web/endpoint.ex`
  - [ ] Add LiveView socket configuration
  - [ ] Configure session options
  - [ ] Add static paths for assets
- [ ] Update `lib/realtime_gateway_web.ex`
  - [ ] Add `live_view/0` macro
  - [ ] Add `live_component/0` macro
  - [ ] Add `html/0` macro

### 1.3 Setup Assets
- [ ] Create `assets/js/hooks.js` for LiveView hooks
- [ ] Update `assets/js/app.js` to import hooks
- [ ] Configure Tailwind CSS (optional)
- [ ] Test asset compilation

---

## Phase 2: Authentication System (Day 2-3)

### 2.1 JWT Validation Service
- [ ] Create `lib/realtime_gateway/services/jwt_validator.ex`
  - [ ] Implement `validate_and_decode/1`
  - [ ] Implement `extract_user/1`
  - [ ] Add expiration validation
  - [ ] Add issuer validation
  - [ ] **CRITICAL**: Ensure JWT_SECRET matches Node.js

### 2.2 Authentication Plugs
- [ ] Create `lib/realtime_gateway_web/plugs/require_auth.ex`
  - [ ] Validate JWT from session
  - [ ] Assign current_user to conn
  - [ ] Redirect to login if unauthorized
- [ ] Create `lib/realtime_gateway_web/live_auth.ex`
  - [ ] Implement `on_mount(:require_authenticated_user)`
  - [ ] Implement `on_mount(:require_farmer)`
  - [ ] Implement `on_mount(:require_buyer)`

### 2.3 Login LiveView
- [ ] Create `lib/realtime_gateway_web/live/login_live.ex`
  - [ ] Implement mount/3
  - [ ] Implement handle_event("login")
  - [ ] Call Node.js `/api/auth/login`
  - [ ] Store JWT in session
  - [ ] Redirect to dashboard on success
  - [ ] Display error messages
- [ ] Create login template with form
- [ ] Add route in router

### 2.4 Session Management
- [ ] Configure secure session in endpoint
- [ ] Implement logout functionality
- [ ] Handle session expiration
- [ ] Test authentication flow

---

## Phase 3: API Client Service (Day 3-4)

### 3.1 Create API Client
- [ ] Create `lib/realtime_gateway/services/api_client.ex`
  - [ ] Implement `login/2`
  - [ ] Implement `get_user_profile/1`
  - [ ] Implement `get_products/2`
  - [ ] Implement `get_product/2`
  - [ ] Implement `create_offer/3`
  - [ ] Implement `get_negotiations/1`
  - [ ] Implement `get_negotiation/2`
  - [ ] Implement `send_negotiation_message/3`
  - [ ] Implement `update_negotiation_status/3`

### 3.2 Error Handling
- [ ] Handle network errors
- [ ] Handle 401 unauthorized
- [ ] Handle 404 not found
- [ ] Handle 500 server errors
- [ ] Log errors appropriately
- [ ] Return user-friendly error messages

### 3.3 Configuration
- [ ] Set NODE_API_URL environment variable
- [ ] Configure timeout settings
- [ ] Configure retry logic (optional)
- [ ] Test all API endpoints

---

## Phase 4: Core LiveView Pages (Day 4-6)

### 4.1 Dashboard LiveView
- [ ] Create `lib/realtime_gateway_web/live/dashboard_live.ex`
  - [ ] Implement mount/3 with authentication
  - [ ] Fetch user profile from API
  - [ ] Load dashboard data (products, negotiations)
  - [ ] Subscribe to PubSub for real-time updates
  - [ ] Implement handle_info for real-time events
  - [ ] Calculate and display stats
- [ ] Create dashboard template
  - [ ] Stats cards
  - [ ] Products list
  - [ ] Recent negotiations
  - [ ] Navigation

### 4.2 Product List LiveView
- [ ] Create `lib/realtime_gateway_web/live/product_list_live.ex`
  - [ ] Implement mount/3
  - [ ] Fetch products from API
  - [ ] Implement search functionality
  - [ ] Implement filter functionality
  - [ ] Handle pagination (optional)
- [ ] Create product list template
  - [ ] Search bar
  - [ ] Filter controls
  - [ ] Product grid/list
  - [ ] Product cards

### 4.3 Product Detail LiveView
- [ ] Create `lib/realtime_gateway_web/live/product_detail_live.ex`
  - [ ] Fetch single product
  - [ ] Display product details
  - [ ] Implement "Make Offer" functionality
  - [ ] Call Node.js API to create offer
- [ ] Create product detail template

---

## Phase 5: Real-time Negotiation (Day 7-9)

### 5.1 Negotiation LiveView
- [ ] Create `lib/realtime_gateway_web/live/negotiation_live.ex`
  - [ ] Implement mount/3
  - [ ] Subscribe to PubSub topic `negotiation:#{id}`
  - [ ] Fetch negotiation data from API
  - [ ] Load previous messages
  - [ ] Implement handle_info for:
    - [ ] `new_message`
    - [ ] `typing`
    - [ ] `user_joined`
    - [ ] `user_left`
    - [ ] `negotiation_ended`
    - [ ] `queued_messages`
  - [ ] Implement handle_event for:
    - [ ] `send_message`
    - [ ] `message_changed` (typing indicator)
    - [ ] `accept_offer`
    - [ ] `reject_offer`
    - [ ] `counter_offer`

### 5.2 Update Phoenix Channel
- [ ] Update `lib/realtime_gateway_web/channels/negotiation_channel.ex`
  - [ ] Add PubSub broadcast after Channel broadcast
  - [ ] Broadcast to `negotiation:#{id}` topic
  - [ ] Format messages for LiveView consumption
  - [ ] Test dual broadcasting (Channel + PubSub)

### 5.3 JavaScript Hooks
- [ ] Create ScrollToBottom hook
- [ ] Create AutoFocus hook (optional)
- [ ] Create InfiniteScroll hook (optional)
- [ ] Test hooks in LiveView

### 5.4 Negotiation Template
- [ ] Header with negotiation info
- [ ] Messages container
- [ ] Message bubbles (own vs other)
- [ ] Typing indicator
- [ ] Online status indicator
- [ ] Message input form
- [ ] Action buttons (Accept/Reject)

---

## Phase 6: Layouts and Components (Day 9-10)

### 6.1 Create Layouts
- [ ] Create `lib/realtime_gateway_web/components/layouts.ex`
- [ ] Create `layouts/root.html.heex`
  - [ ] HTML head with meta tags
  - [ ] CSRF token
  - [ ] Asset links
- [ ] Create `layouts/app.html.heex`
  - [ ] Navigation bar
  - [ ] Flash messages
  - [ ] Main content area
  - [ ] Footer (optional)

### 6.2 Reusable Components
- [ ] Create `lib/realtime_gateway_web/live/components/product_card.ex`
- [ ] Create `lib/realtime_gateway_web/live/components/message_bubble.ex`
- [ ] Create `lib/realtime_gateway_web/live/components/stats_card.ex`
- [ ] Create `lib/realtime_gateway_web/components/core_components.ex`
  - [ ] Button component
  - [ ] Input component
  - [ ] Flash component
  - [ ] Modal component (optional)

### 6.3 Styling
- [ ] Set up Tailwind CSS
- [ ] Create custom CSS for animations
- [ ] Style all LiveView pages
- [ ] Ensure responsive design
- [ ] Test on different screen sizes

---

## Phase 7: Router Configuration (Day 10)

### 7.1 Update Router
- [ ] Create public routes (login, register)
- [ ] Create protected routes with `:require_auth` pipeline
- [ ] Create `live_session` blocks with `on_mount` hooks
- [ ] Create farmer-only routes
- [ ] Create buyer-only routes
- [ ] Test route protection

### 7.2 Navigation
- [ ] Implement navigation between pages
- [ ] Add breadcrumbs (optional)
- [ ] Test all navigation flows

---

## Phase 8: Security Implementation (Day 11-12)

### 8.1 Input Validation
- [ ] Create `lib/realtime_gateway/validators/message_validator.ex`
  - [ ] Validate message length
  - [ ] Sanitize HTML
  - [ ] Check for malicious content
- [ ] Apply validation to all user inputs

### 8.2 Rate Limiting
- [ ] Create `lib/realtime_gateway/rate_limiter.ex`
  - [ ] Implement GenServer
  - [ ] Track requests per user
  - [ ] Enforce limits
- [ ] Apply to message sending
- [ ] Apply to API calls

### 8.3 CSRF Protection
- [ ] Ensure CSRF tokens in all forms
- [ ] Verify CSRF protection in endpoint
- [ ] Test CSRF protection

### 8.4 Security Headers
- [ ] Create security headers plug
- [ ] Add to endpoint pipeline
- [ ] Test headers in production

### 8.5 WebSocket Security
- [ ] Validate JWT in UserSocket.connect/3
- [ ] Verify user authorization in Channel.join/3
- [ ] Test unauthorized access attempts

---

## Phase 9: Testing (Day 13-14)

### 9.1 LiveView Tests
- [ ] Create `test/realtime_gateway_web/live/login_live_test.exs`
- [ ] Create `test/realtime_gateway_web/live/dashboard_live_test.exs`
- [ ] Create `test/realtime_gateway_web/live/product_list_live_test.exs`
- [ ] Create `test/realtime_gateway_web/live/negotiation_live_test.exs`
- [ ] Test authentication flows
- [ ] Test real-time updates
- [ ] Test error handling

### 9.2 Integration Tests
- [ ] Test API client integration
- [ ] Test Channel + LiveView integration
- [ ] Test end-to-end flows
- [ ] Test concurrent users

### 9.3 Manual Testing
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Test WebSocket reconnection
- [ ] Test offline/online scenarios
- [ ] Load testing (optional)

---

## Phase 10: Production Preparation (Day 15-16)

### 10.1 Environment Configuration
- [ ] Create `.env.example`
- [ ] Document all environment variables
- [ ] Configure `config/runtime.exs`
- [ ] Validate required env vars on startup

### 10.2 Docker Setup
- [ ] Create `Dockerfile` for Phoenix
- [ ] Create `docker-compose.yml`
- [ ] Test Docker build
- [ ] Test Docker deployment locally

### 10.3 Nginx Configuration
- [ ] Create nginx.conf
- [ ] Configure SSL/TLS
- [ ] Configure WebSocket proxying
- [ ] Configure rate limiting
- [ ] Test Nginx configuration

### 10.4 Monitoring and Logging
- [ ] Configure Telemetry metrics
- [ ] Set up LiveDashboard
- [ ] Configure log aggregation
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Create health check endpoint

### 10.5 Database
- [ ] Run migrations (if needed)
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Test database failover

---

## Phase 11: Deployment (Day 17)

### 11.1 Pre-Deployment
- [ ] Review all environment variables
- [ ] Verify JWT_SECRET matches Node.js
- [ ] Test SSL certificates
- [ ] Run security audit
- [ ] Create deployment runbook

### 11.2 Deployment
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor logs
- [ ] Verify all services running

### 11.3 Post-Deployment
- [ ] Test web app functionality
- [ ] Test mobile app connectivity
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Set up alerts

---

## Phase 12: Documentation (Day 18)

### 12.1 Code Documentation
- [ ] Add @moduledoc to all modules
- [ ] Add @doc to public functions
- [ ] Add code comments for complex logic
- [ ] Generate ExDoc documentation

### 12.2 User Documentation
- [ ] Create user guide
- [ ] Create API documentation
- [ ] Create troubleshooting guide
- [ ] Create FAQ

### 12.3 Developer Documentation
- [ ] Document architecture
- [ ] Document deployment process
- [ ] Document development setup
- [ ] Document testing procedures

---

## Critical Success Factors

### ✅ Must-Have Features
1. **JWT Authentication** - Properly validated from Node.js
2. **API Integration** - All CRUD via Node.js REST API
3. **Real-time Updates** - Phoenix Channels + LiveView PubSub
4. **Security** - Input validation, rate limiting, CSRF protection
5. **Error Handling** - Graceful degradation, user-friendly messages

### ⚠️ Common Pitfalls to Avoid
1. **JWT Secret Mismatch** - Ensure same secret as Node.js
2. **Business Logic in Phoenix** - Keep ALL logic in Node.js
3. **Missing Authorization** - Always verify user access
4. **Unvalidated Input** - Sanitize all user input
5. **No Rate Limiting** - Prevent abuse
6. **Insecure WebSockets** - Always validate JWT

### 🎯 Performance Targets
- Page load: < 2 seconds
- WebSocket connection: < 500ms
- Message delivery: < 100ms
- API response: < 500ms
- Support 1000+ concurrent users

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Setup | 1 day | None |
| 2. Authentication | 2 days | Phase 1 |
| 3. API Client | 1 day | Phase 2 |
| 4. Core Pages | 2 days | Phase 3 |
| 5. Negotiation | 3 days | Phase 4 |
| 6. Components | 1 day | Phase 5 |
| 7. Router | 1 day | Phase 6 |
| 8. Security | 2 days | Phase 7 |
| 9. Testing | 2 days | Phase 8 |
| 10. Production Prep | 2 days | Phase 9 |
| 11. Deployment | 1 day | Phase 10 |
| 12. Documentation | 1 day | Phase 11 |

**Total: ~18 days** (with 1 experienced Elixir developer)

---

## Quick Start Commands

```bash
# Install dependencies
cd realtime_gateway
mix deps.get
mix deps.compile

# Create API client service
mkdir -p lib/realtime_gateway/services
touch lib/realtime_gateway/services/api_client.ex
touch lib/realtime_gateway/services/jwt_validator.ex

# Create LiveView modules
mkdir -p lib/realtime_gateway_web/live
touch lib/realtime_gateway_web/live/login_live.ex
touch lib/realtime_gateway_web/live/dashboard_live.ex
touch lib/realtime_gateway_web/live/product_list_live.ex
touch lib/realtime_gateway_web/live/negotiation_live.ex

# Create plugs
mkdir -p lib/realtime_gateway_web/plugs
touch lib/realtime_gateway_web/plugs/require_auth.ex

# Create hooks
mkdir -p assets/js
touch assets/js/hooks.js

# Run development server
mix phx.server

# Run tests
mix test

# Build for production
MIX_ENV=prod mix release
```

---

## Support Resources

- **Phoenix LiveView Docs**: https://hexdocs.pm/phoenix_live_view
- **Phoenix Channels Guide**: https://hexdocs.pm/phoenix/channels.html
- **Joken (JWT)**: https://hexdocs.pm/joken
- **Req (HTTP Client)**: https://hexdocs.pm/req

---

## Final Checklist Before Go-Live

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Error monitoring configured
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Team trained on new system
- [ ] Documentation complete
- [ ] Stakeholders notified
- [ ] Go/No-Go decision made

**Good luck with your implementation! 🚀**
