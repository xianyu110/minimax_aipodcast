"""Podcast generation routes and history endpoints."""

import json
import os
import uuid
from datetime import datetime, timezone

from flask import Blueprint, Response, current_app, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from config import UPLOAD_DIR, OUTPUT_DIR, BGM_FILES, DEFAULT_VOICES
from content_parser import content_parser
from extensions import db
from models import PodcastJob
from podcast_generator import podcast_generator
from voice_manager import voice_manager

podcast_bp = Blueprint('podcast', __name__)

ALLOWED_AUDIO_EXTENSIONS = {'wav', 'mp3', 'flac', 'm4a', 'ogg'}
ALLOWED_PDF_EXTENSIONS = {'pdf'}


def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def _job_file_path(user_id: int, job_id: int, kind: str, filename: str):
    folder = os.path.join(OUTPUT_DIR, str(user_id), str(job_id))
    os.makedirs(folder, exist_ok=True)
    return os.path.join(folder, filename)


def _relative_path(abs_path: str):
    if not abs_path:
        return None
    base = os.path.abspath(OUTPUT_DIR)
    return os.path.relpath(abs_path, base)


def _absolute_output_path(rel_path: str):
    if not rel_path:
        return None
    return os.path.join(OUTPUT_DIR, rel_path)


@podcast_bp.get('/health')
def health_check():
    return jsonify({'status': 'ok', 'message': 'AI 播客生成服务运行中'})


@podcast_bp.get('/api/default-voices')
def get_default_voices():
    return jsonify({'success': True, 'voices': DEFAULT_VOICES})


@podcast_bp.get('/api/generations')
@jwt_required()
def list_generations():
    user_id = int(get_jwt_identity())
    jobs = PodcastJob.query.filter_by(user_id=user_id).order_by(PodcastJob.created_at.desc()).all()
    return jsonify({'success': True, 'items': [job.to_dict() for job in jobs]})


@podcast_bp.get('/api/generations/<int:job_id>')
@jwt_required()
def get_generation(job_id):
    user_id = int(get_jwt_identity())
    job = PodcastJob.query.filter_by(id=job_id, user_id=user_id).first_or_404()
    return jsonify({'success': True, 'item': job.to_dict()})


@podcast_bp.get('/api/generations/<int:job_id>/audio')
@jwt_required()
def download_generation_audio(job_id):
    user_id = int(get_jwt_identity())
    job = PodcastJob.query.filter_by(id=job_id, user_id=user_id).first_or_404()
    if not job.audio_path:
        return jsonify({'message': '音频尚未生成'}), 404
    return send_file(_absolute_output_path(job.audio_path), as_attachment=True)


@podcast_bp.get('/api/generations/<int:job_id>/script')
@jwt_required()
def download_generation_script(job_id):
    user_id = int(get_jwt_identity())
    job = PodcastJob.query.filter_by(id=job_id, user_id=user_id).first_or_404()
    if not job.script_path:
        return jsonify({'message': '脚本尚未生成'}), 404
    return send_file(_absolute_output_path(job.script_path), as_attachment=True)


@podcast_bp.get('/api/generations/<int:job_id>/cover')
@jwt_required()
def download_generation_cover(job_id):
    user_id = int(get_jwt_identity())
    job = PodcastJob.query.filter_by(id=job_id, user_id=user_id).first_or_404()
    if not job.cover_path:
        return jsonify({'message': '封面尚未生成'}), 404
    return send_file(_absolute_output_path(job.cover_path), as_attachment=True)


