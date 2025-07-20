# holeRangeStore 测试文档

## 概述

`holeRangeStore` 是一个专门管理高尔夫球洞相关状态的 MobX store，统一管理以下数据：
- `holeList`: 所有球洞列表（原始数据，不变）
- `holePlayList`: 实际打球顺序的球洞列表（完整的洞顺序，如 B1-B9）
- `rangeHolePlayList`: 当前选择范围的球洞列表（选中的洞，如 B1-B4）
- `startHoleindex`: 起始洞号（选中范围的起始洞）
- `endHoleindex`: 结束洞号（选中范围的结束洞）

## 数据关系

```
holeList: [B1, B2, B3, B4, B5, B6, B7, B8, B9]  // 原始洞数据
holePlayList: [B1, B2, B3, B4, B5, B6, B7, B8, B9]  // 打球顺序（可拖拽排序）
rangeHolePlayList: [B1, B2, B3, B4]  // 选中的洞范围
startHoleindex: 1  // 起始洞索引
endHoleindex: 4    // 结束洞索引
```

## 主要方法

### 1. 初始化方法
```javascript
// 初始化洞数据
holeRangeStore.initializeHoles(holeList)

// 重置洞范围到默认状态
holeRangeStore.resetHoleRange()

// 清空所有洞数据
holeRangeStore.clearHoleData()
```

### 2. 洞顺序管理
```javascript
// 根据字符串设置洞顺序 (例如: "3,4,5,6,7,8,9,1,2")
holeRangeStore.setHolePlayListFromString(holePlayListStr)

// 更新洞顺序列表（用于拖拽排序后）
holeRangeStore.updateHolePlayList(newHolePlayList)

// 根据选中的洞设置洞范围
holeRangeStore.setHoleRangeFromSelected(selectedHoles)
```

### 3. 洞范围管理
```javascript
// 设置洞范围
holeRangeStore.setHoleRange(startHoleindex, endHoleindex)
```

### 4. 数据获取
```javascript
// 获取当前状态
const state = holeRangeStore.getState()

// 获取洞数量
const holeCount = holeRangeStore.holeCount
const holePlayCount = holeRangeStore.holePlayCount
const rangeHoleCount = holeRangeStore.rangeHoleCount
```

## 测试步骤

### 1. 基础功能测试
- [ ] 初始化洞数据
- [ ] 设置洞顺序
- [ ] 设置洞范围
- [ ] 获取洞数据

### 2. 组件集成测试
- [ ] RealHolePlayListSetter 组件正常工作
- [ ] HoleRangeSelector 组件正常工作
- [ ] ScoreTable 组件正常显示洞数据
- [ ] ScoreInputPanel 组件正常显示洞数据

### 3. 页面集成测试
- [ ] editRuntime 页面正常加载和编辑洞配置
- [ ] 运行时配置页面正常显示洞数据
- [ ] 规则页面正常传递洞数据

### 4. 数据流测试
- [ ] 从后端获取的 holePlayListStr 正确解析
- [ ] 洞范围配置正确保存和加载
- [ ] 组件间数据同步正常

## 常见问题

### 1. 洞数据显示为灰色
**原因**: 可能是 `holePlayList` 没有正确设置
**解决**: 检查是否正确调用了 `setHolePlayListFromString` 或 `setHoleRangeFromSelected`

### 2. 洞范围不正确
**原因**: `startHoleindex` 和 `endHoleindex` 设置错误
**解决**: 检查是否正确调用了 `setHoleRange` 方法

### 3. 数据不同步
**原因**: 组件没有正确绑定到 `holeRangeStore`
**解决**: 确保组件正确导入了 `holeRangeStore` 并创建了绑定

### 4. 拖选后洞范围错误
**原因**: 混淆了 `holePlayList` 和 `rangeHolePlayList` 的概念
**解决**: 
- `holePlayList` 应该保持完整的洞顺序
- `rangeHolePlayList` 应该是选中的洞范围
- 使用 `updateHolePlayList()` 更新洞顺序
- 使用 `setHoleRangeFromSelected()` 设置洞范围

## 性能优化

1. **使用 toJS**: 在需要处理 observable 数据时，使用 `toJS` 转换为普通对象
2. **避免重复计算**: 使用 getter 方法缓存计算结果
3. **合理使用 autorun**: 避免在 autorun 中进行复杂计算

## 迁移指南

从 `gameStore` 迁移到 `holeRangeStore`:

1. **导入**: 添加 `import { holeRangeStore } from '../stores/holeRangeStore'`
2. **获取数据**: 使用 `holeRangeStore.getState()` 替代 `gameStore.getState()`
3. **更新数据**: 使用 `holeRangeStore` 的方法替代直接赋值
4. **绑定**: 创建 `holeRangeStoreBindings` 替代原有的洞数据绑定

## 更新日志

- **v1.0.0**: 初始版本，统一管理洞相关状态
- **v1.1.0**: 添加了 `setHoleRangeFromSelected` 方法
- **v1.2.0**: 优化了数据流，简化了组件集成 