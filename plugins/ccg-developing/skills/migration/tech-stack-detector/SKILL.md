---
name: tech-stack-detector
description: |
  【触发条件】检测项目技术栈时使用
  【核心产出】${run_dir}/context/tech-stack.json
  【不触发】已知技术栈、单独检测某个框架
allowed-tools: Read, Bash, Grep, Glob
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Tech Stack Detector - 技术栈检测器

## 职责边界

- **输入**: 项目根路径
- **输出**: `.claude/migration/context/tech-stack.json`
- **核心能力**: 识别语言、框架、构建工具、数据库

## 执行流程

### Step 1: 识别构建系统

**JavaScript/TypeScript**:

```bash
if [ -f "package.json" ]; then
  language="JavaScript/TypeScript"
  buildTool=$(detect package-lock.json → npm, yarn.lock → yarn, pnpm-lock.yaml → pnpm)
fi
```

**Java**:

```bash
if [ -f "pom.xml" ]; then
  language="Java"
  buildTool="Maven"
  javaVersion=$(grep -A2 "<maven.compiler.source>" pom.xml | extract_version)
elif [ -f "build.gradle" ]; then
  language="Java"
  buildTool="Gradle"
  javaVersion=$(grep "sourceCompatibility" build.gradle | extract_version)
elif [ -f "build.xml" ]; then
  language="Java"
  buildTool="Ant (Legacy)"
fi
```

**Python**:

```bash
if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  language="Python"
  pythonVersion=$(python --version 2>&1 | extract_version)
fi
```

**Go**:

```bash
if [ -f "go.mod" ]; then
  language="Go"
  goVersion=$(grep "^go " go.mod | extract_version)
fi
```

### Step 2: 检测框架（多语言支持）

**Java 框架检测**:

```bash
# Spring Framework
if grep -q "spring-webmvc" pom.xml; then
  framework="Spring MVC"
  version=$(extract_spring_version)
  config_type=$(detect_spring_config)  # XML vs Annotation
fi

# Spring Boot
if grep -q "spring-boot-starter" pom.xml; then
  framework="Spring Boot"
  version=$(grep -A1 "spring-boot-starter-parent" pom.xml | extract_version)
fi

# Hibernate
if grep -q "hibernate-core" pom.xml; then
  orm="Hibernate"
  version=$(grep "hibernate-core" pom.xml | extract_version)
fi

# Struts (Legacy)
if grep -q "struts" pom.xml; then
  framework="Apache Struts"
  legacy_warning="true"
fi

# JavaEE/JakartaEE
if grep -rq "javax.servlet" src/; then
  servlet_version="JavaEE"
elif grep -rq "jakarta.servlet" src/; then
  servlet_version="JakartaEE"
fi
```

**JavaScript 框架检测**:

```bash
# React
if grep -q "\"react\":" package.json; then
  frontend="React"
  version=$(jq -r '.dependencies.react' package.json)
fi

# Express
if grep -q "\"express\":" package.json; then
  backend="Express"
  version=$(jq -r '.dependencies.express' package.json)
fi
```

**Python 框架检测**:

```bash
# Django
if grep -q "Django" requirements.txt; then
  framework="Django"
fi

# Flask
if grep -q "Flask" requirements.txt; then
  framework="Flask"
fi
```

### Step 3: 识别数据库

```bash
# Java - 从 pom.xml 或 application.properties
database=$(detect_database_from_dependencies)

# JavaScript - 从 package.json
database=$(detect_database_from_npm_packages)

# 通用 - 从配置文件
if [ -f "application.properties" ]; then
  db_url=$(grep "spring.datasource.url" application.properties)
  database=$(extract_db_type_from_url "$db_url")  # mysql, postgresql, oracle
fi
```

### Step 4: 检测应用服务器（Java 特定）

```bash
# WAR 打包 → 外部容器
if grep -q "<packaging>war</packaging>" pom.xml; then
  packaging="WAR"
  app_server=$(detect_app_server)  # Tomcat, WebLogic, WebSphere
fi

# JAR 打包 → 内嵌容器
if grep -q "<packaging>jar</packaging>" pom.xml; then
  packaging="JAR"
  embedded_server=$(grep "spring-boot-starter-" pom.xml | extract_embedded_server)
fi
```

### Step 5: 生成 tech-stack.json

**Java 项目输出示例**:

```json
{
  "language": "Java",
  "version": "8",
  "buildTool": "Maven",
  "buildFiles": ["pom.xml"],
  "frameworks": {
    "backend": [
      {
        "name": "Spring Framework",
        "version": "4.3.25",
        "eol": "2020-12-31",
        "status": "end-of-life"
      },
      {
        "name": "Hibernate",
        "version": "5.2.17",
        "modules": ["hibernate-core", "hibernate-validator"]
      }
    ],
    "web": [
      {
        "name": "Spring MVC",
        "version": "4.3.25",
        "configType": "XML"
      }
    ],
    "database": [
      {
        "driver": "MySQL Connector/J",
        "version": "5.1.47",
        "type": "MySQL"
      }
    ]
  },
  "architecture": "Monolithic MVC",
  "packaging": "WAR",
  "appServer": "Tomcat 8.5",
  "configFiles": [
    "src/main/resources/applicationContext.xml",
    "src/main/resources/application.properties"
  ]
}
```

**JavaScript 项目输出示例**:

```json
{
  "language": "JavaScript",
  "runtime": "Node.js",
  "version": "14.17.0",
  "buildTool": "npm",
  "frameworks": {
    "frontend": [
      {
        "name": "React",
        "version": "17.0.2"
      }
    ],
    "backend": [
      {
        "name": "Express",
        "version": "4.17.1"
      }
    ],
    "database": [
      {
        "name": "MongoDB",
        "driver": "mongoose",
        "version": "5.13.2"
      }
    ]
  },
  "architecture": "SPA + REST API"
}
```

## Gate 检查

- [x] 构建工具已识别（Maven/Gradle/npm/yarn/pnpm）
- [x] 语言版本已确定
- [x] 核心框架已识别
- [x] 数据库类型已检测
- [x] 输出文件格式正确（JSON valid）

**失败处理**: 如果构建文件不存在或无法解析，返回 `"unknown"` 并要求用户手动确认

## 返回值

```json
{
  "status": "success",
  "tech_stack_file": ".claude/migration/context/tech-stack.json",
  "summary": {
    "language": "Java 8",
    "primary_framework": "Spring MVC 4.3",
    "build_tool": "Maven",
    "architecture": "Monolithic"
  }
}
```
