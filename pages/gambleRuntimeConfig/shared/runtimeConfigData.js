/**
 * 运行时配置数据结构
 * 提供默认的数据结构模板，避免页面间重复定义
 */

/**
 * 获取默认的运行时配置数据结构
 * @returns {Object} 默认的数据结构
 */
function getDefaultRuntimeConfigData() {
    return {
        // 传递的数据
        gambleSysName: '',
        gameid: null,
        groupid: null,
        players: [],
        gameData: null,
        userRule: null,
        is8421Game: false,
        needsGrouping: false,
        needsStroking: false,

        runtimeConfig: {
            gameid: null,           // 游戏ID
            groupid: null,          // 分组ID
            userRuleId: null,       // 用户规则ID(仅用户规则时有值)
            gambleSysName: null,    // 游戏系统名称(如:8421、gross、hole等)
            gambleUserName: null,   // 用户规则名称(如:规则_4721)
            red_blue_config: '4_固拉',
            stroking_config: [],    // 让杆配置，初始为空数组
            bootstrap_order: [],
            ranking_tie_resolve_config: '',  // 移除硬编码，稍后从 GambleMetaConfig 获取
            playerIndicatorConfig: {}      // 球员8421指标配置
        },

        // 页面状态
        loading: false,
        error: null,

        // 调试信息字段
        gameDataType: '',
    };
}

/**
 * 获取编辑模式下的默认数据结构
 * @returns {Object} 编辑模式的默认数据结构
 */
function getDefaultEditRuntimeConfigData() {
    const baseData = getDefaultRuntimeConfigData();
    return {
        ...baseData,
        configId: '',  // 编辑模式特有的字段
        // 编辑模式下的一些字段默认值不同
        'runtimeConfig.red_blue_config': null,
        'runtimeConfig.ranking_tie_resolve_config': null,
    };
}

module.exports = {
    getDefaultRuntimeConfigData,
    getDefaultEditRuntimeConfigData
};
