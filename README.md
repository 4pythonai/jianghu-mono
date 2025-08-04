# 高尔夫小程序 - 规则管理模块

## 项目概述
这是一个微信小程序项目，主要用于高尔夫游戏规则的管理和配置。

## 规则页面功能说明

### 页面路径
- 主页面：`pages/rules/rules`
- 我的规则组件：`pages/rules/ruleComponents/MyRules`
- 添加规则组件：`pages/rules/ruleComponents/SysRule`

### 功能特性

#### 1. 我的规则 (MyRules组件)
**功能描述**：显示用户已创建的规则列表，支持查看、编辑和删除操作。

**主要功能**：
- 📋 获取用户规则列表（调用 `getUserGambleRules` API）
- 👁️ 查看规则详情（跳转到运行时配置页面）
- ✏️ 编辑现有规则
- 🗑️ 删除规则（调用 `deleteGambleRule` API）
- 🔄 下拉刷新规则列表
- 📱 支持分组显示（2人、3人、4人游戏）

**API接口**：
```javascript
// 获取用户规则列表
gambleAPI.getUserGambleRules({ group: 'fourPlayers' })

// 删除规则
gambleAPI.deleteGambleRule({ id: ruleId })
```

**数据格式**：
```javascript
{
  id: 1,
  gambleUserName: "我的4人拉丝规则",
  gamblesysname: "lasi",
  gambleSysName: "4p-lasi", // 系统规则名称
  createTime: "2024-01-01"
}
```

#### 2. 添加规则 (SysRule组件)
**功能描述**：创建新规则或编辑现有规则。

**主要功能**：
- ➕ 创建新规则（调用 `addGambleRule` API）
- ✏️ 编辑现有规则（调用 `updateGambleRule` API）
- 🎮 跳转到运行时配置页面进行详细配置
- ✅ 表单验证和错误处理

**API接口**：
```javascript
// 添加新规则
gambleAPI.addGambleRule({
  title: "规则标题",
  description: "规则描述",
  type: "default"
})

// 更新规则
gambleAPI.updateGambleRule({
  id: ruleId,
  title: "更新后的标题",
  description: "更新后的描述",
  type: "custom"
})
```

### 技术实现

#### 组件架构
```
rules/
├── rules.js          # 主页面逻辑
├── rules.wxml        # 主页面模板
├── rules.wxss        # 主页面样式
└── ruleComponents/   # 子组件
    ├── MyRules/      # 我的规则组件
    └── SysRule/      # 添加规则组件
```

#### 数据流
1. **页面加载** → 调用 `getUserGambleRules` API 获取规则列表
2. **添加规则** → 调用 `addGambleRule` API 保存新规则
3. **编辑规则** → 调用 `updateGambleRule` API 更新规则
4. **删除规则** → 调用 `deleteGambleRule` API 删除规则
5. **查看规则** → 跳转到运行时配置页面进行详细配置

#### 错误处理
- 网络请求失败时显示友好提示
- API返回错误时显示具体错误信息
- 表单验证失败时阻止提交

### 使用说明

#### 查看规则
1. 进入规则页面，默认显示"我的规则"标签
2. 点击规则卡片可查看规则详情
3. 长按规则卡片可进行编辑或删除操作

#### 添加规则
1. 点击"添加规则"标签
2. 填写规则基本信息（标题、描述、类型）
3. 点击"保存"按钮提交
4. 可选择跳转到运行时配置页面进行详细配置

#### 编辑规则
1. 在"我的规则"中长按要编辑的规则
2. 选择"编辑"选项
3. 在"添加规则"页面修改规则信息
4. 点击"保存"按钮更新规则

#### 删除规则
1. 在"我的规则"中长按要删除的规则
2. 选择"删除"选项
3. 确认删除操作

### 注意事项

1. **API依赖**：确保后端API接口正常工作
2. **网络状态**：需要稳定的网络连接
3. **权限控制**：用户需要登录才能管理规则
4. **数据同步**：规则变更后会自动刷新列表

### 开发说明

#### 调试模式
- 组件中保留了 `getMockRules` 方法作为备用
- 可在开发阶段切换使用模拟数据

#### 扩展功能
- 支持添加更多规则类型
- 可扩展分组管理功能
- 支持规则模板功能

---

**版本**：1.0.0  
**最后更新**：2024年1月  
**开发者**：AI助手

