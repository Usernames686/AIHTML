import re
from datetime import datetime

from fastapi import APIRouter, HTTPException
from llmai import get_client
from llmai.shared import JSONSchemaResponse, SystemMessage, UserMessage

from models.slidecraft import (
    SlideCraftGenerateRequest,
    SlideCraftGenerateResponse,
)
from utils.llm_client_error_handler import handle_llm_client_exceptions
from utils.llm_config import get_llm_config
from utils.llm_provider import get_model
from utils.llm_utils import generate_structured_with_schema_retries


SLIDECRAFT_ROUTER = APIRouter(prefix="/slidecraft", tags=["SlideCraft"])


STYLE_PRESETS: dict[str, str] = {
    "neo-brutalism-3d": (
        "Raw geometric composition, thick borders, assertive type, tactile 3D depth, "
        "high contrast, useful for creative agencies, Web3, and startup narratives."
    ),
    "retro-futurism": (
        "1980s future language, chrome accents, neon horizon energy, cinematic depth, "
        "useful for launches, gaming, music, and technology storytelling."
    ),
    "maximalism-typography": (
        "Experimental typography, dense but controlled layouts, bold scale shifts, "
        "useful for fashion, creative work, and culture-forward presentations."
    ),
    "naive-typography": (
        "Hand-made warmth, playful typography, imperfect shapes, friendly visual rhythm, "
        "useful for education, workshops, kids products, and maker brands."
    ),
    "bento-3d-glass": (
        "High-end SaaS bento layouts, polished glass surfaces, crisp product depth, "
        "useful for software, dashboards, metrics, and product demos."
    ),
    "neo-minimalism": (
        "Restrained premium minimalism, quiet whitespace, warm details, precise hierarchy, "
        "useful for luxury, strategy, research, and executive storytelling."
    ),
    "memphis": (
        "Bright Memphis geometry, joyful collision of shapes and colors, energetic rhythm, "
        "useful for startup, education, community, and playful brands."
    ),
    "blueprint": (
        "Technical blueprint aesthetics, precision grid, linework, system diagrams, "
        "useful for architecture, engineering, product design, and technical talks."
    ),
    "editorial-magazine": (
        "Print-editorial pacing, strong cover typography, generous white space, captions, "
        "pull quotes, and magazine-like spreads for essays, reports, and thought leadership."
    ),
    "cyber-terminal": (
        "Dark technical command-center language, terminal panels, monospace data, scanline "
        "texture, and operational status motifs for security, AI infra, and dev tools."
    ),
    "course-workshop": (
        "Warm learning-module design with lesson markers, exercises, checkpoints, diagrams, "
        "and readable teaching rhythm for courses, workshops, and internal training."
    ),
    "investor-pitch": (
        "Investor-ready narrative with market framing, traction, product, business model, "
        "competitive contrast, and crisp metric hierarchy for fundraising decks."
    ),
    "obsidian-pro": (
        "Premium dark-mode presentation language with charcoal surfaces, restrained contrast, "
        "sharp typography, subtle depth, and precise technical diagrams for AI, engineering, and strategy."
    ),
    "handdrawn-whiteboard": (
        "Clean whiteboard and sketch-note feel with hand-drawn lines, informal annotations, "
        "diagram arrows, and approachable explanation pacing for teaching and systems walkthroughs."
    ),
    "apple-keynote": (
        "Apple-style launch keynote with cinematic restraint, large product statements, elegant "
        "gradients, spacious pacing, and crisp feature reveals for product announcements."
    ),
    "data-dashboard": (
        "Data-first analytical deck with dense-but-readable charts, KPI hierarchy, dashboard panels, "
        "comparison tables, and executive insight callouts for metrics-heavy presentations."
    ),
    "corporate-blue-gold": (
        "Trustworthy enterprise presentation style with navy, ivory, and muted gold accents, "
        "formal structure, restrained charts, and boardroom-ready executive polish."
    ),
}


SLIDECRAFT_RESPONSE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["title", "html", "warnings"],
    "properties": {
        "title": {
            "type": "string",
            "minLength": 3,
            "maxLength": 120,
        },
        "html": {
            "type": "string",
            "minLength": 1500,
            "description": "A complete self-contained HTML document.",
        },
        "warnings": {
            "type": "array",
            "items": {"type": "string"},
        },
    },
}


