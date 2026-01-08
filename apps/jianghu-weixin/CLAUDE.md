# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 整体要求

用中文回答我 ,每次都用审视的目光，仔细看我输入的潜在问题，你要指出我的问题，并给出明显在我思考框架之外的建议，如果你觉得我说的太离谱了，请给出
严厉的批评,帮我瞬间清醒 

## 页面导航设计规范

### 🚀 导航工具类使用

**统一使用 `utils/navigationHelper.js` 进行页面跳转，禁止直接使用 wx.navigateTo 等原生API**

```javascript
import navigationHelper from '/utils/navigationHelper.js'

// ✅ 正确使用
navigationHelper.navigateTo('/pages/example/example')
navigationHelper.smartNavigate('/pages/example/example') // 智能选择跳转方式
```

### 📱 跳转方式选择规范

| 跳转方式 | 使用场景 | 示例 |
|---------|---------|------|
| `navigateTo` | 层级导航：列表→详情、表单→选择器 | 游戏列表→游戏详情、创建游戏→选择球场 |
| `redirectTo` | 页面替换：登录成功、流程完成、错误修正 | 登录成功→首页、配置保存→结果页 |
| `switchTab` | Tab页面切换 | 底部导航栏切换 |
| `navigateBack` | 返回上级页面 | 取消操作、完成任务返回 |
| `reLaunch` | 应用重启：登录过期、严重错误 | 用户退出登录 |

### ⚠️ 关键原则

**1. 用户预期一致性**
- 用户点击"返回"按钮应该回到**上一个有意义的页面**
- 避免让用户"迷失"在页面层次中

**2. 页面栈管理**
- 监控页面栈深度（最大10层）
- 深度接近限制时自动使用 `redirectTo` 替换
- 重要流程完成后清理不必要的中间页面

**3. 跳转失败处理**
- 所有跳转都必须有失败降级策略
- 记录跳转日志便于问题诊断

```javascript
// ❌ 错误：没有考虑用户返回路径
wx.redirectTo({ url: '/pages/rules/rules' }) // 用户无法返回编辑页面

// ✅ 正确：保留用户返回路径  
navigationHelper.navigateTo('/pages/rules/rules') // 用户可以返回继续编辑
```

## 框架特定

### MobX 关键注意事项：

**1. 响应式更新限制**
- MobX在微信小程序中对**嵌套对象的深度响应式更新可能失效**
- `storeBindings`绑定整个对象时，内部属性变化可能不会触发页面更新
- **解决方案**：在Store更新后手动强制同步到页面数据

```javascript
// ❌ 问题示例：嵌套对象更新可能不响应
storeBindings: {
  fields: {
    storeConfig: 'config'  // config.dingdongConfig变化可能不会触发更新
  }
}

// ✅ 解决方案：手动强制同步
onConfigChange() {
  this.updateStoreConfig(newConfig)
  
  // 强制同步最新状态到页面
  setTimeout(() => {
    const latestConfig = this._getStoreInstance().config.dingdongConfig
    this.setData({
      'storeConfig.dingdongConfig': latestConfig
    })
  }, 50)
}
```

**2. 纯受控组件设计模式**
- 纯受控组件模式 + 防抖机制是有效的解决方案
- UI状态直接计算自properties，不维护内部状态
- 使用observers将复杂计算转换为简单的data绑定

**3. Page 与 Component 的关键区别**
- **Page 不支持 `observers`**，这是 Component 独有的特性
- 在 Page 中使用 `storeBindings` 绑定 store 数据时，数据变化不会自动触发 observers
- **解决方案**：在 Page 的 `onShow` 或 `onLoad` 中手动同步 store 数据

```javascript
// ❌ 错误：在 Page 中使用 observers（不会生效）
Page({
  storeBindings: {
    store: gameStore,
    fields: { storePlayers: 'players' }
  },
  observers: {
    'storePlayers': function(players) {
      // 这段代码永远不会执行！
      this.setData({ processedPlayers: players })
    }
  }
})

// ✅ 正确：在 onShow 中手动同步数据
Page({
  storeBindings: {
    store: gameStore,
    fields: { storePlayers: 'players' }
  },
  onShow() {
    this.syncData()
  },
  syncData() {
    const players = gameStore.players
    if (players && players.length > 0) {
      this.setData({ processedPlayers: players })
    }
  }
})
```

