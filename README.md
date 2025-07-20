# 高尔夫赌博游戏小程序

## 项目架构

### 状态管理

项目使用 MobX 进行状态管理，主要包含以下 store：

#### gameStore
管理游戏核心数据：
- `players`: 玩家列表
- `gameid`: 游戏ID
- `groupId`: 分组ID
- `gameData`: 游戏数据

#### holeRangeStore
专门管理球洞相关数据：
- `holeList`: 所有球洞列表
- `holePlayList`: 实际打球顺序的球洞列表
- `rangeHolePlayList`: 当前选择范围的球洞列表
- `startHoleindex`: 起始洞号
- `endHoleindex`: 结束洞号

#### scoreStore
管理分数相关数据：
- `scores`: 玩家分数矩阵
- `playerTotalScores`: 玩家总分

### 运行时配置数据结构

运行时配置的数据结构已经简化, 去掉了不必要的嵌套层级:

```javascript
// 修改后的数据格式
{
  "enable": true,
  "red_blue_config": "4_固拉",
  "bootstrap_order": [837590, 14, 59, 122],
  "ranking_tie_resolve_config": "indicator.win_loss.reverse_win",
  "holePlayListStr": "3,4,5,6,7,8,9,1,2",
  "startHoleindex": 3,
  "endHoleindex": 9
}
```

### 数据字段说明

- `enable`: 是否启用分组功能
- `red_blue_config`: 分组方式("4_固拉"、"4_乱拉"、"4_高手不见面")
- `bootstrap_order`: 玩家出发顺序(用户ID数组)
- `ranking_tie_resolve_config`: 排名平局解决方案
- `holePlayListStr`: 球洞打球顺序字符串
- `startHoleindex`: 起始洞号
- `endHoleindex`: 结束洞号

### 主要改进

1. **统一状态管理**: 创建了专门的 `holeRangeStore` 来管理所有洞相关数据
2. **简化数据流**: 组件直接从 `holeRangeStore` 获取数据，减少数据传递层级
3. **提高性能**: 使用 MobX 的响应式更新，避免不必要的重新渲染
4. **更好的维护性**: 洞相关逻辑集中在 `holeRangeStore` 中，便于维护和扩展

### 组件内部处理

- RedBlueConfig 组件内部仍使用完整的玩家对象数组进行显示
- 向父组件传递数据时自动转换为用户ID数组
- 确保UI显示完整性的同时满足数据格式要求
- 洞相关组件统一使用 `holeRangeStore` 管理状态

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

### 2024-12-19: 洞数据管理重构
- ✅ 创建了专门的 `holeRangeStore` 来统一管理洞相关数据
- ✅ 重构了所有使用洞数据的组件，统一使用 `holeRangeStore`
- ✅ 简化了数据流，提高了性能和可维护性
- ✅ 更新了相关文档和测试指南

### 主要变更
1. **新增文件**:
   - `stores/holeRangeStore.js`: 洞数据管理 store
   - `stores/holeRangeStore.md`: 测试文档

2. **重构组件**:
   - `RealHolePlayListSetter`: 使用 `holeRangeStore` 管理洞数据
   - `HoleRangeSelector`: 使用 `holeRangeStore` 管理洞范围
   - `ScoreTable`: 从 `holeRangeStore` 获取洞数据
   - `ScoreInputPanel`: 从 `holeRangeStore` 获取洞数据

3. **重构页面**:
   - `editRuntime.js`: 使用 `holeRangeStore` 处理洞配置
   - `baseConfig.js`: 使用 `holeRangeStore` 管理洞数据
   - `configDataProcessor.js`: 从 `holeRangeStore` 获取洞数据
   - `MyRules.js`: 从 `holeRangeStore` 获取洞数据
   - `AddRule.js`: 从 `holeRangeStore` 获取洞数据

4. **优化 gameStore**:
   - 移除了洞相关属性，委托给 `holeRangeStore` 管理
   - 添加了 getter 方法来代理洞数据访问

