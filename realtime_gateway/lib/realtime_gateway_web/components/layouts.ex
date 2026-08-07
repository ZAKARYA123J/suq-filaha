defmodule RealtimeGatewayWeb.Layouts do
  @moduledoc """
  This module holds different layouts used by your application.
  """

  use RealtimeGatewayWeb, :html

  embed_templates("layouts/*")

  def navbar(assigns) do
    assigns = assign_new(assigns, :active_tab, fn -> nil end)

    ~H"""
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-14 gap-2">

          <%!-- Left: user avatar + name + profile dropdown --%>
          <div class="flex items-center gap-2 flex-shrink-0">
            <div class="relative">
              <button type="button"
                phx-click={Phoenix.LiveView.JS.toggle(to: "#profile-dropdown", in: "fade-in-scale", out: "fade-out-scale")}
                phx-click-away={Phoenix.LiveView.JS.hide(to: "#profile-dropdown", transition: "fade-out-scale")}
                class="flex items-center gap-2 hover:opacity-80 transition cursor-pointer text-left">
                <%= if @profile && @profile["profileInfo"] do %>
                  <img src={@profile["profileInfo"]} alt="Avatar" class="h-8 w-8 rounded-full object-cover ring-2 ring-green-100" />
                <% else %>
                  <div class="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    <%= String.at((@profile && @profile["name"]) || "U", 0) %>
                  </div>
                <% end %>
                <div class="hidden sm:block leading-tight">
                  <div class="text-sm font-semibold text-gray-900"><%= (@profile && @profile["name"]) || "Account" %></div>
                  <%= if @profile && @profile["userType"] do %>
                    <div class={"text-[10px] font-semibold #{if @profile["userType"] == "FARMER", do: "text-green-600", else: "text-blue-600"}"}>
                      <%= @profile["userType"] %>
                    </div>
                  <% end %>
                </div>
                <svg class="w-4 h-4 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <div id="profile-dropdown" class="hidden absolute left-0 mt-3 w-72 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden" role="menu">
                <div class="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div class="flex items-center gap-1 text-amber-400">
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <span class="font-bold text-gray-900 text-sm"><%= (@profile && @profile["rating"]) || "0.0" %></span>
                  </div>
                  <span class={"inline-flex px-2 py-0.5 rounded-full text-xs font-semibold #{if @profile && @profile["userType"] == "FARMER", do: "bg-green-100 text-green-700", else: "bg-blue-100 text-blue-700"}"}>
                    <%= @profile && @profile["userType"] %>
                  </span>
                </div>
                <div class="p-4 space-y-4">
                  <div>
                    <span class="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</span>
                    <span class="block text-sm text-gray-800 mt-0.5"><%= (@profile && @profile["location"]) || "Not set" %></span>
                  </div>
                  <div>
                    <span class="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone number</span>
                    <span class="block text-sm text-gray-800 mt-0.5"><%= @profile && @profile["phoneNumber"] %></span>
                  </div>
                </div>
                <div class="bg-gray-50 border-t border-gray-100 p-2 text-center">
                  <span class="text-xs text-gray-400">Manage account on mobile app</span>
                </div>
              </div>
            </div>
          </div>

          <%!-- Centre: navigation tabs (hidden on mobile) --%>
          <nav class="hidden md:flex items-end gap-0 overflow-x-auto flex-1 justify-center -mb-px">
            <.link navigate={~p"/dashboard"}
              class={"whitespace-nowrap px-4 py-4 border-b-2 text-sm font-medium transition
                #{if @active_tab == :dashboard, do: "border-green-600 text-green-700", else: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}"}>
              Dashboard
            </.link>
            <.link navigate={~p"/dashboard/negotiations"}
              class={"whitespace-nowrap px-4 py-4 border-b-2 text-sm font-medium transition
                #{if @active_tab == :negotiations, do: "border-green-600 text-green-700", else: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}"}>
              Negotiations
            </.link>
            <%= if @profile && @profile["userType"] == "FARMER" do %>
              <.link navigate={~p"/dashboard/products"}
                class={"whitespace-nowrap px-4 py-4 border-b-2 text-sm font-medium transition
                  #{if @active_tab == :products, do: "border-green-600 text-green-700", else: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}"}>
                Products
              </.link>
            <% end %>
            <.link navigate={~p"/products"}
              class={"whitespace-nowrap px-4 py-4 border-b-2 text-sm font-medium transition
                #{if @active_tab == :marketplace, do: "border-green-600 text-green-700", else: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}"}>
              Marketplace
            </.link>
          </nav>

          <%!-- Right: Notification Bell + Logout + Mobile Hamburger --%>
          <div class="flex items-center gap-2 flex-shrink-0">

            <%!-- Notification Bell --%>
            <div class="relative">
              <button type="button"
                phx-click={Phoenix.LiveView.JS.toggle(to: "#notification-dropdown", in: "fade-in-scale", out: "fade-out-scale")}
                phx-click-away={Phoenix.LiveView.JS.hide(to: "#notification-dropdown", transition: "fade-out-scale")}
                class="relative p-2 text-gray-400 hover:text-gray-500 transition cursor-pointer bg-gray-50 rounded-full hover:bg-gray-100">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <%= if length(@notifications) > 0 do %>
                  <span class="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                <% end %>
              </button>

              <div id="notification-dropdown" class="hidden absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden" role="menu">
                <div class="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <span class="text-sm font-bold text-gray-900">Notifications</span>
                  <%= if length(@notifications) > 0 do %>
                    <span class="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold"><%= length(@notifications) %> New</span>
                  <% end %>
                </div>
                <div class="max-h-96 overflow-y-auto">
                  <%= if length(@notifications) == 0 do %>
                    <div class="px-4 py-8 text-center">
                      <svg class="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                      </svg>
                      <p class="text-sm text-gray-500">You have no notifications.</p>
                    </div>
                  <% else %>
                    <ul class="divide-y divide-gray-100">
                      <%= for notif <- @notifications do %>
                        <li class="hover:bg-gray-50 transition block">
                          <.link navigate={~p"/negotiations/#{notif["id"]}"} class="block px-4 py-3">
                            <div class="flex items-start gap-3">
                              <div class="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                </svg>
                              </div>
                              <div>
                                <p class="text-sm font-semibold text-gray-900 truncate">Pending Negotiation</p>
                                <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">You have a pending offer of <span class="font-semibold text-gray-700"><%= notif["proposedPrice"] %> MAD</span> on <span class="font-medium text-gray-700"><%= notif["product"]["name"] %></span>.</p>
                              </div>
                            </div>
                          </.link>
                        </li>
                      <% end %>
                    </ul>
                  <% end %>
                </div>
                <.link navigate={~p"/dashboard"} class="block bg-gray-50 text-center py-2.5 text-xs font-semibold text-green-600 hover:text-green-700 hover:bg-gray-100 transition border-t border-gray-100">
                  View all activity
                </.link>
              </div>
            </div>

            <%!-- Logout (hidden on mobile) --%>
            <a href={~p"/logout"}
              class="hidden sm:inline-flex px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition shadow-sm">
              Logout
            </a>

            <%!-- Hamburger (mobile only) --%>
            <button type="button"
              phx-click={Phoenix.LiveView.JS.toggle(to: "#mobile-menu", in: "fade-in-scale", out: "fade-out-scale")}
              class="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

          </div>
        </div>
      </div>

      <%!-- Mobile menu --%>
      <div id="mobile-menu" class="hidden md:hidden border-t border-gray-200 bg-white">
        <nav class="flex flex-col px-4 py-2">
          <.link navigate={~p"/dashboard"}
            class={"px-3 py-3 rounded-md text-sm font-medium transition
              #{if @active_tab == :dashboard, do: "bg-green-50 text-green-700", else: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}"}>
            Dashboard
          </.link>
          <.link navigate={~p"/dashboard/negotiations"}
            class={"px-3 py-3 rounded-md text-sm font-medium transition
              #{if @active_tab == :negotiations, do: "bg-green-50 text-green-700", else: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}"}>
            Negotiations
          </.link>
          <%= if @profile && @profile["userType"] == "FARMER" do %>
            <.link navigate={~p"/dashboard/products"}
              class={"px-3 py-3 rounded-md text-sm font-medium transition
                #{if @active_tab == :products, do: "bg-green-50 text-green-700", else: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}"}>
              Products
            </.link>
          <% end %>
          <.link navigate={~p"/products"}
            class={"px-3 py-3 rounded-md text-sm font-medium transition
              #{if @active_tab == :marketplace, do: "bg-green-50 text-green-700", else: "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}"}>
            Marketplace
          </.link>
          <div class="border-t border-gray-100 mt-2 pt-2">
            <a href={~p"/logout"}
              class="block px-3 py-3 rounded-md text-sm font-semibold text-red-600 hover:bg-red-50 transition">
              Logout
            </a>
          </div>
        </nav>
      </div>
    </header>
    """
  end
end
