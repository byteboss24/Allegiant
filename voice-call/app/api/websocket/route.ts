import type { NextRequest } from "next/server"

// This is a simple WebSocket handler for Next.js
export async function GET(request: NextRequest) {
  const { socket: res, response } = await new Promise<{ socket: WebSocket; response: Response }>((resolve) => {
    const upgradeHeader = request.headers.get("Upgrade")
    if (upgradeHeader !== "websocket") {
      return new Response("Expected websocket", { status: 400 })
    }

    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)

    const response = new Response(null, {
      status: 101,
      webSocket: client,
    })

    resolve({ socket: server, response })
  })

  // Handle WebSocket connection
  res.accept()

  // Set up event handlers
  res.addEventListener("message", async (event) => {
    try {
      // Process the received audio data
      const audioData = JSON.parse(event.data)

      // Echo the audio data back to the client (for testing)
      // In a real application, you would forward this to other connected clients
      res.send(JSON.stringify(audioData))
    } catch (error) {
      console.error("Error processing message:", error)
    }
  })

  res.addEventListener("close", () => {
    console.log("WebSocket closed")
  })

  return response
}

// This is a polyfill for the WebSocketPair API
// In a real application, you would use a proper WebSocket server
class WebSocketPair {
  constructor() {
    const pair = Object.create(null)
    const socket1 = new MockWebSocket()
    const socket2 = new MockWebSocket()
    socket1._peer = socket2
    socket2._peer = socket1
    pair[0] = socket1
    pair[1] = socket2
    return pair
  }
}

class MockWebSocket {
  constructor() {
    this._peer = null
    this._accepted = false
    this._closed = false
    this._eventListeners = {
      message: [],
      close: [],
      error: [],
    }
  }

  accept() {
    this._accepted = true
  }

  send(data) {
    if (!this._accepted || this._closed) return
    if (!this._peer || !this._peer._accepted) return

    const event = { data }
    for (const listener of this._peer._eventListeners.message) {
      listener(event)
    }
  }

  close() {
    if (this._closed) return
    this._closed = true

    if (this._peer && !this._peer._closed) {
      const event = {}
      for (const listener of this._peer._eventListeners.close) {
        listener(event)
      }
      this._peer.close()
    }

    this._eventListeners = {
      message: [],
      close: [],
      error: [],
    }
  }

  addEventListener(type, callback) {
    if (this._eventListeners[type]) {
      this._eventListeners[type].push(callback)
    }
  }

  removeEventListener(type, callback) {
    if (this._eventListeners[type]) {
      this._eventListeners[type] = this._eventListeners[type].filter((cb) => cb !== callback)
    }
  }
}

