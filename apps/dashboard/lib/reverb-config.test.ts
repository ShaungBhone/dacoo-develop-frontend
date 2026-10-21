import { describe, expect, it } from "vitest"

import { getReverbConfig } from "./reverb-config"

describe("getReverbConfig", () => {
  it("preserves the HTTPS API origin default without including its path", () => {
    expect(getReverbConfig("https://api.example.com/api/v1")).toEqual({
      host: "api.example.com",
      wsPort: 443,
      wssPort: 443,
      isHttps: true,
    })
  })

  it("uses a separate public Reverb endpoint in production", () => {
    expect(
      getReverbConfig("https://api.example.com", {
        host: "ws.example.com",
        port: "8443",
        scheme: "https",
      })
    ).toEqual({
      host: "ws.example.com",
      wsPort: 8443,
      wssPort: 8443,
      isHttps: true,
    })
  })

  it("preserves the local HTTP Reverb port when overrides are empty", () => {
    expect(
      getReverbConfig("http://backend.test:8000", {
        host: "",
        port: "",
        scheme: "",
      })
    ).toEqual({
      host: "backend.test",
      wsPort: 8080,
      wssPort: 8080,
      isHttps: false,
    })
  })

  it("allows a TLS Reverb endpoint with an HTTP API", () => {
    expect(
      getReverbConfig("http://backend.test", {
        host: "ws.example.com",
        scheme: "https",
      })
    ).toEqual({
      host: "ws.example.com",
      wsPort: 443,
      wssPort: 443,
      isHttps: true,
    })
  })
})
