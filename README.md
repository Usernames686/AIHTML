# AIHTML

AIHTML is a lightweight HTML slide generation website based on the trimmed Presenton codebase.

It focuses on one workflow:

- Enter a topic, audience, language, page count, and visual style.
- Call the configured model API.
- Generate a self-contained HTML web slide deck.
- Preview, copy, refresh, fullscreen preview, and download the generated HTML.

## Run With Docker

```bash
docker compose up -d --build production
```

Open:

```text
http://localhost:5000/slidecraft
```

## Model Configuration

Set environment variables before starting Docker. Example:

```env
LLM=openai
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini
CAN_CHANGE_KEYS=true
```

Other supported provider configuration is inherited from the remaining FastAPI model routes.

## Development

Frontend:

```bash
cd servers/nextjs
npm install
npm run dev
```

Backend:

```bash
cd servers/fastapi
uv sync
python server.py --port 8000 --reload true
```

## Main Paths

- Frontend page: `servers/nextjs/app/(presentation-generator)/(dashboard)/slidecraft`
- Frontend API client: `servers/nextjs/app/(presentation-generator)/services/api/slidecraft.ts`
- Backend endpoint: `servers/fastapi/api/v1/ppt/endpoints/slidecraft.py`
- Backend model: `servers/fastapi/models/slidecraft.py`
