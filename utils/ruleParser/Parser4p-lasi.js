/**
 * 4p-8421 规则解析器
 */
import { GOLF_SCORE_TYPES } from '../gameConstants.js'

/**
 * 解析扣分配置
 */
function parseKoufenConfig(item) {
    const { badScoreBaseLine, badScoreMaxLost, dutyConfig } = item;

    let detail = '';

    if (badScoreBaseLine === 'NoSub') {
        detail = '不扣分';
    } else if (badScoreBaseLine.startsWith('Par+')) {
        const score = badScoreBaseLine.replace('Par+', '');
        detail = `从帕+${score}开始扣分`;
    } else if (badScoreBaseLine.startsWith('DoublePar+')) {
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
 */
function parseEatmeatConfig(item) {
    const { meatValueConfig, meatMaxValue, eatingRange } = item;

    let detail = '';

    if (eatingRange) {
        let eatRangeObj = null;
        eatRangeObj = JSON.parse(eatingRange);


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
                case 'DOUBLE_WITH_REWARD':
                    detail += '，分值翻倍(含奖励)';
                    break;
                case 'DOUBLE_WITHOUT_REWARD':
                    detail += '，分值翻倍(不含奖励)';
                    break;
                case 'SINGLE_DOUBLE': // 兼容旧格式
                    detail += '，分值翻倍(含奖励)';
                    break;
                case 'CONTINUE_DOUBLE': // 兼容旧格式
                    detail += '，分值翻倍(不含奖励)';
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
 */
function parseDrawConfig(item) {
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

function parseRewardConfig(item) {
    const { RewardConfig } = item;
    return RewardConfig;
}

/**
 * 解析 4p-lasi 规则配置
 */
function parse4PLasiConfig(item) {
    if (!item) return {};

    console.log("拉丝item++++", item.RewardConfig)

    const details = {
        koufen: '无',
        eatmeat: '无',
        draw: '无'
    };

    if (item.badScoreBaseLine) {
        const koufenDetail = parseKoufenConfig(item);
        if (koufenDetail) details.koufen = koufenDetail;
    }

    if (item.meatValueConfig) {
        const eatmeatDetail = parseEatmeatConfig(item);
        if (eatmeatDetail) details.eatmeat = eatmeatDetail;
    }

    if (item.drawConfig) {
        const drawDetail = parseDrawConfig(item);
        if (drawDetail) details.draw = drawDetail;
    }

    // RewardConfig: "{"rewardType":"add","rewardPreCondition":"total_not_fail","rewardPair":[{"scoreName":"Par","rewardValue":1},{"scoreName":"Birdie","rewardValue":2},{"scoreName":"Eagle","rewardValue":3},{"scoreName":"Albatross\/HIO","rewardValue":4}]}"

    if (item.RewardConfig) {
        const rewardDetail = parseRewardConfig(item);
        if (rewardDetail) details.reward = rewardDetail;
    }



    return details;
}

export { parse4PLasiConfig }; 