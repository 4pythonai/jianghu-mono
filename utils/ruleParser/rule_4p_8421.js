/**
 * 4p-8421 规则解析器
 */
import { GOLF_SCORE_TYPES } from '../gameConstants.js'

/**
 * 解析扣分配置
 */
function parseKoufenConfig(item) {
    const { sub8421_config_string, max8421_sub_value, duty_config } = item;

    let detail = '';

    if (sub8421_config_string === 'NoSub') {
        detail = '不扣分';
    } else if (sub8421_config_string.startsWith('Par+')) {
        const score = sub8421_config_string.replace('Par+', '');
        detail = `从帕+${score}开始扣分`;
    } else if (sub8421_config_string.startsWith('DoublePar+')) {
        const score = sub8421_config_string.replace('DoublePar+', '');
        detail = `从双帕+${score}开始扣分`;
    }

    if (max8421_sub_value && max8421_sub_value !== "10000000" && max8421_sub_value !== 10000000) {
        detail += `，扣${max8421_sub_value}分封顶`;
    } else if (sub8421_config_string !== 'NoSub') {
        detail += '，不封顶';
    }

    if (duty_config) {
        switch (duty_config) {
            case 'NODUTY':
                detail += '，不包负分';
                break;
            case 'DUTY_CODITIONAL':
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
    const { meat_value_config_string, meat_max_value, eating_range } = item;

    let detail = '';

    if (eating_range) {
        let eatRangeObj = null;

        if (typeof eating_range === 'string') {
            try {
                eatRangeObj = JSON.parse(eating_range);
            } catch (e) {
                console.error('解析eating_range失败:', e);
            }
        } else if (typeof eating_range === 'object') {
            eatRangeObj = eating_range;
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

    if (meat_value_config_string) {
        switch (meat_value_config_string) {
            case 'MEAT_AS_1':
                detail += '，肉算1分';
                break;
            case 'SINGLE_DOUBLE':
                detail += '，分值翻倍';
                break;
            case 'CONTINUE_DOUBLE':
                detail += '，分值连续翻倍';
                break;
        }
    }

    if (meat_max_value && meat_max_value !== "10000000" && meat_max_value !== 10000000) {
        detail += `，${meat_max_value}分封顶`;
    } else {
        detail += '，不封顶';
    }

    return detail || null;
}

/**
 * 解析顶洞配置
 */
function parseDrawConfig(item) {
    const { draw8421_config } = item;

    if (!draw8421_config) return null;

    switch (draw8421_config) {
        case 'DrawEqual':
            return '得分打平';
        case 'NoDraw':
            return '无顶洞';
        default:
            if (draw8421_config.startsWith('Diff_')) {
                const score = draw8421_config.replace('Diff_', '');
                return `得分${score}分以内`;
            }
            return null;
    }
}

/**
 * 解析 4p-8421 规则配置
 */
function parse4P8421Config(item) {
    if (!item) return {};

    const details = {
        koufen: '无',
        eatmeat: '无',
        draw: '无'
    };

    if (item.sub8421_config_string) {
        const koufenDetail = parseKoufenConfig(item);
        if (koufenDetail) details.koufen = koufenDetail;
    }

    if (item.meat_value_config_string) {
        const eatmeatDetail = parseEatmeatConfig(item);
        if (eatmeatDetail) details.eatmeat = eatmeatDetail;
    }

    if (item.draw8421_config) {
        const drawDetail = parseDrawConfig(item);
        if (drawDetail) details.draw = drawDetail;
    }

    return details;
}

export { parse4P8421Config }; 