# 高尔夫赌博小程序

## 项目简介
这是一个微信小程序项目，用于高尔夫赌博游戏的配置和管理。

## 项目架构

### 核心模块
- **配置管理**: `utils/configManager.js` - 统一的配置解析、转换、处理接口
- **基础配置**: `pages/gambleRuntimeConfig/shared/baseConfig.js` - 新增和编辑模式的公共方法
- **游戏配置**: `utils/gameConfig.js` - 游戏规则和默认配置
- **状态管理**: `stores/` - 使用 MobX 进行状态管理

### 页面结构
- **新增配置**: `pages/gambleRuntimeConfig/addRuntime/` - 新增运行时配置
- **编辑配置**: `pages/gambleRuntimeConfig/editRuntime/` - 编辑现有配置
- **游戏详情**: `pages/gameDetail/` - 游戏详情和配置列表

### 组件系统
- **洞范围选择**: `components/HoleRangeSelector/` - 选择洞范围
- **球员配置**: `components/PlayerIndicator/` - 8421球员指标配置
- **分组配置**: `components/RedBlueConfig/` - 红蓝分组和顺序配置
- **排名配置**: `components/RankConflictResolver/` - 排名冲突解决规则

## 最近修复的问题

### 1. 按钮一直显示"更新中..."的问题
**问题描述**: 在编辑配置页面，即使API返回成功，按钮仍然显示"更新中..."状态

**原因分析**: 
- `baseConfig.js` 中的 `saveConfig` 方法设置了 `loading: true`
- 但在API调用完成后没有重置 `loading: false`
- 无论成功还是失败，loading状态都没有被重置

**解决方案**:
- 在 `saveConfig` 方法中添加 `try-catch-finally` 结构
- 在 `finally` 块中确保 `loading: false` 被设置
- 添加错误处理和返回值，便于调用方处理结果

### 2. 重复的保存配置逻辑
**问题描述**: 在 `editRuntime.js` 和 `baseConfig.js` 中都存在保存配置的逻辑

**原因分析**:
- `editRuntime.js` 有自己的 `saveConfig()` 方法
- `baseConfig.js` 中也有 `saveConfig()` 方法
- 两个方法都在处理保存逻辑，造成代码重复和混乱

**解决方案**:
- 简化 `editRuntime.js` 中的 `saveConfig` 方法
- 直接调用 `BaseConfig.saveConfig`，避免重复逻辑
- 统一使用 `BaseConfig.saveConfig` 作为唯一的保存入口

## 代码规范

### 事件绑定
- 禁止空事件绑定：`bindtap=""` 或 `catchtap=""`
- 使用 `noTap` 方法处理条件性禁用事件

### CSS 语法
- 不支持伪元素 `::before/::after`
- calc 写法：`height: ~"calc(100vh - 80rpx)"`

### 代码风格
- 使用可选链操作符 `?.`
- 使用模板字符串而不是字符串拼接
- API 调用使用 POST 方法

## 开发指南

### 添加新配置项
1. 在 `utils/gameConfig.js` 中添加默认值
2. 在 `utils/configManager.js` 中添加处理逻辑
3. 在相关组件中添加配置收集方法
4. 在页面中调用组件获取配置

### 调试技巧
- 使用页面中的调试信息区域查看数据状态
- 检查控制台日志了解配置收集过程
- 验证组件是否正确返回配置数据

## 注意事项
- 确保所有事件绑定都有有效的方法名
- 在保存配置前验证所有必要的数据
- 正确处理异步操作和错误状态
- 保持代码结构清晰，避免重复逻辑

