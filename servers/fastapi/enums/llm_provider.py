from enum import Enum


class LLMProvider(Enum):
    OLLAMA = "ollama"
    OPENAI = "openai"
    GOOGLE = "google"
    VERTEX = "vertex"
    AZURE = "azure"
    OPENROUTER = "openrouter"
    CEREBRAS = "cerebras"
    ANTHROPIC = "anthropic"
    LITELLM = "litellm"
    CUSTOM = "custom"
    CODEX = "codex"
