# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 整体要求

用中文回答我 ,每次都用审视的目光，仔细看我输入的潜在问题，你要指出我的问题，并给出明显在我思考框架之外的建议，如果你觉得我说的太离谱了，请给出
严厉的批评,帮我瞬间清醒 

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