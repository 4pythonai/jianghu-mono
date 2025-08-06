/**
 * 配置解析工具类
 * 用于解析各种格式的配置字符串
 */

/**
 * 解析 Par+X 格式的配置
 * @param {string} value - 配置值，如 "Par+4"
 * @returns {Object|null} 解析结果，如 { type: 'Par', score: 4 }
 */
export const parseParPlus = (value) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    if (value.startsWith('Par+')) {
        const scoreStr = value.replace('Par+', '');
        const score = parseInt(scoreStr);

        if (!isNaN(score)) {
            return {
                type: 'Par',
                score: score,
                original: value
            };
        }
    }

    return null;
};

/**
 * 解析 DoublePar+X 格式的配置
 * @param {string} value - 配置值，如 "DoublePar+7"
 * @returns {Object|null} 解析结果，如 { type: 'DoublePar', score: 7 }
 */
export const parseDoubleParPlus = (value) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    if (value.startsWith('DoublePar+')) {
        const scoreStr = value.replace('DoublePar+', '');
        const score = parseInt(scoreStr);

        if (!isNaN(score)) {
            return {
                type: 'DoublePar',
                score: score,
                original: value
            };
        }
    }

    return null;
};

/**
 * 解析 Diff_X 格式的配置
 * @param {string} value - 配置值，如 "Diff_6"
 * @returns {Object|null} 解析结果，如 { type: 'Diff', score: 6 }
 */
export const parseDiff = (value) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    if (value.startsWith('Diff_')) {
        const scoreStr = value.replace('Diff_', '');
        const score = parseInt(scoreStr);

        if (!isNaN(score)) {
            return {
                type: 'Diff',
                score: score,
                original: value
            };
        }
    }

    return null;
};

/**
 * 解析 MEAT_AS_X 格式的配置
 * @param {string} value - 配置值，如 "MEAT_AS_2"
 * @returns {Object|null} 解析结果，如 { type: 'MeatAs', score: 2 }
 */
export const parseMeatAs = (value) => {
    if (!value || typeof value !== 'string') {
        return null;
    }

    if (value.startsWith('MEAT_AS_')) {
        const scoreStr = value.replace('MEAT_AS_', '');
        const score = parseInt(scoreStr);

        if (!isNaN(score)) {
            return {
                type: 'MeatAs',
                score: score,
                original: value
            };
        }
    }

    return null;
};

/**
 * 解析 eatingRange JSON字符串
 * @param {string|Object} value - 配置值，如 "{\"BetterThanBirdie\":1,\"Birdie\":1,\"Par\":1,\"WorseThanPar\":1}"
 * @returns {Object|null} 解析结果，如 { BetterThanBirdie: 1, Birdie: 1, Par: 1, WorseThanPar: 1 }
 */
export const parseEatingRange = (value) => {
    if (!value) {
        return null;
    }

    // 如果已经是对象，直接返回
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value;
    }

    // 如果是字符串，尝试解析JSON
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed;
            }
        } catch (error) {
            console.error('解析eatingRange失败:', error, '原始值:', value);
        }
    }

    return null;
};

/**
 * 解析封顶值配置
 * @param {string|number} value - 配置值，如 "10000000" 或 10000000
 * @returns {Object} 解析结果，如 { isUnlimited: true, value: 10000000 }
 */
export const parseMaxValue = (value) => {
    const numValue = Number(value);

    if (isNaN(numValue)) {
        return {
            isUnlimited: false,
            value: 0,
            original: value
        };
    }

    return {
        isUnlimited: numValue === 10000000,
        value: numValue,
        original: value
    };
};

/**
 * 解析 dutyConfig 配置
 * @param {string} value - 配置值，如 "DUTY_DINGTOU"
 * @returns {Object} 解析结果，如 { type: 'DUTY_DINGTOU', index: 1 }
 */
export const parseDutyConfig = (value) => {
    if (!value || typeof value !== 'string') {
        return {
            type: 'NODUTY',
            index: 0
        };
    }

    const dutyMap = {
        'NODUTY': 0,
        'DUTY_DINGTOU': 1,
        'DUTY_NEGATIVE': 2
    };

    return {
        type: value,
        index: dutyMap[value] !== undefined ? dutyMap[value] : 0
    };
};

/**
 * 解析 drawConfig 配置
 * @param {string} value - 配置值，如 "DrawEqual"
 * @returns {Object} 解析结果，如 { type: 'DrawEqual', index: 0 }
 */
export const parseDrawConfig = (value) => {
    if (!value || typeof value !== 'string') {
        return {
            type: 'DrawEqual',
            index: 0
        };
    }

    if (value === 'DrawEqual') {
        return { type: value, index: 0 };
    } else if (value === 'NoDraw') {
        return { type: value, index: 2 };
    } else if (value.startsWith('Diff_')) {
        const diffResult = parseDiff(value);
        return {
            type: 'Diff',
            index: 1,
            score: diffResult ? diffResult.score : 1
        };
    }

    return {
        type: 'DrawEqual',
        index: 0
    };
};

/**
 * 解析 meatValueConfig 配置
 * @param {string} value - 配置值，如 "SINGLE_DOUBLE"
 * @returns {Object} 解析结果，如 { type: 'SINGLE_DOUBLE', index: 1 }
 */
export const parseMeatValueConfig = (value) => {
    if (!value || typeof value !== 'string') {
        return {
            type: 'MEAT_AS_1',
            index: 0,
            score: 1
        };
    }

    if (value === 'SINGLE_DOUBLE') {
        return { type: value, index: 1 };
    } else if (value === 'CONTINUE_DOUBLE') {
        return { type: value, index: 2 };
    } else if (value.startsWith('MEAT_AS_')) {
        const meatResult = parseMeatAs(value);
        return {
            type: 'MEAT_AS',
            index: 0,
            score: meatResult ? meatResult.score : 1
        };
    }

    return {
        type: 'MEAT_AS_1',
        index: 0,
        score: 1
    };
};

// 导出所有解析方法
export const ConfigParser = {
    parseParPlus,
    parseDoubleParPlus,
    parseDiff,
    parseMeatAs,
    parseEatingRange,
    parseMaxValue,
    parseDutyConfig,
    parseDrawConfig,
    parseMeatValueConfig
}; 