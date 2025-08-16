/**
 * 运行时配置方法混入
 * 提供两个页面共同的业务方法实现
 */

/**
 * 收集所有组件的配置
 * 统一的配置收集逻辑
 * @param {Object} pageContext 页面上下文
 * @param {boolean} needsStroking 是否需要让杆功能
 */
function collectAllConfigs(pageContext, needsStroking) {
    console.log('[RuntimeConfigMixin] 开始收集所有组件配置');

    // 调用 configManager 的统一收集方法，传入 needsStroking 参数
    const configManager = require('../../../utils/configManager');
    const collectedConfig = configManager.collectAllConfigs(pageContext, needsStroking);

    // 将收集到的配置设置到页面数据中
    const setDataObj = {};
    for (const key of Object.keys(collectedConfig)) {
        setDataObj[`runtimeConfig.${key}`] = collectedConfig[key];
    }
    pageContext.setData(setDataObj);

    console.log('[RuntimeConfigMixin] 收集配置完成，最终 runtimeConfig:', pageContext.data.runtimeConfig);
}

/**
 * 重新选择规则
 * 统一的规则重选逻辑
 */
function onReSelectRule() {
    wx.showModal({
        title: '重新选择规则',
        content: '确定要重新选择赌博规则吗？当前配置将丢失。',
        success: (res) => {
            if (res.confirm) {
                wx.navigateBack();
            }
        }
    });
}

/**
 * 取消配置
 * 统一的取消配置逻辑
 */
function onCancelConfig() {
    console.log('[RuntimeConfigMixin] 取消配置');
    wx.navigateBack();
}

/**
 * 统一的配置数据设置方法
 * 减少重复的 setData 调用，让配置设置更清晰
 * @param {Object} pageContext 页面上下文
 * @param {Object} configData 要设置的配置数据
 * @param {Object} options 选项配置
 */
function setRuntimeConfigData(pageContext, configData, options = {}) {
    const setDataObj = {};

    // 基础字段设置
    const baseFields = [
        'gambleSysName', 'gameid', 'groupid', 'players', 'gameData', 'userRule',
        'is8421Game', 'needsGrouping', 'needsStroking', 'gameDataType', 'configId'
    ];

    baseFields.forEach(field => {
        setDataObj[field] = configData[field];
    });

    // runtimeConfig 字段设置
    if (configData.runtimeConfig) {
        Object.keys(configData.runtimeConfig).forEach(key => {
            setDataObj[`runtimeConfig.${key}`] = configData.runtimeConfig[key];
        });
    }

    // 特殊字段设置（如 config 对象）
    if (configData.config) {
        setDataObj.config = configData.config;
    }

    // 一次性设置所有数据
    if (Object.keys(setDataObj).length > 0) {
        console.log('[RuntimeConfigMixin] 设置配置数据:', setDataObj);
        pageContext.setData(setDataObj);
    }
}

/**
 * 确认配置的通用逻辑
 * 处理配置验证和保存的通用流程
 * @param {Object} pageContext 页面上下文
 * @param {boolean} isEdit 是否为编辑模式
 */
function onConfirmConfigCommon(pageContext, isEdit = false) {
    const { runtimeConfig, gambleSysName, players } = pageContext.data;

    // 从各个组件收集最新配置
    collectAllConfigs(pageContext, pageContext.data.needsStroking);

    // 验证配置
    const ConfigValidator = require('./configValidator');
    if (!ConfigValidator.validateAndShow(runtimeConfig, players, gambleSysName)) {
        return;
    }

    // 保存配置
    const { gameid, groupid, configId } = pageContext.data;
    console.log('[RuntimeConfigMixin] 保存配置参数:', { gameid, groupid, configId, isEdit });
    const configManager = require('../../../utils/configManager');
    configManager.saveGambleConfig(runtimeConfig, gameid, groupid, configId, pageContext, isEdit);
}

module.exports = {
    collectAllConfigs,
    onReSelectRule,
    onCancelConfig,
    onConfirmConfigCommon,
    setRuntimeConfigData
};
