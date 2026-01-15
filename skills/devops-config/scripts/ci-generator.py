#!/usr/bin/env python3
"""
CI/CD 配置生成器
用法:
  python ci-generator.py --platform github --type node
  python ci-generator.py --platform gitlab --type python --output .gitlab-ci.yml
"""

import argparse
import os


def generate_github_node() -> str:
    """生成 GitHub Actions Node.js 配置"""
    return """# GitHub Actions - Node.js CI/CD
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ============================================
  # 代码检查
  # ============================================
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

  # ============================================
  # 测试
  # ============================================
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  # ============================================
  # 构建和推送镜像
  # ============================================
  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix=
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ============================================
  # 部署到 Staging
  # ============================================
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          echo "Deploying to staging..."
          # kubectl set image deployment/app app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

  # ============================================
  # 部署到 Production
  # ============================================
  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # kubectl set image deployment/app app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
"""


def generate_github_python() -> str:
    """生成 GitHub Actions Python 配置"""
    return """# GitHub Actions - Python CI/CD
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ============================================
  # 代码检查
  # ============================================
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install ruff mypy

      - name: Lint with ruff
        run: ruff check .

      - name: Type check with mypy
        run: mypy . --ignore-missing-imports

  # ============================================
  # 测试
  # ============================================
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio

      - name: Run tests
        run: pytest --cov=. --cov-report=xml
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  # ============================================
  # 构建和推送镜像
  # ============================================
  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix=
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ============================================
  # 部署
  # ============================================
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          echo "Deploying to production..."
"""


def generate_gitlab_node() -> str:
    """生成 GitLab CI Node.js 配置"""
    return """# GitLab CI/CD - Node.js
stages:
  - lint
  - test
  - build
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  NODE_VERSION: "20"

# ============================================
# 代码检查
# ============================================
lint:
  stage: lint
  image: node:${NODE_VERSION}-alpine
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run lint
    - npm run type-check
  only:
    - merge_requests
    - main
    - develop

# ============================================
# 测试
# ============================================
test:
  stage: test
  image: node:${NODE_VERSION}-alpine
  services:
    - postgres:15
  variables:
    POSTGRES_DB: test
    POSTGRES_PASSWORD: postgres
    DATABASE_URL: postgresql://postgres:postgres@postgres:5432/test
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
  script:
    - npm ci
    - npm test -- --coverage
  coverage: '/All files[^|]*\\|[^|]*\\s+([\\d\\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  only:
    - merge_requests
    - main
    - develop

# ============================================
# 构建镜像
# ============================================
build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
    - |
      if [ "$CI_COMMIT_BRANCH" = "main" ]; then
        docker tag $DOCKER_IMAGE $CI_REGISTRY_IMAGE:latest
        docker push $CI_REGISTRY_IMAGE:latest
      fi
  only:
    - main
    - develop

# ============================================
# 部署到 Staging
# ============================================
deploy-staging:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: staging
    url: https://staging.example.com
  script:
    - kubectl config use-context staging
    - kubectl set image deployment/app app=$DOCKER_IMAGE
    - kubectl rollout status deployment/app
  only:
    - develop

# ============================================
# 部署到 Production
# ============================================
deploy-production:
  stage: deploy
  image: bitnami/kubectl:latest
  environment:
    name: production
    url: https://example.com
  script:
    - kubectl config use-context production
    - kubectl set image deployment/app app=$DOCKER_IMAGE
    - kubectl rollout status deployment/app
  when: manual
  only:
    - main
"""


def generate_gitlab_python() -> str:
    """生成 GitLab CI Python 配置"""
    return """# GitLab CI/CD - Python
stages:
  - lint
  - test
  - build
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  PYTHON_VERSION: "3.11"
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

# ============================================
# 代码检查
# ============================================
lint:
  stage: lint
  image: python:${PYTHON_VERSION}-slim
  cache:
    paths:
      - .cache/pip
  before_script:
    - pip install ruff mypy
  script:
    - ruff check .
    - mypy . --ignore-missing-imports
  only:
    - merge_requests
    - main
    - develop

# ============================================
# 测试
# ============================================
test:
  stage: test
  image: python:${PYTHON_VERSION}-slim
  services:
    - postgres:15
  variables:
    POSTGRES_DB: test
    POSTGRES_PASSWORD: postgres
    DATABASE_URL: postgresql://postgres:postgres@postgres:5432/test
  cache:
    paths:
      - .cache/pip
  before_script:
    - pip install -r requirements.txt
    - pip install pytest pytest-cov pytest-asyncio
  script:
    - pytest --cov=. --cov-report=xml --cov-report=term
  coverage: '/TOTAL.*\\s+(\\d+%)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
  only:
    - merge_requests
    - main
    - develop

# ============================================
# 构建镜像
# ============================================
build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
    - |
      if [ "$CI_COMMIT_BRANCH" = "main" ]; then
        docker tag $DOCKER_IMAGE $CI_REGISTRY_IMAGE:latest
        docker push $CI_REGISTRY_IMAGE:latest
      fi
  only:
    - main
    - develop

# ============================================
# 部署
# ============================================
deploy-staging:
  stage: deploy
  environment:
    name: staging
  script:
    - echo "Deploying to staging..."
  only:
    - develop

deploy-production:
  stage: deploy
  environment:
    name: production
  script:
    - echo "Deploying to production..."
  when: manual
  only:
    - main
"""


GENERATORS = {
    ("github", "node"): generate_github_node,
    ("github", "python"): generate_github_python,
    ("gitlab", "node"): generate_gitlab_node,
    ("gitlab", "python"): generate_gitlab_python,
}


def main():
    parser = argparse.ArgumentParser(description="CI/CD 配置生成器")
    parser.add_argument(
        "--platform",
        type=str,
        choices=["github", "gitlab"],
        required=True,
        help="CI/CD 平台",
    )
    parser.add_argument(
        "--type",
        type=str,
        choices=["node", "python"],
        required=True,
        help="项目类型",
    )
    parser.add_argument("--output", type=str, help="输出文件路径")
    args = parser.parse_args()

    key = (args.platform, args.type)
    if key not in GENERATORS:
        print(f"错误: 不支持的组合 {args.platform} + {args.type}")
        exit(1)

    content = GENERATORS[key]()

    # 默认输出路径
    if not args.output:
        if args.platform == "github":
            args.output = ".github/workflows/ci-cd.yml"
        else:
            args.output = ".gitlab-ci.yml"

    print("==================================================")
    print("CI/CD 配置生成器")
    print("==================================================")
    print(f"平台: {args.platform}")
    print(f"类型: {args.type}")
    print(f"输出: {args.output}")
    print("")

    # 创建目录
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ 配置已生成: {args.output}")
    print("")
    print("后续步骤:")
    print("  1. 检查并根据项目需求调整配置")
    print("  2. 配置必要的 Secrets (CODECOV_TOKEN, SLACK_WEBHOOK 等)")
    print("  3. 提交配置文件到仓库")


if __name__ == "__main__":
    main()
