interface ReverbEndpoint {
  host?: string
  port?: string
  scheme?: string
}

export function getReverbConfig(apiBaseUrl: string, endpoint: ReverbEndpoint = {}) {
  const apiUrl = new URL(apiBaseUrl)
  const isHttps = (endpoint.scheme || apiUrl.protocol.slice(0, -1)) === "https"
  const port = Number(endpoint.port || (isHttps ? 443 : 8080))

  return {
    host: endpoint.host || apiUrl.hostname,
    wsPort: port,
    wssPort: port,
    isHttps,
  }
}
