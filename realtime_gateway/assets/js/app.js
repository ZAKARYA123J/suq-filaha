// Phoenix HTML & LiveView
import "../css/app.css"
import "../../deps/phoenix_html"

import { Socket } from "../../deps/phoenix"
import { LiveSocket } from "../../deps/phoenix_live_view"

// ── Hooks ──────────────────────────────────────────────────────────────────────
let Hooks = {}

/**
 * ScrollToBottom – keeps the messages container scrolled to the bottom
 * whenever new content is added or a server event fires.
 */
Hooks.ScrollToBottom = {
    mounted() {
        this.scrollToBottom()
        // Also listen for server-pushed events
        this.handleEvent("scroll_to_bottom", () => this.scrollToBottom())
    },
    updated() {
        this.scrollToBottom()
    },
    scrollToBottom() {
        this.el.scrollTop = this.el.scrollHeight
    }
}

/**
 * ChatInput – handles clearing the input field after a message is sent
 * via the `clear_chat_input` server event.
 */
Hooks.ChatInput = {
    mounted() {
        this.handleEvent("clear_chat_input", () => {
            this.el.value = ""
            this.el.focus()
        })
    }
}

// ── LiveSocket setup ───────────────────────────────────────────────────────────
let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")

let liveSocket = new LiveSocket("/live", Socket, {
    params: { _csrf_token: csrfToken },
    hooks: Hooks
})

// connect if there are any LiveViews on the page
liveSocket.connect()

// expose liveSocket on window for web console debug logs
window.liveSocket = liveSocket
