/**
 * 4p-lasi 规则解析器
 * 继承基础解析器，提供拉丝特定的解析逻辑
 */
const BaseRuleParser = require('./BaseRuleParser.js');

class Parser4pLasi extends BaseRuleParser {
    /**
     * 解析 4p-lasi 规则配置
     * @param {Object} item - 配置项
     * @returns {Object} 解析结果
     */
    parse4PLasiConfig(item) {
        if (!item) return {};

        const details = {
            koufen: '无',
            eatmeat: '无',
            draw: '无'
        };

        if (item.badScoreBaseLine) {
            const koufenDetail = this.parseKoufenConfig(item);
            if (koufenDetail) details.koufen = koufenDetail;
        }

        if (item.meatValueConfig) {
            const eatmeatDetail = this.parseEatmeatConfig(item);
            if (eatmeatDetail) details.eatmeat = eatmeatDetail;
        }

        if (item.drawConfig) {
            const drawDetail = this.parseDrawConfig(item);
            if (drawDetail) details.draw = drawDetail;
        }

        if (item.RewardConfig) {
            const rewardDetail = this.parseRewardConfig(item);
            if (rewardDetail) details.reward = rewardDetail;
        }

        return details;
    }
}

// 创建实例并导出函数，保持向后兼容
const parser = new Parser4pLasi();

/**
 * 解析 4p-lasi 规则配置
 * @param {Object} item - 配置项
 * @returns {Object} 解析结果
 */
function parse4PLasiConfig(item) {
    return parser.parse4PLasiConfig(item);
}

export { parse4PLasiConfig }; 