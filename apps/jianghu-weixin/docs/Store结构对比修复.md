# Store结构对比修复说明

## 问题分析

通过对比 `Gamble4PLasiStore.js` 和 `Gamble4P8421Store.js`，发现了导致8421创建时提示"请输入规则名称"而lasi可以新建的根本原因。

## 🔍 结构对比

### 拉丝Store (Gamble4PLasiStore.js) ✅
```javascript
// 直接字段结构
gambleUserName: '',  // 直接字段

// 初始化方法
initializeStore: action(function (mode, sysname, existingData = null) {
  if (mode === 'create') {
    this.initializeForCreate();  // 调用专门的创建方法
  }
}),

// 专门的创建方法
initializeForCreate: action(function () {
  this.gambleUserName = this.generateDefaultName();  // 直接设置规则名称
})
```

### 8421 Store (修复前) ❌
```javascript
// 嵌套结构
config: {
  metadata: {
    ruleName: '',  // 嵌套在config.metadata中
  }
}

// 初始化方法
initialize: action(function (mode, existingData = null) {
  this.config.metadata = {
    ruleName: this.generateDefaultName(),  // 在初始化时设置
  };
})
```

## 🚨 核心问题

1. **数据结构不一致**：
   - 拉丝：`gambleUserName` (直接字段)
   - 8421：`config.metadata.ruleName` (嵌套字段)

2. **初始化方法不匹配**：
   - 拉丝：`initializeStore` + `initializeForCreate`
   - 8421：`initialize`

3. **字段绑定路径错误**：
   - 配置中绑定到 `config.metadata.ruleName`
   - 但页面期望的是 `gambleUserName`

## ✅ 修复方案

### 1. 统一数据结构

**修复前：**
```javascript
// 嵌套结构
config: {
  metadata: {
    ruleName: '',
  }
}
```

**修复后：**
```javascript
// 直接字段结构，与拉丝Store一致
gambleUserName: '',  // 直接字段
```

### 2. 统一初始化方法

**修复前：**
```javascript
initialize: action(function (mode, existingData = null) {
  // 单一初始化方法
})
```

**修复后：**
```javascript
// 与拉丝Store保持一致的API
initializeStore: action(function (mode, sysname, existingData = null) {
  if (mode === 'create') {
    this.initializeForCreate();
  }
}),

initializeForCreate: action(function () {
  this.gambleUserName = this.generateDefaultName();
})
```

### 3. 统一字段绑定

**修复前：**
```javascript
storeBindings: {
  fields: {
    gambleUserName: 'config.metadata.ruleName',  // 嵌套路径
  }
}
```

**修复后：**
```javascript
storeBindings: {
  fields: {
    gambleUserName: 'gambleUserName',  // 直接字段
  }
}
```

## 📝 修复后的效果

1. **数据结构统一**：两个Store都使用直接字段结构
2. **API接口一致**：都使用 `initializeStore` + `initializeForCreate` 模式
3. **字段绑定正确**：`gambleUserName` 字段可以正确绑定和更新
4. **规则名称自动生成**：8421创建时也会自动生成规则名称

## 🧪 测试验证

修复后，8421游戏类型应该能够：

1. ✅ 自动生成规则名称（如：`8421规则_14:30`）
2. ✅ 正确显示所有配置组件
3. ✅ 支持规则名称的编辑和保存
4. ✅ 与拉丝Store保持一致的API行为

## 相关文件

- `stores/gamble/4p/4p-8421/Gamble4P8421Store.js` - 主要修复文件
- `utils/GambleEditorConfig.js` - 字段绑定配置修复
- `stores/gamble/4p/4p-lasi/Gamble4PLasiStore.js` - 参考标准
