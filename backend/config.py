"""配置管理模块"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

# ========== Secrets / Environment ==========
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_TEXT_API_KEY = MINIMAX_API_KEY
MINIMAX_OTHER_API_KEY = MINIMAX_API_KEY
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'app.db'}")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

# ========== 默认音色配置 ==========
DEFAULT_VOICES = {
    "mini": {
        "name": "Mini",
        "gender": "female",
        "voice_id": "moss_audio_aaa1346a-7ce7-11f0-8e61-2e6e3c7ee85d",
        "description": "女声 - 活泼亲切",
    },
    "max": {
        "name": "Max",
        "gender": "male",
        "voice_id": "moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85",
        "description": "男声 - 稳重专业",
    },
}

# ========== BGM 配置 ==========
BGM_DIR = BASE_DIR / "assets"
BGM_FILES = {
    "bgm01": str(BGM_DIR / "bgm01.wav"),
    "bgm02": str(BGM_DIR / "bgm02.wav"),
}

WELCOME_TEXT = "欢迎收听MiniMax AI播客节目"
WELCOME_VOICE_ID = DEFAULT_VOICES["mini"]["voice_id"]

# ========== MiniMax API 端点配置 ==========
MINIMAX_API_ENDPOINTS = {
    "text_completion": "https://api.minimaxi.com/v1/text/chatcompletion_v2",
    "tts": "https://api.minimaxi.com/v1/t2a_v2",
    "voice_clone": "https://api.minimax.chat/v1/voice_clone",
    "file_upload": "https://api.minimax.chat/v1/files/upload",
    "image_generation": "https://api.minimaxi.com/v1/image_generation",
}

MODELS = {
    "text": "MiniMax-M2-Preview",
    "tts": "speech-2.5-hd-preview",
    "voice_clone": "speech-02-turbo",
    "image": "image-01-live",
}

PODCAST_CONFIG = {
    "target_duration_min": 3,
    "target_duration_max": 5,
    "style": "轻松幽默",
    "speakers": ["Speaker1", "Speaker2"],
}

TIMEOUTS = {
    "url_parsing": 30,
    "pdf_parsing": 30,
    "voice_clone": 60,
    "script_generation": 120,
    "tts_per_sentence": 30,
    "cover_prompt_generation": 60,
    "image_generation": 90,
}

UPLOAD_DIR = str(BASE_DIR / "uploads")
OUTPUT_DIR = str(BASE_DIR / "outputs")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

VOICE_ID_CONFIG = {
    "prefix": "customVoice",
    "min_length": 8,
    "max_length": 256,
    "allowed_chars": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_",
}

TTS_AUDIO_SETTINGS = {
    "sample_rate": 32000,
    "bitrate": 128000,
    "format": "mp3",
    "channel": 1,
}

IMAGE_GENERATION_CONFIG = {
    "style_type": "漫画",
    "style_weight": 1,
    "aspect_ratio": "1:1",
    "prompt_optimizer": True,
    "n": 1,
}

LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
