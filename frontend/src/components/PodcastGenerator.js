import React, { useState, useRef } from 'react';
import './PodcastGenerator.css';

const PodcastGenerator = () => {

  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [pdfFile, setPdfFile] = useState(null);

  const [speaker1Type, setSpeaker1Type] = useState('default');
  const [speaker1Voice, setSpeaker1Voice] = useState('mini');
  const [speaker1Audio, setSpeaker1Audio] = useState(null);

  const [speaker2Type, setSpeaker2Type] = useState('default');
  const [speaker2Voice, setSpeaker2Voice] = useState('max');
  const [speaker2Audio, setSpeaker2Audio] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [logs, setLogs] = useState([]);
  const [script, setScript] = useState([]);
  const [coverImage, setCoverImage] = useState('');
  const [traceIds, setTraceIds] = useState([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [scriptUrl, setScriptUrl] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [activePlayer, setActivePlayer] = useState(0);
  const [player0Url, setPlayer0Url] = useState('');
  const [player1Url, setPlayer1Url] = useState('');
  const [urlWarning, setUrlWarning] = useState(null);

  const audioRef0 = useRef(null);
  const audioRef1 = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || '';

  const addLog = (message) => {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), message }]);
  };

  const addTraceId = (api, traceId) => {
    setTraceIds((prev) => [...prev, { api, traceId }]);
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      alert('请上传 PDF 文件');
    }
  };

  const handleSpeaker1AudioChange = (e) => {
    const file = e.target.files[0];
    if (file) setSpeaker1Audio(file);
  };

  const handleSpeaker2AudioChange = (e) => {
    const file = e.target.files[0];
    if (file) setSpeaker2Audio(file);
  };

  const performUpdate = (newUrl) => {
    const currentAudio = activePlayer === 0 ? audioRef0.current : audioRef1.current;
    const nextAudio = activePlayer === 0 ? audioRef1.current : audioRef0.current;

    if (currentAudio && !currentAudio.paused) {
      const currentTime = currentAudio.currentTime;

      if (activePlayer === 0) {
        setPlayer1Url(newUrl);
      } else {
        setPlayer0Url(newUrl);
      }

      setTimeout(() => {
        if (nextAudio) {
          nextAudio.currentTime = currentTime;
          nextAudio.play().then(() => {
            setActivePlayer((prev) => (prev === 0 ? 1 : 0));
            if (currentAudio) currentAudio.pause();
          }).catch((err) => {
            console.error('切换播放失败:', err);
          });
        }
      }, 500);
    } else {
      if (activePlayer === 0) {
        setPlayer0Url(newUrl);
      } else {
        setPlayer1Url(newUrl);
      }
    }
  };

  const updateProgressiveAudio = (newUrl) => {
    performUpdate(newUrl);
  };

  const handleSSEEvent = (data) => {
    switch (data.type) {
      case 'progress':
        setProgress(data.message);
        addLog(data.message);
        break;
      case 'log':
        addLog(data.message);
        break;
      case 'script_chunk':
        setScript((prev) => [...prev, data.full_line]);
        break;
      case 'trace_id':
        addTraceId(data.api, data.trace_id);
        break;
      case 'cover_image':
        setCoverImage(data.image_url);
        addLog('封面生成完成');
        break;
      case 'progressive_audio': {
        const progressiveUrl = `${API_URL}${data.audio_url}`;
        updateProgressiveAudio(progressiveUrl);

        let logMessage;
        if (data.message) {
          logMessage = `✅ ${data.message}`;
        } else if (data.sentence_number) {
          logMessage = `✅ 第 ${data.sentence_number} 句已添加，播客时长: ${Math.round(data.duration_ms / 1000)}秒`;
        } else {
          logMessage = `✅ 开场音频已生成，播客时长: ${Math.round(data.duration_ms / 1000)}秒`;
        }
        addLog(logMessage);
        break;
      }
      case 'complete':
        setAudioUrl(data.audio_url);
        setScriptUrl(data.script_url);
        setIsGenerating(false);
        setProgress('播客生成完成！');
        addLog('🎉 播客生成完成！可以下载了');
        break;
      case 'url_parse_warning':
        addLog(`⚠️ ${data.message}`);
        setUrlWarning({ message: data.message, error_code: data.error_code });
        if (data.error_code === '403') {
          setProgress('网址解析遇到问题，但您可以继续使用其他输入方式');
        }
        break;
      case 'error':
        addLog(`❌ 错误: ${data.message}`);
        setIsGenerating(false);
        setProgress('');
        break;
      default:
        console.log('未知事件类型:', data);
    }
  };

  const handleGenerate = async () => {
    if (!textInput && !urlInput && !pdfFile) {
      alert('请至少提供一种输入内容（文本/网址/PDF）');
      return;
    }

    setLogs([]);
    setScript([]);
    setTraceIds([]);
    setCoverImage('');
    setAudioUrl('');
    setScriptUrl('');
    setPlayer0Url('');
    setPlayer1Url('');
    setActivePlayer(0);
    setUrlWarning(null);
    setIsGenerating(true);

    const formData = new FormData();
    if (textInput) formData.append('text_input', textInput);
    if (urlInput) formData.append('url', urlInput);
    if (pdfFile) formData.append('pdf_file', pdfFile);

    formData.append('speaker1_type', speaker1Type);
    if (speaker1Type === 'default') {
      formData.append('speaker1_voice_name', speaker1Voice);
    } else if (speaker1Audio) {
      formData.append('speaker1_audio', speaker1Audio);
    }

    formData.append('speaker2_type', speaker2Type);
    if (speaker2Type === 'default') {
      formData.append('speaker2_voice_name', speaker2Voice);
    } else if (speaker2Audio) {
      formData.append('speaker2_audio', speaker2Audio);
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/api/generate_podcast`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            const jsonStr = trimmedLine.substring(6);
            if (!jsonStr.trim()) continue;

            try {
              const data = JSON.parse(jsonStr);
              handleSSEEvent(data);
            } catch (e) {
              console.error('解析 SSE 数据失败:', e);
            }
          }
        }
      }

      if (buffer.trim() && buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.substring(6));
          handleSSEEvent(data);
        } catch (e) {
          console.error('解析最后一行 SSE 数据失败:', e);
        }
      }
    } catch (error) {
      console.error('生成播客失败:', error);
      addLog(`错误: ${error.message}`);
      setIsGenerating(false);
    }
  };

  return (
    <div className="podcast-generator">


      <section className="section">
        <h2>📝 输入内容</h2>
        <p className="input-hint">以下三种输入方式可以单独使用或组合使用：</p>
        <div className="input-content">
          <div className="input-group">
            <label className="input-label">💬 话题文本</label>
            <textarea
              placeholder="输入你想讨论的话题..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={5}
            />
          </div>

          <div className="input-group">
            <label className="input-label">🔗 网址链接</label>
            <input
              type="text"
              placeholder="输入网址 URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">📄 上传 PDF</label>
            <div className="file-upload">
              <label htmlFor="pdf-upload" className="upload-label">
                {pdfFile ? `已选择: ${pdfFile.name}` : '点击选择 PDF 文件'}
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handlePdfChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>🎤 选择音色</h2>
        <div className="voice-config">
          <div className="speaker-config">
            <h3>Speaker 1</h3>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={speaker1Type === 'default'}
                  onChange={() => setSpeaker1Type('default')}
                />
                默认音色
              </label>
              {speaker1Type === 'default' && (
                <select value={speaker1Voice} onChange={(e) => setSpeaker1Voice(e.target.value)}>
                  <option value="mini">Mini（女声）</option>
                  <option value="max">Max（男声）</option>
                </select>
              )}
            </div>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={speaker1Type === 'custom'}
                  onChange={() => setSpeaker1Type('custom')}
                />
                自定义音色
              </label>
              {speaker1Type === 'custom' && (
                <div className="file-upload">
                  <label htmlFor="speaker1-audio" className="upload-label">
                    {speaker1Audio ? speaker1Audio.name : '上传音频文件'}
                  </label>
                  <input
                    id="speaker1-audio"
                    type="file"
                    accept=".wav,.mp3,.flac,.m4a"
                    onChange={handleSpeaker1AudioChange}
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="speaker-config">
            <h3>Speaker 2</h3>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={speaker2Type === 'default'}
                  onChange={() => setSpeaker2Type('default')}
                />
                默认音色
              </label>
              {speaker2Type === 'default' && (
                <select value={speaker2Voice} onChange={(e) => setSpeaker2Voice(e.target.value)}>
                  <option value="mini">Mini（女声）</option>
                  <option value="max">Max（男声）</option>
                </select>
              )}
            </div>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  checked={speaker2Type === 'custom'}
                  onChange={() => setSpeaker2Type('custom')}
                />
                自定义音色
              </label>
              {speaker2Type === 'custom' && (
                <div className="file-upload">
                  <label htmlFor="speaker2-audio" className="upload-label">
                    {speaker2Audio ? speaker2Audio.name : '上传音频文件'}
                  </label>
                  <input
                    id="speaker2-audio"
                    type="file"
                    accept=".wav,.mp3,.flac,.m4a"
                    onChange={handleSpeaker2AudioChange}
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <button className="generate-btn" onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? '🎙️ 生成中...' : '🚀 开始生成播客'}
      </button>

      {urlWarning && (
        <div className="warning-box">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <div className="warning-title">网址解析遇到问题</div>
            <div className="warning-message">{urlWarning.message}</div>
            {urlWarning.error_code === '403' && (
              <div className="warning-suggestion">
                💡 <strong>建议操作：</strong>
                <br />
                1. 打开该网址，复制页面中的文本内容
                <br />
                2. 粘贴到上方的"话题文本"输入框中
                <br />
                3. 点击"开始生成播客"继续
              </div>
            )}
          </div>
          <div className="close-warning" onClick={() => setUrlWarning(null)}>×</div>
        </div>
      )}

      {progress && (
        <div className="progress-bar">
          <div className="progress-text">{progress}</div>
        </div>
      )}

      {((player0Url || player1Url || audioUrl) || coverImage) && (
        <div className="player-cover-container">
          {coverImage && (
            <div className="cover-section">
              <h2>🖼️ 播客封面</h2>
              <img src={coverImage} alt="播客封面" className="cover-image" />
            </div>
          )}

          {(player0Url || player1Url || audioUrl) && (
            <div className="player-section">
              <h2>🎧 播客播放器</h2>
              <audio
                ref={audioRef0}
                controls={activePlayer === 0}
                className="audio-player"
                src={player0Url || (audioUrl && activePlayer === 0 ? `${API_URL}${audioUrl}` : '')}
                preload="metadata"
                style={{ display: activePlayer === 0 ? 'block' : 'none' }}
              />
              <audio
                ref={audioRef1}
                controls={activePlayer === 1}
                className="audio-player"
                src={player1Url || (audioUrl && activePlayer === 1 ? `${API_URL}${audioUrl}` : '')}
                preload="metadata"
                style={{ display: activePlayer === 1 ? 'block' : 'none' }}
              />
            </div>
          )}
        </div>
      )}

      {script.length > 0 && (
        <section className="section">
          <h2>📄 对话脚本</h2>
          <div className="script-box">
            {script.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </section>
      )}

      {audioUrl && (
        <div className="download-section">
          <a href={`${API_URL}${audioUrl}`} download className="download-btn">
            ⬇️ 下载音频
          </a>
          {scriptUrl && (
            <a href={`${API_URL}${scriptUrl}`} download className="download-btn">
              ⬇️ 下载脚本
            </a>
          )}
          {coverImage && (
            <a href={`${API_URL}/download/cover?url=${encodeURIComponent(coverImage)}`} download className="download-btn">
              ⬇️ 下载封面
            </a>
          )}
        </div>
      )}

      <section className="section logs-section">
        <h2 onClick={() => setShowLogs(!showLogs)}>
          🔍 详细日志 {showLogs ? '▼' : '▶'}
        </h2>
        {showLogs && (
          <div className="logs-box">
            {logs.map((log, index) => (
              <p key={index}>
                <span className="log-time">[{log.time}]</span> {log.message}
              </p>
            ))}
          </div>
        )}
      </section>

      {traceIds.length > 0 && (
        <div className="trace-ids">
          <h3>Trace IDs</h3>
          {traceIds.map((trace, index) => (
            <p key={index}>
              <strong>{trace.api}:</strong> <code>{trace.traceId}</code>
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default PodcastGenerator;
