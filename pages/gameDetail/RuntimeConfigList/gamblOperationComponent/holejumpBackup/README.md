# 跳洞设置组件 (holejump)

## 功能概述

这是一个基于微信小程序 `movable-area` 和 `movable-view` 组件实现的拖拽式跳洞设置功能。用户可以通过拖拽洞号球来重新排列洞序，实现跳洞功能。采用2行9列的布局，支持位置交换功能。

## 技术实现

### 核心组件
- **movable-area**: 定义可拖拽区域
- **movable-view**: 实现单个洞号球的拖拽功能

### 主要特性
1. **2行9列布局**: 第一行显示1-9洞，第二行显示10-18洞
2. **位置交换**: 拖拽一个球时，可以与目标位置的球进行交换
3. **实时反馈**: 拖拽时显示缩放和阴影效果
4. **自动重排**: 拖拽结束后自动重新排列到网格位置

## 使用方法

### 1. 组件调用
```xml
<!-- 在父组件中使用 -->
<holejump 
  wx:if="{{isHolejumpVisible}}"
  runtimeConfigs="{{runtimeConfigs}}"
  bind:close="onHolejumpClose"
  bind:complete="onHolejumpComplete"
/>
```

### 2. 事件处理
```javascript
// 完成跳洞设置
onHolejumpComplete(e) {
  const { holePlayList } = e.detail;
  console.log('新的洞序:', holePlayList);
  // 处理新的洞序数据
}

// 关闭弹窗
onHolejumpClose() {
  // 处理关闭逻辑
}
```

## 数据结构

### holePlayList 数组结构
```javascript
[
  {
    hindex: "1",           // 洞号
    holename: "1号洞",     // 洞名
    originalIndex: 0,      // 原始位置索引
    globalIndex: 0,        // 全局索引（0-17）
    isDragging: false,     // 是否正在拖拽
    isInsertPreview: false, // 是否为插入预览
    x: 0,                  // movable-view的x坐标
    y: 0                   // movable-view的y坐标
  }
  // ... 更多洞号
]
```

### 行列数据结构
```javascript
// 第一行数据（1-9洞）
firstRow: [
  { hindex: "1", holename: "1号洞", globalIndex: 0, x: 0, y: 0, ... },
  { hindex: "2", holename: "2号洞", globalIndex: 1, x: 68, y: 0, ... },
  // ... 到9号洞
]

// 第二行数据（10-18洞）
secondRow: [
  { hindex: "10", holename: "10号洞", globalIndex: 9, x: 0, y: 80, ... },
  { hindex: "11", holename: "11号洞", globalIndex: 10, x: 68, y: 80, ... },
  // ... 到18号洞
]
```

## 配置参数

### gridConfig 网格配置
```javascript
{
  itemSize: 60,    // 每个球的大小(rpx)
  gap: 8,         // 球之间的间距(rpx)
  rowHeight: 80   // 行高度(rpx)
}
```

## 样式定制

### 主要样式类
- `.hole-list`: 拖拽区域容器（movable-area）
- `.hole-row`: 单行容器
- `.hole-item`: 单个洞号球样式（movable-view）
- `.hole-item.dragging`: 拖拽状态样式
- `.hole-item.insert-preview`: 插入预览样式

### 自定义样式
```css
/* 修改球的大小 */
.hole-item {
  width: 80rpx;  /* 自定义宽度 */
  height: 80rpx; /* 自定义高度 */
}

/* 修改行间距 */
.hole-list {
  gap: 30rpx; /* 增加行间距 */
}
```

## 事件说明

### movable-view 事件
- `bindchange`: 位置变化时触发，用于实时更新球的位置
- `bindtouchend`: 触摸结束时触发，用于执行位置交换

### 自定义事件
- `complete`: 完成跳洞设置时触发，返回新的洞序数据
- `close`: 关闭弹窗时触发

## 位置计算逻辑

### 1. 初始位置计算
```javascript
calculateItemPosition(index) {
  const { itemSize, gap, rowHeight } = this.data.gridConfig;
  const row = Math.floor(index / 9);
  const col = index % 9;

  const x = col * (itemSize + gap);
  const y = row * rowHeight;

  return { x, y };
}
```

### 2. 目标位置计算
```javascript
calculateTargetPosition(x, y, dragIndex) {
  const { itemSize, gap, rowHeight } = this.data.gridConfig;

  // 计算网格位置
  const col = Math.round(x / (itemSize + gap));
  const row = Math.round(y / rowHeight);

  // 计算目标索引
  const targetIndex = row * 9 + col;

  // 如果目标位置有效且不是当前位置
  if (targetIndex >= 0 && targetIndex < this.data.holePlayList.length && targetIndex !== dragIndex) {
    this.preparePositionSwap(dragIndex, targetIndex);
  }
}
```

### 3. 位置交换
```javascript
preparePositionSwap(fromIndex, toIndex) {
  const { holePlayList } = this.data;
  const newList = [...holePlayList];

  // 获取要交换的两个球
  const fromItem = newList[fromIndex];
  const toItem = newList[toIndex];

  // 交换位置
  const tempX = fromItem.x;
  const tempY = fromItem.y;

  fromItem.x = toItem.x;
  fromItem.y = toItem.y;
  toItem.x = tempX;
  toItem.y = tempY;

  this.setData({ holePlayList: newList });
}
```

## 性能优化

1. **原生拖拽**: 使用微信小程序原生的 `movable-view` 组件，性能更好
2. **批量更新**: 使用 `setData` 批量更新数据，减少渲染次数
3. **位置缓存**: 缓存计算好的位置信息，避免重复计算

## 注意事项

1. **movable-area 高度**: 必须设置明确的高度，否则拖拽可能异常
2. **网格计算**: 确保 `itemSize`、`gap` 和 `rowHeight` 与CSS中的实际尺寸一致
3. **边界处理**: 拖拽超出边界时，球会自动回到最近的网格位置
4. **触摸事件**: 避免在 `movable-view` 上绑定其他触摸事件，可能产生冲突

## 兼容性

- 支持微信小程序基础库 2.0.0 及以上版本
- 支持 iOS 和 Android 平台
- 支持不同屏幕尺寸的设备

## 更新日志

### v4.0.0 (当前版本)
- 重新使用 `movable-area` 和 `movable-view` 组件
- 实现位置交换功能，避免数据丢失
- 优化拖拽体验和性能
- 简化代码结构

### v3.0.0
- 重新设计为2行9列布局
- 实现插入功能，但存在数据丢失问题

### v2.0.0
- 使用 `movable-area` 和 `movable-view` 实现拖拽功能
- 简化代码结构，提升性能

### v1.0.0
- 基于触摸事件实现拖拽功能
- 支持基本的洞序调整功能 