// components/ChatBot.jsx — GlucoBot AI chat widget
import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { apiFetch } from "../services/api";

export default function ChatBot({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm GlucoBot 🤖 — your AI diabetes awareness assistant. Ask me anything about diabetes prevention, symptoms, diet, or lifestyle!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const data = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMsg }),
      });
      const reply = data?.reply || "I'm having trouble connecting. Please try again.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Connection error. Please try again." },
      ]);
    }
    setLoading(false);
  }

  return (
    <div style={{
      position: "fixed", bottom: 90, right: 24, width: 360, height: 480,
      background: "#0a1628", border: "1px solid #1a2e4a",
      borderRadius: 20, display: "flex", flexDirection: "column",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 1000,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#00d4aa,#6c63ff)",
        padding: "14px 18px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "rgba(255,255,255,0.2)",
            borderRadius: 10, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18,
          }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>GlucoBot AI</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>• Online</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%", padding: "10px 14px",
              borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.role === "user"
                ? "linear-gradient(135deg,#00d4aa,#00a87e)"
                : "#0f1f3d",
              color: "#e8f4f8", fontSize: 13, lineHeight: 1.5,
              border: m.role === "assistant" ? "1px solid #1a2e4a" : "none",
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{
            display: "flex", gap: 6, padding: "10px 14px",
            background: "#0f1f3d", borderRadius: "18px 18px 18px 4px",
            width: "fit-content", border: "1px solid #1a2e4a",
          }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 7, height: 7, background: "#00d4aa", borderRadius: "50%",
                animation: `bounce 1s ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid #1a2e4a", display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about diabetes..."
          style={{
            flex: 1, background: "#0f1f3d", border: "1px solid #1a2e4a",
            borderRadius: 12, padding: "10px 14px", color: "#e8f4f8",
            fontSize: 13, outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            background: "linear-gradient(135deg,#00d4aa,#6c63ff)",
            border: "none", borderRadius: 12, padding: "10px 14px",
            cursor: "pointer", color: "#fff",
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
