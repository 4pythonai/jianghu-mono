# RuleCard 统一规则卡片组件

## 概述

`RuleCard` 是一个统一的规则卡片组件，用于替代之前为每个规则类型单独创建的组件。它根据传入的规则数据动态渲染不同的内容，大大减少了代码重复和维护成本。

## 优势

### 1. 统一管理
- 所有规则类型的显示逻辑集中在一个组件中
- 样式和交互行为保持一致
- 便于统一修改和维护

### 2. 易于扩展
- 新增规则类型只需在 `gambleRuleParser.js` 中添加解析器
- 无需创建新的组件文件
- 自动支持新的规则类型

### 3. 代码复用
- 消除了重复的组件代码
- 减少了文件数量
- 提高了开发效率

## 使用方法

### 在 WXML 中使用
```xml
<RuleCard
  item="{{ ruleItem }}"
  showEdit="{{ true }}"
  bind:editRule="onEditRule"
  bind:viewRule="onViewRule"
  bind:longPressRule="onLongPressRule"
/>
```

### 组件属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| item | Object | {} | 规则数据对象 |
| showEdit | Boolean | false | 是否显示编辑按钮 |

### 事件

| 事件名 | 说明 | 参数 |
|--------|------|------|
| editRule | 编辑规则 | { item, group, id } |
| viewRule | 查看规则 | { item, group, id } |
| longPressRule | 长按规则 | { item, group, id } |

## 规则类型支持

组件自动支持以下规则类型：

### 4人游戏
- `4p-8421` - 4人8421规则
- `4p-lasi` - 4人拉丝规则

### 3人游戏
- `3p-8421` - 3人8421规则
- `3p-lasi` - 3人拉丝规则

### 2人游戏
- `2p-8421` - 2人8421规则
- `2p-lasi` - 2人拉丝规则

## 扩展新规则类型

### 1. 添加解析器
在 `utils/ruleParser/` 目录下创建新的解析器文件，例如 `Parser4p-new.js`：

```javascript
export function parse4PNewConfig(item) {
    return {
        koufen: '解析扣分配置',
        eatmeat: '解析吃肉配置',
        // 其他配置项...
    };
}
```

### 2. 注册解析器
在 `utils/gambleRuleParser.js` 中添加新的解析器：

```javascript
import { parse4PNewConfig } from './ruleParser/Parser4p-new.js';

function parseGambleRule(item, tag) {
    switch (tag) {
        case '4p-new':
            return parse4PNewConfig(item);
        // 其他case...
    }
}
```

### 3. 添加规则类型映射
在 `RuleCard.js` 的 `getRuleTypeInfo` 方法中添加新规则类型：

```javascript
getRuleTypeInfo(gambleSysName) {
    const ruleTypeMap = {
        '4p-new': { playerCount: 4, ruleTypeLabel: '4人' },
        // 其他规则类型...
    };
    return ruleTypeMap[gambleSysName] || { playerCount: 0, ruleTypeLabel: '未知' };
}
```

## 样式定制

组件使用统一的样式文件 `RuleCard.wxss`，支持以下样式类：

- `.rule-item1` - 卡片容器
- `.rule-header` - 卡片头部
- `.rule-title` - 规则标题
- `.rule-type` - 规则类型标签
- `.rule-description` - 规则描述区域
- `.config-detail-item` - 配置详情项
- `.config-label` - 配置标签
- `.config-text` - 配置文本
- `.rule-footer` - 卡片底部
- `.action-btn` - 操作按钮

## 迁移指南

### 从旧组件迁移

1. **删除旧组件文件**
   - 删除 `RuleCard/4p/4p-8421/` 目录
   - 删除 `RuleCard/4p/4p-lasi/` 目录
   - 删除其他特定规则组件

2. **更新组件引用**
   - 在 `MyRules.json` 中移除旧组件引用
   - 添加 `RuleCard` 组件引用

3. **更新模板**
   - 将所有特定规则组件替换为 `RuleCard`
   - 移除条件判断逻辑

4. **测试功能**
   - 确保所有规则类型正常显示
   - 验证编辑、查看、长按功能正常

## 注意事项

1. **数据格式**：确保传入的 `item` 对象包含 `gambleSysName` 字段
2. **解析器**：新增规则类型时必须实现对应的解析器
3. **样式**：修改样式时注意保持所有规则类型的一致性
4. **性能**：组件会自动缓存解析结果，避免重复解析

## 未来规划

1. **动态配置**：支持通过配置文件定义规则类型
2. **主题定制**：支持不同主题的样式切换
3. **动画效果**：添加更丰富的交互动画
4. **国际化**：支持多语言显示 