# 未使用后端方法分析器设计文档

## 概述

创建一个 Go 应用，通过 AST 解析分析小程序 API 端点配置与后端 PHP 代码，找出未使用的 Controller 和 Model 方法。

## 目录结构

```
go-clean/
├── main.go                 # 入口，命令行参数处理
├── parser/
│   ├── js_parser.go        # 解析小程序 API 端点配置
│   └── php_parser.go       # 解析 PHP Controller/Model
├── analyzer/
│   ├── endpoint_collector.go   # 收集小程序调用的端点
│   ├── controller_analyzer.go  # 分析 Controller 方法
│   └── model_analyzer.go       # 分析 Model 方法调用链
├── reporter/
│   └── text_reporter.go    # 生成文本报告
└── go.mod
```

## 数据流

1. `js_parser` 解析 `api/modules/*.js` → 提取所有 `/Controller/method` 端点
2. `php_parser` 解析所有 PHP 文件 → 提取类定义、方法定义、方法调用
3. `analyzer` 对比端点与 Controller 方法 → 找出未使用的 Controller 方法
4. `analyzer` 分析所有 PHP 文件中的 Model 调用 → 找出未使用的 Model 方法
5. `reporter` 输出文本报告

## JS 端点解析

### 使用库
`github.com/evanw/esbuild` 的 Go API

### 数据结构

```go
type Endpoint struct {
    Controller   string  // 原始值: "course"
    ControllerNorm string // 标准化: "Course" (首字母大写)
    Method       string  // "getNearestCourses"
    SourceFile   string
    Line         int
}
```

### 解析策略
- 遍历 AST 找到所有 `request('/xxx/yyy', ...)` 调用
- 提取第一个参数（字符串字面量）作为端点路径
- Controller 名称做大小写不敏感匹配

## PHP AST 解析

### 使用库
`github.com/z7zmey/php-parser`

### 数据结构

```go
// PHP 类定义
type PHPClass struct {
    Name       string      // "Game", "MGame"
    File       string      // "Game.php"
    Methods    []PHPMethod
    IsModel    bool        // 根据文件路径或命名判断
}

// PHP 方法定义
type PHPMethod struct {
    Name       string
    Line       int
    Visibility string  // public/private/protected
}

// 方法调用
type MethodCall struct {
    Receiver   string  // "$this->MGame" 或 "$this"
    Method     string  // "getGameidByUUID"
    File       string
    Line       int
}
```

### 解析逻辑
1. 遍历 `controllers/*.php` 和 `models/*.php`
2. 对每个文件构建 AST，提取类定义和方法
3. 遍历方法体，收集所有 `$this->XXX->method()` 形式的调用
4. 区分 Controller 和 Model（通过目录路径判断）

## 分析逻辑

### 未使用的 Controller 方法

```
已使用的 Controller 方法 = JS端点中提取的 {Controller, Method} 集合
Controller 所有 public 方法 = PHP AST 解析得到
未使用 = 所有 public 方法 - 已使用方法
```

注意：只分析 public 方法

### 未使用的 Model 方法

```
已调用的 Model 方法 = 所有 PHP 文件中 $this->ModelName->method() 调用集合
Model 所有 public 方法 = PHP AST 解析得到
未使用 = 所有 public 方法 - 已调用方法
```

### Model 识别规则
- 文件位于 `models/` 目录下
- 或者类名以 `M` 开头（如 `MGame`, `MUser`）

### 调用匹配
- `$this->MGame->xxx()` → 调用了 `MGame` 类的 `xxx` 方法
- 处理 CodeIgniter 的 model 加载方式

## 命令行接口

```bash
./go-clean \
  --api-modules=/path/to/jianghu-weixin/api/modules \
  --controllers=/path/to/jianghu-api/v3/application/controllers \
  --models=/path/to/jianghu-api/v3/application/models
```

## 输出格式

```
================================================
           未使用的后端方法分析报告
================================================

=== 未使用的 Controller 方法 ===

Game.php (Game):
  - oldLegacyMethod        (line 234)
  - deprecatedFunction     (line 456)

Gamble.php (Gamble):
  - unusedHelper           (line 89)

=== 未使用的 Model 方法 ===

MGame.php (MGame):
  - legacyQuery            (line 123)
  - oldCalculation         (line 567)

MUser.php (MUser):
  - deprecatedLookup       (line 45)

================================================
统计: Controller 3个方法, Model 3个方法
================================================
```

## 依赖

- `github.com/evanw/esbuild` - JS AST 解析
- `github.com/z7zmey/php-parser` - PHP AST 解析
