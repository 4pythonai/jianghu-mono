# 扣分配置组件 (koufen)

## 功能说明

这是一个用于配置8421游戏扣分规则的弹窗组件。用户可以通过滚轮选择器自定义扣分的数值参数。

## 主要功能

### 1. 扣分开始条件配置
- **从帕+X开始扣分**: 用户可以通过滚轮选择器设置X的值 (范围:0-20)
- **从双帕+Y开始扣分**: 用户可以通过滚轮选择器设置Y的值 (范围:0-20)  
- **不扣分**: 选择此项时, 封顶和同伴惩罚选项会被禁用

### 2. 扣分封顶配置
- **不封顶**: 扣分没有上限
- **扣X分封顶**: 用户可以通过滚轮选择器设置封顶分数 (范围:1-21)

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
- `value`: String - 可选, 用于传入初始配置值

#### 返回数据 (Events)
- `cancel`: 用户取消配置
- `confirm`: 用户确认配置, 返回配置数据

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
    max8421SubValue: 2,           // 封顶分数数字, 10000000表示不封顶
    sub8421ConfigString: "Par+4", // 扣分开始条件:NoSub/Par+X/DoublePar+X
    duty_config: "NODUTY"          // 同伴惩罚配置:NODUTY/DUTY_CODITIONAL/DUTY_NEGATIVE
  }
}
```

## 数据格式说明

### 最新版本数据格式 (v2.2)
- **max8421_sub_value**: 纯数字类型
  - 具体数字:表示封顶分数, 如 `2` 表示扣2分封顶
  - `10000000`:表示不封顶(统一使用大数值, 避免null)
- **sub8421_config_string**: 字符串格式
  - `"NoSub"` - 不扣分
  - `"Par+4"` - 从帕+4开始扣分
  - `"DoublePar+0"` - 从双帕+0开始扣分
- **duty_config**: 字符串枚举格式
  - `"NODUTY"` - 不包负分
  - `"DUTY_CODITIONAL"` - 同伴顶头包负分
  - `"DUTY_NEGATIVE"` - 包负分

### 版本 v2.1 数据格式 - 已废弃
- **max8421_sub_value**: 数字类型, 如 `2` 表示扣2分封顶, `null` 表示不封顶
- **sub8421_config_string**: 同v2.2
- **duty_config**: 中文字符串, 如 `"不包负分"`

### 旧版本数据格式 (v1.0) - 已废弃
- **max8421_sub_value**: `"扣2分封顶"` 或 `"不封顶"`
- **sub8421_config_string**: `"从帕+4开始扣分"` 或 `"从双帕+0开始扣分"` 或 `"不扣分"`
- **partner_punishment**: `"不包负分"` 或 `"同伴顶头包负分"` 或 `"包负分"`

## 数据示例对比

### v2.2格式(当前)
```javascript
// 有封顶的情况
{
  max8421SubValue: 2,           // 扣2分封顶
  sub8421ConfigString: "Par+4", // 从帕+4开始扣分
  duty_config: "NODUTY"          // 不包负分
}

// 不封顶的情况
{
  max8421SubValue: 10000000,    // 不封顶(大数值表示)
  sub8421ConfigString: "NoSub", // 不扣分
  duty_config: "DUTY_NEGATIVE"   // 包负分
}
```

### v2.1格式(已废弃)
```javascript
{
  max8421SubValue: null,        // 不封顶(null表示)
  sub8421ConfigString: "Par+4",
  duty_config: "不包负分"        // 中文字符串
}
```

### v1.0格式(已废弃)
```javascript
{
  max8421SubValue: "扣2分封顶",
  sub8421ConfigString: "从帕+4开始扣分",
  partner_punishment: "不包负分"  // 旧字段名
}
```

## 枚举值映射表

### duty_config 枚举映射
| UI显示文本 | 枚举值 | API传输值 | 含义 |
|------------|--------|-----------|------|
| 不包负分 | 0 | `NODUTY` | 同伴不承担负分 |
| 同伴顶头包负分 | 1 | `DUTY_CODITIONAL` | 同伴承担顶头包负分 |
| 包负分 | 2 | `DUTY_NEGATIVE` | 同伴完全承担负分 |

### sub8421_config_string 格式映射
| UI显示文本 | 枚举值 | API传输值 | 含义 |
|------------|--------|-----------|------|
| 从帕+X开始扣分 | 0 | `Par+X` | 从帕+X开始扣分 |
| 从双帕+Y开始扣分 | 1 | `DoublePar+Y` | 从双帕+Y开始扣分 |
| 不扣分 | 2 | `NoSub` | 不进行扣分 |

## 自定义数值范围

### 默认数值范围
- 帕分数范围: 0-20
- 双帕分数范围: 0-20
- 封顶分数范围: 1-21

### 修改数值范围
如需修改数值范围, 可以在组件的data中调整:

```javascript
data: {
  paScoreRange: Array.from({length: 31}, (_, i) => i), // 修改为0-30
  doubleParScoreRange: Array.from({length: 21}, (_, i) => i), // 保持0-20
  maxSubScoreRange: Array.from({length: 10}, (_, i) => i + 1), // 修改为1-10
}
```

## 兼容性处理

组件的 `parseStoredConfig` 方法支持自动识别和转换不同版本的数据格式:

```javascript
// 自动识别新旧格式
if (partnerPunishment) {
  let selectedDuty = 0;
  switch (partnerPunishment) {
    case 'NODUTY':           // 新格式
      selectedDuty = 0;
      break;
    case 'DUTY_CODITIONAL':  // 新格式
      selectedDuty = 1;
      break;
    case 'DUTY_NEGATIVE':    // 新格式
      selectedDuty = 2;
      break;
    default:
      // 兼容旧格式中文字符串
      const dutyOptions = ['不包负分', '同伴顶头包负分', '包负分'];
      const index = dutyOptions.indexOf(partnerPunishment);
      if (index !== -1) {
        selectedDuty = index;
      }
  }
}
```

## 注意事项

1. 当选择"不扣分"时, 封顶和同伴惩罚选项会自动禁用
2. 滚轮选择器会在选中对应选项时才显示
3. 数值的显示采用绿色圆角按钮样式, 提供良好的用户体验
4. 所有配置会自动保存到G_4P_8421_Store中
5. **新版本使用纯数字格式, 10000000表示不封顶, 避免null值处理**
6. **统一数据类型简化了API处理逻辑**
7. **dutyconfig使用英文枚举格式, 便于国际化**
8. **组件支持新旧格式的自动转换, 确保向后兼容**

## 样式说明

- 使用模态弹窗样式, 底部弹出
- 绿色主题色 (#4caf7a)
- 数字选择器采用圆角按钮设计
- 支持禁用状态的视觉反馈
- 响应式布局, 适配不同屏幕尺寸

## 常量建议

建议在项目中定义常量以提高代码可维护性:

```javascript
// 推荐的常量定义
const NO_LIMIT_VALUE = 10000000; // 表示不封顶

// duty_config 枚举常量
const DUTY_CONFIG = {
  NODUTY: 'NODUTY',
  DUTY_CODITIONAL: 'DUTY_CODITIONAL',
  DUTY_NEGATIVE: 'DUTY_NEGATIVE'
};

// 使用示例
if (max8421SubValue === NO_LIMIT_VALUE) {
  // 处理不封顶的情况
}

const duty_config = DUTY_CONFIG.NODUTY;
``` 