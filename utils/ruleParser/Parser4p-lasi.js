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
        console.log('[Parser4pLasi] 🟥🟧🟨🟥🟧🟨+++🟥🟧🟨🟥🟧🟨 parse4PLasiConfig ', item);
        const details = {
            koufen: '无',
            eatmeat: '无',
            draw: '无',
            kpis: '无'
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

        if (item.kpis) {
            console.log('[Parser4pLasi] +🟥🟧🟨🟥🟧🟨>+++++++++++ kpisDetail ');
            const kpisDetail = this.parseKpisConfig(item);
            console.log('[Parser4pLasi] +🟥🟧🟨🟥🟧🟨>+++++++++++ kpisDetail ', kpisDetail);
            if (kpisDetail) details.kpis = kpisDetail;
        } else {
            console.log('[Parser4pLasi] +🟥🟧🟨🟥🟧🟨>>>>>>>>>>>>>>>>>>>>>>> kpisDetail 无');
            // details.kpis = '无';
        }

        return details;
    }

    /**
     * 解析拉丝KPI配置
     * @param {Object} item - 配置项
     * @returns {string|null} 解析结果
     */
    parseKpisConfig(item) {
        console.log('[Parser4pLasi] 🟨🟨🟨🟨🟨 解析KPI配置:', item.kpis);

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
            const ruleName = this.generateKpiRuleName(indicators, totalCalculationType);

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

    /**
     * 生成KPI规则名称
     * @param {Array} indicators - 选中的指标
     * @param {string} totalCalculationType - 总杆计算方式
     * @returns {string} 规则名称
     */
    generateKpiRuleName(indicators, totalCalculationType) {
        if (indicators.length === 0) {
            return '四人拉丝';
        }

        if (indicators.length === 1) {
            const indicator = indicators[0];
            const indicatorMap = {
                'best': '拉丝较好',
                'worst': '拉丝较差',
                'total': totalCalculationType === 'add_total' ? '拉丝加法总杆' : '拉丝乘法总杆'
            };
            return indicatorMap[indicator] || '四人拉丝';
        }

        if (indicators.length === 2) {
            const [first, second] = indicators;
            const indicatorMap = {
                'best': '头',
                'worst': '尾',
                'total': totalCalculationType === 'add_total' ? '加' : '乘'
            };
            return `${indicatorMap[first]}${indicatorMap[second]}`;
        }

        if (indicators.length === 3) {
            const indicatorMap = {
                'best': '2',
                'worst': '1',
                'total': '1'
            };
            const name = indicators.map(indicator => indicatorMap[indicator]).join('');
            return name;
        }

        return '四人拉丝';
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