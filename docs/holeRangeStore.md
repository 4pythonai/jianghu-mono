# holeRangeStore 洞范围管理

## 概述
holeRangeStore 负责管理高尔夫球洞的所有相关信息，包括洞列表、洞顺序、洞范围等。

## 核心状态

### 基础数据
- `holeList`: 所有球洞的原始列表
- `holePlayList`: 游戏顺序的球洞列表
- `startHoleindex`: 起始洞索引
- `endHoleindex`: 结束洞索引

### 动态计算
- 当前范围的洞列表可以通过 `getCurrentRangeHoles()` 方法动态计算得出

## 数据示例

```javascript
// 原始洞数据
holeList: [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16, B17, B18]

// 游戏顺序（可能重新排列）
holePlayList: [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15, B16, B17, B18]

// 洞范围设置
startHoleindex: 1
endHoleindex: 4

// 动态计算当前范围的洞
getCurrentRangeHoles(): [B1, B2, B3, B4]  // 选中的洞范围
```

## 主要方法

### initializeHoles(holeList)
初始化洞数据，设置默认的起始和结束洞索引。

### setHoleRange(startHoleindex, endHoleindex)
设置参与游戏的洞范围。

### updateHolePlayList(newHolePlayList)
更新洞顺序列表（用于拖拽排序后）。

### getCurrentRangeHoles()
动态计算并返回当前范围的洞列表。

### clear()
清空所有洞数据。

### getState()
获取当前状态。

## 使用场景

### 1. 洞范围选择
用户可以选择从哪个洞开始，到哪个洞结束进行游戏。

### 2. 洞顺序调整
用户可以拖拽调整洞的播放顺序。

### 3. 动态范围计算
系统会根据 `startHoleindex` 和 `endHoleindex` 动态计算当前参与游戏的洞列表。

## 设计优势

### 1. 简化数据结构
- 移除了冗余的 `rangeHolePlayList` 状态
- 通过 `startHoleindex` 和 `endHoleindex` 动态计算范围
- 减少了数据同步的复杂性

### 2. 提高数据一致性
- 避免了 `rangeHolePlayList` 与实际范围不一致的问题
- 确保范围数据始终是最新的

### 3. 降低维护成本
- 减少了状态更新的逻辑
- 简化了数据流 