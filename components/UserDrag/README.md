# UserDrag 组件

基于 HolesDrag 组件改造的用户拖拽排序组件，支持单列布局的用户列表拖拽排序功能。

## 功能特性

- **拖拽排序**: 支持用户项目的拖拽重新排序
- **分组显示**: 根据 `redBlueConfig` 配置显示分组颜色标识
- **响应式布局**: 适配不同屏幕尺寸
- **单列布局**: 专门针对用户列表的1列布局设计

## 使用方法

### 1. 在页面 JSON 中引入组件

```json
{
  "usingComponents": {
    "UserDrag": "/components/UserDrag/UserDrag"
  }
}
```

### 2. 在 WXML 中使用

```xml
<UserDrag
  user-list="{{userList}}"
  red-blue-config="{{redBlueConfig}}"
  bind:sortend="onUserSortEnd"
/>
```

### 3. 在 JS 中处理数据

```javascript
Page({
  data: {
    userList: [
      {
        userid: 1,
        nickname: "用户1",
        avatar: "/images/avatar1.png"
      },
      // ... 更多用户
    ],
    redBlueConfig: '4_固拉' // 或 '4_乱拉', '4_高手不见面'
  },

  // 拖拽排序完成回调
  onUserSortEnd(e) {
    const newUserList = e.detail.listData;
    this.setData({
      userList: newUserList
    });
    // 处理排序后的用户列表
  }
})
```

## 属性说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| userList | Array | [] | 用户列表数据 |
| redBlueConfig | String | '4_固拉' | 分组配置（'4_固拉', '4_乱拉', '4_高手不见面'） |
| scrollTop | Number | 0 | 外部传入的滚动位置 |
| isModal | Boolean | false | 是否在弹框中使用 |

## 事件说明

| 事件名 | 说明 | 返回参数 |
|--------|------|----------|
| sortend | 拖拽排序完成 | {listData: Array} - 排序后的用户列表 |
| scroll | 滚动事件 | {scrollTop: Number} - 滚动位置 |

## 用户数据结构

```javascript
{
  userid: Number,      // 用户ID
  nickname: String,    // 用户昵称
  wx_nickname: String, // 微信昵称（备用）
  avatar: String,      // 头像URL
  handicap: Number     // 差点（可选）
}
```

## 分组配置说明

- **统一分组逻辑**: 1、2名（index 0、1）显示蓝色🔵，3、4名（index 2、3）显示红色🔴
- 分组颜色基于数组位置（名次），与具体的分组配置无关
- 数组位置即代表名次：index+1 = 名次

## 方法说明

| 方法名 | 说明 | 参数 | 返回值 |
|--------|------|------|-------|
| getListData() | 获取当前用户列表 | 无 | Array |
| setListData(data) | 设置用户列表 | data: Array | 无 |
| updateUserList(newUserList) | 更新用户列表 | newUserList: Array | 无 |

## 组件结构

```
UserDrag/
├── UserDrag.js          # 主组件逻辑
├── UserDrag.wxml        # 主组件模板
├── UserDrag.wxss        # 主组件样式
├── UserDrag.json        # 主组件配置
├── dragComponent/       # 拖拽核心组件（从HolesDrag复制）
└── userItem/            # 用户项目子组件
    ├── index.js         # 用户项目逻辑
    ├── index.wxml       # 用户项目模板
    ├── index.wxss       # 用户项目样式
    └── index.json       # 用户项目配置
```

## 注意事项

1. 组件基于 HolesDrag 的拖拽核心逻辑，继承了其稳定性和性能优势
2. 使用1列布局，专门优化用户列表的显示和操作
3. 支持响应式布局，在不同屏幕尺寸下都有良好的显示效果
4. 拖拽操作支持振动反馈（在真机上）