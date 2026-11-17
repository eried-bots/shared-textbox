export const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shared textbox</title>
<style>
  html, body { margin: 0; height: 100%; background: #000; }
  body { display: flex; flex-direction: column; }
  #s { position: fixed; top: 6px; right: 10px; font: 13px sans-serif; color: #888; opacity: 0; transition: opacity .6s; pointer-events: none; }
  body.off #s { opacity: .5; }
  #t { flex: 1; width: 100%; box-sizing: border-box; border: 0; outline: 0; resize: none;
       background: #000; color: #fff; font: 22px/1.4 sans-serif; padding: 10px; }
</style>
</head>
<body>
<div id="s">disconnected</div>
<textarea id="t" autofocus spellcheck="false" placeholder="Type here. Everyone sees the same text."></textarea>
<script>
(function () {
  var t = document.getElementById("t"), body = document.body;
  var ws, timer = null, dirty = false, offTimer = null;
  function down() { if (!offTimer) offTimer = setTimeout(function () { body.className = "off"; }, 2000); }
  function up() { clearTimeout(offTimer); offTimer = null; body.className = ""; }
  function send() {
    timer = null;
    if (ws && ws.readyState === 1) { ws.send(t.value); dirty = false; }
  }
  function connect() {
    ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws");
    down();
    ws.onopen = function () { up(); if (dirty) send(); };
    ws.onmessage = function (e) {
      if (dirty) return; // our own unsent edit wins (last write wins)
      if (t.value !== e.data) {
        var a = t.selectionStart, b = t.selectionEnd;
        t.value = e.data;
        try { t.setSelectionRange(Math.min(a, e.data.length), Math.min(b, e.data.length)); } catch (x) {}
      }
    };
    ws.onclose = function () { down(); setTimeout(connect, 1500); };
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
