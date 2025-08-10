# PlayerDrag 拖拽组件

## 功能描述
PlayerDrag是一个用于玩家列表拖拽排序的微信小程序组件，基于DragAreaComponent实现。

## 主要特性
- 支持玩家列表的拖拽排序
- 自动处理拖拽状态管理
- 支持弹框模式下的特殊处理
- 具备异常状态自动恢复功能

## 使用方法

### 基本用法
```xml
<PlayerDrag 
  USERS="{{playerList}}" 
  bind:sortend="onSortEnd"
  bind:scroll="onScroll"
/>
```

### 弹框模式
```xml
<PlayerDrag 
  USERS="{{playerList}}" 
  isModal="{{true}}"
  bind:sortend="onSortEnd"
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
| resetDragState | 强制重置拖拽状态 | 无 |
| handleDragError | 处理拖拽异常恢复 | 无 |

## 最近修复的Bug

### Bug描述
第二次拖拽时，选中的item变白矩形，然后无法移动。

### 修复内容
1. **拖拽状态管理优化**：修复了拖拽结束后状态未正确重置的问题
2. **CSS类名管理**：确保拖拽过程中的CSS类名（cur、tran）正确应用和清理
3. **transform样式处理**：修复了拖拽结束后transform样式残留的问题
4. **异常状态恢复**：添加了拖拽状态异常时的自动恢复机制
5. **生命周期管理**：优化了组件的初始化和销毁逻辑
6. **setTimeout兼容性修复**：修复了wxs中setTimeout不可用导致的渲染错误
7. **用户数据完整性修复**：修复了拖拽后用户信息丢失的问题
8. **数据结构兼容性修复**：修复了hindex字段不存在导致的错误

### 技术细节
- 在wxs中添加了延迟状态重置，确保动画完成后再清理状态
- 优化了拖拽开始和结束时的CSS类名管理
- 添加了拖拽状态监听和异常检测
- 实现了强制重置拖拽状态的方法
- **重要修复**：移除了wxs中的setTimeout调用，改用JS中的setTimeout来管理状态
- 优化了拖拽动画的过渡效果，确保状态切换更加平滑
- **数据修复**：添加了用户数据预处理和验证机制
- **字段兼容**：支持多种用户ID字段（userid、id、hindex）

### 已知问题修复
- **nv_setTimeout is not defined错误**：已修复，wxs文件中不再使用setTimeout
- **拖拽状态残留**：通过JS中的延迟状态重置解决
- **CSS动画冲突**：优化了transition属性，避免状态切换时的样式冲突
- **用户信息丢失**：通过数据预处理和验证机制解决
- **hindex字段错误**：支持多种用户ID字段格式，增强兼容性

## 注意事项
1. 确保传入的USERS数据格式正确
2. 在弹框模式下使用isModal属性
3. 如果遇到拖拽异常，可以调用resetDragState()方法强制恢复
4. 组件会自动检测拖拽状态异常并尝试恢复

## 更新日志
- 2024-12-19: 修复第二次拖拽时item变白矩形无法移动的bug
- 优化拖拽状态管理，提升用户体验
- 添加异常状态自动恢复功能
