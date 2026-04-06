import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchGenerations } from "../api/client";
import "./DashboardPage.css";

export default function DashboardPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchGenerations();
        setItems(data.items || []);
      } catch (e) {
        console.error("Failed to fetch generations:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const statusMap = {
    processing: { label: "生成中", cls: "status-processing" },
    completed: { label: "已完成", cls: "status-completed" },
    error: { label: "失败", cls: "status-error" },
    queued: { label: "排队中", cls: "status-queued" },
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>我的播客</h1>
        <Link to="/generate" className="btn-new">
          + 新建播客
        </Link>
      </div>

      {loading ? (
        <div className="dashboard-loading">加载中...</div>
      ) : items.length === 0 ? (
        <div className="dashboard-empty">
          <p>还没有生成过播客</p>
          <Link to="/generate">去生成第一个播客</Link>
        </div>
      ) : (
        <div className="job-list">
          {items.map((job) => {
            const st = statusMap[job.status] || statusMap.queued;
            return (
              <div key={job.id} className="job-card">
                <div className="job-top">
                  <div className="job-info">
                    <h3 className="job-title">{job.title || "未命名"}</h3>
                    <span className={`job-status ${st.cls}`}>{st.label}</span>
                  </div>
                  <span className="job-date">{formatDate(job.created_at)}</span>
                </div>
                <div className="job-meta">
                  <span>{job.source_type || "text"}</span>
                  <span>{job.speaker1_voice || "-"} / {job.speaker2_voice || "-"}</span>
                  {job.duration_seconds && <span>{Math.round(job.duration_seconds / 60)}分钟</span>}
                </div>
                {job.status === "completed" && (
                  <div className="job-actions">
                    {job.audio_path && (
                      <a href={`${process.env.REACT_APP_API_URL || ""}/api/generations/${job.id}/audio`} className="job-action-btn">
                        下载音频
                      </a>
                    )}
                    {job.script_path && (
                      <a href={`${process.env.REACT_APP_API_URL || ""}/api/generations/${job.id}/script`} className="job-action-btn">
                        下载脚本
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
