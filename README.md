# 高尔夫赌博小程序完整技术架构文档

## 项目概述

这是一个基于微信平台的综合高尔夫运动小程序，专注于高尔夫比赛中的赌博游戏规则配置、管理和实时监控。系统支持多种赌博模式，特别是四人拉丝（4P-LASI）和8421等经典玩法。

### 核心特色
- **多元化赌博模式**：支持4P-LASI、8421等多种玩法
- **实时规则配置**：灵活的游戏规则自定义
- **动态球员管理**：支持拖拽排序的直观操作
- **实时数据同步**：比赛数据的实时更新与同步
- **社交化体验**：支持比赛分享、朋友邀请等社交功能

## 技术架构

### 技术栈
- **前端框架**：微信小程序原生 + WXML/WXSS
- **状态管理**：MobX-miniprogram (v6.12.3)
- **网络层**：自定义封装的HTTP客户端
- **样式系统**：CSS变量 + RPX响应式设计
- **构建工具**：微信小程序开发者工具

### 项目结构```
miniprogram/
├── api/                    # 网络请求层
│   ├── index.js           # API统一导出
│   ├── config.js          # 网络配置
│   ├── request-simple.js  # HTTP客户端封装
│   └── modules/           # 业务模块API
│       ├── gamble.js     # 赌博规则API
│       ├── game.js       # 比赛管理API
│       ├── user.js       # 用户管理API
│       ├── course.js     # 球场管理API
│       └── feed.js       # 动态推送API
├── assets/                # 静态资源
├── components/           # 组件系统
├── pages/                # 页面路由
├── stores/               # 状态管理
├── styles/               # 样式系统
├── utils/                # 工具函数
│   ├── auth.js          # 用户认证
│   ├── gameUtils.js     # 比赛工具
│   ├── configManager.js # 配置管理
│   ├── rewardDefaults.js # 奖励默认值
│   └── storage.js       # 本地存储
└── docs/                 # 项目文档
```

## 核心功能模块详解

### 1. 用户认证系统 (utils/auth.js)
- **功能组件**：
  - 微信小程序登录流程
  - 手机号绑定系统
  - 自动重连与Token刷新机制
  - 权限验证与角色管理
- **特色能力**：
  - 事件驱动的登录状态同步
  - 全局用户信息缓存
  - 安全的Token管理机制

### 2. 游戏数据管理 (stores/gameStore.js)
- **核心功能**：
  - 实时游戏数据加载（fetchGameDetail）
  - 玩家智能筛选与分组（_filterPlayersByGroup）
  - 成绩数据标准化处理（_processGameData）
  - 实时倍数配置管理（updateRuntimeMultipliers）
- **数据标准化**：
  - 玩家信息规范化（normalizePlayer）
  - 球洞数据标准化（normalizeHole）
  - 成绩数据格式化（formatScore, formatPutts）

### 3. 赌博规则引擎详解

#### 3.1 4P-LASI模式 (stores/gamble/4p/4p-lasi/)
**规则配置体系**：
```javascript
// 核心配置对象
lasi_config: {
  indicators: [],                    // 选择指标（Par, Birdie等）
  totalCalculationType: 'add_total', // 总计计算方式
  kpiValues: {                       // KPI分值配置
    best: 1,    // 成绩PK分值
    worst: 1,   // 较差成绩PK分值  
    total: 1    // 总杆PK分值
  }
}
```

**奖励规则系统**：
- **吃肉机制**：额外的奖励系统，可自定义吃肉分值范围
- **顶洞规则**：平局处理策略（DrawEqual/NoDraw/Diff_X）
- **包洞机制**：特殊条件下的双倍奖励

#### 3.2 8421模式 (stores/gamble/4p/4p-8421/)
- 四人分组对战模式
- 复杂的计分逻辑和胜负判定
- 支持自定义对战轮次和计分规则

### 4. 配置管理系统 (utils/configManager.js)

#### 4.1 配置收集与验证
```javascript
// 配置收集流程
collectAllConfigs(pageContext, needsStroking) -> {
  // 从各组件收集配置
  holeRangeSelector.getConfig()    // 洞范围
  playerIndicator.getConfig()      // 球员指标
  redBlueConfig.getConfig()        // 红蓝分组
  rankConfig.getConfig()           // 排名规则
  stroking.getConfig()             // 让杆配置（可选）
}
```

#### 4.2 数据验证机制
```javascript
validateConfig(config, players) -> {
  valid: boolean,
  errors: string[]
}
```

### 5. 拖拽组件系统详解

#### 5.1 PlayerDrag - 球员拖拽排序（核心交互组件）
**核心能力**：
- **拖拽排序**：直观的球员顺序调整
- **实时反馈**：拖拽过程中的实时位置预览
- **数据同步**：排序结果实时更新到配置系统
- **弹框支持**：完美适配弹框场景的滚动处理

**使用示例**：
```xml
<PlayerDrag 
  USERS="{{playerList}}" 
  isModal="{{false}}"
  bind:sortend="handleSortEnd"
  bind:scroll="handleScroll"
