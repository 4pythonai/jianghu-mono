# 规则页面重构总结

## 重构目标

将原本20个独立的规则配置页面统一为2个通用页面，提高代码复用性和维护性。

## 重构前后对比

### 重构前
```
pages/ruleConfig/
├── 2player/
│   ├── 2p-gross/2p-gross.js
│   ├── 2p-hole/2p-hole.js
│   └── 2p-8421/2p-8421.js
├── 3player/
│   ├── 3p-doudizhu/3p-doudizhu.js
│   ├── 3p-dizhupo/3p-dizhupo.js
│   └── 3p-8421/3p-8421.js
├── 4player/
│   ├── 4p-lasi/4p-lasi.js
│   ├── 4p-8421/4p-8421.js
│   ├── 4p-dizhupo/4p-dizhupo.js
│   ├── 4p-3da1/4p-3da1.js
│   └── 4p-bestak/4p-bestak.js
└── mplayer/
    ├── mp-labahua/mp-labahua.js
    └── mp-dabudui/mp-dabudui.js
```

**问题：**
- 20个页面，大量重复代码
- 新增游戏类型需要创建新页面
- 维护成本高
- 配置逻辑分散

### 重构后
```
pages/rules/
├── rules.js (主页面)
├── SysEdit/SysEdit.js (系统规则配置)
├── UserRuleEdit/UserRuleEdit.js (用户规则编辑)
└── ruleComponents/
    ├── MyRules/ (我的规则列表)
    ├── SysRule/ (系统规则列表)
    └── ConfigWrapper/ (配置组件包装器)
```

**优势：**
- 2个通用页面，代码复用
- 新增游戏类型只需添加配置组件
- 维护成本低
- 配置逻辑统一

## 核心设计

### 1. 页面分工
- **SysEdit**: 系统规则配置（新增规则）
- **UserRuleEdit**: 用户规则编辑（编辑已有规则）

### 2. 配置组件模式
- **SysConfig模式**: 显示默认配置，用于新增规则
- **UserEdit模式**: 显示当前配置，用于编辑规则

### 3. 动态组件加载
根据游戏类型动态加载对应的配置组件：
```javascript
switch (gameType) {
  case '4p-8421':
    components = [
      { name: 'E8421Koufen', title: '扣分规则' },
      { name: 'Draw8421', title: '顶洞规则' },
      { name: 'E8421Meat', title: '吃肉规则' }
    ];
    break;
  case '4p-lasi':
    components = [
      { name: 'LasiKoufen', title: '扣分规则' },
      { name: 'LasiKPI', title: 'KPI规则' },
      // ...
    ];
    break;
}
```

## 使用方法

### 1. 系统规则配置
```javascript
// 从SysRule组件跳转
wx.navigateTo({
  url: `/pages/rules/SysEdit/SysEdit?gameType=4p-8421`
});
```

### 2. 用户规则编辑
```javascript
// 从MyRules组件跳转
wx.navigateTo({
  url: `/pages/rules/UserRuleEdit/UserRuleEdit?ruleId=123`
});
```

### 3. 配置组件适配
为现有配置组件添加模式支持：
```javascript
Component({
  properties: {
    mode: { type: String, value: 'SysConfig' },
    configData: { type: Object, value: null }
  },
  
  methods: {
    // 获取配置数据
    getConfigData() { /* ... */ },
    
    // 初始化配置数据
    initConfigData(configData) { /* ... */ }
  }
});
```

## 扩展指南

### 添加新游戏类型
1. 在 `loadConfigComponents` 方法中添加新的 case
2. 确保对应的配置组件已存在
3. 在 `ConfigWrapper` 中添加组件引用

### 添加新配置组件
1. 创建新的配置组件
2. 实现 `getConfigData` 和 `initConfigData` 方法
3. 在 `ConfigWrapper` 中添加组件引用
4. 在对应页面的 JSON 文件中添加组件声明

## 优势总结

1. **代码复用**: 从20个页面减少到2个页面
2. **维护简单**: 新增游戏类型只需配置组件
3. **逻辑统一**: 配置逻辑集中管理
4. **用户体验**: 统一的配置界面
5. **扩展性强**: 易于添加新的游戏类型和配置组件

## 注意事项

1. 现有配置组件需要逐步适配新模式
2. 需要确保API接口支持新的数据格式
3. 建议逐步迁移，避免一次性大改动
4. 需要充分测试各种游戏类型的配置功能 