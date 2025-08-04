# Stroking 让杆配置组件

## 功能说明

Stroking组件用于配置高尔夫球游戏中的让杆功能。当某个用户水平比较差时，可以通过让杆来调整计分，比如PAR4的洞让"0.5"杆，PAR3的洞让"1"杆。

## 组件特性

- 支持多用户让杆配置
- 可配置不同PAR值的让杆数量
- 支持指定洞范围进行让杆
- 美观的用户界面和交互体验

## 使用方法

### 1. 在页面中引入组件

```json
{
  "usingComponents": {
    "Stroking": "/pages/gambleRuntimeConfig/RuntimeComponents/Stroking/Stroking"
  }
}
```

### 2. 在WXML中使用

```xml
<Stroking 
  strokingConfig="{{strokingConfig}}"
  bind:save="onStrokingSave"
  bind:cancel="onStrokingCancel"
/>
```

### 3. 在JS中处理事件

```javascript
Page({
  data: {
    strokingConfig: []
  },

  // 保存让杆配置
  onStrokingSave(e) {
    const { config } = e.detail;
    console.log('让杆配置:', config);
    
    // 配置数据格式：
    // [{
    //   userid: "张三",
    //   holeRanges: [7, 8, 9, 10, 11],
    //   PAR3: 1,
    //   PAR4: 0.5,
    //   PAR5: 0.5
    // }]
    
    this.setData({
      strokingConfig: config
    });
  },

  // 取消配置
  onStrokingCancel() {
    console.log('取消让杆配置');
  }
});
```

## 配置数据结构

### 输入属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| strokingConfig | Array | [] | 让杆配置数组 |

### 输出事件

| 事件名 | 说明 | 参数 |
|--------|------|------|
| save | 保存配置时触发 | { config: Array } |
| cancel | 取消配置时触发 | - |

### 配置对象结构

```javascript
{
  userid: "用户ID",           // 用户唯一标识
  holeRanges: [7, 8, 9],     // 让杆的洞范围数组
  PAR3: 1,                   // PAR3洞的让杆数量
  PAR4: 0.5,                 // PAR4洞的让杆数量
  PAR5: 0.5                  // PAR5洞的让杆数量
}
```

## 功能说明

### 1. 用户选择
- 显示当前游戏中的所有玩家
- 支持单选模式，一次只能为一个用户配置让杆
- 切换用户时会重置当前配置

### 2. PAR值配置
- 支持PAR3、PAR4、PAR5三种洞类型
- 让杆数值范围：-1, -0.5, 0, 0.5, 1
- 使用滚轮选择器，操作简单直观

### 3. 洞范围选择
- 可选择起始洞和结束洞
- 自动生成洞范围数组
- 支持任意洞范围配置

### 4. 数据管理
- 支持多用户配置保存
- 自动更新现有配置
- 数据格式标准化

## 注意事项

1. 组件依赖gameStore中的玩家数据和洞数据
2. 确保在使用前已正确初始化游戏数据
3. 让杆配置会影响计分计算，请谨慎使用
4. 建议在游戏开始前完成让杆配置

## 样式定制

组件使用rpx单位，支持响应式设计。主要样式类：

- `.stroking-container`: 主容器
- `.user-item`: 用户选择项
- `.par-input-group`: PAR值输入组
- `.hole-input-group`: 洞范围输入组
- `.action-row`: 操作按钮行

可通过CSS变量或样式覆盖来自定义外观。 