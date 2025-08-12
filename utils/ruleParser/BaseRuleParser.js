/**
 * 基础规则解析器
 * 提供通用的规则解析方法，供具体规则解析器继承使用
 */
const { GOLF_SCORE_TYPES, MEAT_VALUE_CONFIG_TYPES } = require('../gambleConfig.js');

class BaseRuleParser {
    /**
     * 解析扣分配置
     * @param {Object} item - 配置项
     * @returns {string|null} 解析结果
     */
    parseKoufenConfig(item) {
        const { badScoreBaseLine, badScoreMaxLost, dutyConfig } = item;

        let detail = '';

        if (badScoreBaseLine === 'NoSub') {
            detail = '不扣分';
        } else if (badScoreBaseLine?.startsWith('Par+')) {
            const score = badScoreBaseLine.replace('Par+', '');
            detail = `从帕+${score}开始扣分`;
        } else if (badScoreBaseLine?.startsWith('DoublePar+')) {
            const score = badScoreBaseLine.replace('DoublePar+', '');
            detail = `从双帕+${score}开始扣分`;
        }

        if (badScoreMaxLost && badScoreMaxLost !== "10000000" && badScoreMaxLost !== 10000000) {
            detail += `，扣${badScoreMaxLost}分封顶`;
        } else if (badScoreBaseLine !== 'NoSub') {
            detail += '，不封顶';
        }

        if (dutyConfig) {
            switch (dutyConfig) {
                case 'NODUTY':
                    detail += '，不包负分';
                    break;
                case 'DUTY_DINGTOU':
                    detail += '，同伴顶头包负分';
                    break;
                case 'DUTY_NEGATIVE':
                    detail += '，包负分';
                    break;
            }
        }

        return detail || null;
    }

    /**
     * 解析吃肉配置
     * @param {Object} item - 配置项
     * @returns {string|null} 解析结果
     */
    parseEatmeatConfig(item) {
        const { meatValueConfig, meatMaxValue, eatingRange } = item;

        let detail = '';

        if (eatingRange) {
            let eatRangeObj = null;

            // 处理eatingRange，可能是字符串或对象
            if (typeof eatingRange === 'string') {
                try {
                    eatRangeObj = JSON.parse(eatingRange);
                } catch (error) {
                    console.error('解析eatingRange JSON字符串失败:', error);
                    eatRangeObj = null;
                }
            } else if (typeof eatingRange === 'object' && !Array.isArray(eatingRange)) {
                eatRangeObj = eatingRange;
            }

            if (eatRangeObj) {
                const eatDetails = GOLF_SCORE_TYPES.KEYS.map(key => {
                    const value = eatRangeObj[key];
                    const label = GOLF_SCORE_TYPES.LABELS[key];
                    return `${label}${value}个`;
                }).join('、');

                detail = `${eatDetails}`;
            }
        }

        if (meatValueConfig) {
            // 处理MEAT_AS_X格式
            if (meatValueConfig.startsWith('MEAT_AS_')) {
                const score = meatValueConfig.replace('MEAT_AS_', '');
                detail += `，肉算${score}分`;
            } else {
                // 处理其他格式
                switch (meatValueConfig) {
                    case MEAT_VALUE_CONFIG_TYPES.DOUBLE_WITH_REWARD:
                        detail += `，${MEAT_VALUE_CONFIG_TYPES.getLabel('DOUBLE_WITH_REWARD')}`;
                        break;
                    case MEAT_VALUE_CONFIG_TYPES.DOUBLE_WITHOUT_REWARD:
                        detail += `，${MEAT_VALUE_CONFIG_TYPES.getLabel('DOUBLE_WITHOUT_REWARD')}`;
                        break;
                    case MEAT_VALUE_CONFIG_TYPES.SINGLE_DOUBLE:
                        detail += `，${MEAT_VALUE_CONFIG_TYPES.getLabel('SINGLE_DOUBLE')}`;
                        break;
                    case MEAT_VALUE_CONFIG_TYPES.CONTINUE_DOUBLE:
                        detail += `，${MEAT_VALUE_CONFIG_TYPES.getLabel('CONTINUE_DOUBLE')}`;
                        break;
                    default:
                        // 如果是不认识的格式，直接显示原值
                        detail += `，${meatValueConfig}`;
                        break;
                }
            }
        }

        if (meatMaxValue && meatMaxValue !== "10000000" && meatMaxValue !== 10000000) {
            detail += `，${meatMaxValue}分封顶`;
        } else {
            detail += '，不封顶';
        }

        return detail || null;
    }

    /**
     * 解析顶洞配置
     * @param {Object} item - 配置项
     * @returns {string|null} 解析结果
     */
    parseDrawConfig(item) {
        const { drawConfig } = item;

        if (!drawConfig) return null;

        switch (drawConfig) {
            case 'DrawEqual':
                return '得分打平';
            case 'NoDraw':
                return '无顶洞';
            default:
                if (drawConfig.startsWith('Diff_')) {
                    const score = drawConfig.replace('Diff_', '');
                    return `得分${score}分以内`;
                }
                return null;
        }
    }

    /**
     * 解析奖励配置
     * @param {Object} item - 配置项
     * @returns {string|null} 解析结果
     */
    parseRewardConfig(item) {
        const { RewardConfig } = item;

        if (!RewardConfig) return null;

        try {
            // 如果RewardConfig是字符串，需要解析JSON
            const config = typeof RewardConfig === 'string' ? JSON.parse(RewardConfig) : RewardConfig;

            const { rewardType, rewardPreCondition, rewardPair } = config;

            let detail = '';

            // 解析奖励类型
            const rewardTypeText = rewardType === 'add' ? '加法奖励' : '乘法奖励';
            detail += rewardTypeText;

            // 解析前置条件
            if (rewardPreCondition) {
                let preConditionText = '';
                switch (rewardPreCondition) {
                    case 'total_win':
                        preConditionText = '总分获胜时';
                        break;
                    case 'total_not_fail':
                        preConditionText = '总分不输时';
                        break;
                    case 'total_ignore':
                        preConditionText = '无视总分';
                        break;
                    default:
                        preConditionText = rewardPreCondition;
                        break;
                }
                detail += `，${preConditionText}`;
            }

            // 解析奖励项目
            if (rewardPair && Array.isArray(rewardPair)) {
                const validRewards = rewardPair.filter(item => item.rewardValue > 0);

                if (validRewards.length > 0) {
                    const rewardDetails = validRewards.map(item => {
                        const { scoreName, rewardValue } = item;
                        return `${scoreName}+${rewardValue}`;
                    }).join('、');

                    detail += `，${rewardDetails}`;
                } else {
                    detail += '，未设置奖励';
                }
            }

            return detail;

        } catch (error) {
            console.error('解析奖励配置失败:', error);
            return '奖励配置解析失败';
        }
    }
}

module.exports = BaseRuleParser; 