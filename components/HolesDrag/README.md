# HolesDrag 组件

## 功能描述
这是一个高尔夫球洞拖拽排序组件，提供完整的拖拽功能，包括：
- 球洞列表的拖拽排序
- 滚动位置同步
- 排序结果回调

## 使用方法

### 在页面中使用
```xml
<HolesDrag 
  scroll-top="{{scrollTop}}"
  bind:sortend="onSortEnd"
  bind:scroll="onScroll"
></HolesDrag>
```

### 属性说明
- `scrollTop`: 外部传入的滚动位置，用于同步页面滚动

### 事件说明
- `sortend`: 拖拽排序结束时触发，返回排序后的数据
- `scroll`: 组件内部滚动时触发，返回滚动位置

### 方法说明
- `getListData()`: 获取当前列表数据
- `setListData(data)`: 设置列表数据
- `init()`: 初始化组件

## 组件特点
1. **独立性**: 组件内部包含完整的拖拽逻辑和数据
2. **可复用性**: 可以在多个页面中使用
3. **事件通信**: 通过事件向父组件传递数据
4. **自动初始化**: 组件加载完成后自动初始化
5. **页面兼容**: 组件不包含 `<page-meta>` 标签，由页面处理滚动同步

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