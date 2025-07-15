# CourseSelector 球场选择组件

一个功能完整的球场搜索和选择组件，支持搜索球场、显示收藏球场列表等功能。

## 功能特性

- 🔍 实时搜索球场
- ⭐ 显示收藏球场列表
- 📱 响应式设计
- 🎨 现代化UI界面
- 🔄 加载状态显示
- 📝 自定义文本内容
- 🐛 调试模式支持

## 使用方法

### 1. 在页面配置中引入组件

```json
{
  "usingComponents": {
    "course-selector": "/components/CourseSelector/CourseSelector"
  }
}
```

### 2. 在页面中使用组件

```xml
<course-selector
  placeholder="搜索球场"
  auto-focus="{{true}}"
  show-favorites="{{true}}"
  debug="{{false}}"
  bind:select="onCourseSelect"
  bind:error="onError"
  bind:searchStart="onSearchStart"
  bind:searchComplete="onSearchComplete"
/>
```

### 3. 处理组件事件

```javascript
Page({
  // 处理球场选择事件
  onCourseSelect(e) {
    const { course } = e.detail
    console.log('选中的球场:', course)
    // 处理选中的球场数据
  },

  // 处理错误事件
  onError(e) {
    const { type, error } = e.detail
    console.error('组件错误:', type, error)
    
    let message = '操作失败，请重试'
    if (type === 'getFavorites') {
      message = '获取收藏球场失败'
    } else if (type === 'search') {
      message = '搜索球场失败'
    }
    
    wx.showToast({
      title: message,
      icon: 'none'
    })
  },

  // 处理搜索开始事件
  onSearchStart(e) {
    const { keyword } = e.detail
    console.log('开始搜索:', keyword)
  },

  // 处理搜索完成事件
  onSearchComplete(e) {
    const { keyword, results } = e.detail
    console.log('搜索完成:', keyword, '结果数量:', results.length)
  }
})
```

## 属性配置

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| placeholder | String | '搜索球场' | 搜索框占位符文本 |
| autoFocus | Boolean | false | 是否自动聚焦搜索框 |
| showFavorites | Boolean | true | 是否显示收藏球场列表 |
| favoritesTitle | String | '收藏球场' | 收藏球场列表标题 |
| emptyText | String | '未找到相关球场' | 搜索无结果时的提示文本 |
| emptyDesc | String | '请尝试其他关键词' | 搜索无结果时的描述文本 |
| defaultText | String | '请输入球场名称进行搜索' | 默认状态提示文本 |
| loadingText | String | '搜索中...' | 加载状态提示文本 |
| debug | Boolean | false | 是否显示调试信息 |
| initialValue | String | '' | 初始搜索值 |

## 事件说明

| 事件名 | 说明 | 事件参数 |
|--------|------|----------|
| select | 选择球场时触发 | `{ course: Object }` |
| error | 发生错误时触发 | `{ type: String, error: Object, keyword?: String }` |
| input | 输入框内容变化时触发 | `{ value: String }` |
| searchStart | 开始搜索时触发 | `{ keyword: String }` |
| searchComplete | 搜索完成时触发 | `{ keyword: String, results: Array }` |

## 外部方法

可以通过组件实例调用以下方法:

```javascript
// 获取组件实例
const courseSelector = this.selectComponent('#course-selector')

// 清空搜索
courseSelector.clearSearch()

// 设置搜索值
courseSelector.setSearchValue('球场名称')

// 刷新收藏列表
courseSelector.refreshFavorites()
```

## 样式自定义

组件使用了独立的样式作用域，如需自定义样式，可以通过以下方式:

1. 修改组件内部的 WXSS 文件
2. 使用外部样式类(需要在组件中添加 `externalClasses` 支持)

## 依赖说明

- 需要 `app.api.course.searchCourse()` API 支持搜索功能
- 需要 `app.api.course.getFavorites()` API 支持获取收藏列表
- 需要搜索图标资源:`/assets/icons/search.png`
- 需要箭头图标资源:`/assets/icons/arrow-right.svg`

## 注意事项

1. 组件内部不会显示 Toast 提示，错误信息通过 `error` 事件传递给父组件处理
2. 球场选择后会通过 `select` 事件传递给父组件，不会自动处理页面跳转
3. 组件支持调试模式，可以显示搜索值的详细信息
4. 搜索功能使用防抖处理，避免频繁请求API 