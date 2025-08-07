# RealHolePlayListSetter 组件

## 概述

`RealHolePlayListSetter` 是一个用于设置高尔夫球洞顺序的组件。该组件支持环形结构的洞选择，允许用户设置起始洞和终止洞，并自动计算洞范围。

## 重构说明

### 重构前
- 依赖 `holeRangeStore` 获取数据
- 数据流复杂，组件与store耦合度高

### 重构后
- 直接从 `gameStore` 获取 `holeList` 数据
- 与 `holeRangeStore` 完全解耦
- 实现环形结构逻辑：根据 `startHoleindex` 和 `roadLength` 计算洞范围
- 通过事件向上传递结果，由父组件更新 `holeRangeStore`

## 功能特性

### 1. 环形结构支持
- 将 `holeList` 视为环形结构
- 起始洞：根据 `hindex == startHoleindex` 确定
- 终止洞：从起始洞开始，向后寻找 `roadLength` 个洞

### 2. 两种选择模式
- **start模式**：点击某个洞，将其设置为起始洞
- **end模式**：点击某个洞，将其设置为终止洞，后面的洞变灰

### 3. 数据源
- 主要数据源：`gameStore.gameData.holeList`
- 备用数据：默认的5个洞（B14-B18）

## 属性 (Properties)

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| startHoleindex | Number | null | 起始洞索引 |
| roadLength | Number | 0 | 道路长度（洞数量） |
| selectType | String | null | 选择类型（'start' 或 'end'） |
| holePlayListStr | String | '' | 外部传入的洞顺序字符串 |

## 事件 (Events)

| 事件名 | 说明 | 参数 |
|--------|------|------|
| cancel | 取消操作 | 无 |
| confirm | 确认洞顺序 | `{ holePlayList, startHoleindex, endHoleindex, roadLength }` |

## 使用示例

### 在 HoleRangeSelector 中使用

```xml
<RealHolePlayListSetter
  wx:if="{{ifShowModal}}"
  holeList="{{holeList}}"
  startHoleindex="{{startHoleindex}}"
  roadLength="{{roadLength}}"
  selectType="{{selectType}}"
  bind:cancel="onModalCancel"
  bind:confirm="onModalConfirm"
/>
```

### 处理确认事件

```javascript
onModalConfirm(e) {
    const result = e.detail;
    
    // 更新 holeRangeStore
    if (result.holePlayList) {
        holeRangeStore.updateHolePlayList(result.holePlayList);
    }
    if (result.roadLength) {
        holeRangeStore.setRoadLength(result.roadLength);
    }
    if (result.startHoleindex && result.endHoleindex) {
        holeRangeStore.setHoleRange(result.startHoleindex, result.endHoleindex);
    }
}
```

## 核心方法

### calculateHolePlayList(holeList, startHoleindex, roadLength)
根据起始洞和道路长度计算洞范围（环形结构）

### buildDisplayHoleList(holeList, holePlayList)
构建用于显示的洞列表，包含所有洞，按 `holePlayList` 的顺序排列

### onSelectHole(e)
处理洞选择事件，根据 `selectType` 执行不同的逻辑

## 数据流

1. 组件初始化时从 `gameStore` 获取 `holeList`
2. 根据 `startHoleindex` 和 `roadLength` 计算 `holePlayList`
3. 构建 `displayHoleList` 用于UI显示
4. 用户交互时更新内部状态
5. 确认时通过事件向上传递结果

## 注意事项

1. 组件与 `holeRangeStore` 解耦，不直接操作store
2. 支持环形结构，当洞数量不足时会循环使用
3. 保持UI和行为不变，确保用户体验一致
4. 使用可选链操作符避免空值错误 