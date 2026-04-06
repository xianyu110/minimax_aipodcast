"""AI 播客生成工具 - Flask 后端服务"""

import os
import sys
import json
import logging

from flask import Flask, jsonify, send_file
from flask_cors import CORS

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import UPLOAD_DIR, OUTPUT_DIR, BGM_FILES, DATABASE_URL, JWT_SECRET_KEY, FRONTEND_ORIGIN
from extensions import db, jwt
from models import User, PodcastJob

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY

db.init_app(app)
jwt.init_app(app)

CORS(app, origins=[FRONTEND_ORIGIN], supports_credentials=True)

from routes.auth import auth_bp
from routes.podcast import podcast_bp

app.register_blueprint(auth_bp)
app.register_blueprint(podcast_bp)


@app.route("/health")
def health_check():
    return jsonify({"status": "ok", "message": "AI 播客生成服务运行中"})


@app.route("/api/default-voices")
def get_default_voices():
    from config import DEFAULT_VOICES
    return jsonify({"success": True, "voices": DEFAULT_VOICES})


@app.route("/download/audio/<path:filename>")
def download_audio(filename):
    try:
        return send_from_directory(OUTPUT_DIR, filename, as_attachment=True)
    except Exception:
        return jsonify({"error": "not found"}), 404


@app.route("/download/script/<path:filename>")
def download_script(filename):
    try:
        return send_from_directory(OUTPUT_DIR, filename, as_attachment=True)
    except Exception:
        return jsonify({"error": "not found"}), 404


@app.route("/download/cover")
def download_cover():
    try:
        import requests as req
        cover_url = __import__("flask").request.args.get("url")
        if not cover_url:
            return jsonify({"error": "missing url"}), 400
        resp = req.get(cover_url, timeout=30)
        resp.raise_for_status()
        from flask import make_response
        r = make_response(resp.content)
        r.headers["Content-Type"] = "image/jpeg"
        r.headers["Content-Disposition"] = 'attachment; filename="cover.jpg"'
        return r
    except Exception:
        return jsonify({"error": "download failed"}), 500


@app.route("/static/<path:filename>")
def serve_static(filename):
    from config import BGM_FILES
    if filename in BGM_FILES:
        return send_file(BGM_FILES[filename])
    return jsonify({"error": "not found"}), 404


with app.app_context():
    db.create_all()

if __name__ == "__main__":
    logger.info("=" * 50)
    logger.info("🎙️  MiniMax AI 播客生成服务启动")
    logger.info(f"📁 上传目录: {UPLOAD_DIR}")
    logger.info(f"📁 输出目录: {OUTPUT_DIR}")
    logger.info("=" * 50)
    app.run(debug=False, host="0.0.0.0", port=5001, threaded=True)