/>
```

**事件处理**：
```javascript
handleSortEnd(e) {
  const sortedPlayers = e.detail.listData;
  this.updatePlayerOrder(sortedPlayers);
  this.calculateTeamConfiguration();
}
```

#### 5.2 系统组件架构
1. **HoleRangeSelector** - 洞范围配置选择器
2. **RedBlueConfig** - 红黄蓝分组配置面板
3. **PlayerIndicator** - 8421指标配置界面
4. **RankConfig** - 排名冲突解决器
5. **Stroking** - 让杆规则配置组件（可选启用）

### 6. 页面路由架构

#### 6.1 导航架构
```
├── 直播 (pages/live/)
├── 赛事 (pages/events/)
├── 创建游戏 (pages/createGame/)
│   ├── 普通创建
│   ├── 多模式创建
│   └── 快速创建
├── 球员选择 (pages/player-select/)
│   ├── 组合选择
│   ├── 好友选择
│   ├── 扫码添加
│   ├── 手动添加
│   └── 分享邀请
├── 赌博规则配置 (pages/gambleRuntimeConfig/)
│   ├── 新增规则模式
│   └── 编辑规则模式
└── 游戏详情 (pages/gameDetail/)
    ├── 详细信息
    ├── 实时计分
    ├── 规则配置列表
    └── 社区讨论
