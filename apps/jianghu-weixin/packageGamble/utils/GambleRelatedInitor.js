/**
 * 特定游戏相关的运行时配置功能
 * 处理不同游戏类型的特殊配置需求
 */


/**
 * 游戏相关运行时配置管理器
 */
const GambleRelatedInitor = {
    /**
     * 获取默认配置
     */
    getInit8421Values(players = []) {
        console.log('[GambleRelatedInitor] 🟥🟧🟨🟥🟧🟨🟥🟧🟨🟥🟧🟨 getInit8421Values ', players);
        const playerIndicatorConfig = {
        };
        const defaultPlayerConfig = {
            "Birdie": 8,
            "Par": 4,
            "Par+1": 2,
            "Par+2": 1
        };

        for (const player of players) {
            playerIndicatorConfig[String(player.user_id)] = { ...defaultPlayerConfig };
        }
        return playerIndicatorConfig;
    }
};

module.exports = GambleRelatedInitor;
