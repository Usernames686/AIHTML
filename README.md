# AIHTML

AIHTML 是一个专注于“AI 生成 HTML 网页幻灯片”的轻量化网站。项目基于 Presenton 精简改造，保留模型调用、页面生成和预览能力，去掉了不需要的 PPTX/复杂初始化流程，让用户输入主题后即可生成可预览、可复制、可下载的单文件 HTML 幻灯片。

在线访问：

```text
http://64.90.14.72:5000/slidecraft
```

## 主要特点

- **只生成 HTML 网页幻灯片**：输出为自包含 HTML，适合浏览器演示、网页发布、二次编辑和归档。
- **接入 OpenAI 兼容模型 API**：支持在网页里配置后端模型 API，也支持通过环境变量配置。
- **多种中文风格可选**：网站内使用中文风格名，覆盖极简演讲、科技分享、产品发布、商业路演、周报总结、小红书图文、知识图谱、蓝图架构、暗色终端、杂志风等方向。
- **生成后直接预览**：生成完成后可在页面中立即预览，也可以进入全屏查看。
- **便于使用生成结果**：支持复制 HTML、下载 HTML、刷新预览和查看错误预览。
- **适合 Windows 和 Linux**：本地开发可分别启动前后端，生产部署推荐 Docker。
- **保留持久化配置**：模型配置和生成数据默认写入 `app_data` / `user_data`，重启容器后仍可保留。

## 快速部署

推荐使用 Docker Compose：

```bash
docker compose up -d --build production
```

启动后打开：

```text
http://localhost:5000/slidecraft
```

如果部署在服务器上，默认端口是 `5000`：

```text
http://服务器IP:5000/slidecraft
```

## 模型 API 配置

### 方式一：在网站中配置

进入 `/slidecraft` 页面后，点击页面里的“后端模型 API”配置入口，填写：

- API 地址，例如 `http://your-api-host:8317/v1`
- API Key
- 模型名称，例如 `gpt-5.5`

配置会保存到数据目录，后续生成会自动读取。

### 方式二：使用环境变量

也可以在启动 Docker 前设置环境变量：

```env
LLM=custom
CUSTOM_LLM_URL=http://your-api-host:8317/v1
CUSTOM_LLM_API_KEY=your-api-key
CUSTOM_MODEL=gpt-5.5
CAN_CHANGE_KEYS=true
DISABLE_AUTH=true
DISABLE_IMAGE_GENERATION=true
```

OpenAI 官方接口也可以使用：

```env
LLM=openai
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
CAN_CHANGE_KEYS=true
DISABLE_AUTH=true
DISABLE_IMAGE_GENERATION=true
```

## 本地开发

### 1. 启动后端

```bash
cd servers/fastapi
uv sync
python server.py --port 8000 --reload true
```

Windows PowerShell 可先设置本地数据目录：

```powershell
$env:APP_DATA_DIRECTORY="D:\codex\presenton\app_data"
$env:TEMP_DIRECTORY="D:\codex\presenton\user_data"
$env:USER_CONFIG_PATH="D:\codex\presenton\user_data\user_config.json"
$env:DISABLE_AUTH="true"
```

Linux/macOS 可使用：

```bash
export APP_DATA_DIRECTORY="$PWD/app_data"
export TEMP_DIRECTORY="$PWD/user_data"
export USER_CONFIG_PATH="$PWD/user_data/user_config.json"
export DISABLE_AUTH=true
```

### 2. 启动前端

```bash
cd servers/nextjs
npm install
npm run dev
```

如果前端需要直连本地后端，可设置：

```env
NEXT_PUBLIC_FAST_API=http://localhost:8000
```

然后访问：

```text
http://localhost:3000/slidecraft
```

## 生成文件会保存吗

网站页面会保留当前生成结果，并支持复制或下载 HTML。服务端配置和运行数据会保存在：

- Docker 部署：`app_data`
- 本地开发：`app_data` 和 `user_data`

如果要长期保存某次生成结果，建议直接点击下载 HTML，或复制生成的 HTML 内容保存为 `.html` 文件。

## 项目结构

```text
AIHTML
├── docker-compose.yml
├── Dockerfile
├── app_data/                         # 生产部署数据目录
├── user_data/                        # 本地开发数据目录
├── docs/                             # 项目说明文档
├── servers/
│   ├── fastapi/                      # 后端 API 与模型调用
│   │   └── api/v1/ppt/endpoints/
│   │       └── slidecraft.py          # HTML 幻灯片生成接口
│   └── nextjs/                       # 前端页面
│       └── app/(presentation-generator)/(dashboard)/slidecraft/
│           └── SlideCraftWorkbench.tsx
└── README.md
```

## Docker 镜像为什么比源码大

源码清理后体积较小，但 Docker 镜像会包含：

- Node.js 运行环境和前端依赖
- Python 运行环境和后端依赖
- Next.js 构建产物
- 系统级依赖、字体、图片处理库等

因此源码可能只有几十 MB，而完整 Docker 镜像达到 GB 级是正常现象。部署时可定期清理构建缓存：

```bash
docker builder prune
docker image prune
```

## 常用命令

重新构建并启动生产服务：

```bash
docker compose up -d --build production
```

查看容器状态：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f production
```

停止服务：

```bash
docker compose down
```

## 许可

本项目继承 Presenton 的 Apache-2.0 许可证。详见 [LICENSE](./LICENSE)。
