import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import PodcastGenerator from "./components/PodcastGenerator";
import "./App.css";

function AppNav() {
  const { user, logout } = useAuth();
  return (
    <header className="app-header">
      <div className="header-content">
        <a href="/" className="logo" style={{ textDecoration: "none" }}>
          <span className="logo-icon">🎙️</span>
          <span className="logo-text">AI Podcast</span>
        </a>
        <nav className="nav-links">
          {user ? (
            <>
              <a href="/generate">生成播客</a>
              <a href="/dashboard">我的播客</a>
              <button className="nav-logout" onClick={logout}>退出</button>
            </>
          ) : (
            <>
              <a href="/login">登录</a>
              <a href="/register">注册</a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <AppNav />
          <Routes>
            <Route path="/" element={<Navigate to="/generate" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/generate" element={
              <ProtectedRoute><PodcastGenerator /></ProtectedRoute>
            } />
          </Routes>
          <footer className="app-footer">
            <div className="footer-content">
              <div className="footer-info">
                <p>Powered by <strong>MiniMax AI</strong></p>
                <p>Built with ❤️ using Claude Code</p>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
