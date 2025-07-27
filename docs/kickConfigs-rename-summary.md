# kickConfig 字段重命名为 kickConfigs 修改总结

## 修改概述

将 `gameStore` 中的 `kickConfig` 字段重命名为 `kickConfigs`，以更好地反映这是一个数组类型的数据结构。

## 修改的文件

### 1. stores/gameStore.js
- **字段定义**：`kickConfig: []` → `kickConfigs: []`
- **方法更新**：`updateRuntimeMultipliers` 方法中的所有 `kickConfig` 引用
- **数据获取**：`fetchGameDetail` 方法中的数据赋值
- **状态返回**：`getState` 方法中的字段名

### 2. pages/gameDetail/RuntimeConfigList/gamblOperationComponent/kickoff/kickoff.js
- **数据定义**：`kickConfig: []` → `kickConfigs: []`
- **MobX 绑定**：`kickConfig: 'kickConfig'` → `kickConfigs: 'kickConfigs'`
- **观察者**：`'kickConfig'` → `'kickConfigs'`
- **方法更新**：所有方法中的 `kickConfig` 引用都改为 `kickConfigs`

### 3. README.md
- **文档更新**：数据结构说明中的字段名
- **功能描述**：更新相关功能说明

## 修改的字段列表

### gameStore.js
```javascript
// 字段定义
kickConfigs: [], // 新增：运行时倍数数据

// 方法中的引用
this.kickConfigs.findIndex(...)
this.kickConfigs[existingIndex].holeMultipliers = ...
this.kickConfigs.push(...)
this.kickConfigs = res.kickConfigs || []  // 修复：API 返回字段名
kickConfigs: this.kickConfigs
```

### kickoff.js
```javascript
// 数据定义
kickConfigs: [],

// MobX 绑定
kickConfigs: 'kickConfigs'

// 观察者
'kickConfigs': function (kickConfigs) { ... }

// 方法中的引用
const { kickConfigs } = this.data;
this.data.kickConfigs
this.setData({ kickConfigs: updatedRuntimeMultipliers });
```

## 重要修复

### API 字段名修复
**问题**：在 `fetchGameDetail` 方法中，错误地使用了 `res.kickConfig` 而不是 `res.kickConfigs`
**修复**：将 `res.kickConfig` 改为 `res.kickConfigs`，与后端 API 返回的字段名保持一致

```javascript
// 修复前
this.kickConfigs = res.kickConfig || [];

// 修复后
this.kickConfigs = res.kickConfigs || [];
```

### 后端 API 返回格式
```php
echo json_encode([
    'code' => 200, 
    'game_detail' => $game_detail, 
    'red_blue' => $red_blue, 
    'kickConfigs' => $this->getHoleMultiplier($game_id)
], JSON_UNESCAPED_UNICODE);
```

## 影响范围

1. **数据存储**：`gameStore` 中的运行时倍数数据
2. **组件绑定**：`kickoff` 组件与 `gameStore` 的数据绑定
3. **UI 显示**：洞选择界面中的倍数配置显示
4. **连锁设置**：踢一脚功能中的倍数连锁设置

## 注意事项

1. **API 兼容性**：后端 API 返回的字段名是 `kickConfigs`，前端现在正确映射
2. **数据一致性**：确保所有相关组件都使用新的字段名
3. **测试验证**：需要验证踢一脚功能是否正常工作

## 验证步骤

1. 检查 `gameStore` 中的数据是否正确加载
2. 验证 `kickoff` 组件是否能正确获取倍数数据
3. 测试踢一脚功能中的连锁设置是否正常
4. 确认洞选择界面中的倍数显示是否正确

## 调试信息

添加了详细的调试日志来帮助排查问题：

```javascript
// gameStore 中的调试信息
console.log('[gameStore] fetchGameDetail - API 返回数据:', {
    hasGameDetail: !!res.game_detail,
    hasRedBlue: !!res.red_blue,
    hasKickConfigs: !!res.kickConfigs,
    kickConfigsData: res.kickConfigs
});

// kickoff 组件中的调试信息
console.log('[kickoff] kickConfigs 数据变化');
console.log('[kickoff] kickConfigs 详细内容:', JSON.stringify(kickConfigs, null, 2));
```

## 相关功能

- 踢一脚功能
- 连锁设置倍数
- 洞倍数配置显示
- 运行时倍数数据管理 