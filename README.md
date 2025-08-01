# 高尔夫小程序 - 四人拉丝功能

## 项目概述
这是一个微信小程序项目，主要功能是高尔夫比赛管理和规则配置。最近新增了"四人拉丝"功能，与现有的"8421"功能保持平行结构。

## 四人拉丝功能实现

### 功能描述
四人拉丝是高尔夫比赛中的一种特殊规则，当玩家得分满足特定条件时，会触发额外的比赛机制。

### 文件结构
```
pages/ruleConfig/4player/4p-lasi/
├── 4p-lasi.js          # 页面逻辑
├── 4p-lasi.wxml        # 页面结构
├── 4p-lasi.wxss        # 页面样式
└── 4p-lasi.json        # 页面配置

stores/gamble/4p/4p-lasi/
└── gamble_4P_lasi_Store.js  # 状态管理

components/Gamble/8421_configItems/drawlasiConfig/
├── drawlasiConfig.js   # 拉丝配置组件
├── drawlasiConfig.wxml # 组件结构
├── drawlasiConfig.wxss # 组件样式
└── drawlasiConfig.json # 组件配置
```

### 主要功能
1. **规则配置页面**: 用户可以配置四人拉丝的具体规则
2. **拉丝规则选项**: 
   - 无拉丝
   - 得分打平
   - 得分1-5分以内
3. **状态管理**: 使用MobX进行状态管理
4. **数据持久化**: 支持保存到"我的规则"

### 路由配置
- 页面路径: `/pages/ruleConfig/4player/4p-lasi/4p-lasi`
- 在`app.json`中已注册
- 在`SysRule`组件中已配置跳转逻辑

### 使用方法
1. 在规则页面点击"四人拉丝"卡片
2. 进入配置页面设置规则名称
3. 配置拉丝触发条件
4. 配置扣分规则和吃肉规则
5. 点击"添加至我的规则"保存

### 技术特点
- 使用微信小程序原生框架
- 采用MobX进行状态管理
- 组件化开发，代码复用性高
- 响应式设计，适配不同设备
- 遵循微信小程序设计规范

## 开发规范
- 使用可选链操作符 `?.`
- 使用模板字符串而非字符串拼接
- API调用统一使用POST方法
- 不支持CSS伪元素(::before/::after)
- WXSS calc写法: `height: ~"calc(100vh - 80rpx)"`

## 更新日志
- 2024年: 新增四人拉丝功能，与8421功能保持平行结构
- 2024年: 修复四人拉丝吃肉功能，添加缺失的store属性和方法
  - 在 `G4PLasiStore` 中添加 `meat_value_config_string` 和 `meat_max_value` 属性
  - 添加 `updateEatmeatRule` 方法，与8421 store保持一致
  - 修复 `parseInt` 为 `Number.parseInt` 的linter错误

