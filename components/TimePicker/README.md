# TimePicker 时间选择器组件

一个支持日期+时间二级联选择的微信小程序组件。

## 功能特点

- ✅ 日期选择(默认未来30天)
- ✅ 时间选择(06:00-18:00，30分钟间隔)
- ✅ 二级联动选择器
- ✅ 自定义占位符
- ✅ 支持初始值设置
- ✅ 响应式设计
- ✅ 完整的事件回调

## 使用方法

### 1. 在页面配置中引入组件

```json
{
  "usingComponents": {
    "TimePicker": "/components/TimePicker/time-picker"
  }
}
```

### 2. 在页面中使用组件

```xml
<TimePicker 
    value="{{ formData.openTime }}"
    placeholder="请选择开球时间"
    bind:change="onOpenTimeChange"
/>
```

### 3. 处理组件事件

```javascript
onOpenTimeChange(e) {
    const { value, display, date, time } = e.detail;
    
    console.log('选择的时间:', {
        value,      // "2024-12-19 14:30"
        display,    // "12月19日 周四 14:30"
        date,       // { label: "12月19日 周四", value: "2024-12-19" }
        time        // { label: "14:30", value: "14:30" }
    });
    
    this.setData({
        'formData.openTime': display
    });
}
```

## 组件属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `value` | String | `''` | 已选择的时间值 |
| `placeholder` | String | `'请选择开球时间'` | 占位符文本 |
| `disabled` | Boolean | `false` | 是否禁用 |
| `dayRange` | Number | `30` | 日期范围天数 |

## 事件回调

### change 事件

当用户选择时间时触发，事件详情包含：

```javascript
{
    value: "2024-12-19 14:30",        // 标准格式的时间值
    display: "12月19日 周四 14:30",    // 用于显示的时间文本
    date: {                           // 日期对象
        label: "12月19日 周四",
        value: "2024-12-19"
    },
    time: {                           // 时间对象
        label: "14:30",
        value: "14:30"
    },
    indexes: [0, 16]                  // 选择器索引
}
```

## 时间范围配置

- **日期范围**: 从今天开始的未来30天(可通过 `dayRange` 属性自定义)
- **时间范围**: 06:00 - 18:00，每30分钟一个时间点
- **时间格式**: HH:MM (24小时制)

## 样式定制

组件使用标准的表单样式，与项目其他表单元素保持一致：

- 高度: 88rpx
- 圆角: 16rpx  
- 背景色: #f8f9fa
- 边框: 2rpx solid #e9ecef
- 激活时背景变为白色，边框变为绿色

## 使用示例

### 基础用法
```xml
<TimePicker bind:change="onTimeChange" />
```

### 带初始值
```xml
<TimePicker 
    value="12月20日 周五 14:30" 
    bind:change="onTimeChange" 
/>
```

### 自定义占位符
```xml
<TimePicker 
    placeholder="选择比赛开始时间"
    bind:change="onTimeChange" 
/>
```

### 自定义日期范围
```xml
<TimePicker 
    dayRange="60"
    bind:change="onTimeChange" 
/>
```

## 注意事项

1. 组件会自动初始化日期和时间范围数据
2. 时间值的格式为 "YYYY-MM-DD HH:MM"
3. 显示文本的格式为 "MM月DD日 周X HH:MM"
4. 组件内部会处理数据的格式转换和验证
5. 建议在父组件中保存 `display` 值用于显示，`value` 值用于API提交 