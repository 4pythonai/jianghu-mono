/**
 * gambleUtils - 赌博游戏相关工具函数
 */

/**
 * 根据 bootstrap_order 重新排序玩家列表
 * @param {Array} players - 玩家列表
 * @param {Array} bootStrapOrder - 排序顺序（userid数组）
 * @returns {Array} 排序后的玩家列表
 */
function reorderPlayersByBootStrapOrder(players, bootStrapOrder) {
    if (!Array.isArray(players) || players.length === 0) return [];

    const orderIds = Array.isArray(bootStrapOrder) ? bootStrapOrder.map(id => `${id}`) : [];
    if (orderIds.length === 0) return [...players];

    const idToFirstIndex = new Map();
    for (let i = 0; i < players.length; i++) {
        const idStr = `${players[i]?.user_id}`;
        if (!idToFirstIndex.has(idStr)) idToFirstIndex.set(idStr, i);
    }

    const usedIndices = new Set();
    const ordered = [];

    for (const idStr of orderIds) {
        const matchedIndex = idToFirstIndex.get(idStr);
        if (matchedIndex !== undefined) {
            ordered.push(players[matchedIndex]);
            usedIndices.add(matchedIndex);
        }
    }

    for (let i = 0; i < players.length; i++) {
        if (!usedIndices.has(i)) ordered.push(players[i]);
    }

    return ordered;
}

/**
 * 处理单个赌博配置数据
 * 解析 JSON 字符串字段，添加派生字段
 * @param {Object} config - 原始配置对象
 * @returns {Object} 处理后的配置对象
 */
function processOneGamble(config) {
    try {
        const processedConfig = { ...config };

        // 解析 playerIndicatorConfig JSON 字符串
        if (config.playerIndicatorConfig && typeof config.playerIndicatorConfig === 'string') {
            try {
                processedConfig.val8421_config_parsed = JSON.parse(config.playerIndicatorConfig);
                processedConfig.player8421Count = Object.keys(processedConfig.val8421_config_parsed).length;
                processedConfig.val8421_config_display = JSON.stringify(processedConfig.val8421_config_parsed, null, 2);
            } catch (e) {
                processedConfig.val8421_config_parsed = {};
                processedConfig.player8421Count = 0;
                processedConfig.val8421_config_display = config.playerIndicatorConfig;
            }
        }

        // 解析 bootstrap_order JSON 字符串
        if (config.bootstrap_order && typeof config.bootstrap_order === 'string') {
            try {
                processedConfig.bootstrap_order_parsed = JSON.parse(config.bootstrap_order);
                processedConfig.players = reorderPlayersByBootStrapOrder(
                    processedConfig.attenders,
                    processedConfig.bootstrap_order_parsed
                );
            } catch (e) {
                processedConfig.bootstrap_order_parsed = [];
            }
        }

        return processedConfig;
    } catch (e) {
        console.error('[gambleUtils] processOneGamble error:', e);
        return config;
    }
}

module.exports = {
    reorderPlayersByBootStrapOrder,
    processOneGamble
};
