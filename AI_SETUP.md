AI integration setup

This project uses OpenRouter (an API gateway for different LLMs) for two features:

- Generating AI-powered summaries for listing reviews (`/api/listings/:id/generate-summary`)
- Smart Match assistant (`/api/smart-match`)

If these are returning empty results or asking users to rephrase repeatedly, the most common causes are missing API credentials or misconfigured environment variables. Below are steps to get the project working locally and in deployment.

1) Obtain an API key

- Sign up for OpenRouter (https://openrouter.ai) or another LLM gateway you intend to use.
- Create an API key and copy it.

2) Local server configuration

Create a `server/.env` file (this file is ignored by git) with the following contents:

OPENROUTER_API_KEY=sk-...
PORT=5001
FRONTEND_URL=http://localhost:5173

Notes:
- Use your real OpenRouter API key for `OPENROUTER_API_KEY`.
- `FRONTEND_URL` is optional but helps CORS in production setups.

3) Local frontend configuration (optional)

Create `client/.env` or `client/.env.development` with:

VITE_API_URL=http://localhost:5001/api

This makes the frontend call your local backend instead of a production endpoint.

4) Start server and client

From project root:

# start server
cd server
npm install
npm run dev

# in another terminal: start client
cd client
npm install
npm run dev

5) Test endpoints

- Test Smart Match (replace host if deployed):

curl -X POST "http://localhost:5001/api/smart-match" \
  -H "Content-Type: application/json" \
  -d '{"userInput":"2 bed under $1500 with parking near campus","conversationHistory":[]}'

- Test generate summary (replace listing id as needed):

curl -X POST "http://localhost:5001/api/listings/1/generate-summary"

Expected behavior:
- If `OPENROUTER_API_KEY` is NOT set, the server will log errors from the OpenRouter API and the endpoints should return 500 or an informative message.
- If the key is set and valid, the endpoints should return structured JSON (Smart Match) or a saved `ai_summary` (Generate Summary).

6) Troubleshooting

- Check server logs for errors that include `OpenRouter API error` or `Smart match error`.
- Look for HTTP error codes from OpenRouter such as 401 (invalid key), 429 (rate limit), 403 (forbidden), or 500 (server error).
- If Smart Match returns plain text prompting for rephrase, the assistant may be returning a message instead of the expected JSON. Review the system prompt in `server/server.js` for the exact required JSON format and adjust the prompt to be more strict (e.g., force `JSON_ONLY` and provide clear examples).
- Consider adding a small validation step: after getting the AI response, try to JSON.parse; if parsing fails, log the raw AI response to help debugging.

7) Deployment

- Add `OPENROUTER_API_KEY` as a secret environment variable in your deployment platform (Render, Vercel, etc.).
- Set the frontend `VITE_API_URL` to your deployed backend API URL (e.g., `https://your-backend.example.com/api`).

8) Security

- Never commit `.env` files containing API keys to the repository.
- Rotate API keys if they are accidentally committed.

If you want, I can:
- add a small server-side validation wrapper that logs raw AI responses when JSON parsing fails,
- re-run the server with a local test key (you'll need to provide it), or
- prepare a PR to make error messages clearer in the UI.

