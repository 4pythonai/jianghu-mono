# CustomNavBar 自定义导航栏使用指南

## 问题背景

当页面使用 `CustomNavBar` 组件时,由于导航栏是 `position: fixed` 固定定位,页面内容会被导航栏遮挡。

## 解决方案

### 1. 页面 JSON 配置

```json
{
  "usingComponents": {
    "CustomNavBar": "/components/CustomNavBar/CustomNavBar"
  },
  "navigationStyle": "custom"
}
```

### 2. WXSS 样式设置

**必须** 为页面容器添加顶部内边距:

```css
.container {
  min-height: 100vh;
  padding-top: 180rpx; /* 为固定导航栏预留空间 */
}
```

### 3. WXML 结构

```html
<view class="container">
  <CustomNavBar title="页面标题" showBack="{{true}}" />
  
  <!-- 页面内容 -->
</view>
```

## 关键参数说明

| 参数 | 说明 |
|------|------|
| `padding-top: 180rpx` | 约等于状态栏高度(~44px) + 导航栏高度(44px) + 安全间距 |

## 参考示例

已正确实现的页面:
- `pages/my-team/my-team.wxss` - 使用 `margin-top: 200rpx`
- `pages/contacts/contacts.wxss` - 使用 `padding-top: 180rpx`

## 常见错误

❌ **错误**: 忘记添加 `padding-top`,导致内容被导航栏遮挡

```css
/* 错误示例 */
.container {
  min-height: 100vh;
  /* 缺少 padding-top */
}
```

✅ **正确**: 添加足够的顶部间距

```css
/* 正确示例 */
.container {
  min-height: 100vh;
  padding-top: 180rpx;
}
```

## 新建页面检查清单

- [ ] `xxx.json` 配置了 `"navigationStyle": "custom"`
- [ ] `xxx.json` 引入了 `CustomNavBar` 组件
- [ ] `xxx.wxss` 的 `.container` 添加了 `padding-top: 180rpx`
- [ ] `xxx.wxml` 中 `CustomNavBar` 是 `container` 的第一个子元素
