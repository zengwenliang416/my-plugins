#!/usr/bin/env python3
"""
Kubernetes 资源配置生成器
用法:
  python k8s-generator.py --name myapp --image myregistry/myapp:latest
  python k8s-generator.py --name myapp --image myapp:latest --replicas 3 --port 8080
  python k8s-generator.py --name myapp --image myapp:latest --output k8s/
"""

import argparse
import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class K8sConfig:
    """Kubernetes 配置"""

    name: str
    image: str
    port: int = 3000
    replicas: int = 2
    namespace: str = "default"
    cpu_request: str = "100m"
    cpu_limit: str = "500m"
    memory_request: str = "128Mi"
    memory_limit: str = "512Mi"
    health_path: str = "/health"
    ready_path: str = "/ready"
    env_vars: Optional[dict] = None


def generate_deployment(config: K8sConfig) -> str:
    """生成 Deployment 配置"""
    env_section = ""
    if config.env_vars:
        env_lines = []
        for key, value in config.env_vars.items():
            if value.startswith("secret:"):
                secret_ref = value.replace("secret:", "")
                env_lines.append(
                    f"""            - name: {key}
              valueFrom:
                secretKeyRef:
                  name: {config.name}-secrets
                  key: {secret_ref}"""
                )
            else:
                env_lines.append(
                    f"""            - name: {key}
              value: "{value}" """
                )
        env_section = "\n          env:\n" + "\n".join(env_lines)

    return f"""# Deployment - {config.name}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {config.name}
  namespace: {config.namespace}
  labels:
    app: {config.name}
spec:
  replicas: {config.replicas}
  selector:
    matchLabels:
      app: {config.name}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: {config.name}
    spec:
      serviceAccountName: {config.name}
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
      containers:
        - name: {config.name}
          image: {config.image}
          imagePullPolicy: Always
          ports:
            - name: http
              containerPort: {config.port}
              protocol: TCP{env_section}
          resources:
            requests:
              cpu: {config.cpu_request}
              memory: {config.memory_request}
            limits:
              cpu: {config.cpu_limit}
              memory: {config.memory_limit}
          livenessProbe:
            httpGet:
              path: {config.health_path}
              port: {config.port}
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: {config.ready_path}
              port: {config.port}
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          volumeMounts:
            - name: config
              mountPath: /app/config
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: {config.name}-config
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: {config.name}
                topologyKey: kubernetes.io/hostname
"""


def generate_service(config: K8sConfig) -> str:
    """生成 Service 配置"""
    return f"""# Service - {config.name}
apiVersion: v1
kind: Service
metadata:
  name: {config.name}
  namespace: {config.namespace}
  labels:
    app: {config.name}
spec:
  type: ClusterIP
  selector:
    app: {config.name}
  ports:
    - name: http
      port: 80
      targetPort: {config.port}
      protocol: TCP
"""


def generate_ingress(config: K8sConfig, host: str) -> str:
    """生成 Ingress 配置"""
    return f"""# Ingress - {config.name}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {config.name}
  namespace: {config.namespace}
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
    - hosts:
        - {host}
      secretName: {config.name}-tls
  rules:
    - host: {host}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {config.name}
                port:
                  number: 80
"""


def generate_hpa(
    config: K8sConfig, min_replicas: int = 2, max_replicas: int = 10
) -> str:
    """生成 HorizontalPodAutoscaler 配置"""
    return f"""# HorizontalPodAutoscaler - {config.name}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {config.name}
  namespace: {config.namespace}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {config.name}
  minReplicas: {min_replicas}
  maxReplicas: {max_replicas}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
"""


def generate_configmap(config: K8sConfig) -> str:
    """生成 ConfigMap 配置"""
    return f"""# ConfigMap - {config.name}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {config.name}-config
  namespace: {config.namespace}
data:
  # 添加配置项
  APP_ENV: "production"
  LOG_LEVEL: "info"
"""


