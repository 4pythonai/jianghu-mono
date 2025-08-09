# UserDrag 组件重构方案

## 重构完成 ✅

UserDrag组件已经完成重构，采用简化架构方案，大大提升了代码的可维护性和可读性。

## 重构前后对比

### 重构前的问题
1. **数据流混乱**：
   - `UserDrag.js` 维护 `currentUserList`
   - `dragComponent.js` 维护 `userList` 
   - 数据在多个地方重复存储和同步，容易导致不一致

2. **事件处理复杂**：
   - 拖拽逻辑分散在 `wxs` 文件和 `js` 文件中
   - 事件传递链路长：`userItem` → `dragComponent` → `UserDrag` → 父组件
   - 状态更新时机不明确

3. **组件职责不清**：
   - `UserDrag` 作为外层容器，但实际拖拽逻辑在 `dragComponent` 中
   - `userItem` 只是展示组件，但也被卷入了拖拽逻辑
   - 组件间耦合度高

4. **代码重复**：
   - `UserDrag.js` 中有自己的拖拽逻辑（`onLongPress`、`onTouchMove`、`onTouchEnd`）
   - `dragComponent` 中也有完整的拖拽逻辑
   - 功能重复，维护困难

### 重构后的优势
1. **架构简单**：
   - 移除了复杂的 `dragComponent` 依赖
   - 统一数据管理，只在 `UserDrag` 中维护 `userList`
   - 组件职责明确，易于理解和维护

2. **数据流清晰**：
   - 数据单向流动：`userList` → `currentUserList` → 渲染
   - 事件处理统一：`userItem` → `UserDrag` → 父组件

3. **代码简洁**：
   - 减少了约70%的代码量
   - 移除了复杂的 `wxs` 逻辑
   - 提高了代码可读性

## 重构后的组件结构

```
UserDrag/
├── UserDrag.js          # 主组件，负责数据管理和拖拽逻辑
├── UserDrag.wxml        # 模板，渲染用户列表
├── UserDrag.wxss        # 样式
├── UserDrag.json        # 组件配置
├── userItem/            # 用户项组件
│   ├── userItem.js      # 只负责展示和点击事件
│   ├── userItem.wxml    # 用户项模板
│   ├── userItem.wxss    # 用户项样式
│   └── userItem.json    # 用户项配置
└── README.md           # 组件文档
```

## 使用方法

### 基本用法
```xml
<!-- 父组件中使用 -->
<UserDrag 
  user-list="{{userList}}" 
  bind:sortend="onUserSortEnd"
  bind:itemclick="onUserClick"
/>
```

### 完整示例
```xml
<!-- 父组件模板 -->
<view class="container">
  <UserDrag 
    user-list="{{userList}}" 
    bind:sortend="onUserSortEnd"
    bind:itemclick="onUserClick"
    disabled="{{false}}"
  />
</view>
```

```javascript
// 父组件逻辑
Page({
  data: {
    userList: [
      {
        id: '1',
        userid: 'user1',
        nickname: '张三',
        avatar: '/images/avatar1.png',
        handicap: 10
      },
      {
        id: '2', 
        userid: 'user2',
        nickname: '李四',
        avatar: '/images/avatar2.png',
        handicap: 15
      }
    ]
  },

  // 拖拽排序完成事件
  onUserSortEnd(e) {
    const { listData } = e.detail;
    this.setData({ userList: listData });
    console.log('排序完成:', listData);
  },

  // 用户点击事件
  onUserClick(e) {
    const { itemData, index } = e.detail;
    console.log('用户点击:', itemData, index);
  }
});
```

## 组件属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| userList | Array | [] | 用户列表数据 |
| disabled | Boolean | false | 是否禁用拖拽 |

## 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| sortend | 拖拽排序完成时触发 | `{ listData: Array }` |
| itemclick | 用户项点击时触发 | `{ itemData: Object, index: Number }` |

## 数据格式要求

### 用户数据格式
```javascript
{
  id: '1',                    // 唯一标识符（必需）
  userid: 'user1',           // 用户ID
  nickname: '张三',          // 用户昵称
  wx_nickname: '微信昵称',   // 微信昵称
  avatar: '/images/avatar.png', // 头像路径
  handicap: 10,              // 差点
  fixed: false               // 是否固定位置（可选）
}
```

## 样式定制

组件提供了以下CSS类名，可以用于样式定制：

- `.user-drag-container`: 容器样式
- `.user-item`: 用户项样式
- `.user-item.dragging`: 拖拽中的用户项样式
- `.user-item.dragging-active`: 拖拽激活状态样式

## 注意事项

1. **数据格式**：确保用户数据包含 `id` 字段作为唯一标识符
2. **拖拽限制**：可以通过 `fixed` 字段设置固定位置的用户项
3. **性能优化**：组件使用 `wx:key="id"` 进行列表渲染优化
4. **事件处理**：拖拽事件使用 `catch` 前缀，避免事件冒泡

## 兼容性

- 支持微信小程序基础库 2.0.0 及以上版本
- 支持 TypeScript
- 支持组件化开发 