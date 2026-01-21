/**
 * 赌博规则解析器总控
 * 使用重构后的规则解析器
 */

import { parse4P8421Config } from '@/utils/ruleParser/Parser4p8421.js';
import { parse4PLasiConfig } from '@/utils/ruleParser/Parser4p-lasi.js';
/**
 * 解析赌博规则配置
 * @param {Object} item - 规则配置项
 * @param {String} tag - 规则类型
 * @returns {Object} 解析后的配置详情
 */
function parseGambleRule(item, tag) {


    switch (tag) {
        case '4p-8421':
            return parse4P8421Config(item);
        case '4p-lasi':
            return parse4PLasiConfig(item);
        default:
            return {};
    }
}

export { parseGambleRule };
