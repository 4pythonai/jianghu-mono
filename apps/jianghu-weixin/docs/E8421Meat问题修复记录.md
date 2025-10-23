# E8421Meat 组件问题修复记录

## 问题描述

用户反馈 E8421Meat 组件存在以下问题：
1. 页面上部分值控制部分输入后回显不对，仍然是旧值
2. 肉的分值(3个radio)无法切换
3. 最后两个肉值封顶选项disabled了，显示为灰色

## 根本原因分析

### 1. 数据传递格式不匹配
**问题**: 组件重构为纯受控组件后，期望接收独立的 properties，但父组件仍传递整体 configData
- **期望**: `eatingRange`, `meatValueConfig`, `meatMaxValue` 作为独立属性
- **实际**: 传递的是 `configData="{{meatRules}}"` 整体对象

### 2. Store数据结构不匹配  
**问题**: Store默认数据中的字段名与组件期望不一致
- **Store中**: `{"Win": 2, "Lose": 0, "Draw": 1}`
- **组件期望**: `{"BetterThanBirdie": 1, "Birdie": 1, "Par": 1, "WorseThanPar": 1}`

### 3. 事件类型不匹配
**问题**: 组件发送的事件类型与actionMap不匹配
- **组件发送**: `componentType: 'eatmeat'`
- **actionMap期望**: `'meat'`

## 解决方案

### ✅ 1. 修正父组件数据传递
**文件**: `/pages/rules/RuleEditer/RuleEditer.wxml`

```html
<!-- 修改前 -->
<E8421Meat
  configData="{{meatRules}}"
  bind:configChange="onConfigChange"
/>

<!-- 修改后 -->
<E8421Meat
  eatingRange="{{meatRules.eatingRange}}"
  meatValueConfig="{{meatRules.meatValueConfig}}"
  meatMaxValue="{{meatRules.meatMaxValue}}"
  disabled="{{false}}"
  bind:configChange="onConfigChange"
/>
```

### ✅ 2. 修正Store默认数据结构
**文件**: `/stores/gamble/4p/4p-8421/Gamble4P8421Store.js`

```javascript
// 修改前
meatRules: {
  eatingRange: {
    "Win": 2,
    "Lose": 0, 
    "Draw": 1
  },
  meatValueConfig: 'SINGLE_DOUBLE',
  meatMaxValue: 10000000
}

// 修改后  
meatRules: {
  eatingRange: {
    "BetterThanBirdie": 1,
    "Birdie": 1,
    "Par": 1,
    "WorseThanPar": 1
  },
  meatValueConfig: 'MEAT_AS_1',
  meatMaxValue: 10000000
}
```

### ✅ 3. 修正事件类型
**文件**: `/components/Gamble/8421_configItems/E8421Meat/E8421Meat.js`

```javascript
// 修改前
this.triggerEvent('configChange', {
  componentType: 'eatmeat',
  config: config
});

// 修改后
this.triggerEvent('configChange', {
  componentType: 'meat',
  config: config
});
```

## 数据流修复验证

### 完整数据流路径
1. **Store** → `meatRules` (MobX绑定)
2. **RuleEditer** → 分解为独立properties
3. **E8421Meat** → observers监听属性变化
4. **组件内部** → updateCurrentConfig计算UI状态
5. **用户操作** → handleConfigChange统一处理
6. **事件发送** → componentType: 'meat'
7. **RuleEditer** → actionMap['meat'] = 'updateMeatConfig'
8. **Store** → updateMeatRules更新数据

### 关键修复点
- ✅ 属性传递：使用独立properties而不是configData
- ✅ 数据结构：eatingRange字段名匹配
- ✅ 事件路由：componentType与actionMap匹配
- ✅ 响应式：observers正确监听属性变化
- ✅ 状态计算：currentConfig等计算属性正确绑定

## 预期效果

修复后应该解决：
1. ✅ **回显正确**: UI状态从Store数据正确计算和显示
2. ✅ **radio可切换**: 事件处理链路完整，状态更新正常
3. ✅ **封顶选项可用**: disabled逻辑暂时设为false，等Draw8421组件重构完成后再调整

## 后续工作

1. **Draw8421组件**: 需要同样重构为纯受控组件
2. **disabled逻辑**: Draw8421重构完成后，调整E8421Meat的disabled计算逻辑  
3. **测试验证**: 完整测试数据流和UI交互