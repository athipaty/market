import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, resolveAssetUrl } from "../api/client";
import type { ConversationSummary, Message } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { useChatSocket } from "../hooks/useChatSocket";

export function Inbox() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(searchParams.get("conversation"));
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function loadConversations() {
    api
      .get<{ conversations: ConversationSummary[] }>("/api/conversations")
      .then((data) => {
        setConversations(data.conversations);
        if (!activeId && data.conversations.length > 0) {
          setActiveId(data.conversations[0].id);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadConversations, []);

  useEffect(() => {
    if (!activeId) return;
    setSearchParams({ conversation: activeId }, { replace: true });
    api
      .get<{ messages: Message[] }>(`/api/conversations/${activeId}/messages`)
      .then((data) => setMessages(data.messages));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { sendMessage } = useChatSocket(activeId, (message) => {
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    setConversations((prev) =>
      prev.map((c) => (c.id === message.conversationId ? { ...c, messages: [message] } : c)),
    );
  });

  function onSend() {
    const text = draft.trim();
    if (!text || !activeId) return;
    sendMessage(text);
    setDraft("");
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="container page">
      <h1>Messages</h1>
      {loading && <p className="muted">Loading…</p>}
      {!loading && conversations.length === 0 && (
        <p className="muted">No conversations yet. Contact a seller from a listing to start one.</p>
      )}
      {conversations.length > 0 && (
        <div className="chat-layout">
          <div className="card" style={{ overflowY: "auto" }}>
            {conversations.map((c) => {
              const other = c.buyerId === user?.id ? c.seller : c.buyer;
              const lastMessage = c.messages[0];
              return (
                <div
                  key={c.id}
                  className={`conversation-list-item ${c.id === activeId ? "active" : ""}`}
                  onClick={() => setActiveId(c.id)}
                >
                  <img
                    src={c.listing.images[0] ? resolveAssetUrl(c.listing.images[0]) : ""}
                    alt=""
                    onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.listing.title}</div>
                    <div className="muted">with {other.name}</div>
                    {lastMessage && (
                      <div className="muted" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lastMessage.body}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card chat-panel">
            {active ? (
              <>
                <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 8 }}>
                  <strong>{active.listing.title}</strong>{" "}
                  <span className="muted">with {active.buyerId === user?.id ? active.seller.name : active.buyer.name}</span>
                </div>
                <div className="chat-messages">
                  {messages.map((m) => (
                    <div key={m.id} className={`chat-bubble ${m.senderId === user?.id ? "mine" : ""}`}>
                      {m.body}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-row">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSend()}
                    placeholder="Type a message…"
                  />
                  <button className="btn" onClick={onSend} disabled={!draft.trim()}>
                    Send
                  </button>
                </div>
              </>
            ) : (
              <p className="muted">Select a conversation</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
