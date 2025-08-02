# 公共按钮样式使用指南

## 概述
本项目已统一按钮样式系统，所有按钮样式都定义在 `styles/buttons.wxss` 中，并在 `app.wxss` 中全局引入。

## 基础用法

### 1. 基础按钮类
所有按钮都需要添加 `btn` 基础类：

```xml
<button class="btn">基础按钮</button>
```

### 2. 按钮尺寸
- `btn-small`: 小按钮 (60rpx 高度)
- `btn-medium`: 中等按钮 (80rpx 高度) - 默认
- `btn-large`: 大按钮 (100rpx 高度)

```xml
<button class="btn btn-small">小按钮</button>
<button class="btn btn-medium">中等按钮</button>
<button class="btn btn-large">大按钮</button>
```

### 3. 按钮类型

#### 主要按钮 (绿色主题)
```xml
<button class="btn btn-primary">确认</button>
```

#### 次要按钮 (灰色边框)
```xml
<button class="btn btn-secondary">次要操作</button>
```

#### 取消按钮
```xml
<button class="btn btn-cancel">取消</button>
```

#### 确认按钮 (蓝色)
```xml
<button class="btn btn-confirm">确定</button>
```

#### 危险按钮 (红色)
```xml
<button class="btn btn-danger">删除</button>
```

#### 微信绿色按钮
```xml
<button class="btn btn-wechat">微信风格</button>
```

### 4. 按钮状态

#### 禁用状态
```xml
<button class="btn btn-primary" disabled>禁用按钮</button>
```

#### 加载状态
```xml
<button class="btn btn-primary loading">加载中...</button>
```

### 5. 按钮布局

#### 全宽按钮
```xml
<button class="btn btn-primary btn-block">全宽按钮</button>
```

#### 圆形按钮
```xml
<button class="btn btn-circle btn-operation">
  <text>+</text>
</button>
```

### 6. 按钮组

#### 底部按钮组
```xml
<view class="btn-group-bottom">
  <button class="btn btn-cancel">取消</button>
  <button class="btn btn-confirm">确定</button>
</view>
```

#### 水平按钮组
```xml
<view class="btn-group-horizontal">
  <button class="btn btn-cancel">取消</button>
  <button class="btn btn-confirm">确定</button>
</view>
```

### 7. 特殊按钮

#### 带图标的按钮
```xml
<button class="btn btn-primary btn-icon">
  <image class="icon" src="/images/icon.png"></image>
  <text>带图标按钮</text>
</button>
```

#### 带emoji的按钮
```xml
<button class="btn btn-primary btn-emoji">
  <text class="emoji">🎮</text>
  <text>添加游戏</text>
</button>
```

#### 操作按钮 (深色)
```xml
<button class="btn btn-operation btn-circle">
  <text>+</text>
</button>
```

#### 返回按钮
```xml
<button class="btn btn-back">返回</button>
```

#### 重试按钮
```xml
<button class="btn btn-retry">重试</button>
```

## 迁移指南

### 从旧样式迁移到新样式

#### 1. 确认/取消按钮组
**旧样式:**
```xml
<view class="bottom-buttons">
  <button class="cancel-btn">取消</button>
  <button class="confirm-btn">确定</button>
</view>
```

**新样式:**
```xml
<view class="btn-group-bottom">
  <button class="btn btn-cancel">取消</button>
  <button class="btn btn-confirm">确定</button>
</view>
```

#### 2. 主要操作按钮
**旧样式:**
```xml
<button class="create-btn">开始计分</button>
```

**新样式:**
```xml
<button class="btn btn-primary btn-large">开始计分</button>
```

#### 3. 带emoji的按钮
**旧样式:**
```xml
<button class="add-game-button">
  <text class="button-emoji">🎮</text>
  <text class="button-text">添加游戏</text>
</button>
```

**新样式:**
```xml
<button class="btn btn-primary btn-emoji btn-block">
  <text class="emoji">🎮</text>
  <text>添加游戏</text>
</button>
```

#### 4. 操作按钮
**旧样式:**
```xml
<button class="btn-add">
  <image class="btn-icon" src="/images/add.png"></image>
</button>
```

**新样式:**
```xml
<button class="btn btn-operation btn-circle">
  <image class="icon" src="/images/add.png"></image>
</button>
```

## 最佳实践

### 1. 类名组合
- 基础类 `btn` 必须放在第一位
- 尺寸类放在第二位
- 类型类放在第三位
- 状态类放在最后

```xml
<!-- 正确的类名顺序 -->
<button class="btn btn-medium btn-primary loading">加载中...</button>
```

### 2. 语义化命名
- 使用有意义的类名组合
- 避免过度使用工具类

### 3. 响应式设计
- 按钮样式已内置响应式支持
- 在小屏幕设备上会自动调整尺寸

### 4. 无障碍访问
- 所有按钮都支持 `disabled` 属性
- 加载状态有视觉反馈
- 支持键盘导航

## 自定义样式

如果需要自定义按钮样式，可以：

1. **覆盖现有样式**
```css
/* 在你的页面样式中 */
.btn-primary {
  background: linear-gradient(135deg, #your-color, #your-color);
}
```

2. **创建新的按钮类型**
```css
/* 在你的页面样式中 */
.btn-custom {
  background-color: #your-color;
  color: #your-text-color;
}
```

3. **组合现有样式**
```xml
<button class="btn btn-medium btn-primary" style="background-color: #your-color;">
  自定义按钮
</button>
```

## 注意事项

1. **微信小程序兼容性**
   - 所有样式都针对微信小程序进行了优化
   - 使用了 `rpx` 单位确保在不同设备上的一致性

2. **性能优化**
   - 样式文件已全局引入，无需重复引入
   - 使用了CSS3特性，确保良好的性能

3. **维护性**
   - 统一的样式系统便于维护
   - 修改按钮样式只需修改 `buttons.wxss` 文件 