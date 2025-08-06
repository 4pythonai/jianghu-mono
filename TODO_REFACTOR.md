# 配置组件重构任务清单

## 第一阶段：创建工具类

### 1. 创建配置解析工具类
- [x] 创建 `utils/configParser.js`
- [x] 实现 `parseParPlus()` 方法 - 解析 Par+X 格式
- [x] 实现 `parseDoubleParPlus()` 方法 - 解析 DoublePar+X 格式  
- [x] 实现 `parseDiff()` 方法 - 解析 Diff_X 格式
- [x] 实现 `parseMeatAs()` 方法 - 解析 MEAT_AS_X 格式
- [x] 实现 `parseEatingRange()` 方法 - 解析 eatingRange JSON字符串
- [x] 添加单元测试和错误处理

### 2. 创建显示值格式化工具类
- [x] 创建 `utils/displayFormatter.js`
- [x] 实现 `formatKoufenRule()` 方法 - 格式化扣分规则显示
- [x] 实现 `formatDrawRule()` 方法 - 格式化顶洞规则显示
- [x] 实现 `formatMeatRule()` 方法 - 格式化吃肉规则显示
- [x] 添加边界情况处理和默认值

### 3. 创建数据转换工具类
- [x] 创建 `utils/configConverter.js`
- [x] 实现 `toConfigData()` 方法 - 将组件状态转换为配置数据
- [x] 实现 `fromConfigData()` 方法 - 将配置数据转换为组件状态
- [x] 支持所有8421组件的配置格式

## 第二阶段：创建基础组件类

### 4. 创建基础配置组件
- [x] 创建 `components/base/BaseConfigComponent.js`
- [x] 实现通用的 `initConfigData()` 方法
- [x] 实现通用的生命周期管理
- [x] 定义子类必须实现的抽象方法
- [x] 添加错误处理和日志记录

## 第三阶段：重构现有组件

### 5. 重构 E8421Koufen 组件
- [x] 引入工具类
- [x] 简化 `parseStoredConfig()` 方法
- [x] 简化 `updateDisplayValue()` 方法
- [x] 简化 `getConfigData()` 方法
- [ ] 测试功能完整性

### 6. 重构 Draw8421 组件
- [x] 引入工具类
- [x] 简化 `initConfigData()` 方法
- [x] 简化 `updateDisplayValue()` 方法
- [x] 简化 `getConfigData()` 方法
- [ ] 测试功能完整性

### 7. 重构 E8421Meat 组件
- [x] 引入工具类
- [x] 简化 `initConfigData()` 方法
- [x] 简化 `updateDisplayValue()` 方法
- [x] 简化 `getConfigData()` 方法
- [ ] 测试功能完整性

## 第四阶段：测试和优化

### 8. 全面测试
- [x] 修复编辑界面显示值问题
- [ ] 测试 SysEdit 页面创建规则功能
- [ ] 测试 UserRuleEdit 页面编辑规则功能
- [ ] 测试所有组件的回显功能
- [ ] 测试边界情况和错误处理

### 9. 代码优化
- [ ] 移除重复代码
- [ ] 优化性能
- [ ] 添加详细注释
- [ ] 更新文档

## 当前进度
- [x] 分析重复代码
- [x] 制定重构计划
- [x] 完成第一阶段：创建工具类
  - [x] 创建配置解析工具类 (`utils/configParser.js`)
  - [x] 创建显示值格式化工具类 (`utils/displayFormatter.js`)
  - [x] 创建数据转换工具类 (`utils/configConverter.js`)
- [x] 完成第二阶段：创建基础组件类
  - [x] 创建基础配置组件 (`components/base/BaseConfigComponent.js`)
- [x] 完成第三阶段：重构现有组件
  - [x] 重构 E8421Koufen 组件
  - [x] 重构 Draw8421 组件
  - [x] 重构 E8421Meat 组件

## 下一步
开始第四阶段第8项：全面测试 