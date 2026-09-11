import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL, getToken } from "../api/client";
import type { Message } from "../api/types";

export function useChatSocket(conversationId: string | null, onMessage: (message: Message) => void) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Chat runs on its own namespace on the shared backend so it doesn't mix
    // with other projects' events on the default namespace.
    const socket = io(`${API_URL}/market`, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("message", (message: Message) => onMessageRef.current(message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (conversationId && socketRef.current?.connected) {
      socketRef.current.emit("join", conversationId);
    } else if (conversationId) {
      socketRef.current?.on("connect", () => socketRef.current?.emit("join", conversationId));
    }
  }, [conversationId, connected]);

  function sendMessage(body: string) {
    if (!conversationId) return;
    socketRef.current?.emit("message", { conversationId, body });
  }

  return { connected, sendMessage };
}
