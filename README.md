# shared-textbox

One big textbox. Whatever you type shows up in every other open browser within a second or two.

- No login, one shared text, last write wins (no merging, no conflict handling).
- A Cloudflare Worker serves the page. One SQLite-backed Durable Object holds the text and pushes changes to all browsers over WebSockets.
- `GET /api/text` returns the current text; `POST /api/text` replaces it.
- Free-tier friendly: no R2, no paid resources.

## Deploy
`npm install && npx wrangler deploy`, or connect this repo in Cloudflare Workers & Pages (Workers Builds) so every push to `main` deploys.
