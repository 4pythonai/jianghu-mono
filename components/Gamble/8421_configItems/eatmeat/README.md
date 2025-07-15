# 吃肉配置组件 (eatmeat)

## 功能说明

这是一个用于配置8421游戏吃肉规则的弹窗组件。用户可以通过滚轮选择器自定义吃肉数量和封顶分数。

## 主要功能

### 1. 吃肉数量配置
- **帕以上**: 用户可以通过滚轮选择器设置吃肉数量 (范围：1-20)
- **帕**: 用户可以通过滚轮选择器设置吃肉数量 (范围：1-20)
- **鸟**: 用户可以通过滚轮选择器设置吃肉数量 (范围：1-20)
- **鸟以下**: 用户可以通过滚轮选择器设置吃肉数量 (范围：1-20)

### 2. 肉的分值计算
- **肉算1分**: 每个肉固定算1分
- **分值翻倍**: 肉的分值翻倍计算
- **分值连续翻倍**: 肉的分值连续翻倍计算

### 3. 肉值封顶配置
- **不封顶**: 肉值没有上限
- **X分封顶**: 用户可以通过滚轮选择器设置封顶分数 (范围：1-20)

## 使用方法

### 在页面中使用

```javascript
// 页面js文件
Page({
  data: {
    showEatmeatConfig: false
  },
  
  // 显示配置弹窗
  showEatmeatConfig() {
    this.setData({ showEatmeatConfig: true });
  },
  
  // 取消配置
  onEatmeatCancel() {
    this.setData({ showEatmeatConfig: false });
  },
  
  // 确认配置
  onEatmeatConfirm(e) {
    const configData = e.detail;
    console.log('吃肉配置:', configData);
    this.setData({ showEatmeatConfig: false });
  }
});
```

```xml
<!-- 页面wxml文件 -->
<eatmeat 
  visible="{{showEatmeatConfig}}"
  bind:cancel="onEatmeatCancel"
  bind:confirm="onEatmeatConfirm">
</eatmeat>
```

### 配置数据结构

#### 传入数据 (Properties)
- `visible`: Boolean - 控制弹窗显示/隐藏
- `value`: Object - 可选，用于传入初始配置值

#### 返回数据 (Events)
- `cancel`: 用户取消配置
- `confirm`: 用户确认配置，返回配置数据

#### confirm事件返回的数据结构
```javascript
{
  value: {
    eatList: [
      { label: '帕以上', value: 1 },
      { label: '帕', value: 1 },
      { label: '鸟', value: 1 },
      { label: '鸟以下', value: 1 }
    ],
    scoreSelected: 0,     // 选中的分值计算方式索引
    topSelected: 0,       // 选中的封顶条件索引
    topScoreLimit: 3      // 封顶分数
  },
  parsedData: {
    eating_range: [...],              // 吃肉得分配对数组
    meatValueConfig: "MEAT_AS_1",    // 新格式：MEAT_AS_X/SINGLE_DOUBLE/CONTINUE_DOUBLE
    meat_max_value	: 3                  // 封顶分数数字，10000000表示不封顶
  }
}
```

## 数据格式说明

### 最新版本数据格式 (v2.1)
- **meat_value_config_string**: 字符串格式
  - `"MEAT_AS_1"` - 肉算1分(可扩展为MEAT_AS_X)
  - `"SINGLE_DOUBLE"` - 分值翻倍
  - `"CONTINUE_DOUBLE"` - 分值连续翻倍
- **meat_max_value	**: 纯数字类型
  - 具体数字：表示封顶分数，如 `3` 表示3分封顶
  - `10000000`：表示不封顶(统一使用大数值，避免null)

### 版本 v2.0 数据格式 - 已废弃
- **meat_value_config_string**: 同v2.1
- **meat_max_value	**: 数字类型，如 `3` 表示3分封顶，`null` 表示不封顶

### 旧版本数据格式 (v1.0) - 已废弃
- **meat_value_config_string**: `"肉算1分"` 或 `"分值翻倍"` 或 `"分值连续翻倍"`
- **meat_max_value	**: `"3分封顶"` 或 `"不封顶"`

## 数据示例对比

### v2.1格式(当前)
```javascript
// 有封顶的情况
{
  eating_range: [
    { label: '帕以上', value: 1 },
    { label: '帕', value: 2 },
    { label: '鸟', value: 3 },
    { label: '鸟以下', value: 1 }
  ],
  meatValueConfig: "SINGLE_DOUBLE", // 分值翻倍
  meat_max_value	: 5                   // 5分封顶
}

// 不封顶的情况
{
  eating_range: [...],
  meatValueConfig: "MEAT_AS_1",     // 肉算1分
  meat_max_value	: 10000000            // 不封顶(大数值表示)
}
```

### v2.0格式(已废弃)
```javascript
{
  eating_range: [...],
  meatValueConfig: "MEAT_AS_1",
  meat_max_value	: null                // 不封顶(null表示)
}
```

## 自定义数值范围

### 默认数值范围
- 吃肉数量范围: 1-20
- 封顶分数范围: 1-20

### 修改数值范围
如需修改数值范围，可以在组件的data中调整：

```javascript
data: {
  eatValueRange: Array.from({length: 30}, (_, i) => i + 1), // 修改为1-30
  topScoreRange: Array.from({length: 10}, (_, i) => i + 1), // 修改为1-10
}
```

## 主要改进

### 从输入框改为滚轮选择器
- **原来**: 通过输入框手动输入吃肉数量
- **现在**: 通过滚轮选择器选择吃肉数量，操作更便捷
- **优势**: 避免输入错误，提供更好的用户体验

### 封顶分数可编辑
- **原来**: 固定的"3分封顶"
- **现在**: 可以通过滚轮选择器自定义封顶分数
- **范围**: 1-20分可选

### 数据格式标准化
- **v1.0**: 使用中文描述字符串，如"肉算1分"
- **v2.0**: 使用英文枚举格式，如"MEAT_AS_1"，null表示不封顶
- **v2.1**: 使用英文枚举格式，如"MEAT_AS_1"，10000000表示不封顶
- **优势**: 更适合API传输和国际化，统一数据类型避免null值处理

## 注意事项

1. 当游戏设置为"不扣分"时，此组件的相关选项会被禁用
2. 滚轮选择器会在选中对应选项时才显示
3. 数值的显示采用绿色圆角按钮样式，提供良好的用户体验
4. 所有配置会自动保存到G_4P_8421_Store中
5. 组件支持从store加载之前保存的配置
6. **新版本使用纯数字格式，10000000表示不封顶，避免null值处理**
7. **统一数据类型简化了API处理逻辑**

## 样式说明

- 使用模态弹窗样式，底部弹出
- 绿色主题色 (#4caf7a)
- 数字选择器采用圆角按钮设计
- 吃肉数量选择器采用较小的圆角设计
- 封顶分数选择器采用圆形按钮设计
- 支持禁用状态的视觉反馈

## 常量建议

建议在项目中定义常量以提高代码可维护性：

```javascript
// 推荐的常量定义
const NO_LIMIT_VALUE = 10000000; // 表示不封顶

// 使用示例
if (meat_max_value	 === NO_LIMIT_VALUE) {
  // 处理不封顶的情况
}
``` 