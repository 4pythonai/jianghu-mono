/**
 * 运行时配置导入管理
 * 统一管理两个页面共同的模块导入，避免重复导入
 */

// 配置验证器
const ConfigValidator = require('./configValidator');

// 配置管理器
const configManager = require('@/utils/configManager');

// 游戏元配置
const { GambleMetaConfig } = require('@/utils/GambleMetaConfig');

// 游戏相关初始化器
const GambleRelatedInitor = require('@/utils/GambleRelatedInitor');

// 游戏存储
const { gameStore } = require('@/stores/gameStore');

// 运行时存储
const { runtimeStore } = require('@/stores/runtimeStore');

// 洞范围存储
const { holeRangeStore } = require('@/stores/holeRangeStore');

// MobX工具
const { toJS } = require('mobx-miniprogram');

/**
 * 获取所有运行时配置相关的导入
 * @returns {Object} 包含所有导入的对象
 */
function getRuntimeConfigImports() {
    return {
        ConfigValidator,
        configManager,
        GambleMetaConfig,
        GambleRelatedInitor,
        gameStore,
        runtimeStore,
        holeRangeStore,
        toJS
    };
}

/**
 * 获取基础导入（新增页面使用）
 * @returns {Object} 基础导入对象
 */
function getBaseImports() {
    return {
        ConfigValidator,
        configManager,
        GambleMetaConfig,
        GambleRelatedInitor,
        gameStore,
        toJS
    };
}

/**
 * 获取编辑模式导入（编辑页面使用）
 * @returns {Object} 编辑模式导入对象
 */
function getEditImports() {
    return {
        ConfigValidator,
        configManager,
        GambleMetaConfig,
        runtimeStore,
        gameStore,
        holeRangeStore,
        toJS
    };
}

/**
 * 获取运行时配置相关的所有导入（包括混入方法）
 * @returns {Object} 包含所有导入和混入方法的对象
 */
function getRuntimeConfigWithMixin() {
    const mixin = require('./runtimeConfigMixin');
    return {
        ...getRuntimeConfigImports(),
        ...mixin
    };
}

/**
 * 获取基础导入（包含混入方法）
 * @returns {Object} 基础导入和混入方法
 */
function getBaseImportsWithMixin() {
    const mixin = require('./runtimeConfigMixin');
    return {
        ...getBaseImports(),
        ...mixin
    };
}

/**
 * 获取编辑模式导入（包含混入方法）
 * @returns {Object} 编辑模式导入和混入方法
 */
function getEditImportsWithMixin() {
    const mixin = require('./runtimeConfigMixin');
    return {
        ...getEditImports(),
        ...mixin
    };
}

module.exports = {
    getRuntimeConfigImports,
    getBaseImports,
    getEditImports,
    getRuntimeConfigWithMixin,
    getBaseImportsWithMixin,
    getEditImportsWithMixin,
    // 直接导出常用模块，方便使用
    ConfigValidator,
    configManager,
    GambleMetaConfig,
    GambleRelatedInitor,
    gameStore,
    runtimeStore,
    holeRangeStore,
    toJS
};
