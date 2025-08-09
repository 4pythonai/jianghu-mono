# HolesDrag 组件

## 功能描述
这是一个高尔夫球洞拖拽排序组件，提供完整的拖拽功能，包括：
- 球洞列表的拖拽排序
- 滚动位置同步
- 排序结果回调
- **完全依赖外部传入的动态数据**

## 使用方法

### 在页面中使用
```xml
<HolesDrag 
  scroll-top="{{scrollTop}}"
  bind:sortend="onSortEnd"
  bind:scroll="onScroll"
  hole-list="{{holeList}}"
></HolesDrag>
```

### 属性说明
- `scrollTop`: 外部传入的滚动位置，用于同步页面滚动
- `holeList`: **外部传入的球洞列表数据（必需）**
- `isModal`: 是否在弹框中使用，影响坐标计算

### 事件说明
- `sortend`: 拖拽排序结束时触发，返回排序后的数据
- `scroll`: 组件内部滚动时触发，返回滚动位置

### 方法说明
- `getListData()`: 获取当前列表数据
- `setListData(data)`: 设置列表数据
- `updateHoleList(newHoleList)`: 更新球洞列表数据
- `init()`: 初始化组件

## 组件特点
1. **完全数据驱动**: 完全依赖外部传入的数据，无内置默认数据
2. **可复用性**: 可以在多个页面中使用
3. **事件通信**: 通过事件向父组件传递数据
4. **自动初始化**: 组件加载完成后自动初始化
5. **页面兼容**: 组件不包含 `<page-meta>` 标签，由页面处理滚动同步
6. **动态数据支持**: 支持外部数据变化时的自动更新

## 数据格式要求

### 输入数据格式（参考 gameStore 中的真实数据）
```javascript
const holeList = [
  {
    holeid: "1",
    unique_key: "1", 
    par: 4,
    hindex: 1,
    holename: "1号洞"
  },
  {
    holeid: "2",
    unique_key: "2",
    par: 3, 
    hindex: 2,
    holename: "2号洞"
  },
  // ... 更多洞数据
];
```

### 必需字段说明
- `holeid`: 洞的唯一标识符（字符串）
- `unique_key`: 洞的唯一键值（字符串）
- `par`: 标准杆数（数字）
- `hindex`: 洞的索引位置（数字，从1开始）
- `holename`: 洞的显示名称（字符串，用于界面显示）

### 输出数据格式
```javascript
// sortend 事件返回的数据格式相同
{
  listData: [
    {
      holeid: "1",
      unique_key: "1",
      par: 4,
      hindex: 1,
      holename: "1号洞"
    },
    // ... 排序后的数据
  ]
}
```

## 文件结构
```
HolesDrag/
├── HolesDrag.js      # 组件逻辑
├── HolesDrag.wxml    # 组件模板
├── HolesDrag.json    # 组件配置
├── HolesDrag.wxss    # 组件样式
└── README.md         # 说明文档
```

## 依赖组件
- `DragComponent`: 核心拖拽组件
- `holeItem`: 球洞项组件

## 使用示例

### 基础使用（从 gameStore 获取数据）
```javascript
import { gameStore } from '../../stores/gameStore';

Page({
  data: {
    scrollTop: 0,
    holeList: []
  },
  
  onLoad() {
    // 从 gameStore 获取洞数据
    const holeList = gameStore.gameData?.holeList || [];
    this.setData({
      holeList: holeList
    });
  },
  
  onSortEnd(e) {
    console.log("排序结果:", e.detail.listData);
    // 更新本地数据
    this.setData({
      holeList: e.detail.listData
    });
  },
  
  onScroll(e) {
    this.setData({
      scrollTop: e.detail.scrollTop
    });
  }
});
```

### 动态更新数据
```javascript
// 更新球洞列表
updateHoleList() {
  const newHoleList = gameStore.gameData?.holeList || [];
  this.setData({
    holeList: newHoleList
  });
}
```

### 弹框中使用
```xml
<HolesDrag 
  scroll-top="{{scrollTop}}"
  bind:sortend="onSortEnd"
  bind:scroll="onScroll"
  hole-list="{{holeList}}"
  is-modal="{{true}}"
></HolesDrag>
```

## 注意事项

1. **数据必需**: 必须传入 `holeList` 数据，组件无内置默认数据
2. **数据格式**: 确保传入的数据格式正确，包含所有必需字段
3. **数据来源**: 建议从 `gameStore.gameData.holeList` 获取真实数据
4. **弹框使用**: 在弹框中使用时，必须设置 `is-modal="{{true}}"`
5. **事件处理**: 记得处理 `sortend` 和 `scroll` 事件
6. **数据更新**: 使用 `observers` 或 `updateHoleList` 方法更新数据
7. **性能优化**: 大量数据时考虑使用虚拟滚动
8. **错误处理**: 组件会在没有数据时输出警告，但不会崩溃 