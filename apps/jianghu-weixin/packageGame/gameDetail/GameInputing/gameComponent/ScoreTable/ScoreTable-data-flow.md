# ScoreTable 数据联动说明

本文梳理 `ScoreTable` 组件在渲染记分表时的数据来源与计算流程，重点关注 `OUT / IN / TOTAL` 三列的处理方式，并总结当前 `OUT` 列显示为空的排查方向。

## 组件上下文
- 结构：左侧固定球员列、右侧可横向滚动的洞详情区以及尾部操作栏（`ScoreTable.wxml`）。
- 表头和数据行根据 `holeList` 长度动态渲染；当洞数为 18 时插入 `OUT`、`IN` 汇总列。
- 单个洞的内容由子组件 `<HoleCell />` 渲染，汇总列直接读取组件 `data` 中的统计结果。

## 数据绑定来源
- `gameStore` 提供 `players`、`red_blue`、`gameAbstract`、`gameid` 等基础信息（`ScoreTable.js`）。
- `holeRangeStore` 提供标准化后的 `holeList`（`ScoreTable.js`）。
- `scoreStore` 暴露一维分数列表 `scores`（`ScoreTable.js`）。
- 组件挂载后由 `observers` 自动触发计算，并统一委托给 `runAtomicScoreUpdate`（`ScoreTable.js`），内部改为调用 `scoreTableViewModel` 生成展示数据。

## 计算流程
1. 观察者 `playerScores, players, holeList, red_blue` 任一变化后触发（`ScoreTable.js`），随后调用 `runAtomicScoreUpdate`，内部复用 `ScoreTable/scoreTableViewModel.js` 与 `ScoreTable/scoreTableCalculator.js` 提供的计算函数。
2. 通过 `scoreStore.calculateDisplayScores` 将一维原始分数转为二维矩阵 `displayScores`，保留推杆、罚杆及红蓝标记信息。
3. **三个统计值在同一时间同步计算（原子操作）**（`ScoreTable.js` → `scoreTableViewModel.js`）：
   - `displayTotals = calculateDisplayTotals(displayScores)` - 计算所有洞的总分
   - `{ displayOutTotals, displayInTotals } = calculateOutInTotals(displayScores, holeList)` - 计算前9洞和后9洞汇总
   
   **架构说明**：统计函数下沉到 `scoreTableCalculator`，与显示矩阵计算放在一起减少重复遍历；handicap 更新改为在 `ScoreTable` 观察者中独立触发。
   
4. **关键差异**：`calculateDisplayTotals` 无条件计算所有洞的总分；而 `calculateOutInTotals` 在 `holeList.length !== 18` 或 `displayScores` 为空时返回空数组。
5. 为防止绑定数组长度与球员数量不一致，`runAtomicScoreUpdate` 会对 `displayOutTotals` / `displayInTotals` 进行零填充后写回 `data`。

## OUT / IN / TOTAL 列渲染
- 表格列宽依据 `holeList.length` 计算。18 洞场景下额外加上 `OUT`、`IN` 两列（`ScoreTable.wxml:24-62`）。
- 行内渲染顺序为：前 9 洞单元格 → `OUT` → 后 9 洞单元格 → `IN` → `TOTAL`（`ScoreTable.wxml:73-123`）。
- `TOTAL` 直接展示 `displayTotals[playerIndex]`。
- `OUT` 与 `IN` 分别展示 `displayOutTotals[playerIndex]` 与 `displayInTotals[playerIndex]`，未定义时回退为 `0`。

## OUT 列当前为空的排查方向

**重要发现**：`displayTotals`、`displayOutTotals`、`displayInTotals` 是**同时同步计算（原子操作）**的（`ScoreTable.js`），因此如果 TOTAL 列显示正常而 OUT 列显示空白，问题可能出在：
1. CSS 样式问题（已修复：`.cell-out` 和 `.cell-in` 缺少 `position: relative`）
2. `calculateOutInTotals` 函数的条件判断或返回值处理
3. 数据绑定或渲染逻辑

### 可能原因：

1. **`calculateOutInTotals` 的条件判断导致返回空数组**（`scoreTableCalculator.js`）：
   - `displayScores` 为空或长度为 0
   - `holeList.length !== 18`（但此情况下 OUT 列不应该显示）
   - 需要确认在计算时 `holeList.length` 的实际值

2. **`displayScores` 的维度问题**：
   - `calculateDisplayTotals` 对 `displayScores` 的维度要求较宽松，只要不是空数组就能计算
   - `calculateOutInTotals` 要求 `displayScores.length > 0` 且必须是二维数组
   - 如果 `displayScores` 结构异常（如不是二维数组），可能导致 OUT/IN 返回空数组，但 TOTAL 仍能计算

3. **零填充逻辑的覆盖问题**：
   - 虽然代码对空数组进行了零填充（`ScoreTable.js:122-129`），但如果 `safeDisplayOutTotals` 本身是空数组且 `players.length === 0`，填充可能不会执行
   - 需要确认 `players.length` 在计算时是否大于 0

### 排查步骤：

1. 检查控制台日志中的 `[ScoreTable] 计算结果`，重点查看：
   - `displayScoresLength` 是否等于 `players.length`
   - `holeListLength` 是否为 18
   - `displayOutTotals` 是否为数组且长度正确
   - `displayOutTotalsValues` 的实际内容

2. 对比 `displayTotals` 和 `displayOutTotals` 的计算时机：
   - 确认两者是否真的在同一时间计算
   - 检查是否有其他代码路径覆盖了 `displayOutTotals`

3. 验证 `displayScores` 的数据结构：
   - 确认 `displayScores` 是二维数组 `[playerArray1, playerArray2, ...]`
   - 每个 `playerArray` 是否有 18 个元素（对应 18 个洞）

> 建议在复现场景下开启现有日志，重点检查：`holeList.length === 18`、`displayScores` 的结构和长度、`displayOutTotals` 的数组内容、以及对应玩家的前九洞 `score` 是否正确落库。