**Page vs Component 特性对比**：
| 特性 | Page | Component |
|------|------|-----------|
| `observers` | ❌ 不支持 | ✅ 支持 |
| `storeBindings` | ✅ 支持 | ✅ 支持 |
| `lifetimes` | ❌ 不支持 | ✅ 支持 |
| `pageLifetimes` | ❌ 不支持 | ✅ 支持 |
| `onLoad/onShow` | ✅ 支持 | ❌ 不支持 |

### 微信小程序WXML开发注意事项：

**⚠️ WXML中的字符串操作限制**
- WXML模板中**不能直接使用JavaScript字符串方法**（如`.includes()`, `.indexOf()`, `.substring()`等）
- **必须使用WXS模块中定义的工具函数**进行字符串操作
- 所有字符串处理逻辑都需要在`utils/es.wxs`中实现

```html
<!-- ❌ 错误：直接使用JavaScript方法 -->
<view wx:if="{{config.drawConfig.includes('Diff_')}}">
<text>{{config.drawConfig.substring(5)}}</text>

<!-- ✅ 正确：使用WXS工具函数 -->
<wxs src="/utils/es.wxs" module="util" />
<view wx:if="{{util.includes(config.drawConfig, 'Diff_')}}">
<text>{{util.parseIntFromString(config.drawConfig, 'Diff_')}}</text>
```

**常用WXS工具函数示例**：
- `util.includes(str, substring)` - 检查字符串包含
- `util.parseIntFromString(str, prefix)` - 从带前缀的字符串中提取数字
- `util.indexOf(array, value)` - 查找数组索引

**⚠️ WXML中的函数调用限制**
- WXML模板表达式中**不能调用JavaScript函数**（如`{{getCurrentConfig()}}`、`{{formatDate()}}`等）
- **只支持简单的数据绑定和表达式**：`{{data.property}}`、`{{a + b}}`、`{{condition ? a : b}}`
- **解决方案**：使用observers将函数计算结果转换为data属性

```html
<!-- ❌ 错误：在WXML中调用函数 -->
<view wx:if="{{getCurrentMeatValueOption() === 0}}">
<text>{{formatDisplayValue()}}</text>

<!-- ✅ 正确：使用计算好的data属性 -->
<view wx:if="{{currentMeatValueOption === 0}}">
<text>{{displayValue}}</text>
```

**开发原则**：
- 在WXML中进行任何字符串操作前，先检查`utils/es.wxs`是否有对应工具函数，没有则需要先实现
- 任何需要在WXML中使用的计算逻辑，都应该在JS中通过observers计算后存储到data中

**⚠️ 组件自定义事件命名规范**

**不要使用原生事件名作为自定义事件名**，包括：`tap`, `touchstart`, `touchmove`, `touchend`, `scroll`, `input`, `focus`, `blur` 等。

原因：原生事件会覆盖自定义事件，导致 `e.detail` 只包含原生事件数据（如 x, y 坐标），而不是你传递的自定义数据。

```javascript
// ❌ 错误：使用原生事件名 'tap'
Component({
  methods: {
    onTap() {
      this.triggerEvent('tap', { groupId: '123' })  // 会被原生 tap 事件覆盖！
    }
  }
})
// 父页面 bind:tap="onGroupTap" 收到的 e.detail = { x: 242, y: 287 }

// ✅ 正确：使用自定义事件名
Component({
  methods: {
    onTap() {
      this.triggerEvent('grouptap', { groupId: '123' })  // 自定义名称
    }
  }
})
// 父页面 bind:grouptap="onGroupTap" 收到的 e.detail = { groupId: '123' }
```

**推荐的事件命名方式**：
- `itemtap` / `itemclick` - 列表项点击
- `confirm` / `cancel` - 确认/取消操作
- `change` / `select` - 选择变化
- `cardtap` / `grouptap` - 特定组件点击

## Project Overview

这是一个基于微信小程序的高尔夫运动应用，主要功能包括：
- 高尔夫比赛管理和记分
- 复杂的高尔夫赌博系统（4人拉丝、8421、地主婆等多种玩法）
- 球员管理和分组
- 实时比赛状态跟踪

