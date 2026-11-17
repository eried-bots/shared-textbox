export const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shared textbox</title>
<style>
  html, body { margin: 0; height: 100%; background: #000; }
  body { display: flex; flex-direction: column; }
  #s { position: fixed; top: 8px; right: 8px; width: 28px; height: 28px; display: none; opacity: .85; pointer-events: none; }
  body.off #s { display: block; }
  #t { flex: 1; width: 100%; box-sizing: border-box; border: 0; outline: 0; resize: none;
       background: #000; color: #fff; font: 22px/1.4 sans-serif; padding: 10px; }
</style>
</head>
<body>
<svg id="s" viewBox="0 0 24 24" aria-label="Disconnected"><circle cx="12" cy="12" r="11" fill="#e00"/><path d="M7 7l10 10M17 7L7 17" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>
<textarea id="t" autofocus spellcheck="false" placeholder="Type here. Everyone sees the same text."></textarea>
<script>
(function () {
  var t = document.getElementById("t"), body = document.body;
  var ws, timer = null, dirty = false;
  function send() {
    timer = null;
    if (ws && ws.readyState === 1) { ws.send(t.value); dirty = false; }
  }
  function connect() {
    ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws");
    body.className = "off";
    ws.onopen = function () { body.className = ""; if (dirty) send(); };
    ws.onmessage = function (e) {
      if (dirty) return; // our own unsent edit wins (last write wins)
      if (t.value !== e.data) {
        var a = t.selectionStart, b = t.selectionEnd;
        t.value = e.data;
        try { t.setSelectionRange(Math.min(a, e.data.length), Math.min(b, e.data.length)); } catch (x) {}
      }
    };
    ws.onclose = function () { body.className = "off"; setTimeout(connect, 1500); };
    ws.onerror = function () { try { ws.close(); } catch (x) {} };
  }
  t.addEventListener("input", function () {
    dirty = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(send, 150);
  });
  connect();
})();
</script>
</body>
</html>`;
