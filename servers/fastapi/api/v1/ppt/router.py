from fastapi import APIRouter

from api.v1.ppt.endpoints.openai import OPENAI_ROUTER
from api.v1.ppt.endpoints.ollama import OLLAMA_ROUTER
from api.v1.ppt.endpoints.slidecraft import SLIDECRAFT_ROUTER


API_V1_PPT_ROUTER = APIRouter(prefix="/api/v1/ppt")

API_V1_PPT_ROUTER.include_router(SLIDECRAFT_ROUTER)
API_V1_PPT_ROUTER.include_router(OLLAMA_ROUTER)
API_V1_PPT_ROUTER.include_router(OPENAI_ROUTER)
