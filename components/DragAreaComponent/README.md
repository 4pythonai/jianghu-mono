# DragAreaComponent 拖拽区域组件

## 功能描述
这是一个通用的拖拽排序组件，支持多列布局、滚动同步、额外节点等功能。组件采用 WXS 实现高性能拖拽，支持自定义唯一键名。

## 主要特性
- 支持多列网格布局拖拽排序
- 高性能 WXS 拖拽算法
- 支持额外节点（before/after/destBefore/destAfter）
- 自定义唯一键名配置
- 滚动位置同步
- 弹框模式支持

## 使用方法

### 基本用法
```xml
<DragComponent
  array-data="{{listData}}"
  columns="3"
  item-height="200"
  unique-key-name="id"
  bind:sortend="onSortEnd"
  bind:scroll="onScroll"
></DragComponent>
```

### 在 HolesDrag 中的使用
```xml
<DragComponent
  id="holoJump"
  generic:item="holeItem"
  bind:sortend="sortEnd"
  bind:scroll="scroll"
  item-wrap-class="holeItem-wrap"
  extra-nodes="{{extraNodes}}"
  array-data="{{listData}}"
  columns="6"
  scroll-top="{{scrollTop}}"
  item-height="{{(750 - 8) / 6}}"
  top-size="{{isModal ? 0 : 110}}"
  bottom-size="{{isModal ? 0 : 400}}"
  unique-key-name="unique_key"
></DragComponent>
```

## 属性说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| arrayData | Array | [] | 数据源数组 |
| columns | Number | 1 | 列数 |
| itemHeight | Number | 0 | 每个item的高度（rpx） |
| scrollTop | Number | 0 | 页面滚动位置 |
| topSize | Number | 0 | 顶部固定区域高度 |
| bottomSize | Number | 0 | 底部固定区域高度 |
| extraNodes | Array | [] | 额外节点配置 |
| uniqueKeyName | String | 'id' | 数组中唯一性键的名称 |

### uniqueKeyName 属性详解

`uniqueKeyName` 属性用于指定数据数组中哪个字段作为唯一标识符，避免使用防御性编程。

**使用示例：**
```javascript
// 数据格式
const listData = [
  { unique_key: "1", name: "项目1" },
  { unique_key: "2", name: "项目2" },
  { unique_key: "3", name: "项目3" }
];

// 组件配置
<DragComponent
  array-data="{{listData}}"
  unique-key-name="unique_key"
></DragComponent>
```

**支持的键名类型：**
- `id`: 默认值，适用于标准ID字段
- `unique_key`: 适用于自定义唯一键
- `userid`: 适用于用户ID
- `holeid`: 适用于球洞ID
- 任何其他字符串字段名

## 事件说明

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| sortend | 拖拽排序结束 | { listData: Array } |
| scroll | 滚动事件 | { scrollTop: Number } |
| change | 拖拽过程中数据变化 | { listData: Array } |
| click | 点击事件 | { key: Number, data: Object, extra: Object } |

## 方法说明

| 方法名 | 说明 | 参数 |
|--------|------|------|
| init | 初始化组件 | 无 |
| initDom | 初始化DOM信息 | 无 |
| forceResetDragState | 强制重置拖拽状态 | 无 |
| syncDragEndState | 拖拽结束后的状态同步 | 无 |

## 初始化说明

**重要**: 当 `{arrayData, topSize, bottomSize, itemHeight}` 参数改变时需要手动调用初始化方法。

## 数据格式要求

### 输入数据格式
```javascript
const listData = [
  {
    unique_key: "1",        // 唯一标识符（必需）
    name: "项目名称",        // 显示名称
    // ... 其他业务字段
  }
];
```

### 额外节点格式
```javascript
const extraNodes = [
  {
    type: "before",         // 类型：before/after/destBefore/destAfter
    destKey: 0,            // 目标位置
    data: {                 // 节点数据
      name: "额外项目"
    }
  }
];
```

## 样式类名

| 类名 | 说明 |
|------|------|
| item-wrap | 容器样式 |
| item | 单个项目样式 |
| item.tran | 过渡动画样式 |
| item.cur | 当前拖拽项样式 |
| item.fixed | 固定项样式 |

## 注意事项

1. **唯一键必需**: 确保数据中包含指定的唯一键字段
2. **列数配置**: columns 改变后需要重新初始化
3. **弹框使用**: 在弹框中使用时需要延迟初始化DOM
4. **性能优化**: 大量数据时考虑虚拟滚动
5. **错误处理**: 组件会自动过滤无效数据项

## 更新日志

### v2.0.0
- 新增 `uniqueKeyName` 属性，支持自定义唯一键名
- 移除防御性编程，使用明确的键名配置
- 优化可选链操作符使用
- 提升代码可维护性和性能
