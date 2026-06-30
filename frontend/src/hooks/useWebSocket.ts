import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const apiHost = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/^https?:\/\//, "")
      : window.location.host;
    const wsUrl = `${protocol}://${apiHost}/ws?token=${token}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      try {
        const { event: eventType, data } = JSON.parse(event.data);
        if (eventType === "new_order") {
          toast.success(`Новый заказ #${data.order_id} — ${data.total} ₸`, { duration: 5000 });
        } else if (eventType === "order_status_changed") {
          toast(`Заказ #${data.order_id}: статус изменён на "${data.status}"`, { icon: "📦" });
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.current.onerror = () => {
      // silently reconnect
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  return ws;
}
