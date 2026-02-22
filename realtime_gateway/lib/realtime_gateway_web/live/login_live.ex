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
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Work+Sans:wght@400;500;600&display=swap');
    input:-webkit-autofill,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:hover {
    -webkit-box-shadow: 0 0 0px 1000px var(--input-bg) inset !important;
    -webkit-text-fill-color: var(--text-primary) !important;
    transition: background-color 9999s ease-in-out 0s;
    }

      :root {
        --bg-gradient-start: #f5f7fa;
        --bg-gradient-end: #e8f5e9;
        --card-bg: rgba(255, 255, 255, 0.95);
        --card-border: rgba(255, 255, 255, 0.5);
        --text-primary: #1a1a1a;
        --text-secondary: #5f6368;
        --label-color: #37474f;
        --input-bg-focus: #ffffff;
        --input-border: #e0e0e0;
        --input-border-focus: #4caf50;
        --placeholder-color: #9e9e9e;
        --error-bg-start: #ffebee;
        --error-bg-end: #fce4ec;
        --error-border: #e53935;
        --error-text: #c62828;
        --float-accent-1: rgba(76, 175, 80, 0.08);
        --float-accent-2: rgba(139, 195, 74, 0.06);
        --shadow-color: rgba(0, 0, 0, 0.1);
        --logo-shadow: rgba(76, 175, 80, 0.2);
      }

      .login-container {
        font-family: 'Work Sans', sans-serif;
        background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
        min-height: 100vh;
        position: relative;
        overflow: hidden;
      }

      .login-container::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -20%;
        width: 80%;
        height: 150%;
        background: radial-gradient(circle, var(--float-accent-1) 0%, transparent 70%);
        border-radius: 50%;
        animation: float 20s ease-in-out infinite;
      }

      .login-container::after {
        content: '';
        position: absolute;
        bottom: -30%;
        left: -10%;
        width: 60%;
        height: 100%;
        background: radial-gradient(circle, var(--float-accent-2) 0%, transparent 70%);
        border-radius: 50%;
        animation: float 15s ease-in-out infinite reverse;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-30px) scale(1.05); }
      }

      .login-card {
        background: var(--card-bg);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        box-shadow: 0 20px 60px var(--shadow-color), 0 0 1px rgba(0, 0, 0, 0.1);
        padding: 3rem 2.5rem;
        position: relative;
        z-index: 1;
        border: 1px solid var(--card-border);
        animation: slideUp 0.6s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .logo-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 2rem;
        animation: fadeIn 0.8s ease-out 0.2s both;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .logo {
        width: 80px;
        height: 80px;
        margin-bottom: 1.25rem;
        position: relative;
      }

      .logo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 4px 12px var(--logo-shadow));
      }

      .logo-text {
        font-family: 'Playfair Display', serif;
        font-size: 2rem;
        font-weight: 700;
        background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.5rem;
        letter-spacing: -0.02em;
      }

      .tagline {
        color: var(--text-secondary);
        font-size: 0.95rem;
        font-weight: 500;
        letter-spacing: 0.01em;
      }

      .form-group {
        margin-bottom: 1.25rem;
        animation: fadeIn 0.8s ease-out 0.4s both;
      }

      .form-label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--label-color);
        font-weight: 500;
        font-size: 0.9rem;
        letter-spacing: 0.01em;
      }

      .form-input {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 2px solid var(--input-border);
        border-radius: 12px;
        font-size: 1rem;
        font-family: 'Work Sans', sans-serif;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: var(--input-bg);
        color: var(--text-primary);
      }

      .form-input:focus {
        outline: none;
        border-color: var(--input-border-focus);
        background: var(--input-bg-focus);
        box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.1);
        transform: translateY(-1px);
      }

    .form-input::placeholder { color: var(--placeholder-color); }

      .error-message {
        background: linear-gradient(135deg, var(--error-bg-start) 0%, var(--error-bg-end) 100%);
        border-left: 4px solid var(--error-border);
        padding: 1rem 1.25rem;
        border-radius: 12px;
        margin-bottom: 1.25rem;
        animation: shake 0.4s ease-in-out, fadeIn 0.3s ease-out;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-8px); }
        75% { transform: translateX(8px); }
      }

      .error-text {
        color: var(--error-text);
        font-size: 0.9rem;
        font-weight: 500;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .submit-btn {
        width: 100%;
        padding: 1rem;
        background: linear-gradient(135deg, #43a047 0%, #66bb6a 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        font-family: 'Work Sans', sans-serif;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        position: relative;
        overflow: hidden;
        animation: fadeIn 0.8s ease-out 0.6s both;
      }

      .submit-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s;
      }

      .submit-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
      }

      .submit-btn:hover:not(:disabled)::before {
        left: 100%;
      }

      .submit-btn:active:not(:disabled) {
        transform: translateY(0);
      }

      .submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 0.5rem;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @media (max-width: 640px) {
        .login-card {
          padding: 2rem 1.5rem;
          border-radius: 20px;
        }

        .logo {
          width: 64px;
          height: 64px;
        }

        .logo-text {
          font-size: 1.75rem;
        }
      }
    </style>

    <div class="login-container">
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem;">
        <div style="max-width: 440px; width: 100%;">
          <div class="login-card">
            <div class="logo-container">
              <div class="logo">
                <img src={~p"/images/logod.png"} alt="Sūq l-Filāḥa Logo" />
              </div>
              <h1 class="logo-text">Sūq l-Filāḥa</h1>
              <p class="tagline">Agricultural Market Platform</p>
            </div>

    <form phx-submit="login" phx-change="validate" autocomplete="off">
              <%= if @error do %>
                <div class="error-message">
                  <p class="error-text">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                    <%= @error %>
                  </p>
                </div>
              <% end %>

              <div class="form-group">
                <label for="phone" class="form-label">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"

                  required
                  class="form-input"
                  placeholder="+212 600 000 000"
                  autocomplete="tel"
                />
              </div>

              <div class="form-group">
                <label for="password" class="form-label">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required

                  class="form-input"
                  placeholder="Enter your password"
                 autocomplete="new-password"
    autocomplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={@loading}
                class="submit-btn"
              >
                <%= if @loading do %>
                  <span style="display: flex; align-items: center; justify-content: center;">
                    <span class="loading-spinner"></span>
                    Signing in...
                  </span>
                <% else %>
                  Sign In
                <% end %>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
    """
  end
end
