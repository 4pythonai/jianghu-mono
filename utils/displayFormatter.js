/**
 * 显示值格式化工具类
 * 用于将配置数据格式化为用户友好的显示文本
 */

/**
 * 格式化扣分规则显示
 * @param {string} badScoreBaseLine - 扣分基线，如 "Par+4", "DoublePar+7", "NoSub"
 * @param {string|number} badScoreMaxLost - 最大扣分，如 "10000000" 或 10000000
 * @returns {string} 格式化后的显示文本，如 "帕+4/不封顶"
 */
export const formatKoufenRule = (badScoreBaseLine, badScoreMaxLost) => {
    // 格式化扣分开始值
    let startText = '';
    if (badScoreBaseLine === 'NoSub') {
        startText = '不扣分';
    } else if (badScoreBaseLine?.startsWith('Par+')) {
        const score = badScoreBaseLine.replace('Par+', '');
        startText = `帕+${score}`;
    } else if (badScoreBaseLine?.startsWith('DoublePar+')) {
        const score = badScoreBaseLine.replace('DoublePar+', '');
        startText = `双帕+${score}`;
    } else if (badScoreBaseLine) {
        startText = badScoreBaseLine;
    }

    // 格式化封顶值
    let fengdingText = '';
    const maxLostValue = Number(badScoreMaxLost);
    if (maxLostValue === 10000000) {
        fengdingText = '不封顶';
    } else if (maxLostValue > 0 && maxLostValue < 10000000) {
        fengdingText = `扣${maxLostValue}分封顶`;
    }

    // 组合显示值
    if (startText && fengdingText) {
        return `${startText}/${fengdingText}`;
    } else if (startText) {
        return startText;
    } else if (fengdingText) {
        return fengdingText;
    } else {
        return '请配置扣分规则';
    }
};

/**
 * 格式化顶洞规则显示
 * @param {string} drawConfig - 顶洞配置，如 "DrawEqual", "Diff_6", "NoDraw"
 * @returns {string} 格式化后的显示文本，如 "得分打平"
 */
export const formatDrawRule = (drawConfig) => {
    if (!drawConfig) {
        return '请配置顶洞规则';
    }

    switch (drawConfig) {
        case 'DrawEqual':
            return '得分打平';
        case 'NoDraw':
            return '无顶洞';
        default:
            // 处理 Diff_X 格式
            if (drawConfig.startsWith('Diff_')) {
                const score = drawConfig.replace('Diff_', '');
                return `得分${score}分以内`;
            }
            return drawConfig;
    }
};

/**
 * 格式化吃肉规则显示
 * @param {string} meatValueConfig - 肉分值配置，如 "MEAT_AS_2", "SINGLE_DOUBLE", "CONTINUE_DOUBLE"
 * @param {string|number} meatMaxValue - 吃肉封顶值，如 "10000000" 或 10000000
 * @returns {string} 格式化后的显示文本，如 "肉算2分/不封顶"
 */
export const formatMeatRule = (meatValueConfig, meatMaxValue) => {
    // 格式化肉分值计算方式
    let meatValueText = '';
    if (meatValueConfig?.startsWith('MEAT_AS_')) {
        const score = meatValueConfig.replace('MEAT_AS_', '');
        meatValueText = `肉算${score}分`;
    } else if (meatValueConfig === 'SINGLE_DOUBLE') {
        meatValueText = '分值翻倍';
    } else if (meatValueConfig === 'CONTINUE_DOUBLE') {
        meatValueText = '分值连续翻倍';
    } else if (meatValueConfig) {
        meatValueText = meatValueConfig;
    }

    // 格式化封顶值
    let meatMaxText = '';
    const maxValue = Number(meatMaxValue);
    if (maxValue === 10000000) {
        meatMaxText = '不封顶';
    } else if (maxValue > 0 && maxValue < 10000000) {
        meatMaxText = `${maxValue}分封顶`;
    }

    // 组合显示值
    if (meatValueText && meatMaxText) {
        return `${meatValueText}/${meatMaxText}`;
    } else if (meatValueText) {
        return meatValueText;
    } else if (meatMaxText) {
        return meatMaxText;
    } else {
        return '请配置吃肉规则';
    }
};

/**
 * 格式化同伴惩罚规则显示
 * @param {string} dutyConfig - 同伴惩罚配置，如 "NODUTY", "DUTY_DINGTOU", "DUTY_NEGATIVE"
 * @returns {string} 格式化后的显示文本，如 "不包负分"
 */
export const formatDutyRule = (dutyConfig) => {
    if (!dutyConfig) {
        return '请配置同伴惩罚规则';
    }

    switch (dutyConfig) {
        case 'NODUTY':
            return '不包负分';
        case 'DUTY_DINGTOU':
            return '同伴顶头包负分';
        case 'DUTY_NEGATIVE':
            return '包负分';
        default:
            return dutyConfig;
    }
};

/**
 * 格式化 eatingRange 显示
 * @param {string|Object} eatingRange - 吃肉范围配置
 * @returns {string} 格式化后的显示文本，如 "小鸟+1, 帕+1"
 */
export const formatEatingRange = (eatingRange) => {
    if (!eatingRange) {
        return '请配置吃肉范围';
    }

    // 如果是字符串，尝试解析JSON
    let rangeObj = eatingRange;
    if (typeof eatingRange === 'string') {
        try {
            rangeObj = JSON.parse(eatingRange);
        } catch (error) {
            return eatingRange;
        }
    }

    // 如果是对象，格式化显示
    if (typeof rangeObj === 'object' && !Array.isArray(rangeObj)) {
        const parts = [];

        if (rangeObj.BetterThanBirdie) {
            parts.push(`小鸟+${rangeObj.BetterThanBirdie}`);
        }
        if (rangeObj.Birdie) {
            parts.push(`帕+${rangeObj.Birdie}`);
        }
        if (rangeObj.Par) {
            parts.push(`帕+${rangeObj.Par}`);
        }
        if (rangeObj.WorseThanPar) {
            parts.push(`双帕+${rangeObj.WorseThanPar}`);
        }

        return parts.length > 0 ? parts.join(', ') : '请配置吃肉范围';
    }

    return '请配置吃肉范围';
};

/**
 * 格式化完整的8421规则显示
 * @param {Object} config - 完整的配置对象
 * @returns {Object} 格式化后的显示对象
 */
export const format8421RuleDisplay = (config) => {
    return {
        koufen: formatKoufenRule(config.badScoreBaseLine, config.badScoreMaxLost),
        draw: formatDrawRule(config.drawConfig),
        meat: formatMeatRule(config.meatValueConfig, config.meatMaxValue),
        duty: formatDutyRule(config.dutyConfig),
        eatingRange: formatEatingRange(config.eatingRange)
    };
};

// 导出所有格式化方法
export const DisplayFormatter = {
    formatKoufenRule,
    formatDrawRule,
    formatMeatRule,
    formatDutyRule,
    formatEatingRange,
    format8421RuleDisplay
}; 