@podcast_bp.post('/api/generate_podcast')
@jwt_required()
def generate_podcast():
    user_id = int(get_jwt_identity())
    session_id = str(uuid.uuid4())

    text_input = request.form.get('text_input', '').strip()
    url_input = request.form.get('url', '').strip()

    pdf_file = None
    pdf_path = None
    if 'pdf_file' in request.files:
        pdf_file_obj = request.files['pdf_file']
        if pdf_file_obj and allowed_file(pdf_file_obj.filename, ALLOWED_PDF_EXTENSIONS):
            filename = secure_filename(pdf_file_obj.filename)
            upload_dir = os.path.join(UPLOAD_DIR, str(user_id), session_id)
            os.makedirs(upload_dir, exist_ok=True)
            pdf_path = os.path.join(upload_dir, filename)
            pdf_file_obj.save(pdf_path)
            pdf_file = filename

    speaker1_type = request.form.get('speaker1_type', 'default')
    speaker1_voice_name = request.form.get('speaker1_voice_name', 'mini')
    speaker1_audio_path = None
    if speaker1_type == 'custom' and 'speaker1_audio' in request.files:
        audio_file = request.files['speaker1_audio']
        if audio_file and allowed_file(audio_file.filename, ALLOWED_AUDIO_EXTENSIONS):
            filename = secure_filename(audio_file.filename)
            upload_dir = os.path.join(UPLOAD_DIR, str(user_id), session_id)
            os.makedirs(upload_dir, exist_ok=True)
            speaker1_audio_path = os.path.join(upload_dir, f'speaker1_{filename}')
            audio_file.save(speaker1_audio_path)

    speaker2_type = request.form.get('speaker2_type', 'default')
    speaker2_voice_name = request.form.get('speaker2_voice_name', 'max')
    speaker2_audio_path = None
    if speaker2_type == 'custom' and 'speaker2_audio' in request.files:
        audio_file = request.files['speaker2_audio']
        if audio_file and allowed_file(audio_file.filename, ALLOWED_AUDIO_EXTENSIONS):
            filename = secure_filename(audio_file.filename)
            upload_dir = os.path.join(UPLOAD_DIR, str(user_id), session_id)
            os.makedirs(upload_dir, exist_ok=True)
            speaker2_audio_path = os.path.join(upload_dir, f'speaker2_{filename}')
            audio_file.save(speaker2_audio_path)

    source_bits = []
    if text_input:
        source_bits.append('text')
    if url_input:
        source_bits.append('url')
    if pdf_file:
        source_bits.append('pdf')

    job = PodcastJob(
        user_id=user_id,
        status='processing',
        title=(text_input[:60] if text_input else url_input[:60] if url_input else pdf_file or 'Untitled'),
        source_type='+'.join(source_bits) if source_bits else None,
        source_summary=(text_input[:500] if text_input else url_input[:500] if url_input else pdf_file),
        speaker1_voice=speaker1_voice_name if speaker1_type == 'default' else 'custom',
        speaker2_voice=speaker2_voice_name if speaker2_type == 'default' else 'custom',
    )
    db.session.add(job)
    db.session.commit()

    def generate():
        try:
            merged_content = ''
            pdf_content = ''

            if pdf_path:
                yield f"data: {json.dumps({'type': 'log', 'message': f'已上传 PDF: {pdf_file}'})}\n\n"
                pdf_result = content_parser.parse_pdf(pdf_path)
                if pdf_result['success']:
                    pdf_content = pdf_result['content']
                    for log in pdf_result['logs']:
                        yield f"data: {json.dumps({'type': 'log', 'message': log})}\n\n"
                else:
                    job.status = 'error'
                    job.error_message = pdf_result['error']
                    db.session.commit()
                    yield f"data: {json.dumps({'type': 'error', 'message': pdf_result['error']})}\n\n"
                    return

            url_content = ''
            if url_input:
                yield f"data: {json.dumps({'type': 'log', 'message': f'开始解析网址: {url_input}'})}\n\n"
                url_result = content_parser.parse_url(url_input)
                if url_result['success']:
                    url_content = url_result['content']
                    for log in url_result['logs']:
                        yield f"data: {json.dumps({'type': 'log', 'message': log})}\n\n"
                else:
                    error_code = url_result.get('error_code', 'unknown')
                    yield f"data: {json.dumps({'type': 'url_parse_warning', 'message': url_result['error'], 'error_code': error_code})}\n\n"
                    for log in url_result['logs']:
                        yield f"data: {json.dumps({'type': 'log', 'message': log})}\n\n"

            merged_content = content_parser.merge_contents(text_input, url_content, pdf_content)
            if not merged_content or merged_content == '没有可用的内容':
                job.status = 'error'
                job.error_message = '请至少提供一种输入内容（文本/网址/PDF）'
                db.session.commit()
                yield f"data: {json.dumps({'type': 'error', 'message': '请至少提供一种输入内容（文本/网址/PDF）'})}\n\n"
                return

            speaker1_config = {'type': speaker1_type}
            if speaker1_type == 'default':
                speaker1_config['voice_name'] = speaker1_voice_name
            else:
                if speaker1_audio_path:
                    speaker1_config['audio_file'] = speaker1_audio_path
                else:
                    job.status = 'error'
                    job.error_message = 'Speaker1 自定义音色未上传音频文件'
                    db.session.commit()
                    yield f"data: {json.dumps({'type': 'error', 'message': 'Speaker1 选择自定义音色但未上传音频文件'})}\n\n"
                    return

            speaker2_config = {'type': speaker2_type}
            if speaker2_type == 'default':
                speaker2_config['voice_name'] = speaker2_voice_name
            else:
                if speaker2_audio_path:
                    speaker2_config['audio_file'] = speaker2_audio_path
                else:
                    job.status = 'error'
                    job.error_message = 'Speaker2 自定义音色未上传音频文件'
                    db.session.commit()
                    yield f"data: {json.dumps({'type': 'error', 'message': 'Speaker2 选择自定义音色但未上传音频文件'})}\n\n"
                    return

            voices_result = voice_manager.prepare_voices(speaker1_config, speaker2_config)
            if not voices_result['success']:
                job.status = 'error'
                job.error_message = voices_result['error']
                db.session.commit()
                yield f"data: {json.dumps({'type': 'error', 'message': voices_result['error']})}\n\n"
                return

            for log in voices_result['logs']:
                yield f"data: {json.dumps({'type': 'log', 'message': log})}\n\n"

            for key, trace_id in voices_result.get('trace_ids', {}).items():
                if trace_id:
                    yield f"data: {json.dumps({'type': 'trace_id', 'api': key, 'trace_id': trace_id})}\n\n"

            speaker1_voice_id = voices_result['speaker1']
            speaker2_voice_id = voices_result['speaker2']

            audio_path = None
            script_path = None
            cover_url = ''
            trace_ids = {}

            for event in podcast_generator.generate_podcast_stream(
                content=merged_content,
                speaker1_voice_id=speaker1_voice_id,
                speaker2_voice_id=speaker2_voice_id,
                session_id=session_id,
                api_key=None,
            ):
                if event.get('type') == 'complete':
                    audio_path = event.get('audio_path')
                    script_path = event.get('script_path')
                    cover_url = event.get('cover_url', '')
                    trace_ids = event.get('trace_ids', {})
                yield f"data: {json.dumps(event)}\n\n"

            if audio_path or script_path or cover_url:
                job.audio_path = _relative_path(audio_path) if audio_path else None
                job.script_path = _relative_path(script_path) if script_path else None
                job.cover_path = None
                job.trace_ids_json = json.dumps(trace_ids, ensure_ascii=False) if trace_ids else None
                job.status = 'completed'
                job.completed_at = datetime.now(timezone.utc)
                db.session.commit()
            else:
                job.status = 'error'
                job.error_message = '播客生成未返回结果'
                db.session.commit()

        except Exception as e:
            job.status = 'error'
            job.error_message = str(e)
            db.session.commit()
            yield f"data: {json.dumps({'type': 'error', 'message': f'播客生成失败: {str(e)}'})}\n\n"

    return Response(generate(), mimetype='text/event-stream')
