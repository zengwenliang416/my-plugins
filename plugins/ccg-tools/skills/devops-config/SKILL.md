---
name: devops-config
description: |
  生成 DevOps 配置文件（Dockerfile、docker-compose、GitHub Actions、K8s manifests）。
  当用户要求容器化、CI/CD 流水线或 Kubernetes 部署时触发。
  先问项目语言、运行时、部署目标，再选择模板。
  不触发：纯本地脚本、非容器化部署。
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# DevOps 配置生成

## 决策入口

在生成配置前，必须确认以下问题：

1. **项目语言/运行时**：Node.js / Python / Go / Java / Rust？
2. **部署目标**：本地 Docker / K8s / 云服务（AWS/GCP/Azure）？
3. **CI/CD 平台**：GitHub Actions / GitLab CI / Jenkins？
4. **环境数量**：dev / staging / prod？
5. **特殊需求**：多阶段构建？私有仓库？Secrets 管理？

## 推荐流程

```
1. 检测项目结构 → 识别语言和依赖管理方式
2. 确认部署目标 → 选择对应模板类别
3. 生成配置文件 → 从 references/templates.md 选取模板
4. 定制化调整   → 根据项目需求修改
5. 本地验证     → 运行 lint/build 测试
```

## 模板索引

详细模板请参考 `references/templates.md`：

| 类别           | 模板       | 适用场景                       |
| -------------- | ---------- | ------------------------------ |
| Dockerfile     | 多阶段构建 | Node/Python/Go 生产镜像        |
| docker-compose | 开发环境   | 本地多服务编排                 |
| GitHub Actions | CI/CD      | 构建、测试、部署流水线         |
| K8s manifests  | 部署       | Deployment + Service + Ingress |

## 本地验证清单

- [ ] Dockerfile: `docker build --no-cache -t test .`
- [ ] docker-compose: `docker-compose config`
- [ ] GitHub Actions: `act -l` 或 `actionlint`
- [ ] K8s: `kubectl apply --dry-run=client -f .`

## 安全检查

- 禁止硬编码 secrets，使用环境变量或 Secrets Manager
- 镜像使用固定版本 tag，避免 `latest`
- 最小权限原则配置 RBAC
