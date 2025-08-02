# 高尔夫小程序 - 按钮样式系统

## 项目概述

这是一个微信小程序项目，专门为高尔夫爱好者设计。项目已实现统一的按钮样式系统，提供一致的用户体验。

## 按钮样式系统

### 🎯 系统特点

- **统一设计**：所有按钮使用统一的设计语言
- **模块化**：支持多种按钮类型和尺寸
- **响应式**：适配不同屏幕尺寸
- **易维护**：集中管理，便于修改和扩展

### 📁 文件结构

```
styles/
├── buttons.wxss          # 公共按钮样式系统
├── buttons-usage.md      # 使用说明文档
└── iconfont.wxss         # 图标字体样式

pages/
└── button-test/          # 按钮样式测试页面
    ├── button-test.wxml
    ├── button-test.wxss
    ├── button-test.js
    └── button-test.json
```

### 🎨 按钮类型

#### 基础按钮
- `btn-primary` - 主要按钮（绿色主题）
- `btn-secondary` - 次要按钮（灰色边框）
- `btn-cancel` - 取消按钮
- `btn-confirm` - 确认按钮（蓝色）
- `btn-danger` - 危险按钮（红色）
- `btn-wechat` - 微信风格按钮

#### 特殊按钮
- `btn-operation` - 操作按钮（深色背景）
- `btn-back` - 返回按钮
- `btn-retry` - 重试按钮
- `btn-circle` - 圆形按钮

#### 按钮尺寸
- `btn-small` - 小按钮 (60rpx)
- `btn-medium` - 中等按钮 (80rpx) - 默认
- `btn-large` - 大按钮 (100rpx)

#### 按钮状态
- `disabled` - 禁用状态
- `loading` - 加载状态

#### 按钮布局
- `btn-block` - 全宽按钮
- `btn-group-bottom` - 底部按钮组
- `btn-group-horizontal` - 水平按钮组
- `btn-group-vertical` - 垂直按钮组

### 🚀 快速开始

#### 1. 基础用法

```xml
<!-- 基础按钮 -->
<button class="btn btn-primary">确认</button>

<!-- 带尺寸的按钮 -->
<button class="btn btn-medium btn-primary">中等按钮</button>

<!-- 带状态的按钮 -->
<button class="btn btn-primary loading">加载中...</button>
```

#### 2. 按钮组

```xml
<!-- 底部按钮组 -->
<view class="btn-group-bottom">
  <button class="btn btn-cancel">取消</button>
  <button class="btn btn-confirm">确定</button>
</view>
```

#### 3. 特殊按钮

```xml
<!-- 带emoji的按钮 -->
<button class="btn btn-primary btn-emoji">
  <text class="emoji">🎮</text>
  <text>添加游戏</text>
</button>

<!-- 圆形操作按钮 -->
<button class="btn btn-operation btn-circle">
  <text>+</text>
</button>
```

### 📖 详细文档

查看 `styles/buttons-usage.md` 获取完整的使用指南和迁移说明。

### 🧪 测试页面

访问 `pages/button-test/button-test` 页面查看所有按钮样式的效果。

### 🔧 自定义样式

如需自定义按钮样式，可以：

1. **覆盖现有样式**
```css
.btn-primary {
  background: linear-gradient(135deg, #your-color, #your-color);
}
```

2. **创建新按钮类型**
```css
.btn-custom {
  background-color: #your-color;
  color: #your-text-color;
}
```

### 📱 兼容性

- ✅ 微信小程序
- ✅ 支持 rpx 单位
- ✅ 响应式设计
- ✅ 无障碍访问

### 🎯 最佳实践

1. **类名顺序**：基础类 → 尺寸类 → 类型类 → 状态类
2. **语义化命名**：使用有意义的类名组合
3. **避免重复**：优先使用公共样式，避免重复定义
4. **保持一致性**：在整个项目中保持按钮样式的一致性

### 🔄 迁移指南

项目中的旧按钮样式可以逐步迁移到新的公共样式系统：

1. 确认/取消按钮组 → `btn-group-bottom`
2. 主要操作按钮 → `btn btn-primary`
3. 带emoji的按钮 → `btn btn-emoji`
4. 操作按钮 → `btn btn-operation btn-circle`

**详细迁移指南请查看：** `styles/migration-guide.md`

### 📈 性能优化

- 样式文件全局引入，避免重复加载
- 使用CSS3特性，确保良好性能
- 响应式设计，适配不同设备

### 🤝 贡献指南

1. 遵循现有的样式规范
2. 新增按钮类型时更新文档
3. 保持向后兼容性
4. 测试在不同设备上的显示效果

---

## 项目信息

- **版本**：1.0.0
- **更新时间**：2024年
- **维护者**：开发团队
- **许可证**：MIT

## 联系方式

如有问题或建议，请联系开发团队。

