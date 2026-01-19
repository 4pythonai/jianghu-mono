# 微信小程序绿色主题颜色变量使用指南

## 概述

本项目已建立完整的绿色主题色彩系统，通过 CSS 变量实现统一的颜色管理。所有颜色变量定义在 `app.wxss` 的 `page` 选择器中，可在整个小程序中使用。

## 颜色变量分类

### 1. 主色调 - 绿色系

```css
--primary-green: #4caf50;        /* 主绿色 - 用于主要按钮、重要元素 */
--primary-green-light: #66bb6a; /* 浅绿色 - 用于悬停状态 */
--primary-green-dark: #388e3c;   /* 深绿色 - 用于按下状态 */
--primary-green-darker: #2e7d32; /* 更深绿色 - 用于强调 */
```

### 2. 辅助绿色

```css
--secondary-green: #81c784;      /* 辅助绿色 - 边框、装饰 */
--accent-green: #a5d6a7;        /* 强调绿色 - 次要元素 */
--light-green: #c8e6c9;         /* 浅绿色 - 背景色 */
--pale-green: #e8f5e8;          /* 极浅绿色 - 悬停背景 */
```

### 3. 渐变色

```css
--gradient-primary: linear-gradient(135deg, #4caf50, #45a049);
--gradient-primary-hover: linear-gradient(135deg, #45a049, #3d8b40);
--gradient-light: linear-gradient(135deg, #66bb6a, #4caf50);
```

### 4. 阴影色

```css
--shadow-primary: rgba(76, 175, 80, 0.3);
--shadow-primary-hover: rgba(76, 175, 80, 0.4);
--shadow-light: rgba(76, 175, 80, 0.12);
```

### 5. 边框色

```css
--border-primary: #4caf50;
--border-primary-light: #81c784;
--border-light: #e0e0e0;
--border-focus: #4caf50;
```

### 6. 背景色系统

```css
--bg-primary: #4caf50;           /* 主背景 */
--bg-secondary: #f9fbfa;        /* 页面背景 */
--bg-card: #ffffff;              /* 卡片背景 */
--bg-light: #f8f9fa;            /* 浅背景 */
--bg-hover: #e8f5e8;            /* 悬停背景 */
--bg-disabled: #f5f5f5;         /* 禁用背景 */
```

### 7. 文字色系统

```css
--text-primary: #333333;        /* 主要文字 */
--text-secondary: #666666;      /* 次要文字 */
--text-tertiary: #999999;        /* 三级文字 */
--text-disabled: #cccccc;        /* 禁用文字 */
--text-white: #ffffff;           /* 白色文字 */
--text-on-primary: #ffffff;      /* 主色上的文字 */
```

### 8. 状态色

```css
--success: #4caf50;              /* 成功色 */
--warning: #ff9800;              /* 警告色 */
--error: #f44336;                /* 错误色 */
--info: #2196f3;                 /* 信息色 */
```

## 使用示例

### 按钮样式

```css
/* 主要按钮 */
.btn-primary {
    background: var(--gradient-primary);
    color: var(--text-on-primary);
    box-shadow: 0 4rpx 12rpx var(--shadow-primary);
}

.btn-primary:active {
    background: var(--gradient-primary-hover);
    box-shadow: 0 2rpx 8rpx var(--shadow-primary-hover);
}

/* 次要按钮 */
.btn-secondary {
    background-color: var(--bg-card);
    color: var(--text-primary);
    border: 2rpx solid var(--border-light);
}
```

组件中复用按钮样式与类名组合规则请参考 `jianghu-weixin/docs/button-style-guide.md`。

### 卡片样式

```css
.card {
    background: var(--bg-card);
    border: 1rpx solid var(--border-primary-light);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}
```

### 输入框样式

```css
.form-input {
    background: var(--bg-light);
    border: 2rpx solid var(--border-light);
    color: var(--text-primary);
}

.form-input:focus {
    border-color: var(--border-focus);
    background: var(--bg-card);
}
```

### 文字样式

```css
.title {
    color: var(--text-primary);
}

.subtitle {
    color: var(--text-secondary);
}

.description {
    color: var(--text-tertiary);
}
```

## 最佳实践

### 1. 优先使用语义化变量

```css
/* ✅ 推荐 */
background-color: var(--bg-card);
color: var(--text-primary);

/* ❌ 不推荐 */
background-color: #ffffff;
color: #333333;
```

### 2. 使用渐变变量

```css
/* ✅ 推荐 */
background: var(--gradient-primary);

/* ❌ 不推荐 */
background: linear-gradient(135deg, #4caf50, #45a049);
```

### 3. 状态变化使用对应变量

```css
/* ✅ 推荐 */
.btn:active {
    background: var(--gradient-primary-hover);
    box-shadow: 0 2rpx 8rpx var(--shadow-primary-hover);
}
```

### 4. 保持一致性

- 所有绿色元素使用 `--primary-green` 系列
- 所有背景使用 `--bg-*` 系列
- 所有文字使用 `--text-*` 系列

## 主题切换

如需切换主题，只需修改 `app.wxss` 中的变量值即可：

```css
page {
    /* 切换到蓝色主题 */
    --primary-green: #2196f3;
    --primary-green-light: #42a5f5;
    --primary-green-dark: #1976d2;
    /* ... 其他颜色相应调整 */
}
```

## 兼容性说明

项目保留了旧变量名以确保向后兼容：

```css
--theme-color: var(--primary-green);
--common-bg: var(--bg-secondary);
--card-bg: var(--bg-card);
/* ... 等等 */
```

## 注意事项

1. 所有颜色变量都在 `page` 选择器中定义，确保全局可用
2. 使用 `var()` 函数引用变量
3. 变量名采用语义化命名，便于理解和维护
4. 新增颜色时请遵循现有的命名规范
5. 避免在组件中硬编码颜色值

## 更新日志

- 2024-01-XX: 建立完整的绿色主题色彩系统
- 更新了按钮、卡片、模态框等组件的颜色变量使用
- 保持了向后兼容性