```

#### 6.2 核心页面设计

##### 赌博规则配置页面
- **新增模式**：从零开始创建完整规则配置
- **编辑模式**：修改已存在的配置方案
- **实时预览**：修改后实时查看配置效果
- **配置验证**：完整的保存前数据检查

### 7. 工具与实用函数

#### 7.1 配置管理工具
```javascript
// 配置验证工具
validateConfig()      // 验证配置数据完整性
prepareSaveData()     // 准备保存数据格式
parseMaxValue()       // 解析封顶值配置
```

#### 7.2 数据处理工具
```javascript
// 数组工具
filterPlayersByGroup()  // 智能分组筛选
normalizeGameData()     // 游戏数据标准化
formatGameDisplay()     // 前端展示格式化
```

### 8. 性能优化与最佳实践

#### 8.1 组件性能优化
- **懒加载**：大型配置页面按模块懒加载
- **虚拟滚动**：长球员列表的虚拟滚动优化
- **防抖节流**：频繁操作的事件优化（500ms防抖）

#### 8.2 状态管理优化
- **分页存储**：避免存储过多历史游戏数据
- **缓存策略**：智能判断配置数据更新时机
- **内存清理**：页面卸载时自动清理无关状态

#### 8.3 网络优化
```javascript
// 请求优化策略
const apiRequest = {
  retryCount: 3,           // 网络错误自动重试
  debounceTime: 500,       // 防止重复请求
  cacheTimeout: 300000     // 5分钟数据缓存
}
```

## 开发规范与代码约定

### 9.1 命名与标识符规范
- **中文优先**：所有中文功能名称保持原汁原味
- **驼峰规则**：技术层采用标准JavaScript命名
- **前缀约定**：Gamble组件统一`Gamble/`前缀
- **状态标识**：复杂配置使用完整描述性名称

### 9.2 文件组织原则
```
utils/
├── gameUtils.js        # 游戏数据通用工具
├── configManager.js    # 配置管理器（核心服务）
├── rewardDefaults.js   # 奖励规则默认值
├── storage.js         # 本地存储管理器
├── auth.js            # 用户认证系统
└── ruleParser/        # 规则解析子系统
```

### 9.3 API调用标准
```javascript
// 统一返回格式
{
  code: 200,          // 状态码
  data: {},          // 业务数据
  message: '',       // 提示信息
  timestamp: 123     // 时间戳
}
```

### 9.4 错误处理标准
```javascript
// 标准错误处理流程
try {
  await configManager.saveGambleConfig(config);
} catch (error) {
  wx.showToast({ title: error.message, icon: 'none' });
  console.error('[Error Handler]', error);
}
```

## 部署配置指南

### 10.1 小程序配置要求
```json
{
  "permission": {
    "scope.userLocation": {
      "desc": "需要定位权限获取附近球场"
    }
  },
  "requiredPrivateInfos": ["getLocation"]
}
```

### 10.2 环境变量配置
```javascript
// 环境配置检测
const ENVIRONMENT = {
  development: 'http://dev.golf-api.com',
  staging: 'http://test.golf-api.com', 
  production: 'https://api.golf-brother.com'
}
```

## 开发者快速入门

### 11.1 本地开发环境
1. **环境要求**：
   - 微信小程序开发者工具
   - Node.js 16+
   - 本项目依赖（mobx-miniprogram系列）

2. **启动步骤**：
   ```bash
   # 项目已内联依赖，无需额外安装
   # 直接使用开发者工具打开项目
   ```

### 11.2 添加新赌博规则

#### 开发流程
1. **创建状态管理**：在`stores/gamble`下新建规则Store
2. **开发配置界面**：创建对应的配置组件
3. **API集成**：在`api/modules/gamble.js`添加接口支持
4. **页面集成**：更新相关页面选择器
5. **测试验证**：完整的功能测试流程

#### 数据结构示例
```javascript
// 新规则数据模板
export const NewGambleStore = observable({
  gambleSysName: 'new-rule',
  gambleUserName: '新规则名称',
  rulesConfig: {},          // 规则配置对象
  rewardConfig: {},         // 奖励配置对象
  
  validateRules: action(function() {}),
  calculateRewards: action(function(scores) {})
})
```

## 故障排除与调试

### 12.1 配置相关错误排查
- **Error "分组数量不匹配"**：检查bootstrap_order配置
- **Error "球员配置无效"**：验证所有playerids在列表中
- **Error "洞范围异常"**：检查startHoleindex和endHoleindex

### 12.2 网络请求问题
- **API调用失败**：检查loading状态是否被正确复位
- **数据同步异常**：确保MobX状态已正确绑定
- **Token过期**：使用authManager的自动刷新机制

### 12.3 用户界面问题排查
- **拖拽不响应**：检查PlayerDrag组件是否正确注册
- **数据不更新**：确认组件的数据观测器配置
- **页面跳转失败**：验证redirectTo参数合法性

## 扩展性设计指南

### 13.1 多语言支持扩展
- **配置系统**：国际化配置文本字段
- **动态标题**：支持多语言的规则命名
- **错误提示**：友好的多语言错误信息

### 13.2 高级功能路径
- **AI智能裁判**：基于机器学习的结果判定
- **多人实时对战**：WebSocket实时同步技术
- **视频直播集成**：专业赛事直播功能
- **支付系统**：完整的赌博支付结算方案

---

## 项目基本信息
- **名称**: 高尔夫赌博小程序
- **微信平台**: 微信小程序
- **业务领域**: 高尔夫运动赌博游戏管理
- **主要功能**: 游戏规则配置、实时比分追踪、社交化体验
- **核心特色**: 多元化赌博模式支持、拖拽式配置界面、实时数据同步

## 项目联系
- **技术支持**: [在此添加技术团队联系]
- **业务咨询**: [在此添加业务团队联系]
- **更新文档**: 随代码更新持续维护本文档

**注：本文档与代码同步更新，是项目开发、维护、扩展的核心技术指南**