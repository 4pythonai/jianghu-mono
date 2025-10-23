/**
 * 统一规则格式化器
 * 合并 displayFormatter.js 的功能，提供统一的格式化接口
 */
const { GOLF_SCORE_TYPES } = require('../GambleMetaConfig');

class RuleFormatter {
    /**
     * 格式化扣分规则显示
     * @param {string} badScoreBaseLine - 扣分基线，如 "Par+4", "DoublePar+7", "NoSub"
     * @param {string|number} badScoreMaxLost - 最大扣分，如 "10000000" 或 10000000
     * @returns {string} 格式化后的显示文本，如 "帕+4/不封顶"
     */
    formatKoufenRule(badScoreBaseLine, badScoreMaxLost) {
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
        }
        if (startText) {
            return startText;
        }
        if (fengdingText) {
            return fengdingText;
        }
        return '请配置扣分规则';
    }

    /**
     * 格式化顶洞规则显示
     * @param {string} drawConfig - 顶洞配置，如 "DrawEqual", "Diff_6", "NoDraw"
     * @returns {string} 格式化后的显示文本，如 "得分打平"
     */
    formatDrawRule(drawConfig) {
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
    }

    /**
     * 格式化吃肉规则显示
     * @param {string} meatValueConfig - 肉分值配置，如 "MEAT_AS_2", "SINGLE_DOUBLE", "CONTINUE_DOUBLE"
     * @param {string|number} meatMaxValue - 吃肉封顶值，如 "10000000" 或 10000000
     * @returns {string} 格式化后的显示文本，如 "肉算2分/不封顶"
     */
    formatMeatRule(meatValueConfig, meatMaxValue) {
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
        }
        if (meatValueText) {
            return meatValueText;
        }
        if (meatMaxText) {
            return meatMaxText;
        }
        return '请配置吃肉规则';
    }

    /**
     * 格式化同伴惩罚规则显示
     * @param {string} dutyConfig - 同伴惩罚配置，如 "NODUTY", "DUTY_DINGTOU", "DUTY_NEGATIVE"
     * @returns {string} 格式化后的显示文本，如 "不包负分"
     */
    formatDutyRule(dutyConfig) {
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
    }

    /**
     * 格式化 eatingRange 显示
     * @param {string|Object} eatingRange - 吃肉范围配置
     * @returns {string} 格式化后的显示文本，如 "小鸟+1, 帕+1"
     */
    formatEatingRange(eatingRange) {
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
    }

    /**
     * 格式化完整的8421规则显示
     * @param {Object} config - 完整的配置对象
     * @returns {Object} 格式化后的显示对象
     */
    format8421RuleDisplay(config) {
        return {
            koufen: this.formatKoufenRule(config.badScoreBaseLine, config.badScoreMaxLost),
            draw: this.formatDrawRule(config.drawConfig),
            meat: this.formatMeatRule(config.meatValueConfig, config.meatMaxValue),
            duty: this.formatDutyRule(config.dutyConfig),
            eatingRange: this.formatEatingRange(config.eatingRange)
        };
    }

    /**
     * 格式化完整的拉丝规则显示
     * @param {Object} config - 完整的配置对象
     * @returns {Object} 格式化后的显示对象
     */
    formatLasiRuleDisplay(config) {
        const result = this.format8421RuleDisplay(config);

        // 添加拉丝特有的奖励规则格式化
        if (config.RewardConfig) {
            result.reward = this.formatRewardRule(config.RewardConfig);
        }

        return result;
    }

    /**
     * 格式化奖励规则显示
     * @param {string|Object} rewardConfig - 奖励配置
     * @returns {string} 格式化后的显示文本
     */
    formatRewardRule(rewardConfig) {
        if (!rewardConfig) {
            return '无奖励';
        }

        try {
            // 如果RewardConfig是字符串，需要解析JSON
            const config = typeof rewardConfig === 'string' ? JSON.parse(rewardConfig) : rewardConfig;

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
            console.error('格式化奖励配置失败:', error);
            return '奖励配置格式化失败';
        }
    }

    /**
     * 格式化分数显示
     * @param {number} score - 分数
     * @param {number} par - 标准杆
     * @returns {string} 格式化后的分数显示
     */
    formatScore(score, par) {
        if (!score || score === 0) return '0';
        return score.toString();
    }

    /**
     * 格式化差值显示
     * @param {number} score - 分数
     * @param {number} par - 标准杆
     * @returns {string} 格式化后的差值显示
     */
    formatDiff(score, par) {
        if (!score || !par) return '0';
        const diff = score - par;
        if (diff === 0) return '0';
        return diff > 0 ? `+${diff}` : diff.toString();
    }

    /**
     * 计算分数样式类
     * @param {number} diff - 差值
     * @returns {string} 样式类名
     */
    getScoreClass(diff) {
        if (diff <= -2) return 'score-eagle';
        if (diff === -1) return 'score-birdie';
        if (diff === 0) return 'score-par';
        if (diff === 1) return 'score-bogey';
        if (diff === 2) return 'score-double-bogey';
        if (diff >= 3) return 'score-triple-bogey';
        return 'score-par';
    }
}

// 创建单例实例
const ruleFormatter = new RuleFormatter();

// 导出单例实例
module.exports = ruleFormatter;

// 导出兼容接口，保持向后兼容
module.exports.RuleFormatter = RuleFormatter;
module.exports.DisplayFormatter = ruleFormatter; 