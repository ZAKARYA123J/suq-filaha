import { Socket } from "phoenix"

class RealtimeChat {
  constructor(chatId, userId) {
    this.chatId = chatId
    this.userId = userId
    this.socket = null
    this.channel = null
  }

  connect() {
    // Connect to WebSocket
   this.socket = new Socket("ws://localhost:4000/socket/websocket", {
      params: { token: "user_auth_token" }
    })

    this.socket.connect()

    // Join chat channel
    this.channel = this.socket.channel(`chat:${this.chatId}`, {})

    // Listen for new messages
    this.channel.on("new_message", (payload) => {
      console.log("New message:", payload)
      this.displayMessage(payload)
    })

    // Listen for typing indicators
    this.channel.on("typing", (payload) => {
      console.log("User typing:", payload)
      this.showTypingIndicator(payload)
    })

    // Listen for user joined
    this.channel.on("user_joined", (payload) => {
      console.log("User joined:", payload)
    })

    // Listen for user left
    this.channel.on("user_left", (payload) => {
      console.log("User left:", payload)
    })

    // Join the channel
    this.channel.join()
      .receive("ok", (resp) => {
        console.log("Joined successfully", resp)
      })
      .receive("error", (resp) => {
        console.log("Unable to join", resp)
      })
  }

  sendMessage(message) {
    this.channel.push("new_message", { body: message })
      .receive("ok", (msg) => console.log("Message sent", msg))
      .receive("error", (err) => console.log("Error sending message", err))
  }

  sendTyping(isTyping) {
    this.channel.push("typing", { typing: isTyping })
  }

  disconnect() {
    if (this.channel) {
      this.channel.leave()
    }
    if (this.socket) {
      this.socket.disconnect()
    }
  }

  displayMessage(message) {
    // Your UI logic to display the message
  }

  showTypingIndicator(payload) {
    // Your UI logic to show typing indicator
  }
}

// Usage
const chat = new RealtimeChat("room_123", "user_456")
chat.connect()

// Send a message
chat.sendMessage("Hello, world!")

// Send typing indicator
chat.sendTyping(true)
