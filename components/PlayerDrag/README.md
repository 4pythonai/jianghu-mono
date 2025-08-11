# PlayerDrag 拖拽组件

## 功能描述
PlayerDrag是一个用于玩家列表拖拽排序的微信小程序组件，基于DragAreaComponent实现。

## 主要特性
- 支持玩家列表的拖拽排序
- 自动处理拖拽状态管理
- 支持弹框模式下的特殊处理
- 简洁的代码结构，易于维护

## 使用方法

### 基本用法
```xml
<PlayerDrag 
  USERS="{{playerList}}" 
  bind:sortend="onSortEnd"
  bind:scroll="onScroll"
  bind:drag="onDragChange"
/>
```

### 弹框模式
```xml
<PlayerDrag 
  USERS="{{playerList}}" 
  isModal="{{true}}"
  bind:sortend="onSortEnd"
  bind:drag="onDragChange"
/>
```

## 属性说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| USERS | Array | [] | 玩家列表数据 |
| scrollTop | Number | 0 | 外部传入的滚动位置 |
| isModal | Boolean | false | 是否在弹框中使用 |

## 事件说明

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| sortend | 拖拽排序结束 | { listData: Array } |
| scroll | 滚动事件 | { scrollTop: Number } |
| drag | 拖拽状态变化 | { dragging: Boolean } |

## 方法说明

| 方法名 | 说明 | 参数 |
|--------|------|------|
| getListData | 获取当前列表数据 | 无 |
| setListData | 设置列表数据 | data: Array |
| updateUserList | 更新玩家列表 | newUserList: Array |

## 数据格式要求

### 输入数据格式
```javascript
const playerList = [
  {
    userid: "1",           // 唯一标识符（必需）
    username: "玩家1",     // 显示名称
    // ... 其他业务字段
  }
];
```

### 输出数据格式
```javascript
// sortend 事件返回的数据格式
{
  listData: [
    {
      userid: "1",
      username: "玩家1",
      // ... 排序后的数据
    }
  ]
}
```

## 使用示例

### 基础使用
```javascript
Page({
  data: {
    playerList: []
  },
  
  onLoad() {
    // 获取玩家数据
    this.setData({
      playerList: this.getPlayerList()
    });
  },
  
  onSortEnd(e) {
    console.log("排序结果:", e.detail.listData);
    // 更新本地数据
    this.setData({
      playerList: e.detail.listData
    });
  },
  
  onScroll(e) {
    // 处理滚动事件
    console.log("滚动位置:", e.detail.scrollTop);
  },
  
  onDragChange(e) {
    // 处理拖拽状态变化
    console.log("拖拽状态:", e.detail.dragging);
  }
});
```

### 动态更新数据
```javascript
// 更新玩家列表
updatePlayerList() {
  const newPlayerList = this.getNewPlayerList();
  this.setData({
    playerList: newPlayerList
  });
}
```

## 注意事项

1. **数据必需**: 必须传入 `USERS` 数据，组件无内置默认数据
2. **数据格式**: 确保传入的数据格式正确，包含所有必需字段
3. **弹框使用**: 在弹框中使用时，必须设置 `is-modal="{{true}}"`
4. **事件处理**: 记得处理 `sortend`、`scroll` 和 `drag` 事件
5. **数据更新**: 使用 `observers` 或 `updateUserList` 方法更新数据

## 组件特点

1. **简洁设计**: 代码结构清晰，易于理解和维护
2. **完全数据驱动**: 完全依赖外部传入的数据
3. **自动初始化**: 组件加载完成后自动初始化
4. **弹框兼容**: 支持弹框模式下的特殊处理
5. **事件通信**: 通过事件向父组件传递数据
