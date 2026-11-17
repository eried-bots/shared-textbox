// Shared textbox: one text, held by one Durable Object. Last write wins.
import { DurableObject } from "cloudflare:workers";
import { HTML } from "./html.js";

export class Box extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY CHECK (id = 1), text TEXT NOT NULL)"
    );
  }

  getText() {
    const row = this.ctx.storage.sql.exec("SELECT text FROM t WHERE id = 1").toArray()[0];
    return row ? row.text : "";
  }

  setText(text) {
    this.ctx.storage.sql.exec(
      "INSERT INTO t (id, text) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET text = excluded.text",
      text
    );
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      pair[1].send(this.getText());
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (url.pathname === "/api/text") {
      if (request.method === "POST" || request.method === "PUT") {
        const text = (await request.text()).slice(0, 100000);
        this.setText(text);
        this.broadcast(text, null);
        return new Response("ok");
      }
      return new Response(this.getText(), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
    }
    return new Response("Not found", { status: 404 });
  }

  broadcast(text, except) {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== except) {
        try { ws.send(text); } catch (e) {}
      }
    }
  }

  webSocketMessage(ws, message) {
    if (typeof message !== "string") return;
    const text = message.slice(0, 100000);
    this.setText(text);
    this.broadcast(text, ws);
  }

  webSocketClose(ws, code) {
    try { ws.close(code); } catch (e) {}
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/" ) {
      return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" } });
    }
    if (url.pathname === "/ws" || url.pathname === "/api/text") {
      const stub = env.BOX.get(env.BOX.idFromName("main"));
      return stub.fetch(request);
    }
    return new Response("Not found", { status: 404 });
  },
};
