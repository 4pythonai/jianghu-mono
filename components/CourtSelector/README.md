# CourtSelector 半场选择组件

一个用于微信小程序的半场选择组件，支持前九洞和后九洞的独立选择，并显示选中半场的洞信息。

## 功能特性

- 🏌️ 支持前九洞和后九洞独立选择
- 📊 自动调用 API 获取球场详细信息
- 🎯 显示选中半场的洞信息（包含 Par 值）
- 📱 响应式两列布局设计
- ⚡ 加载状态和错误处理
- 🎨 现代化 UI 设计

## 安装使用

### 1. 在页面的 JSON 文件中注册组件

```json
{
  "usingComponents": {
    "court-selector": "/components/CourtSelector/CourtSelector"
  }
}
```

### 2. 在页面的 WXML 中使用组件

```xml
<court-selector
  courseid="{{selectedCourse.courseid}}"
  course-info="{{selectedCourse}}"
  show-course-info="{{true}}"
  title="选择半场"
  show-confirm-button="{{true}}"
  bind:confirm="onCourtConfirm"
  bind:selectFrontNine="onSelectFrontNine"
  bind:selectBackNine="onSelectBackNine"
  bind:selectionComplete="onSelectionComplete"
  bind:dataLoaded="onDataLoaded"
  bind:error="onError"
/>
```

## 属性配置

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
|--------|------|--------|------|------|
| courseid | String | '' | 是 | 球场ID，用于调用API获取详细信息 |
| courseInfo | Object | null | 否 | 球场基本信息对象 |
| showCourseInfo | Boolean | true | 否 | 是否显示球场信息卡片 |
| title | String | '选择半场' | 否 | 组件标题 |
| confirmText | String | '确认选择' | 否 | 确认按钮文本 |
| showConfirmButton | Boolean | true | 否 | 是否显示确认按钮 |
| checkIcon | String | '/assets/icons/check.svg' | 否 | 选中状态图标路径 |

## 事件回调

### confirm
用户点击确认按钮时触发

```javascript
onCourtConfirm(e) {
  const { selectionData } = e.detail
  console.log('选择结果:', selectionData)
  // selectionData 包含：
  // - course: 球场详细信息
  // - frontNine: 前九洞半场信息
  // - backNine: 后九洞半场信息
  // - frontNineHoles: 前九洞的洞信息数组
  // - backNineHoles: 后九洞的洞信息数组
  // - timestamp: 选择时间戳
}
```

### selectFrontNine
选择前九洞时触发

```javascript
onSelectFrontNine(e) {
  const { court, holes } = e.detail
  console.log('选择前九洞:', court, holes)
}
```

### selectBackNine
选择后九洞时触发

```javascript
onSelectBackNine(e) {
  const { court, holes } = e.detail
  console.log('选择后九洞:', court, holes)
}
```

### selectionComplete
前九洞和后九洞都选择完成时触发

```javascript
onSelectionComplete(e) {
  const { frontNine, backNine, frontNineHoles, backNineHoles } = e.detail
  console.log('选择完成:', { frontNine, backNine, frontNineHoles, backNineHoles })
}
```

### dataLoaded
球场数据加载完成时触发

```javascript
onDataLoaded(e) {
  const { course, courts } = e.detail
  console.log('数据加载完成:', course, courts)
}
```

### error
发生错误时触发

```javascript
onError(e) {
  const { type, message, error } = e.detail
  console.error('组件错误:', type, message)
}
```

## API 依赖

组件依赖以下 API 接口：

### getCourseDetail
获取球场详细信息，包括半场和洞信息

```javascript
// 调用方式
app.api.course.getCourseDetail({ courseid })

// 期望返回格式
{
  code: 200,
  course: {
    courseid: "course123",
    name: "球场名称",
    // ... 其他球场信息
  },
  courts: [
    {
      courtid: "court1",
      courtname: "A半场",
      courtholes: [
        {
          holeid: "hole1",
          holename: "第1洞",
          par: 4
        },
        // ... 更多洞信息
      ]
    },
    // ... 更多半场信息
  ]
}
```

## 外部方法

组件提供以下外部调用方法：

### clearSelection()
清空当前选择

```javascript
this.selectComponent('#courtSelector').clearSelection()
```

### refreshData()
刷新球场数据

```javascript
this.selectComponent('#courtSelector').refreshData()
```

### getSelection()
获取当前选择状态

```javascript
const selection = this.selectComponent('#courtSelector').getSelection()
```

## 数据结构

### 球场信息 (courseInfo)
```javascript
{
  courseid: "course123",
  name: "球场名称",
  // ... 其他球场属性
}
```

### 半场信息 (court)
```javascript
{
  courtid: "court1",
  courtname: "A半场",
  courtholes: [
    {
      holeid: "hole1",
      holename: "第1洞",
      par: 4
    }
    // ... 更多洞信息
  ]
}
```

### 选择结果 (selectionData)
```javascript
{
  course: {}, // 球场详细信息
  frontNine: {}, // 前九洞半场信息
  backNine: {}, // 后九洞半场信息
  frontNineHoles: [], // 前九洞的洞信息数组
  backNineHoles: [], // 后九洞的洞信息数组
  timestamp: 1234567890 // 选择时间戳
}
```

## 样式定制

组件使用标准的 WXSS 样式，支持以下主要样式类：

- `.court-selector` - 组件根容器
- `.court-columns` - 两列布局容器
- `.court-item` - 半场选项
- `.court-item.selected` - 选中状态
- `.holes-info` - 洞信息显示区域
- `.confirm-btn` - 确认按钮

## 注意事项

1. **必须提供 courseid**：组件需要 courseid 参数来调用 API 获取数据
2. **API 格式要求**：确保 `getCourseDetail` API 返回正确的数据格式
3. **错误处理**：建议监听 error 事件来处理各种错误情况
4. **性能考虑**：组件会在初始化时自动调用 API，避免重复调用

## 更新日志

### v2.0.0
- 重构组件架构，支持 API 集成
- 新增前九洞和后九洞独立选择
- 新增洞信息显示功能
- 优化 UI 设计和用户体验
- 完善错误处理和加载状态

### v1.0.0
- 初始版本，基础半场选择功能 