# 高尔夫赌博游戏小程序

## 运行时配置数据结构

### 简化后的数据格式

运行时配置的数据结构已经简化, 去掉了不必要的嵌套层级:

```javascript
// 修改后的数据格式
{
  "startHoleindex": 1,
  "endHoleindex": 9,
  "enable": true,
  "red_blue_config": "4_固拉",
  "bootstrap_order": [837590, 14, 59, 122],
  "ranking_tie_resolve_config": "indicator.win_loss.reverse_win"
}
```

### 数据字段说明

- `startHoleindex`: 起始洞号
- `endHoleindex`: 结束洞号  
- `enable`: 是否启用分组功能
- `red_blue_config`: 分组方式("4_固拉"、"4_乱拉"、"4_高手不见面")
- `bootstrap_order`: 玩家出发顺序(用户ID数组)
- `ranking_tie_resolve_config`: 排名平局解决方案

### 主要改进

1. **去除嵌套层级**:将 `grouping_config` 下的配置直接提升到顶层
2. **简化数据格式**:`bootstrap_order` 从对象数组简化为用户ID数组
3. **统一命名**:洞配置使用 `startHoleindex` 和 `endHoleindex`

### 组件内部处理

- RedBlueConfig 组件内部仍使用完整的玩家对象数组进行显示
- 向父组件传递数据时自动转换为用户ID数组
- 确保UI显示完整性的同时满足数据格式要求

# 高尔夫小程序项目

这是一个微信小程序, 关于高尔夫运动的, 包括计费、游戏、群组等功能。

## 主要功能

### 用户管理
- ✅ 微信登录和用户身份验证
- ✅ 用户头像和昵称获取(已更新为新版API)
- ✅ 手机号绑定功能
- ✅ 用户信息管理
- ✅ 头像本地存储功能

### 核心功能
- ✅ 老牌组合选择功能
- ✅ 好友选择功能
- 🚧 游戏功能
- 🚧 群组管理
- 🚧 其他功能开发中...

## 功能说明

### 老牌组合选择功能
老牌组合功能允许用户从经常一起打游戏的玩家组合中进行选择:

- **数据获取**: 调用 `api.game.getPlayerCombination` 接口获取组合数据
- **组合展示**: 以卡片形式展示多个组合, 每个组合包含多名玩家信息
- **玩家信息**: 显示每个玩家的头像、昵称和杆数信息
- **选择功能**: 支持点击选择组合, 有确认弹窗和选中状态指示
- **页面交互**: 支持下拉刷新, 包含加载状态和空状态处理
- **数据回传**: 选择完成后将组合数据回传给上级页面

### 好友选择功能
好友选择功能允许用户从个人好友列表中选择多名好友参与游戏:

- **数据获取**: 调用 `api.user.getFriends` 接口获取好友数据
- **好友展示**: 以列表形式展示所有好友, 包含头像、昵称、ID等信息
- **多选功能**: 支持选择多名好友(最多4名), 有选中状态指示
- **搜索功能**: 支持按昵称或ID搜索好友, 实时过滤结果
- **选择统计**: 实时显示已选择人数和确认按钮
- **页面交互**: 支持下拉刷新, 包含加载状态和空状态处理
- **数据回传**: 选择完成后将好友数据回传给创建比赛页面

#### 使用流程

**老牌组合选择流程:**
1. **进入创建比赛页面**: 在 `commonCreate` 页面点击添加玩家
2. **选择添加方式**: 在 `player-select` 页面选择"老牌组合"
3. **选择组合**: 在 `combineSelect` 页面浏览和选择组合
4. **确认选择**: 点击组合卡片, 确认后自动返回创建比赛页面
5. **查看结果**: 在创建比赛页面查看已添加的玩家

**好友选择流程:**
1. **进入创建比赛页面**: 在 `commonCreate` 页面点击添加玩家
2. **选择添加方式**: 在 `player-select` 页面选择"好友选择"
3. **浏览好友**: 在 `friendSelect` 页面查看好友列表
4. **选择好友**: 点击好友进行多选(最多4名)
5. **搜索过滤**: 可使用搜索功能快速找到特定好友
6. **确认选择**: 点击确认按钮, 自动返回创建比赛页面
7. **查看结果**: 在创建比赛页面查看已添加的好友

#### 技术实现特点
- 使用微信小程序原生框架开发
- 支持响应式布局, 适配不同尺寸设备
- 包含完整的错误处理和用户体验优化
- 使用CSS动画增强用户体验
- 支持头像懒加载和默认头像降级
- 智能页面导航和数据传递机制

## 最近更新

### 2024-12-19 - 游戏运行时配置API调用优化
- **API调用改进**: 将 `listRuntimeConfig` 的调用方式从使用 `gameId` 改为使用 `groupId`
- **业务流程优化**:
  - 在 `pages/live/live` 页面获取比赛列表时, 每个比赛包含一个或多个分组
  - 点击比赛后跳转到 `pages/gameDetail/gameDetail` 页面, 并传递 `groupId` 参数
  - 在游戏详情页面第3个tab(游戏tab)中, 使用 `groupId` 而不是 `gameId` 调用 `listRuntimeConfig`
