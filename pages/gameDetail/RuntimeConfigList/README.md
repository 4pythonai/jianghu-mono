# RuntimeConfigList 页面说明

## 功能概述

RuntimeConfigList 是游戏详情页面中的运行时配置列表模块，用于管理和展示游戏的所有运行时配置项。

## 主要功能

### 1. 游戏设置管理
- **游戏公开性设置**: 控制游戏是否公开显示
- **大风吹设置**: 控制是否启用大风吹功能
- **捐锅设置**: 配置捐锅相关参数
- **跳洞设置**: 配置跳洞功能
- **出发洞调整**: 调整游戏起始洞

### 2. 配置项管理
- **配置项列表展示**: 显示所有运行时配置
- **配置项详情查看**: 点击查看配置详情
- **配置项删除**: 删除不需要的配置
- **踢一脚功能**: 为特定配置设置踢一脚参数

### 3. 数据逻辑

#### 数据来源
- `ifShow` 和 `bigWind` 字段从返回数组的第一个配置项中获取
- 所有配置项共享相同的全局设置值
- 数据来源统一，避免本地状态与服务器数据不一致

#### 数据流程
1. 页面加载时获取 `groupId` 和 `gameId`
2. 调用 `runtimeStore.fetchRuntimeConfigs(groupId)` 获取配置列表
3. 通过 `observers` 监听 `runtimeConfigs` 变化
4. 调用 `updateGameSettings()` 更新游戏设置状态

### 4. 核心方法

#### refreshRuntimeConfig()
```javascript
// 刷新运行时配置
refreshRuntimeConfig() {
    const gameId = this.data.gameId || gameStore.gameid;
    const groupId = this.data.groupId || gameStore.groupId;
    
    if (!groupId) {
        console.error('[RuntimeConfigList] groupId 为空，无法刷新配置');
        return;
    }

    this.setData({ loading: true });

    runtimeStore.fetchRuntimeConfigs(groupId)
        .then(() => {
            this.updateGameSettings(this.data.runtimeConfigs);
        })
        .catch(err => {
            console.error('[RuntimeConfigList] 刷新配置失败:', err);
            wx.showToast({
                title: '加载配置失败',
                icon: 'none'
            });
        })
        .finally(() => {
            this.setData({ loading: false });
        });
}
```

#### getCurrentGameSettings()
```javascript
// 获取当前游戏设置状态 - 从第一个配置项获取
getCurrentGameSettings() {
    const configs = this.data.runtimeConfigs || [];
    if (configs.length === 0) {
        return {
            ifShow: 'y',  // 默认公开
            bigWind: 'n'  // 默认否
        };
    }

    const firstConfig = configs[0];
    return {
        ifShow: firstConfig.ifShow !== undefined && firstConfig.ifShow !== null ? firstConfig.ifShow : 'y',
        bigWind: firstConfig.bigWind !== undefined && firstConfig.bigWind !== null ? firstConfig.bigWind : 'n'
    };
}
```

#### updateGameSettings()
```javascript
// 更新游戏设置状态 - 从第一个配置项获取
updateGameSettings(configs) {
    if (!configs || configs.length === 0) {
        return;
    }

    // 使用第一个配置项的值作为全局设置
    const firstConfig = configs[0];
    const newData = {};

    // 更新游戏是否公开状态 - 确保字段存在且有效
    if (firstConfig.ifShow !== undefined && firstConfig.ifShow !== null) {
        newData.ifShow = firstConfig.ifShow;
    }

    // 更新大风吹状态 - 确保字段存在且有效
    if (firstConfig.bigWind !== undefined && firstConfig.bigWind !== null) {
        newData.bigWind = firstConfig.bigWind;
    }

    // 批量更新数据
    if (Object.keys(newData).length > 0) {
        this.setData(newData);
    }
}
```

## 页面参数

### 输入参数
- `gameId`: 游戏ID
- `groupId`: 群组ID
- `players`: 玩家列表（JSON字符串）

### 数据绑定
- `runtimeConfigs`: 运行时配置列表（来自 runtimeStore）
- `loadingRuntimeConfig`: 加载状态（来自 runtimeStore）
- `runtimeConfigError`: 错误信息（来自 runtimeStore）

## 事件处理

### 游戏设置事件
- `onGamePublicChange()`: 处理游戏公开性变更
- `onBigWindChange()`: 处理大风吹设置变更

### 配置项事件
- `handleGotoResult()`: 跳转到结果页面
- `onRuntimeItemClick()`: 跳转到配置编辑页面
- `onDeleteConfig()`: 删除配置项
- `onKickClick()`: 打开踢一脚设置

### 额外功能事件
- `onJuanguoClick()`: 打开捐锅设置
- `onHoleJumpClick()`: 打开跳洞设置
- `onStartholeClick()`: 打开出发洞调整

## 优化说明

### 1. 数据逻辑优化
- 移除了无用的 `initGame()` 方法
- 优化了 `refreshRuntimeConfig()` 方法，添加了错误处理和加载状态
- 重命名 `updateRadioButtonStates()` 为 `updateGameSettings()`，更符合实际功能

### 2. 数据一致性优化
- 统一数据来源：`ifShow` 和 `bigWind` 都从第一个配置项获取
- 优化用户体验：设置变更时立即更新本地状态，提供即时反馈
- 添加数据验证：确保字段存在且有效
- 添加了 API 调用的错误处理
- 添加了参数验证
- 添加了用户友好的错误提示
- 添加了失败回滚机制：API 调用失败时自动回滚到原状态

### 3. 性能优化
- 添加了防抖刷新机制 `refreshRuntimeConfigWithThrottle()`
- 优化了数据更新逻辑，使用批量更新减少 setData 调用

### 4. 调试功能
- 添加了详细的日志记录，便于问题排查
- 添加了 `debugDataStatus()` 方法，可以手动检查数据状态
- 在关键数据更新点添加了调试信息

### 5. 代码结构优化
- 重新组织了方法顺序，按功能分组
- 添加了详细的注释说明
- 统一了代码风格和命名规范

## 使用注意事项

1. **groupId 必填**: 页面需要有效的 groupId 才能正常加载配置
2. **数据一致性**: 游戏设置变更会同步到所有配置项，确保数据一致性
3. **数据来源**: `ifShow` 和 `bigWind` 始终从第一个配置项获取，避免数据混乱
4. **错误处理**: 网络请求失败时会显示错误提示
5. **防抖机制**: 避免频繁刷新导致的性能问题

## 依赖关系

- `stores/gameStore.js`: 游戏数据存储
- `stores/runtimeStore.js`: 运行时配置存储
- `api/modules/gamble.js`: 游戏相关API接口
- 各种弹窗组件: kickoff, holejump, starthole, juanguo 