from typing import Literal, Optional

from pydantic import BaseModel, Field


SlideCraftStyle = Literal[
    "neo-brutalism-3d",
    "retro-futurism",
    "maximalism-typography",
    "naive-typography",
    "bento-3d-glass",
    "neo-minimalism",
    "memphis",
    "blueprint",
    "editorial-magazine",
    "cyber-terminal",
    "course-workshop",
    "investor-pitch",
    "obsidian-pro",
    "handdrawn-whiteboard",
    "apple-keynote",
    "data-dashboard",
    "corporate-blue-gold",
]


class SlideCraftGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3, description="Deck topic or brief")
    audience: Optional[str] = Field(default=None, description="Target audience")
    language: Optional[str] = Field(default=None, description="Deck language")
    n_slides: int = Field(default=8, ge=1, le=30, description="Number of slides")
    style: SlideCraftStyle = Field(
        default="bento-3d-glass",
        description="SlideCraft visual style preset",
    )
    instructions: Optional[str] = Field(
        default=None,
        description="Additional deck requirements or source notes",
    )
    include_speaker_notes: bool = Field(
        default=True,
        description="Whether to include speaker notes in the HTML",
    )


class SlideCraftGenerateResponse(BaseModel):
    title: str
    html: str
    style: SlideCraftStyle
    warnings: list[str] = Field(default_factory=list)
