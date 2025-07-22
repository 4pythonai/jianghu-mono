# 游戏运行时配置模块重构

## 重构目标

将原来的单一大型文件 `gambleRuntimeConfig.js` 重构为更清晰、可维护的模块化架构。

## 新的目录结构

```
pages/gambleRuntimeConfig/
├── addRuntime/              # 新增配置页面
│   ├── addRuntime.js
│   ├── addRuntime.json
│   ├── addRuntime.wxml
│   └── addRuntime.wxss
├── editRuntime/             # 编辑配置页面
│   ├── editRuntime.js
│   ├── editRuntime.json
│   ├── editRuntime.wxml
│   └── editRuntime.wxss
├── RuntimeComponents/       # 运行时组件（保持不变）
│   ├── Summary/
│   ├── HoleRangeSelector/
│   ├── RedBlueConfig/
│   ├── RankConflictResolver/
│   └── PlayerIndicator/
├── shared/                  # 共享逻辑
│   ├── baseConfig.js        # 基础配置逻辑
│   └── configValidator.js   # 配置验证逻辑
└── README.md               # 本文档
```

## 核心模块说明

### 1. 游戏类型管理器 (utils/gameTypeManager.js)

统一管理所有游戏类型的配置逻辑：

- **游戏类型定义**: 支持2人、3人、4人、多人游戏
- **组件需求**: 根据游戏类型确定需要的组件
- **默认配置**: 为每种游戏类型提供默认配置
- **验证功能**: 验证游戏类型的有效性

```javascript
// 使用示例
const gameType = GameTypeManager.getGameTypeConfig('4p-8421');
const components = GameTypeManager.getRequiredComponents('4p-8421');
const defaultConfig = GameTypeManager.getDefaultConfig('4p-8421', players);
```

### 2. 配置数据处理器 (utils/configDataProcessor.js)

统一处理传入和传出的配置数据：

- **数据解析**: 解析页面传入的参数
- **数据验证**: 验证配置数据的完整性
- **数据准备**: 准备保存的数据格式

```javascript
// 使用示例
const processedData = ConfigDataProcessor.processIncomingData(options);
const validation = ConfigDataProcessor.validateConfig(config, players);
const saveData = ConfigDataProcessor.prepareSaveData(runtimeConfig, gameId, configId);
```

### 3. 基础配置逻辑 (shared/baseConfig.js)

包含新增和编辑模式的公共方法：

- **页面初始化**: 统一的页面数据初始化逻辑
- **配置加载**: 编辑模式的配置加载逻辑
- **配置保存**: 统一的配置保存逻辑
- **事件处理**: 公共的事件处理方法

```javascript
// 使用示例
const result = BaseConfig.initializePageData(options, pageContext);
await BaseConfig.saveConfig(runtimeConfig, gameId, configId, pageContext);
```

### 4. 配置验证器 (shared/configValidator.js)

专门处理配置验证逻辑：

- **完整验证**: 验证所有配置项
- **分组验证**: 验证分组配置
- **球员验证**: 验证球员配置
- **错误显示**: 统一的错误提示

```javascript
// 使用示例
const isValid = ConfigValidator.validateAndShow(runtimeConfig, players, gambleSysName);
```

## 页面说明

### 新增配置页面 (addRuntime)

- **功能**: 专门处理新增配置的逻辑
- **特点**: 简洁的界面，专注于配置创建
- **按钮**: "确认配置"（蓝色）

### 编辑配置页面 (editRuntime)

- **功能**: 专门处理编辑配置的逻辑
- **特点**: 加载现有配置，支持修改
- **按钮**: "更新配置"（绿色）

## 使用方式

### 跳转到新增页面

```javascript
// 从系统规则进入
const runtimeConfigData = {
  gambleSysName: '4p-8421',
  gameId: gameStore.gameid,
  fromUserRule: false
};

const encodedData = encodeURIComponent(JSON.stringify(runtimeConfigData));

wx.navigateTo({
  url: `/pages/gambleRuntimeConfig/addRuntime/addRuntime?data=${encodedData}`
});
```

### 跳转到编辑页面

```javascript
// 从配置列表进入
const jumpData = {
  gambleSysName: config.gambleSysName,
  gameId: gameId,
  configId: config.id,
  isEditMode: true,
  editConfig: config
};

const encodedData = encodeURIComponent(JSON.stringify(jumpData));

wx.navigateTo({
  url: `/pages/gambleRuntimeConfig/editRuntime/editRuntime?data=${encodedData}`
});
```

## 扩展新游戏类型

要添加新的游戏类型，只需要在 `GameTypeManager.js` 中添加配置：

```javascript
// 在 GAME_TYPES 中添加新类型
'4p-newgame': {
  name: '4人新游戏',
  components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankConflictResolver'],
  hasPlayerConfig: false,
  hasGrouping: true
}
```

## 优势

1. **职责分离**: 新增和编辑逻辑完全分离
2. **代码复用**: 共享逻辑提取到公共模块
3. **易于维护**: 每个模块职责单一，易于理解和修改
4. **易于扩展**: 新增游戏类型只需修改配置
5. **类型安全**: 统一的验证和错误处理

## 迁移指南

1. 更新所有跳转到 `gambleRuntimeConfig` 的代码
2. 根据是新增还是编辑，跳转到对应的页面
3. 确保传递的数据格式正确
4. 测试所有功能是否正常工作

## 注意事项

1. 确保 `app.json` 中已添加新页面路径
2. 所有导入使用 `require` 而不是 `import`
3. 保持与现有组件的兼容性
4. 测试所有游戏类型的配置流程 