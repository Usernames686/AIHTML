from pydantic import ValidationError

from api.v1.ppt.endpoints.slidecraft import (
    STYLE_PRESETS,
    _build_user_prompt,
    _merge_warnings,
    _strip_html_fences,
    _validate_html,
)
from models.slidecraft import SlideCraftGenerateRequest


def test_slidecraft_accepts_expanded_style_presets():
    expected_styles = {
        "bento-3d-glass",
        "neo-minimalism",
        "blueprint",
        "neo-brutalism-3d",
        "retro-futurism",
        "maximalism-typography",
        "naive-typography",
        "memphis",
        "editorial-magazine",
        "cyber-terminal",
        "course-workshop",
        "investor-pitch",
        "obsidian-pro",
        "handdrawn-whiteboard",
        "apple-keynote",
        "data-dashboard",
        "corporate-blue-gold",
    }

    assert expected_styles.issubset(STYLE_PRESETS.keys())
    for style in expected_styles:
        request = SlideCraftGenerateRequest(topic="Launch an HTML slide product", style=style)
        assert request.style == style


def test_slidecraft_rejects_unknown_style():
    try:
        SlideCraftGenerateRequest(topic="Launch an HTML slide product", style="ppt-export")
    except ValidationError as exc:
        assert "style" in str(exc)
    else:
        raise AssertionError("Unknown styles must not be accepted")


def test_user_prompt_carries_quality_contract_and_selected_style():
    request = SlideCraftGenerateRequest(
        topic="Explain browser-native decks for founders",
        audience="Seed-stage founders",
        language="Chinese",
        n_slides=9,
        style="editorial-magazine",
        instructions="Use numbered sections and avoid stock images.",
        include_speaker_notes=False,
    )

    prompt = _build_user_prompt(request)

    assert "Style preset: editorial-magazine" in prompt
    assert "Create exactly 9 slides" in prompt
    assert "Do not include speaker notes" in prompt
    assert "Return a single HTML document only" in prompt
    assert "No PPTX, PDF, image export, upload flow, or template-library assumptions" in prompt


def test_validate_html_warns_about_missing_safety_and_structure():
    warnings = _validate_html("<html><body><section>One slide</section></body></html>")

    assert "Generated HTML is missing a doctype." in warnings
    assert any("SlideCraft slide sections" in warning for warning in warnings)
    assert any("SlidePresentation controller" in warning for warning in warnings)
    assert any("content auto-fit" in warning for warning in warnings)


def test_validate_html_warns_about_external_scripts_and_markdown_fences():
    warnings = _validate_html(
        """```html
        <!doctype html>
        <html>
          <head><script src="https://example.com/deck.js"></script></head>
          <body>
            <section class="slide"><div class="slide-content">Deck</div></section>
            <script>class SlidePresentation { fitSlideContent() {} }</script>
          </body>
        </html>
        ```"""
    )

    assert any("Markdown code fences" in warning for warning in warnings)
    assert any("external script" in warning for warning in warnings)


def test_strip_html_fences_only_removes_outer_html_fence():
    html = "<!doctype html><html><body>Deck</body></html>"

    assert _strip_html_fences(f"```html\n{html}\n```") == html
    assert _strip_html_fences(html) == html


def test_validate_complete_html_has_no_warnings():
    html = """<!doctype html>
    <html><body>
      <section class="slide"><div class="slide-content">Deck</div></section>
      <script>class SlidePresentation { fitSlideContent() {} }</script>
    </body></html>"""

    assert _validate_html(html) == []


def test_merge_warnings_preserves_order_and_removes_duplicates():
    assert _merge_warnings(["First", "Shared"], ["Shared", "Second"]) == [
        "First",
        "Shared",
        "Second",
    ]
