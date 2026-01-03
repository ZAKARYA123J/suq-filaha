defmodule RealtimeGateway.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      RealtimeGatewayWeb.Telemetry,
      {DNSCluster, query: Application.get_env(:realtime_gateway, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: RealtimeGateway.PubSub},
      # Start a worker by calling: RealtimeGateway.Worker.start_link(arg)
      # {RealtimeGateway.Worker, arg},
      # Start to serve requests, typically the last entry
      RealtimeGatewayWeb.Endpoint,
      RealtimeGatewayWeb.Presence
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: RealtimeGateway.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    RealtimeGatewayWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