## Development Commands

```bash
# 安装依赖
npm install

# 开发模式 - 在微信开发者工具中打开项目目录
# 使用微信开发者工具进行开发和调试

# 构建和部署通过微信开发者工具完成
```

## Architecture

### 核心技术栈
- **框架**: 微信小程序原生框架
- **状态管理**: MobX (`mobx-miniprogram`, `mobx-miniprogram-bindings`)
- **API通信**: 自定义HTTP客户端 (`api/request-simple.js`)
- **认证**: 微信登录 + 自定义认证系统

### 目录结构
```
miniprogram/
├── api/                    # API接口模块
│   ├── modules/           # 按功能分类的API模块
│   └── request-simple.js  # HTTP客户端
├── components/            # 可复用组件
│   ├── Gamble/           # 赌博相关组件
│   └── ...               # 其他业务组件
├── pages/                # 页面文件
├── stores/               # MobX状态管理
│   ├── gamble/          # 赌博游戏状态
│   └── gameStore.js     # 主游戏状态
├── utils/                # 工具函数
└── styles/              # 全局样式
```

### 状态管理架构
使用MobX进行状态管理，主要Store包括：
- `gameStore`: 主游戏状态，包含玩家、洞数据、分数等
- `scoreStore`: 分数记录状态
- `holeRangeStore`: 洞数据范围管理
- `gamble/*Store`: 各种赌博游戏的专用状态管理

### 高尔夫业务核心概念

#### 赌博游戏类型
- **4人拉丝**: 复杂的4人团队赌博游戏，包含KPI指标、吃肉规则、奖励配置
- **8421**: 基于不同成绩的积分系统（鸟球8分、帕球4分等）
- **地主婆**: 分组对抗模式
- **3打1**: 三人对一人模式

#### 数据流架构
1. **App.js**: 全局事件系统和认证管理
2. **gameStore**: 从API获取比赛数据，标准化处理
3. **专用Store**: 各赌博游戏的配置和状态管理
4. **组件**: 通过MobX绑定消费状态

## Common Development Patterns

### MobX Store创建模式
```javascript
import { observable, action } from 'mobx-miniprogram'

export const ExampleStore = observable({
  // 状态
  data: null,
  loading: false,
  
  // Actions
  updateData: action(function(newData) {
    this.data = newData
  })
})
```

### 组件与Store绑定
```javascript
// 在页面/组件中
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { gameStore } from '../stores/gameStore'

Page({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store: gameStore,
    fields: ['players', 'loading'],
    actions: ['fetchGameDetail']
  }
})
```

### API调用模式
```javascript
// 使用全局API实例
const app = getApp()
const result = await app.api.game.getGameDetail(params, {
  loadingTitle: '加载中...',
  loadingMask: true
})
```

## Important Business Logic

### 游戏数据处理流程
1. `gameStore.fetchGameDetail()` 获取原始数据
2. `_processGameData()` 标准化数据格式
3. 按groupid过滤玩家数据
4. 初始化洞数据到 `holeRangeStore`

### 赌博配置系统
- `GambleMetaConfig.js`: 游戏类型定义和默认配置
- `GamesRegistry.js`: 游戏注册和配置管理器
- 各种Parser: 解析不同游戏规则的配置

### 数据标准化
所有游戏数据通过utils中的标准化函数处理：
- `normalizePlayer()`: 玩家数据标准化
- `normalizeHole()`: 洞数据标准化  
- `normalizeScore()`: 分数数据标准化

## Key Files to Understand

- `app.js`: 应用初始化、认证、全局事件系统
- `stores/gameStore.js`: 核心游戏状态管理
- `utils/GambleMetaConfig.js`: 游戏类型配置系统
- `api/request-simple.js`: HTTP客户端实现
- `components/Gamble/`: 赌博游戏相关组件

## Development Notes

- 该项目使用微信小程序原生框架，需要在微信开发者工具中开发
- 状态管理基于MobX，注意action的使用规范
- API调用统一通过app实例获取，支持loading状态管理
- 游戏配置系统较为复杂，修改前需理解业务逻辑
- 组件采用配置驱动模式，支持多种显示模式（SysConfig/UserEdit等）