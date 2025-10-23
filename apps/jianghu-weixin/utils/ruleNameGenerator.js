/**
 * 规则名称生成器
 * 统一处理不同游戏类型的规则命名逻辑
 */

/**
 * 生成拉丝KPI规则名称
 * @param {Array} indicators - 选中的指标 ['best', 'worst', 'total']
 * @param {Object} kpiValues - KPI分值配置 {best: 1, worst: 1, total: 1}
 * @param {string} totalCalculationType - 总杆计算方式 'add_total' | 'multiply_total'
 * @returns {string} 生成的规则名称
 */
function generateLasiRuleName(indicators, kpiValues, totalCalculationType = 'add_total') {
    if (!indicators || indicators.length === 0) {
        return '四人拉丝';
    }

    // 获取选中指标的分值
    const selectedValues = indicators.map(indicator => kpiValues[indicator] || 1);

    // 检查所有分值是否一致
    const allValuesEqual = selectedValues.every(value => value === selectedValues[0]);

    if (indicators.length === 3) {
        if (allValuesEqual) {
            // 三个指标且分值一致，默认名称为"拉丝三点"
            return '拉丝三点';
        } else {
            // 三个指标但分值不一致，按"头尾总"顺序展示分值
            return `${kpiValues.best || 1}${kpiValues.worst || 1}${kpiValues.total || 1}`;
        }
    } else if (indicators.length === 2) {
        // 按"头尾总"顺序重新排列选中的指标
        const sortedIndicators = [];
        const sortedValues = [];

        // 先添加头（best）
        if (indicators.includes('best')) {
            sortedIndicators.push('best');
            sortedValues.push(kpiValues.best || 1);
        }
        // 再添加尾（worst）
        if (indicators.includes('worst')) {
            sortedIndicators.push('worst');
            sortedValues.push(kpiValues.worst || 1);
        }
        // 最后添加总（total）
        if (indicators.includes('total')) {
            sortedIndicators.push('total');
            sortedValues.push(kpiValues.total || 1);
        }

        if (allValuesEqual) {
            // 两个指标且分值一致，根据勾选指标命名
            const indicatorNames = sortedIndicators.map(indicator => {
                if (indicator === 'best') return '头';
                if (indicator === 'worst') return '尾';
                if (indicator === 'total') return '总';
                return '';
            });
            return `${indicatorNames[0]}${indicatorNames[1]}两点`;
        } else {
            // 两个指标但分值不一致，根据勾选指标和分值命名
            const indicatorNames = sortedIndicators.map(indicator => {
                if (indicator === 'best') return '头';
                if (indicator === 'worst') return '尾';
                if (indicator === 'total') return '总';
                return '';
            });
            return `${indicatorNames[0]}${sortedValues[0]}${indicatorNames[1]}${sortedValues[1]}`;
        }
    } else if (indicators.length === 1) {
        const indicator = indicators[0];
        const indicatorName = indicator === 'best' ? '最好成绩' :
            indicator === 'worst' ? '最差成绩' : '总成绩';
        return `拉丝一点${indicatorName}`;
    }

    return '四人拉丝';
}

/**
 * 生成8421规则名称
 * @param {Object} drawConfig - 平局配置
 * @param {Object} meatRules - 吃肉规则配置
 * @returns {string} 生成的规则名称
 */
function generate8421RuleName(drawConfig, meatRules) {
    const timestamp = new Date().toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });
    return `8421规则_${timestamp}`;
}

module.exports = { generateLasiRuleName, generate8421RuleName };