- **代码修改**:
  - 修改 `stores/gameStore.js` 中的 `fetchRuntimeConfigs` 方法, 支持 `groupId` 参数
  - 更新 `pages/gameDetail/gamble/gamble.js` 中的调用方式, 确保传递正确的 `groupId`
  - 优化API请求参数构建逻辑, 优先使用 `groupId` 作为查询条件
- **技术改进**:
  - 增强了数据获取的准确性, 确保运行时配置与特定分组相关联
  - 改进了调试日志, 便于追踪API调用过程
  - 保持了向后兼容性, 在没有 `groupId` 时仍使用 `gameId` 作为降级方案

### 2024-12-19 - 赌博游戏运行时配置功能实现
- **新增页面**: 创建了完整的赌博游戏运行时配置页面 (`pages/gambleRuntimeConfig/`)
- **运行时配置组件**: 
  - `Summary组件` - 显示游戏规则摘要和参与人员, 支持重新选择规则
  - `HoleRangeSelector组件` - 起点洞与终点洞选择器, 支持自定义洞数范围
  - `RedBlueConfig组件` - 红蓝分组配置, 支持3人/4人游戏的对抗分组
  - `RankingSelector组件` - 排名规则选择器, 支持多种排名算法
- **数据流程优化**:
  - 修改 `AddRule` 组件的跳转逻辑, 从直接跳转到规则配置改为跳转到运行时配置
  - 实现完整的数据传递机制, 从 `gameStore` 获取游戏数据并传递给运行时配置页面
  - 配置完成后自动返回到游戏详情页面, 跳过中间页面
- **用户体验增强**:
  - 现代化的UI设计, 支持响应式布局
  - 完整的数据验证和错误处理
  - 智能的自动分组和重置功能
  - 清晰的配置状态指示和提示信息
- **技术特点**:
  - 组件化开发, 便于维护和扩展
  - 完整的数据绑定和事件传递机制
  - 支持多种游戏类型的配置适配
  - 优雅的CSS动画和交互效果

### 2024-12-19 - UUID 唯一标识符系统实现
- **新增功能**: 完成了完整的 UUID 生成工具函数系统
- **核心函数**:
  - `uuid()` - 生成符合 RFC 4122 标准的 UUID v4
  - `simpleUuid()` - 生成去掉连字符的简化 UUID
  - `shortUuid()` - 生成8位短 UUID(适用于临时标识)
  - `timestampUuid()` - 生成带时间戳前缀的 UUID
- **技术特点**:
  - 符合 RFC 4122 UUID v4 标准格式
  - 使用高精度时间戳和性能计时器增强随机性
  - 支持微信小程序环境, 兼容性良好
  - 通过唯一性测试和格式验证
- **应用集成**:
  - 在 `commonCreate.js` 页面加载时自动生成游戏 UUID
  - 用于游戏数据的唯一标识和防重复提交
  - API 请求中包含 `uuid`  字段
- **使用示例**:
  ```javascript
  import { uuid, shortUuid } from '../../../utils/tool';
  
  // 生成标准 UUID
  const gameId = uuid(); // e.g., "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  
  // 生成短 UUID
  const sessionId = shortUuid(); // e.g., "k2j9n8m1"
  ```

### 2024-12-19 - 游戏组管理工具函数重构
- **代码重构**: 将 `handleAppendPlayersToGroup` 方法抽象到 `utils/gameGroupUtils.js` 中
- **新增工具函数**:
  - `handleAppendPlayersToGroup()` - 通用的玩家添加处理函数, 支持任何框架环境
  - `createWxPageHandler()` - 创建适用于微信小程序页面的处理函数
  - 提供 `executeWxActions()` 便捷方法直接执行微信小程序UI操作
- **架构优化**:
  - 分离业务逻辑和UI操作, 提高代码可测试性
  - 支持不同框架环境的适配(通过UI操作指令)
  - 减少 `commonCreate.js` 的代码量, 从100+行的组管理逻辑简化为几行代码
- **使用方式**:
  ```javascript
  // 在 Page() 对象中直接绑定
  handleAppendPlayersToGroup: createWxPageHandler('formData.gameGroups')
  
  // 或者使用通用版本
  const result = handleAppendPlayersToGroup(players, groupIndex, sourceType, gameGroups);
  result.executeWxActions(this); // 执行微信小程序UI操作
  ```
- **技术优势**:
  - 纯函数设计, 易于单元测试
  - 单一职责原则, 每个函数职责明确
  - 代码复用性强, 可在多个页面使用
  - 支持扩展配置(数据路径、最大玩家数等)

## 最近更新

