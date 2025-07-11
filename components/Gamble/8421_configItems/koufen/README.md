# 扣分配置组件 (koufen)

## 功能说明

这是一个用于配置8421游戏扣分规则的弹窗组件。用户可以通过滚轮选择器自定义扣分的数值参数。

## 主要功能

### 1. 扣分开始条件配置
- **从帕+X开始扣分**: 用户可以通过滚轮选择器设置X的值 (范围：0-20)
- **从双帕+Y开始扣分**: 用户可以通过滚轮选择器设置Y的值 (范围：0-20)  
- **不扣分**: 选择此项时，封顶和同伴惩罚选项会被禁用

### 2. 扣分封顶配置
- **不封顶**: 扣分没有上限
- **扣X分封顶**: 用户可以通过滚轮选择器设置封顶分数 (范围：1-21)

### 3. 同伴惩罚配置
- **不包负分**: 同伴不承担负分
- **同伴顶头包负分**: 同伴承担顶头包负分
- **包负分**: 同伴完全承担负分

## 使用方法

### 在页面中使用

```javascript
// 页面js文件
Page({
  data: {
    showKoufenConfig: false
  },
  
  // 显示配置弹窗
  showKoufenConfig() {
    this.setData({ showKoufenConfig: true });
  },
  
  // 取消配置
  onKoufenCancel() {
    this.setData({ showKoufenConfig: false });
  },
  
  // 确认配置
  onKoufenConfirm(e) {
    const configData = e.detail;
    console.log('扣分配置:', configData);
    this.setData({ showKoufenConfig: false });
  }
});
```

```xml
<!-- 页面wxml文件 -->
<koufen 
  visible="{{showKoufenConfig}}"
  bind:cancel="onKoufenCancel"
  bind:confirm="onKoufenConfirm">
</koufen>
```

### 配置数据结构

#### 传入数据 (Properties)
- `visible`: Boolean - 控制弹窗显示/隐藏
- `value`: String - 可选，用于传入初始配置值

#### 返回数据 (Events)
- `cancel`: 用户取消配置
- `confirm`: 用户确认配置，返回配置数据

#### confirm事件返回的数据结构
```javascript
{
  value: {
    selectedStart: 0, // 选中的开始条件索引
    selectedMax: 0,   // 选中的封顶条件索引  
    selectedDuty: 0,  // 选中的同伴惩罚索引
    paScore: 4,       // 帕分数
    doubleParScore: 0, // 双帕分数
    maxSubScore: 2    // 封顶分数
  },
  parsedData: {
    start: "从帕+4开始扣分",     // 解析后的开始条件文本
    meatMaxValue: "不封顶",      // 解析后的封顶条件文本
    punishment: "不包负分"       // 解析后的同伴惩罚文本
  }
}
```

## 自定义数值范围

### 默认数值范围
- 帕分数范围: 0-20
- 双帕分数范围: 0-20
- 封顶分数范围: 1-21

### 修改数值范围
如需修改数值范围，可以在组件的data中调整：

```javascript
data: {
  paScoreRange: Array.from({length: 31}, (_, i) => i), // 修改为0-30
  doubleParScoreRange: Array.from({length: 21}, (_, i) => i), // 保持0-20
  maxSubScoreRange: Array.from({length: 10}, (_, i) => i + 1), // 修改为1-10
}
```

## 注意事项

1. 当选择"不扣分"时，封顶和同伴惩罚选项会自动禁用
2. 滚轮选择器会在选中对应选项时才显示
3. 数值的显示采用绿色圆角按钮样式，提供良好的用户体验
4. 所有配置会自动保存到G_4P_8421_Store中

## 样式说明

- 使用模态弹窗样式，底部弹出
- 绿色主题色 (#4caf7a)
- 数字选择器采用圆角按钮设计
- 支持禁用状态的视觉反馈
- 响应式布局，适配不同屏幕尺寸 