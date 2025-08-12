/**
 * 基础配置逻辑
 * 包含新增和编辑模式的公共方法
 */
const { holeRangeStore } = require('../../../stores/holeRangeStore');
const { GambleMetaConfig } = require('../../../utils/GambleMetaConfig');
const configManager = require('../../../utils/configManager');

const app = getApp();

const BaseConfig = {
    /**
     * 初始化页面数据
     * @param {Object} options 页面参数
     * @param {Object} pageContext 页面上下文
     * @returns {Object} 初始化结果
     */
    initializePageData(options, pageContext) {

        // 处理传入的数据
        const processedData = configManager.processIncomingData(options);

        // 设置页面数据
        const setDataObj = {
            gambleSysName: processedData.gambleSysName,
            gameid: processedData.gameid,
            groupid: processedData.groupid, // 添加 groupid 到页面数据
            configId: processedData.configId || '',
            players: processedData.players,
            gameData: processedData.gameData,
            userRule: processedData.userRule,
            'runtimeConfig.gameid': processedData.gameid,
            'runtimeConfig.groupid': processedData.groupid,
            'runtimeConfig.userRuleId': processedData.userRuleId,
            'runtimeConfig.gambleSysName': processedData.gambleSysName,
            'runtimeConfig.gambleUserName': processedData.gambleUserName
        };

        pageContext.setData(setDataObj);
        BaseConfig.loadEditConfig(processedData.editConfig, pageContext);

        return {
            success: true,
            data: processedData
        };
    },



    /**
     * 加载编辑配置
     * @param {Object} editConfig 编辑配置
     * @param {Object} pageContext 页面上下文
     */
    loadEditConfig(editConfig, pageContext) {

        // 加载分组配置
        if (editConfig.red_blue_config !== undefined && editConfig.red_blue_config !== null) {
            pageContext.setData({
                'runtimeConfig.red_blue_config': editConfig.red_blue_config
            });
        } else {
            console.log('[BaseConfig] 分组配置为空或未定义');
        }

        // 加载玩家顺序配置
        if (editConfig.bootstrap_order) {
            let bootstrapOrder = editConfig.bootstrap_order;

            if (typeof bootstrapOrder === 'string') {
                try {
                    bootstrapOrder = JSON.parse(bootstrapOrder);
                } catch (error) {
                    bootstrapOrder = [];
                }
            }

            if (Array.isArray(bootstrapOrder) && bootstrapOrder.length > 0) {
                pageContext.setData({
                    'runtimeConfig.bootstrap_order': bootstrapOrder
                });
                console.log('[BaseConfig] 玩家顺序配置加载:', bootstrapOrder);
            }
        }

        // 加载排名配置
        if (editConfig.ranking_tie_resolve_config) {
            pageContext.setData({
                'runtimeConfig.ranking_tie_resolve_config': editConfig.ranking_tie_resolve_config
            });
            console.log('[BaseConfig] 排名配置加载:', editConfig.ranking_tie_resolve_config);
        }

        // 加载8421配置
        let val8421Config = {};
        if (editConfig.playerIndicatorConfig) {
            let configData = editConfig.playerIndicatorConfig;

            if (typeof configData === 'string') {
                try {
                    configData = JSON.parse(configData);
                } catch (error) {
                    console.error('[BaseConfig] 解析8421配置失败:', error);
                    configData = {};
                }
            }

            if (typeof configData === 'object' && configData !== null && Object.keys(configData).length > 0) {
                val8421Config = configData;
                console.log('[BaseConfig] 8421配置加载成功:', val8421Config);
            }
        }

        // 如果8421配置为空且是8421游戏，则初始化默认配置
        const is8421Game = editConfig.gambleSysName && (
            editConfig.gambleSysName.includes('8421') ||
            GambleMetaConfig.needsPlayerConfig(editConfig.gambleSysName)
        );

        if (Object.keys(val8421Config).length === 0 && is8421Game) {
            console.log('[BaseConfig] 检测到8421游戏但配置为空，初始化默认配置');

            // 获取玩家数据
            const players = pageContext.data.players || [];

            if (players.length > 0) {
                const defaultConfig = GambleMetaConfig.getDefaultGambleConfig(editConfig.gambleSysName, players);
                val8421Config = defaultConfig.playerIndicatorConfig;
            }
        }

        // 设置8421配置
        pageContext.setData({
            'runtimeConfig.playerIndicatorConfig': val8421Config
        });


        // 加载起始洞和结束洞索引配置
        if (editConfig.startHoleindex !== undefined) {
            const startHoleindex = Number.parseInt(editConfig.startHoleindex);
            holeRangeStore.setStartIndex(startHoleindex);
        }

        console.log('[BaseConfig] 编辑配置加载完成');
    },




    /**
     * 重新选择规则
     * @param {Object} pageContext 页面上下文
     */
    onReSelectRule(pageContext) {
        wx.showModal({
            title: '重新选择规则',
            content: '确定要重新选择赌博规则吗？当前配置将丢失。',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateBack();
                }
            }
        });
    },

    /**
     * 取消配置
     * @param {Object} pageContext 页面上下文
     */
    onCancelConfig(pageContext) {
        console.log('[BaseConfig] 取消配置');
        wx.navigateBack();
    }
};

module.exports = BaseConfig; 