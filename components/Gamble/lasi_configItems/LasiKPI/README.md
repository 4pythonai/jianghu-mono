# LasiKPI 拉丝KPI配置组件

## 功能描述

这是一个用于配置拉丝KPI（关键绩效指标）的微信小程序组件。用户可以选择不同的KPI指标，每个指标都有对应的分值，系统会自动计算总分。

## 界面布局

- **左侧**：3个KPI选项的checkbox列表
  - 较好成绩PK（1-5分可选）
  - 较差成绩PK（1-5分可选）
  - 双方总杆PK（1-5分可选，带切换按钮）
- **右侧**：显示所有选中KPI的总分
- **底部**：配置说明文字

## 数据结构

### 输入数据
组件从 `G4PLasiStore.lasi_config` 获取初始配置：
```javascript
{
    indicators: [], // 选中的指标列表
    totalCalculationType: 'add_total', // 总杆计算方式
    kpiValues: {
        best: 2,    // 较好成绩PK分值
        worst: 1,   // 较差成绩PK分值
        total: 1    // 双方总杆PK分值
    }
}
```

### 输出数据
组件返回指定格式的数组：
```javascript
[
    { kpi: "best", value: 2 },
    { kpi: "worst", value: 1 },
    { kpi: "add_total", value: 1 }
]
```

## 使用方法

### 1. 在页面中引入组件
```json
{
    "usingComponents": {
        "lasi-kpi": "/components/Gamble/lasi_configItems/LasiKPI/LasiKPI"
    }
}
```

### 2. 在页面中使用
```xml
<lasi-kpi id="lasiKpi"></lasi-kpi>
```

### 3. 获取配置结果
```javascript
// 在页面中获取组件实例
const lasiKpiComponent = this.selectComponent('#lasiKpi');

// 获取配置结果
const configResult = lasiKpiComponent.getConfigResult();
console.log('配置结果:', configResult);

// 获取完整配置信息
const currentConfig = lasiKpiComponent.getCurrentConfig();
console.log('当前配置:', currentConfig);
```

## 组件方法

### getConfigResult()
返回指定格式的配置数组：
```javascript
[
    { kpi: "best", value: 2 },
    { kpi: "worst", value: 1 },
    { kpi: "add_total", value: 1 }
]
```

### getCurrentConfig()
返回完整的配置信息：
```javascript
{
    selectedIndicators: ['best', 'worst'],
    totalCalculationType: 'add_total',
    kpiValues: { best: 2, worst: 1, total: 1 },
    totalScore: 3,
    configResult: [...]
}
```

### setKpiValue(kpi, value)
设置指定KPI的分值：
```javascript
lasiKpiComponent.setKpiValue('best', 3); // 设置较好成绩PK为3分
```

### resetConfig()
重置所有配置到默认值。

## 事件说明

- **选择/取消选择KPI**：点击checkbox切换选中状态
- **切换总杆计算方式**：点击第三个选项的切换按钮，在"加法总杆PK"和"乘法总杆PK"之间切换
- **修改KPI分值**：点击分值区域，可选择1-5分

## 样式定制

组件使用CSS变量，可以通过以下方式定制样式：
- 主色调：`#4caf7a`（绿色）
- 背景色：`#f8f9fa`（浅灰）
- 边框色：`#e9ecef`（中灰）
- 文字色：`#6c757d`（深灰）

## 注意事项

1. 组件会自动保存配置到 `G4PLasiStore`
2. 总分会根据选中的KPI自动计算
3. 第三个选项（双方总杆PK）支持两种计算方式切换
4. 组件支持响应式布局，适配不同屏幕尺寸 