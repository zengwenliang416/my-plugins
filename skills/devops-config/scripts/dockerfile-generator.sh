#!/bin/bash
# Dockerfile 生成器
# 用法:
#   bash dockerfile-generator.sh --type node --output Dockerfile
#   bash dockerfile-generator.sh --type python --framework fastapi
#   bash dockerfile-generator.sh --type go

set -e

# 默认值
TYPE=""
FRAMEWORK=""
OUTPUT="Dockerfile"
NODE_VERSION="20"
PYTHON_VERSION="3.11"
GO_VERSION="1.21"

# 帮助信息
show_help() {
    echo "Dockerfile 生成器"
    echo ""
    echo "用法:"
    echo "  bash dockerfile-generator.sh --type <type> [options]"
    echo ""
    echo "参数:"
    echo "  --type        项目类型: node, python, go"
    echo "  --framework   框架: express, nestjs, react, fastapi, flask, django, gin"
    echo "  --output      输出文件名 (默认: Dockerfile)"
    echo "  --node-ver    Node.js 版本 (默认: 20)"
    echo "  --python-ver  Python 版本 (默认: 3.11)"
    echo "  --go-ver      Go 版本 (默认: 1.21)"
    echo ""
    echo "示例:"
    echo "  bash dockerfile-generator.sh --type node --framework nestjs"
    echo "  bash dockerfile-generator.sh --type python --framework fastapi"
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --type)
            TYPE="$2"
            shift 2
            ;;
        --framework)
            FRAMEWORK="$2"
            shift 2
            ;;
        --output)
            OUTPUT="$2"
            shift 2
            ;;
        --node-ver)
            NODE_VERSION="$2"
            shift 2
            ;;
        --python-ver)
            PYTHON_VERSION="$2"
            shift 2
            ;;
        --go-ver)
            GO_VERSION="$2"
            shift 2
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

if [ -z "$TYPE" ]; then
    echo "错误: 请指定 --type"
    show_help
    exit 1
fi

# 生成 Node.js Dockerfile
generate_node() {
    local framework="$1"

    cat << 'EOF'
# ============================================
# 多阶段构建 - Node.js 应用
# ============================================

# 构建阶段
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

# 利用 Docker 缓存层
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制源代码并构建
COPY . .
RUN npm run build

# ============================================
# 生产阶段
# ============================================
FROM node:${NODE_VERSION}-alpine AS production

WORKDIR /app

# 安全: 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 只复制必要文件
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "dist/main.js"]
EOF
}

# 生成 Python Dockerfile
generate_python() {
    local framework="$1"

    cat << 'EOF'
# ============================================
# 多阶段构建 - Python 应用
# ============================================

# 构建阶段
FROM python:${PYTHON_VERSION}-slim AS builder

WORKDIR /app

# 安装构建依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ============================================
# 生产阶段
# ============================================
FROM python:${PYTHON_VERSION}-slim AS production

WORKDIR /app

# 安全: 创建非 root 用户
RUN useradd -m -u 1001 appuser

# 复制依赖
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH

# 复制代码
COPY --chown=appuser:appuser . .

# 切换到非 root 用户
USER appuser

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令 (FastAPI)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
}

# 生成 Go Dockerfile
generate_go() {
    cat << 'EOF'
# ============================================
# 多阶段构建 - Go 应用
# ============================================

# 构建阶段
FROM golang:${GO_VERSION}-alpine AS builder

WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache git ca-certificates

# 下载依赖
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码并构建
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w -X main.version=$(git describe --tags --always)" \
    -o main .

# ============================================
# 生产阶段 (使用 scratch 最小化镜像)
# ============================================
FROM alpine:3.18 AS production

WORKDIR /app

# 安装运行时依赖
RUN apk --no-cache add ca-certificates tzdata

# 安全: 创建非 root 用户
RUN adduser -D -u 1001 appuser

# 复制二进制文件
COPY --from=builder --chown=appuser:appuser /app/main .

# 切换到非 root 用户
USER appuser

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# 启动命令
CMD ["./main"]
EOF
}

# 生成 React/Next.js Dockerfile
generate_react() {
    cat << 'EOF'
# ============================================
# 多阶段构建 - React/Next.js 应用
# ============================================

# 依赖安装阶段
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 构建阶段
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置构建时环境变量
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ============================================
# 生产阶段
# ============================================
FROM node:${NODE_VERSION}-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# 安全: 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
EOF
}

echo "=================================================="
echo "Dockerfile 生成器"
echo "=================================================="
echo "类型: $TYPE"
echo "框架: ${FRAMEWORK:-未指定}"
echo "输出: $OUTPUT"
echo ""

# 根据类型生成
case $TYPE in
    node)
        if [ "$FRAMEWORK" = "react" ] || [ "$FRAMEWORK" = "nextjs" ]; then
            generate_react | sed "s/\${NODE_VERSION}/$NODE_VERSION/g" > "$OUTPUT"
        else
            generate_node "$FRAMEWORK" | sed "s/\${NODE_VERSION}/$NODE_VERSION/g" > "$OUTPUT"
        fi
        ;;
    python)
        generate_python "$FRAMEWORK" | sed "s/\${PYTHON_VERSION}/$PYTHON_VERSION/g" > "$OUTPUT"
        ;;
    go)
        generate_go | sed "s/\${GO_VERSION}/$GO_VERSION/g" > "$OUTPUT"
        ;;
    *)
        echo "错误: 不支持的类型 '$TYPE'"
        echo "支持: node, python, go"
        exit 1
        ;;
esac

echo "✅ Dockerfile 已生成: $OUTPUT"
echo ""
echo "后续步骤:"
echo "  1. 根据项目调整构建命令和启动命令"
echo "  2. 配置 .dockerignore 文件"
echo "  3. 构建镜像: docker build -t myapp ."
echo "  4. 运行容器: docker run -p 3000:3000 myapp"
