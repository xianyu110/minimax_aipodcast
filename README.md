# 🎙️ MiniMax AI 播客生成器

一个基于 MiniMax API 的 AI 播客生成工具。支持输入文本、网址或 PDF，自动生成双人对谈脚本、语音播客音频和封面图。

## 项目特点

- **前后端分离**：React 前端 + Flask 后端
- **流式生成**：SSE 实时推送，边生成边预览
- **渐进式播放**：生成过程中可平滑切换音频
- **多种输入**：文本、网址、PDF
- **多种音色**：默认音色 / 自定义音色
- **可下载**：音频、脚本、封面一键下载

## 在线部署

### Vercel 前端部署

本项目的前端可以直接部署到 Vercel，但后端需要单独部署。

#### 部署前端
1. 将 GitHub 仓库导入 Vercel
2. 将 **Root Directory** 设置为 `frontend`
3. 构建命令使用 `npm run build`
4. 输出目录使用 `build`

#### 配置后端地址
前端通过环境变量访问后端：

```bash
REACT_APP_API_URL=https://your-backend-domain.com
```

如果后端和前端同域部署，可以留空：

```bash
REACT_APP_API_URL=
```

## 本地运行

### 运行前提
- Python 3.7+
- Node.js 14+
- npm 6+
- ffmpeg（音频处理依赖）

### 启动后端

```bash
pip3 install -r requirements.txt
cd backend
python3 app.py
```

后端默认运行在：

- `http://localhost:5001`

### 启动前端

```bash
cd frontend
npm install
npm start
```

前端默认运行在：

- `http://localhost:3000`

### 一键启动

```bash
./start_all.sh
```

## 目录结构

```text
.
├── backend/                 # Flask 后端
├── frontend/                # React 前端
│   ├── public/
│   └── src/
├── DEPLOYMENT.md            # 部署说明
├── QUICK_START.md           # 快速开始
├── README.md                # 项目说明
└── start_all.sh             # 一键启动脚本
```

## 使用流程

1. 输入 MiniMax API Key
2. 输入话题文本、网址或上传 PDF
3. 选择默认音色或自定义音色
4. 点击生成播客
5. 预览并下载生成结果

## 注意事项

- 网址解析可能受目标站点反爬策略影响
- 自定义音色建议上传清晰、时长足够的音频
- 生产环境建议前端和后端分开部署

## 许可证

本项目仅供学习和研究使用。
