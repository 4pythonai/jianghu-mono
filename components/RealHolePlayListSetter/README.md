# RealHolePlayListSetter 组件

## 功能描述

这是一个用于设置高尔夫球场洞序的组件，具有以下特性：

1. **渲染所有洞**：显示球场中的所有洞（来自 `holeList`）
2. **顺序对齐**：第一个元素与 `holePlayList` 的第一个洞对齐
3. **视觉区分**：
   - 在 `holePlayList` 中的洞：绿色背景
   - 不在 `holePlayList` 中的洞：灰色背景
4. **交互功能**：
   - 点击洞可以设置起始洞，重新排列洞序
   - 选择终止洞后，从第一个洞到被点击洞的所有洞都会变绿色（被选中）

## 组件属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| startHoleindex | Number | null | 起始洞索引（编辑模式） |
| endHoleindex | Number | null | 结束洞索引（编辑模式） |
| selectType | String | null | 选择类型（'start'/'end'） |

## 数据结构

### 输入数据
- `holeList`: 所有洞的原始数据
- `holePlayList`: 游戏顺序的洞列表

### 输出数据
- `displayHoleList`: 用于显示的洞列表，包含所有洞并按顺序排列
- 每个洞对象包含 `inPlaylist` 属性，用于判断是否在游戏列表中

## 样式类名

- `.hole-item.active`: 第一个洞（起始洞）
- `.hole-item.in-playlist`: 在游戏列表中的洞（绿色）
- `.hole-item.not-in-playlist`: 不在游戏列表中的洞（灰色）

## 使用方法

```javascript
// 在页面中使用
<RealHolePlayListSetter 
  startHoleindex="{{startHoleindex}}"
  endHoleindex="{{endHoleindex}}"
  selectType="start"
  bind:cancel="onCancel"
/>
```

## 事件

- `cancel`: 用户取消操作时触发

## 核心方法

### buildDisplayHoleList(holeList, holePlayList)
构建显示列表，确保：
1. 包含所有洞
2. 第一个洞与 holePlayList 的第一个洞对齐
3. 为每个洞添加 `inPlaylist` 状态标记

### buildHolePlayListFromStart(startHindex)
根据选中的起始洞重新构建 holePlayList

### onSelectHole(e)
处理洞选择事件：
- 当 selectType 为 'start' 时：设置起始洞，重新排列洞序
- 当 selectType 为 'end' 时：设置终止洞，从第一个洞到终止洞的所有洞都会被选中

### buildHolePlayListToEnd(endHindex)
根据终止洞构建新的 holePlayList，包含从第一个洞到终止洞的所有洞（包括之前灰色的洞）

## 更新日志

- 2024-01-XX: 重构组件，支持渲染所有洞并添加视觉区分
- 清理了 holeRangeStore 中不需要的方法
- 优化了洞序对齐逻辑
- 修复终止洞选择逻辑：点击灰色洞时，从第一个洞到被点击洞的所有洞都会被选中

## 使用示例

```javascript
// 场景：用户点击第8个洞（灰色洞）
// 结果：第1-8个洞都会变成绿色（被选中）
// 第9个洞及之后的洞保持灰色（未被选中）
``` 