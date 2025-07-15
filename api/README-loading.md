# 统一Loading管理功能

## 📋 功能概述

HttpClient现在支持统一的loading管理，为所有API请求提供智能的加载提示功能。

### ✨ 主要特性

1. **自动loading管理** - 默认所有请求都显示loading
2. **智能防闪烁** - 延迟显示和最小显示时间机制
3. **并发请求支持** - 多个请求共享一个loading状态
4. **灵活配置** - 支持自定义loading文案、遮罩等
5. **零侵入升级** - 现有代码无需修改即可享受loading功能

### 🚀 防闪烁机制

- **延迟显示**：请求开始后300ms才显示loading，避免快速请求的闪烁
- **最小显示时间**：loading至少显示500ms，避免一闪而过
- **并发管理**：多个请求时只显示一个loading，最后一个请求完成才隐藏

## 📖 使用方法

### 1. 默认使用(推荐)

```javascript
// 自动显示 "加载中..." loading
const result = await app.api.user.createAndSelect(userData)
```

### 2. 自定义loading文案

```javascript
// 显示自定义文案
const result = await app.api.user.createAndSelect(userData, {
    loadingTitle: '正在创建用户...'
})

// 搜索时的loading
const courses = await app.api.course.searchCourse(keyword, {
    loadingTitle: '搜索球场中...'
})

// 上传文件时的loading
const uploadResult = await app.http.uploadFile('/upload', filePath, {
    loadingTitle: '上传头像中...'
})
```

### 3. 禁用loading

```javascript
// 静默请求，不显示loading
const userInfo = await app.api.user.getUserInfo({}, {
    showLoading: false
})

// 轮询请求通常不需要loading
const status = await app.api.game.getGameStatus(gameId, {
    showLoading: false
})
```

### 4. 自定义loading配置

```javascript
// 设置loading遮罩
const result = await app.api.course.getFavorites({}, {
    loadingTitle: '获取收藏中...',
    loadingMask: false  // 不显示遮罩，用户可以继续操作
})
```

### 5. 全局配置loading行为

```javascript
// 在app.js中配置
app.http.setLoadingConfig({
    delay: 500,              // 延迟显示时间(ms)
    minDuration: 800,        // 最小显示时间(ms)
    defaultTitle: '请稍候...', // 默认文案
    defaultMask: true        // 默认是否显示遮罩
})
```

## 🔧 API参考

### Loading选项参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showLoading` | Boolean | true | 是否显示loading |
| `loadingTitle` | String | '加载中...' | loading文案 |
| `loadingMask` | Boolean | true | 是否显示遮罩 |

### HttpClient方法

#### `setLoadingConfig(config)`
设置全局loading配置

```javascript
app.http.setLoadingConfig({
    delay: 300,           // 延迟显示时间
    minDuration: 500,     // 最小显示时间
    defaultTitle: '加载中...',
    defaultMask: true
})
```

#### `getLoadingStatus()`
获取当前loading状态

```javascript
const status = app.http.getLoadingStatus()
console.log(status)
// {
//   isLoading: true,     // 是否正在loading
//   loadingCount: 2,     // 当前请求数量
//   hasTimer: false      // 是否有延迟定时器
// }
```

#### `forceHideLoading()`
强制隐藏loading(用于异常情况)

```javascript
app.http.forceHideLoading()
```

## 🎯 最佳实践

### 1. 业务相关的loading文案

```javascript
// ❌ 通用文案
await app.api.user.createAndSelect(userData, { loadingTitle: '请稍候...' })

// ✅ 业务相关文案
await app.api.user.createAndSelect(userData, { loadingTitle: '正在创建用户...' })
```

### 2. 合理使用loading禁用

```javascript
// ✅ 这些场景适合禁用loading
await app.api.user.getUserInfo({}, { showLoading: false })  // 静默获取用户信息
await app.api.game.heartbeat({}, { showLoading: false })    // 心跳请求
await app.api.log.report({}, { showLoading: false })        // 日志上报

// ❌ 这些场景不应该禁用loading
await app.api.user.createAndSelect(userData, { showLoading: false })  // 用户操作应该有反馈
await app.api.course.searchCourse(keyword, { showLoading: false })    // 搜索应该有loading
```

### 3. 文件上传场景

```javascript
// 上传头像
await app.http.uploadFile('/user/avatar', filePath, {
    loadingTitle: '上传头像中...',
    loadingMask: true  // 上传时阻止用户操作
})

// 上传比赛数据
await app.http.uploadFile('/game/data', filePath, {
    loadingTitle: '上传比赛数据中...'
})
```

## 🧪 测试loading功能

项目中提供了测试工具，可以验证loading功能：

```javascript
import { runAllLoadingTests, testBasicLoading, getLoadingStatus } from '../utils/test-loading'

// 运行所有测试
await runAllLoadingTests()

// 单独测试基本功能
await testBasicLoading()

// 查看loading状态
getLoadingStatus()
```

## 🔄 迁移指南

### 现有代码自动升级

✅ **无需修改** - 所有现有的API调用都会自动获得loading功能：

```javascript
// 这些代码无需任何修改，会自动显示loading
await app.api.user.createAndSelect(userData)
await app.api.course.searchCourse(keyword)
await app.api.game.getGameDetail(gameId)
```

### 移除手动loading代码

🔧 **可以移除** - 现在可以移除页面中的手动loading代码：

```javascript
// ❌ 旧代码 - 可以移除
wx.showLoading({ title: '加载中...' })
try {
    const result = await app.api.user.getUserInfo()
    // 处理结果...
} finally {
    wx.hideLoading()
}

// ✅ 新代码 - 自动loading
const result = await app.api.user.getUserInfo()
// 处理结果...
```

## 📊 性能优化

### 并发请求优化

当同时发起多个请求时，loading会智能管理：

```javascript
// 同时发起3个请求，只显示一个loading
const [userInfo, favorites, gameList] = await Promise.all([
    app.api.user.getUserInfo(),
    app.api.course.getFavorites(), 
    app.api.game.getGameList()
])
// loading会在所有请求完成后才隐藏
```

### 防闪烁优化

- 快速请求(<300ms)不会显示loading
- 显示的loading至少显示500ms，避免闪烁
- 可通过`setLoadingConfig`调整这些参数

## ❓ 常见问题

### Q: 如何处理loading与页面跳转的冲突？
A: 在页面`onHide`或`onUnload`时调用`forceHideLoading()`

### Q: 如何在组件中使用？
A: 组件中同样可以使用`getApp().api`调用，loading会正常工作

### Q: 如何自定义loading样式？
A: 目前使用微信小程序的系统loading，如需自定义可以禁用loading后使用自己的组件

### Q: loading计数异常怎么办？
A: 可以调用`forceHideLoading()`重置，或查看`getLoadingStatus()`诊断问题 