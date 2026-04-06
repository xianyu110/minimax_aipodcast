import React from 'react';
import './App.css';
import PodcastGenerator from './components/PodcastGenerator';

function App() {
  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🎙️</span>
            <span className="logo-text">AI Podcast</span>
          </div>
          <nav className="nav-links">
            <a href="https://www.minimaxi.com" target="_blank" rel="noopener noreferrer">
              MiniMax API
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            3分钟生成
            <span className="gradient-text">专业播客</span>
          </h1>
          <p className="hero-description">
            输入文本、网址或 PDF，AI 自动生成双人对播播客<br />
            支持自定义音色、实时预览、封面生成
          </p>
          <div className="hero-features">
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>快速生成</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎨</span>
              <span>智能封面</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎤</span>
              <span>多种音色</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="app-main">
        <PodcastGenerator />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-info">
            <p>Powered by <strong>MiniMax AI</strong></p>
            <p>Built with ❤️ using Claude Code</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