### 2024-12-19 - 完成好友选择功能
- **新增功能**: 实现了完整的好友选择页面 (`/pages/player-select/friendSelect/`)
- **API集成**: 集成 `api.user.getFriends` 接口获取好友数据
- **界面实现**: 
  - 美观的好友列表设计, 支持头像、昵称、ID等信息展示
  - 多选功能, 最多支持选择4名好友
  - 实时搜索过滤功能, 支持按昵称或ID搜索
  - 选择统计和确认按钮, 清晰显示选择状态
  - 下拉刷新、加载状态、空状态等完整交互
- **数据传递优化**:
  - 实现 `commonCreate` 页面的 `onFriendsSelected` 回调方法
  - 优化 `friendSelect` 页面选择逻辑, 支持直接返回创建比赛页面
  - 数据格式转换适配 `PlayerSelector` 组件要求
  - 智能页面导航, 支持多层级页面返回
- **用户体验优化**:
  - 底部固定确认按钮, 方便操作
  - 选中状态清晰可见, 支持取消选择
  - 响应式布局适配不同设备
  - CSS动画效果提升交互体验

### 2024-12-19 - 完成老牌组合选择功能及数据展示修复
- **新增功能**: 实现了完整的老牌组合选择页面 (`/pages/player-select/combineSelect/`)
- **API集成**: 集成 `api.game.getPlayerCombination` 接口获取组合数据
- **界面实现**: 
  - 美观的组合卡片设计, 支持多名玩家信息展示
  - 头像、昵称、杆数等详细信息显示
  - 选中状态指示和确认弹窗
  - 下拉刷新、加载状态、空状态等完整交互
- **数据传递优化**:
  - 实现 `commonCreate` 页面的 `onCombinationSelected` 回调方法
  - 优化 `combineSelect` 页面选择逻辑, 支持直接返回创建比赛页面
  - 数据格式转换适配 `PlayerSelector` 组件要求
  - 智能页面导航, 支持多层级页面返回
- **数据展示修复**:
  - 为 `PlayerSelector` 组件添加 `observers` 监听器, 监听 `players` 属性变化
  - 新增 `updatePlayerSlots` 方法处理玩家数据更新
  - 优化组件生命周期, 确保数据变化时正确更新显示
  - 添加调试日志, 便于追踪数据流转过程
- **技术优化**:
  - 使用CSS动画提升用户体验
  - 支持响应式布局和头像懒加载
  - 完整的错误处理和降级方案
  - 页面间数据传递机制完善

### 2024-12-19 - 移除价格相关功能
- **功能简化**: 根据需求删除了所有与球场价格相关的代码
- **代码清理**:
  - 移除了 `courtOptions` 数组和相关的价格计算逻辑
  - 删除了 `customCourtOptions` 属性和 `updateCourtOptions` 方法
  - 清理了 `priceMultiplier` 和 `priceLabel` 等价格相关属性
  - 移除了界面中的价格显示和相关样式
- **简化功能**: 专注于高尔夫游戏和群组管理, 不再涉及计费系统

### 2024-12-19 - 头像存储机制优化
- **问题解决**: 修复了开发者工具中 `chooseAvatar` 临时文件系统错误
- **新增功能**:
  - 头像本地永久存储:将临时头像文件保存到小程序本地存储
  - 头像缓存机制:重启小程序后自动加载已保存的头像
  - 文件系统容错:处理文件不存在或存储失败的情况
- **技术改进**:
  - 使用 `wx.getFileSystemManager()` 进行文件操作
  - 添加完整的错误处理和降级方案
  - 实现头像文件的生命周期管理

### 2024-12-19 - 用户信息获取功能升级
- **问题修复**: 修复了 `getUserProfile` API 废弃导致无法获取用户信息的问题
- **功能更新**: 
  - 使用新的 `open-type="chooseAvatar"` 方式获取用户头像
  - 使用 `type="nickname"` 输入框获取用户昵称
  - 优化用户体验, 提供更直观的信息完善界面
- **技术改进**:
  - 移除废弃的 `wx.getUserProfile` API
  - 增加头像预览功能
  - 添加昵称输入验证
  - 改进UI界面和交互体验

## 技术特性

本项目所有页面的“当前游戏数据”（如 players、holeList、gameData）统一通过 `stores/gameStore.js` 管理，**不再使用 `app.globalData.currentGameData`**。

### 推荐用法

```js
// 在页面/组件中引入 gameStore
const { gameStore } = require('../../stores/gameStore');

// 读取当前玩家列表
const players = gameStore.players;

// 读取当前洞信息
const holeList = gameStore.holeList;

// 读取当前游戏原始数据
const gameData = gameStore.gameData;

// 更新数据时直接赋值
// gameStore.players = [...];
// gameStore.holeList = [...];
// gameStore.gameData = {...};
```

> 这样做的好处：
> - 数据响应式，页面自动刷新
> - 代码更规范，易维护
> - 集中管理，方便团队协作

如需清空当前游戏数据，直接：
```js
gameStore.players = [];
gameStore.holeList = [];
gameStore.gameData = null;
```

## 技术特性

### 头像存储机制
```