def generate_secret(config: K8sConfig) -> str:
    """生成 Secret 配置模板"""
    return f"""# Secret - {config.name}
# 注意: 实际值应通过 CI/CD 或 sealed-secrets 管理
apiVersion: v1
kind: Secret
metadata:
  name: {config.name}-secrets
  namespace: {config.namespace}
type: Opaque
stringData:
  # 示例配置 - 请替换为实际值
  database-url: "postgresql://user:pass@host:5432/db"
  api-key: "your-api-key"
"""


def generate_serviceaccount(config: K8sConfig) -> str:
    """生成 ServiceAccount 配置"""
    return f"""# ServiceAccount - {config.name}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {config.name}
  namespace: {config.namespace}
"""


def generate_pdb(config: K8sConfig) -> str:
    """生成 PodDisruptionBudget 配置"""
    return f"""# PodDisruptionBudget - {config.name}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {config.name}
  namespace: {config.namespace}
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: {config.name}
"""


def generate_all(config: K8sConfig, host: Optional[str] = None) -> str:
    """生成所有配置"""
    sections = [
        generate_serviceaccount(config),
        generate_configmap(config),
        generate_secret(config),
        generate_deployment(config),
        generate_service(config),
        generate_hpa(config),
        generate_pdb(config),
    ]

    if host:
        sections.append(generate_ingress(config, host))

    return "\n---\n".join(sections)


def main():
    parser = argparse.ArgumentParser(description="Kubernetes 资源配置生成器")
    parser.add_argument("--name", type=str, required=True, help="应用名称")
    parser.add_argument("--image", type=str, required=True, help="容器镜像")
    parser.add_argument("--port", type=int, default=3000, help="容器端口")
    parser.add_argument("--replicas", type=int, default=2, help="副本数")
    parser.add_argument("--namespace", type=str, default="default", help="命名空间")
    parser.add_argument("--host", type=str, help="Ingress 主机名")
    parser.add_argument("--output", type=str, help="输出目录")
    parser.add_argument("--single-file", action="store_true", help="输出单个文件")
    args = parser.parse_args()

    config = K8sConfig(
        name=args.name,
        image=args.image,
        port=args.port,
        replicas=args.replicas,
        namespace=args.namespace,
    )

    print("==================================================")
    print("Kubernetes 资源配置生成器")
    print("==================================================")
    print(f"应用名称: {config.name}")
    print(f"镜像: {config.image}")
    print(f"端口: {config.port}")
    print(f"副本数: {config.replicas}")
    print(f"命名空间: {config.namespace}")
    print("")

    if args.output:
        os.makedirs(args.output, exist_ok=True)

        if args.single_file:
            # 输出单个文件
            output_path = os.path.join(args.output, f"{config.name}.yaml")
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(generate_all(config, args.host))
            print(f"✅ 配置已保存: {output_path}")
        else:
            # 输出多个文件
            files = {
                "serviceaccount.yaml": generate_serviceaccount(config),
                "configmap.yaml": generate_configmap(config),
                "secret.yaml": generate_secret(config),
                "deployment.yaml": generate_deployment(config),
                "service.yaml": generate_service(config),
                "hpa.yaml": generate_hpa(config),
                "pdb.yaml": generate_pdb(config),
            }

            if args.host:
                files["ingress.yaml"] = generate_ingress(config, args.host)

            for filename, content in files.items():
                filepath = os.path.join(args.output, filename)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"✅ 已生成: {filepath}")

        print("")
        print("后续步骤:")
        print(f"  1. 检查并修改配置文件")
        print(f"  2. 创建命名空间: kubectl create namespace {config.namespace}")
        print(f"  3. 应用配置: kubectl apply -f {args.output}/")
        print(f"  4. 检查状态: kubectl get pods -n {config.namespace}")
    else:
        # 输出到标准输出
        print(generate_all(config, args.host))


if __name__ == "__main__":
    main()
