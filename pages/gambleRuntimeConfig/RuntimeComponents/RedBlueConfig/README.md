# RedBlueConfig 组件使用说明

## 功能概述
RedBlueConfig 组件用于配置高尔夫比赛的红蓝分组和出发顺序。现在支持自动抽签功能，可以定时模拟用户点击"抽签排序"按钮。

## 新增功能：自动抽签

### 1. 基本使用

```xml
<!-- 在父组件的WXML中 -->
<RedBlueConfig
  id="redBlueConfig"
  players="{{players}}"
  red_blue_config="{{red_blue_config}}"
  autoRandomOrder="{{true}}"
  autoRandomInterval="{{3000}}"
  bind:change="onRedBlueConfigChange"
  bind:autoRandomExecuted="onAutoRandomExecuted"
/>
```

### 2. 属性说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `autoRandomOrder` | Boolean | false | 是否启用自动抽签 |
| `autoRandomInterval` | Number | 3000 | 自动抽签间隔时间（毫秒） |

### 3. 事件说明

| 事件名 | 说明 | 参数 |
|--------|------|------|
| `autoRandomExecuted` | 自动抽签执行时触发 | `{players, bootstrap_order}` |

### 4. 方法说明

| 方法名 | 说明 | 参数 |
|--------|------|------|
| `toggleAutoRandom()` | 切换自动抽签状态 | 无 |
| `setAutoRandomInterval(interval)` | 设置自动抽签间隔 | `interval`: 毫秒数 |

## 使用示例

### 在父组件JS中：

```javascript
Page({
  data: {
    players: [
      { userid: '1', name: '张三', handicap: 10 },
      { userid: '2', name: '李四', handicap: 15 },
      { userid: '3', name: '王五', handicap: 8 },
      { userid: '4', name: '赵六', handicap: 12 }
    ],
    red_blue_config: '4_固拉',
    autoRandomOrder: false,
    autoRandomInterval: 3000
  },

  // 监听配置变化
  onRedBlueConfigChange(e) {
    console.log('配置变化:', e.detail);
  },

  // 监听自动抽签执行
  onAutoRandomExecuted(e) {
    console.log('自动抽签执行:', e.detail);
    wx.showToast({
      title: '自动抽签完成',
      icon: 'success',
      duration: 1000
    });
  },

  // 手动控制自动抽签
  toggleAutoRandom() {
    const redBlueConfig = this.selectComponent('#redBlueConfig');
    redBlueConfig.toggleAutoRandom();
  },

  // 设置抽签间隔
  setInterval() {
    const redBlueConfig = this.selectComponent('#redBlueConfig');
    redBlueConfig.setAutoRandomInterval(5000); // 5秒间隔
  },

  // 启动自动抽签
  startAutoRandom() {
    this.setData({
      autoRandomOrder: true
    });
  },

  // 停止自动抽签
  stopAutoRandom() {
    this.setData({
      autoRandomOrder: false
    });
  }
});
```

### 在父组件WXML中：

```xml
<view class="container">
  <!-- 控制按钮 -->
  <view class="control-buttons">
    <button bindtap="startAutoRandom" class="btn">启动自动抽签</button>
    <button bindtap="stopAutoRandom" class="btn">停止自动抽签</button>
    <button bindtap="toggleAutoRandom" class="btn">切换自动抽签</button>
    <button bindtap="setInterval" class="btn">设置5秒间隔</button>
  </view>

  <!-- RedBlueConfig组件 -->
  <RedBlueConfig
    id="redBlueConfig"
    players="{{players}}"
    red_blue_config="{{red_blue_config}}"
    autoRandomOrder="{{autoRandomOrder}}"
    autoRandomInterval="{{autoRandomInterval}}"
    bind:change="onRedBlueConfigChange"
    bind:autoRandomExecuted="onAutoRandomExecuted"
  />
</view>
```

## 功能特点

1. **自动管理定时器**：组件会自动管理定时器的创建和销毁，避免内存泄漏
2. **状态可视化**：自动抽签运行时按钮会变红并有脉冲动画效果
3. **状态提示**：显示当前自动抽签的运行状态和间隔时间
4. **灵活控制**：支持通过属性、方法或事件来控制自动抽签
5. **事件通知**：每次自动抽签执行都会触发事件，方便外部监听

## 注意事项

1. 组件销毁时会自动清除定时器
2. 自动抽签只在有玩家数据时执行
3. 可以通过 `autoRandomInterval` 属性调整抽签间隔
4. 自动抽签不会显示Toast提示，避免频繁弹窗
5. 手动点击"抽签排序"按钮仍然有效，会显示Toast提示
