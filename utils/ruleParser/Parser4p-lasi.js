/**
 * 4p-lasi 规则解析器
 * 继承基础解析器，提供拉丝特定的解析逻辑
 */
const BaseRuleParser = require('./BaseRuleParser.js');
const { generateLasiRuleName } = require('../ruleNameGenerator.js');

class Parser4pLasi extends BaseRuleParser {
    /**
     * 解析 4p-lasi 规则配置
     * @param {Object} item - 配置项
     * @returns {Object} 解析结果
     */
    parse4PLasiConfig(item) {
        const details = {
            koufen: '无',
            eatmeat: '无',
            draw: '无',
            kpis: '无'
        };

        if (item.badScoreBaseLine) {
            // 拉丝没有扣分配置
            details.koufen = null
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

        if (item.kpis) {
            const kpisDetail = this.parseKpisConfig(item);
            if (kpisDetail) details.kpis = kpisDetail;
        }


        return details;
    }

    /**
     * 解析拉丝KPI配置
     * @param {Object} item - 配置项
     * @returns {string|null} 解析结果
     */
    parseKpisConfig(item) {

        try {
            // 解析kpis配置，支持字符串和对象格式
            let kpiConfig = item.kpis;
            if (typeof kpiConfig === 'string') {
                kpiConfig = JSON.parse(kpiConfig);
            }

            const { indicators, kpiValues, totalCalculationType } = kpiConfig;

            if (!indicators || !Array.isArray(indicators) || indicators.length === 0) {
                return '未配置KPI';
            }

            // 构建KPI描述
            const kpiDetails = [];

            // 处理较好成绩PK
            if (indicators.includes('best')) {
                const value = kpiValues?.best || 1;
                kpiDetails.push(`较好成绩${value}分`);
            }

            // 处理较差成绩PK
            if (indicators.includes('worst')) {
                const value = kpiValues?.worst || 1;
                kpiDetails.push(`较差成绩${value}分`);
            }

            // 处理总杆PK
            if (indicators.includes('total')) {
                const value = kpiValues?.total || 1;
                const totalType = totalCalculationType === 'add_total' ? '加法总杆' : '乘法总杆';
                kpiDetails.push(`${totalType}${value}分`);
            }

            // 生成规则名称
            const ruleName = generateLasiRuleName(indicators, kpiValues, totalCalculationType);

            // 计算总分
            let totalScore = 0;
            for (const indicator of indicators) {
                totalScore += kpiValues?.[indicator] || 1;
            }

            return `${ruleName}，${kpiDetails.join('、')}，总分${totalScore}分`;

        } catch (error) {
            console.error('[Parser4pLasi] 解析KPI配置失败:', error);
            return 'KPI配置解析失败';
        }
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