SYSTEM_PROMPT = """
You are SlideCraft, an expert HTML presentation generator.

Generate one complete, self-contained HTML presentation document. The HTML must run
entirely in the browser with inline CSS and inline JavaScript. Do not use npm,
build tools, external JavaScript, Markdown fences, or explanatory text.

Core requirements:
- Return JSON only with keys: title, html, warnings.
- The html string must include <!doctype html>, <html>, <head>, <style>, <body>,
  multiple <section class="slide"> elements, and a <script>.
- Every slide must fit exactly in the viewport: .slide uses width: 100vw,
  height: 100vh, height: 100dvh, overflow: hidden.
- Include a .slide-content container on content slides.
- Use clamp() for title, body, spacing, and key layout sizes.
- Include prefers-reduced-motion CSS.
- Include a SlidePresentation class with keyboard navigation, touch/swipe
  navigation, progress bar, navigation dots, and fitSlideContent().
- fitSlideContent() must detect overflowing .slide-content blocks and scale them
  down safely after load and resize.
- Use only audience-facing content on slides. If speaker notes are requested,
  put them in <aside class="notes"> elements.
- Keep content density reasonable: title slides are concise, content slides use
  4-6 bullets max, grids use 6 cards max.
- Avoid generic AI-looking visuals. Make the selected style feel intentional.
- Use fonts from Google Fonts or Fontshare, not system font stacks.
- No external images unless the user explicitly supplied image URLs. Prefer CSS,
  gradients, typography, and simple inline shapes.
- Do not include scripts that fetch remote data or call APIs.
- Do not generate PPTX/PDF/export workflows, upload flows, template-library
  assumptions, or references to Presenton legacy editor screens.
"""


def _build_user_prompt(request: SlideCraftGenerateRequest) -> str:
    language = (request.language or "auto-detect").strip() or "auto-detect"
    audience = (request.audience or "general audience").strip() or "general audience"
    instructions = (request.instructions or "").strip()
    style_description = STYLE_PRESETS[request.style]
    notes = (
        "Include hidden <aside class=\"notes\"> speaker notes per slide."
        if request.include_speaker_notes
        else "Do not include speaker notes."
    )

    return f"""
# Current Date
{datetime.now().strftime("%Y-%m-%d")}

# Presentation Brief
Topic: {request.topic}
Audience: {audience}
Language: {language}
Slide count: {request.n_slides}
Style preset: {request.style}
Style direction: {style_description}
Speaker notes: {notes}

# Additional Instructions
{instructions if instructions else "No additional instructions."}

Return a single HTML document only. No PPTX, PDF, image export, upload flow, or template-library assumptions.
The output should be useful as a standalone web page that can be previewed in an
iframe, copied, downloaded, and opened directly in a browser.

Create exactly {request.n_slides} slides. Make it ready for iframe preview and
keyboard presentation. Return corrected JSON only.
"""


def _strip_html_fences(html: str) -> str:
    stripped = html.strip()
    match = re.match(r"^```(?:html)?\s*(.*?)\s*```$", stripped, re.DOTALL | re.I)
    return match.group(1).strip() if match else stripped


def _validate_html(html: str) -> list[str]:
    warnings: list[str] = []
    stripped = html.strip()
    lower = html.lower()
    if stripped.startswith("```") or stripped.endswith("```"):
        warnings.append("Generated HTML still contains Markdown code fences.")
    if "<!doctype html" not in lower:
        warnings.append("Generated HTML is missing a doctype.")
    if "<section" not in lower or 'class="slide' not in lower:
        warnings.append("Generated HTML may not contain SlideCraft slide sections.")
    if "class slidepresentation" not in lower and "class slidepresentation" not in lower.replace(" ", ""):
        warnings.append("Generated HTML may be missing the SlidePresentation controller.")
    if "fitslidecontent" not in lower:
        warnings.append("Generated HTML may be missing content auto-fit support.")
    if re.search(r"<script[^>]+src\s*=", lower):
        warnings.append("Generated HTML contains an external script reference.")
    return warnings


@SLIDECRAFT_ROUTER.post("/generate", response_model=SlideCraftGenerateResponse)
async def generate_slidecraft_html(
    request: SlideCraftGenerateRequest,
) -> SlideCraftGenerateResponse:
    client = get_client(config=get_llm_config())
    model = get_model()

    try:
        content = await generate_structured_with_schema_retries(
            client,
            model,
            messages=[
                SystemMessage(content=SYSTEM_PROMPT),
                UserMessage(content=_build_user_prompt(request)),
            ],
            response_format=JSONSchemaResponse(
                name="slidecraft_html",
                json_schema=SLIDECRAFT_RESPONSE_SCHEMA,
                strict=False,
            ),
            json_schema=SLIDECRAFT_RESPONSE_SCHEMA,
            strict=False,
            validate_schema=True,
        )
    except Exception as exc:
        raise handle_llm_client_exceptions(exc)

    html = _strip_html_fences(str(content.get("html") or ""))
    if not html:
        raise HTTPException(status_code=400, detail="The model returned empty HTML.")

    warnings = list(content.get("warnings") or [])
    warnings.extend(_validate_html(html))

    return SlideCraftGenerateResponse(
        title=str(content.get("title") or "SlideCraft Presentation"),
        html=html,
        style=request.style,
        warnings=warnings,
    )
