# 规则页面重构方案

## 当前问题
- 20个游戏类型，每个都有独立的配置页面
- 大量重复代码（规则名称输入、保存逻辑等）
- 维护成本高，新增游戏类型需要创建新页面

## 重构方案

### 1. 新增页面结构

#### SysEdit 页面（系统规则配置）
- **路径**: `pages/rules/SysEdit/SysEdit`
- **功能**: 配置新的系统规则
- **模式**: `SysConfig` 模式
- **参数**: `gameType` (如 '4p-8421', '4p-lasi')

#### UserRuleEdit 页面（用户规则编辑）
- **路径**: `pages/rules/UserRuleEdit/UserRuleEdit`
- **功能**: 编辑用户自定义规则
- **模式**: `UserEdit` 模式
- **参数**: `ruleId` (规则ID)

### 2. 配置组件模式

#### SysConfig 模式
- 用于系统规则配置
- 显示默认配置值
- 保存时创建新规则

#### UserEdit 模式
- 用于用户规则编辑
- 显示当前规则配置值
- 保存时更新现有规则

### 3. 路由更新

#### 系统规则跳转
```
SysRule 组件 -> SysEdit 页面
参数: gameType
```

#### 用户规则编辑
```
MyRules 组件 -> UserRuleEdit 页面
参数: ruleId
```

### 4. 配置组件适配

所有配置组件需要支持两种模式：
- `mode`: 'SysConfig' | 'UserEdit'
- `configData`: 配置数据对象

### 5. 优势

1. **代码复用**: 配置组件在两个页面中复用
2. **维护简单**: 新增游戏类型只需添加配置组件
3. **逻辑统一**: 配置逻辑集中管理
4. **用户体验**: 统一的配置界面

## 实施步骤

1. ✅ 创建 `SysEdit` 页面
2. ✅ 创建 `UserRuleEdit` 页面
3. ✅ 更新配置组件支持模式切换
4. ✅ 更新路由跳转逻辑
5. 🔄 测试和优化

## 已完成的工作

### 1. 新增页面
- ✅ `pages/rules/SysEdit/SysEdit` - 系统规则配置页面
- ✅ `pages/rules/UserRuleEdit/UserRuleEdit` - 用户规则编辑页面

### 2. 配置组件适配
- ✅ 为 `E8421Koufen` 组件添加模式支持
- ✅ 创建 `ConfigWrapper` 组件包装器
- ✅ 支持 `SysConfig` 和 `UserEdit` 两种模式

### 3. 路由更新
- ✅ 更新 `SysRule` 组件跳转到 `SysEdit` 页面
- ✅ 更新 `MyRules` 组件跳转到 `UserRuleEdit` 页面
- ✅ 在 `app.json` 中添加新页面路由

### 4. 功能特性
- ✅ 动态加载配置组件
- ✅ 支持配置数据的获取和初始化
- ✅ 统一的保存和取消逻辑
- ✅ 错误处理和用户提示
- ✅ 修复了UserRuleEdit页面加载规则失败的问题

## 文件结构

```
pages/rules/
├── rules.js (主页面)
├── SysEdit/
│   ├── SysEdit.js
│   ├── SysEdit.wxml
│   ├── SysEdit.wxss
│   └── SysEdit.json
├── UserRuleEdit/
│   ├── UserRuleEdit.js
│   ├── UserRuleEdit.wxml
│   ├── UserRuleEdit.wxss
│   └── UserRuleEdit.json
└── ruleComponents/
    ├── MyRules/
    ├── SysRule/
    └── ConfigWrapper/ (新增：配置组件包装器)
``` 