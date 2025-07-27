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
- `red_blue`: 红蓝分组数据
- `runtimeMultipliers`: 运行时倍数数据（新增）

#### holeRangeStore
专门管理球洞相关数据：
- `holeList`: 所有球洞列表
- `holePlayList`: 实际打球顺序的球洞列表
- `startHoleindex`: 起始洞号
- `endHoleindex`: 结束洞号

#### scoreStore
管理分数相关数据：
- `scores`: 玩家分数矩阵
- `playerTotalScores`: 玩家总分

### 核心功能

#### 大风吹和游戏是否公开回显功能
**功能描述**：在游戏配置列表中，自动回显大风吹和游戏是否公开的设置状态
- **数据来源**：从 `listRuntimeConfig` API 获取的每个配置项都包含 `bigWind` 和 `ifShow` 字段
- **回显逻辑**：由于后台保证所有配置项的值都一样，系统取第一个配置项的值进行回显
- **实时更新**：当配置数据变化时，单选按钮状态会自动更新
- **用户友好**：用户可以看到当前的设置状态，无需重新设置

**技术实现**：
- 在 `RuntimeConfigList` 组件的 `observers` 中监听 `runtimeConfigs` 变化
- 通过 `updateRadioButtonStates` 方法分析配置数据并设置单选按钮状态
- 在 WXML 中使用数据绑定 `checked="{{ifShow === 'y'}}"` 和 `checked="{{bigWind === 'y'}}"`
- 添加详细的日志记录，便于调试和问题排查
- 数据字段名与 API 保持一致：使用 `ifShow` 而不是 `gamePublic`

### 连锁设置倍数功能
**功能描述**：在踢一脚功能中，支持连锁设置球洞倍数
- **连锁设置**：点击一个球洞设置倍数后，从该洞开始到最后一个洞都会应用相同的倍数
- **多次设置**：如果再次点击其他洞设置新倍数，则从新洞开始往后应用新倍数，前面的设置保持不变
- **实时显示**：在洞选择界面实时显示每个洞的当前倍数配置
- **数据持久化**：倍数设置会保存到 `runtimeMultipliers` 中，与游戏配置关联

**使用流程**：
1. 进入踢一脚功能页面
2. 点击任意球洞，弹出倍数选择器
3. 选择倍数后，从该洞开始到最后一个洞都会应用相同倍数
4. 可以继续点击其他洞设置新的倍数，形成不同的倍数区间
5. 确认设置后，倍数配置会保存到游戏数据中

**技术实现**：
- 使用 `HoleMultiplierSelector` 组件进行倍数选择
- 在 `onMultiplierConfirm` 方法中实现连锁设置逻辑
- 通过 `holeMultiplierMap` 在界面上显示当前倍数配置
- 与 `gameStore` 的 `runtimeMultipliers` 数据同步

### 数据流优化

#### red_blue 数据管理优化
**问题**：之前 `red_blue` 数据在多个地方重复管理：
1. API 接口返回 `red_blue` 数据
2. `gameStore` 存储 `red_blue` 数据
3. `GameMagement` 组件再次设置 `red_blue` 到自己的 `data` 中
4. `ScoreTable` 组件通过 `properties` 接收 `red_blue` 数据

**解决方案**：统一到 `gameStore` 管理：
1. ✅ API 接口返回 `red_blue` 数据
2. ✅ `gameStore` 存储 `red_blue` 数据
3. ✅ `ScoreTable` 组件通过 MobX 绑定直接从 `gameStore` 获取 `red_blue` 数据
4. ✅ 移除 `GameMagement` 组件中的 `red_blue` 数据管理
5. ✅ 移除 `ScoreTable` 组件的 `red_blue` 属性定义

**优势**：
- 减少数据重复管理
- 简化数据流
- 提高代码可维护性
- 确保数据一致性

#### kickConfigs 数据管理优化
**新增功能**：运行时倍数数据管理
1. ✅ API 接口返回 `kickConfig` 数据
2. ✅ `gameStore` 存储 `kickConfigs` 数据
3. ✅ `kickoff` 组件通过 MobX 绑定直接从 `gameStore` 获取 `kickConfigs` 数据
4. ✅ 在洞选择界面显示当前倍数配置
5. ✅ 支持连锁设置倍数功能

**数据结构**：
```javascript
// kickConfigs 数据结构
[
  {
    runtime_id: "config_id",  // 配置项ID
    holeMultipliers: [
      {
        hindex: 1,        // 洞号
        multiplier: 2     // 倍数
      },
      {
        hindex: 3,
        multiplier: 4
      }
    ]
  }
]
```

**功能特性**：
- 在踢一脚功能中显示每个洞的当前倍数配置
- 支持连锁设置倍数：从选择的洞开始到最后一个洞应用相同倍数
- 支持多次设置：不同洞区间可以设置不同倍数
- 与 `HoleMultiplierSelector` 组件集成
- 实时更新界面显示

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
5. **red_blue 数据优化**: 统一到 `gameStore` 管理，避免重复设置

### 组件内部处理

- RedBlueConfig 组件内部仍使用完整的玩家对象数组进行显示
- 向父组件传递数据时自动转换为用户ID数组
- 确保UI显示完整性的同时满足数据格式要求
- 洞相关组件统一使用 `holeRangeStore` 管理状态
- ScoreTable 组件通过 MobX 绑定直接从 gameStore 获取 red_blue 数据

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

### 2024-12-19: 大风吹和游戏是否公开回显功能
- ✅ 实现了大风吹和游戏是否公开的回显功能
- ✅ 从 `listRuntimeConfig` API 获取的每个配置项都包含 `bigWind` 和 `ifShow` 字段
- ✅ 由于后台保证所有配置项的值都一样，系统取第一个配置项的值进行回显
- ✅ 在 `RuntimeConfigList` 组件中自动分析配置数据并设置单选按钮状态
- ✅ 支持实时更新：当配置数据变化时，单选按钮状态会自动更新
- ✅ 添加了详细的日志记录，便于调试和问题排查

### 2024-12-19: 连锁设置倍数功能
- ✅ 实现了连锁设置倍数功能：点击一个球洞设置倍数后，从该洞开始到最后一个洞都会应用相同倍数
- ✅ 支持多次设置：可以点击不同洞设置不同倍数，形成不同的倍数区间
- ✅ 实时显示：在洞选择界面实时显示每个洞的当前倍数配置
- ✅ 数据持久化：倍数设置保存到 `runtimeMultipliers` 中，与游戏配置关联
- ✅ 优化了 `onMultiplierConfirm` 方法，实现连锁设置逻辑
- ✅ 更新了相关文档和功能说明

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

