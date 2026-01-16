/**
 * 游戏配置管理 - 统一管理所有游戏相关配置
 */

const { convertToUserIds } = require('./gameUtils.js');

// 高尔夫球成绩类型
const GOLF_SCORE_TYPES = {
    BETTER_THAN_BIRDIE: 'BetterThanBirdie',
    BIRDIE: 'Birdie',
    PAR: 'Par',
    WORSE_THAN_PAR: 'WorseThanPar',

    LABELS: {
        'BetterThanBirdie': '比鸟更好',
        'Birdie': '鸟',
        'Par': '帕',
        'WorseThanPar': '比帕更差'
    },

    KEYS: ['BetterThanBirdie', 'Birdie', 'Par', 'WorseThanPar']
};

// 肉分值配置类型
const MEAT_VALUE_CONFIG_TYPES = {
    DOUBLE_WITH_REWARD: 'DOUBLE_WITH_REWARD',
    DOUBLE_WITHOUT_REWARD: 'DOUBLE_WITHOUT_REWARD',
    SINGLE_DOUBLE: 'SINGLE_DOUBLE',
    CONTINUE_DOUBLE: 'CONTINUE_DOUBLE',

    LABELS: {
        'DOUBLE_WITH_REWARD': '分值翻倍(含奖励)',
        'DOUBLE_WITHOUT_REWARD': '分值翻倍(不含奖励)',
        'SINGLE_DOUBLE': '分值翻倍',
        'CONTINUE_DOUBLE': '分值连续翻倍'
    },

    // 获取显示文本
    getLabel(type) {
        return this.LABELS[type] || type;
    }
};

// 游戏类型配置



const GAMBLE_TYPES = {
    // 2人游戏
    '2p-gross': { name: '2人比杆', playerCount: 2, ruleTypeLabel: '2人', hasPlayerConfig: false, hasGrouping: false, hasStroking: false },
    '2p-hole': { name: '2人比洞', playerCount: 2, ruleTypeLabel: '2人', hasPlayerConfig: false, hasGrouping: false, hasStroking: false },
    '2p-8421': { name: '2人8421', playerCount: 2, ruleTypeLabel: '2人', hasPlayerConfig: true, hasGrouping: false, hasStroking: false },

    // 3人游戏  
    '3p-doudizhu': { name: '3人斗地主', playerCount: 3, ruleTypeLabel: '3人', hasPlayerConfig: false, hasGrouping: true, hasStroking: false },
    '3p-dizhupo': { name: '3人地主婆', playerCount: 3, ruleTypeLabel: '3人', hasPlayerConfig: false, hasGrouping: true, hasStroking: false },
    '3p-8421': { name: '3人8421', playerCount: 3, ruleTypeLabel: '3人', hasPlayerConfig: true, hasGrouping: true, hasStroking: false },

    // 4人游戏
    '4p-lasi': { name: '4人拉丝', playerCount: 4, ruleTypeLabel: '4人', hasPlayerConfig: false, hasGrouping: true, hasStroking: true },
    '4p-8421': { name: '4人8421', playerCount: 4, ruleTypeLabel: '4人', hasPlayerConfig: true, hasGrouping: true, hasStroking: false },
    '4p-dizhupo': { name: '4人地主婆', playerCount: 4, ruleTypeLabel: '4人', hasPlayerConfig: false, hasGrouping: true, hasStroking: false },
    '4p-3da1': { name: '4人3打1', playerCount: 4, ruleTypeLabel: '4人', hasPlayerConfig: false, hasGrouping: true, hasStroking: false },
    '4p-bestak': { name: '4人Bestak', playerCount: 4, ruleTypeLabel: '4人', hasPlayerConfig: false, hasGrouping: true, hasStroking: false },

    // 多人游戏
    'mp-labahua': { name: '多人喇叭花', playerCount: 0, ruleTypeLabel: '多人', hasPlayerConfig: false, hasGrouping: true, hasStroking: false },
    'mp-dabudui': { name: '多人大部队', playerCount: 0, ruleTypeLabel: '多人', hasPlayerConfig: false, hasGrouping: true, hasStroking: false }
};

// 游戏配置管理器
const GambleMetaConfig = {
    /**
     * 获取游戏类型配置
     */
    getGambleType(sysRuleName) {
        return GAMBLE_TYPES[sysRuleName] || null;
    },

    /**
     * 获取游戏名称
     */
    getGambleHumanName(sysRuleName) {
        return GAMBLE_TYPES[sysRuleName]?.name;
    },

    /**
     * 检查是否需要球员配置
     */
    needsPlayerConfig(sysRuleName) {
        return GAMBLE_TYPES[sysRuleName]?.hasPlayerConfig;
    },

    /**
     * 检查是否需要分组
     */
    needRedBlueDiv(sysRuleName) {
        return GAMBLE_TYPES[sysRuleName]?.hasGrouping;
    },

    /**
     * 检查是否需要让杆
     */
    needsStroking(sysRuleName) {
        return GAMBLE_TYPES[sysRuleName]?.hasStroking;
    },

    /**
     * 获取默认配置
     */
    getDefaultGambleConfig(sysRuleName, players = []) {
        // 根据游戏类型设置不同的默认排名规则
        let defaultRankingConfig = 'indicator.reverse_indicator'; // 默认值

        if (sysRuleName && sysRuleName.includes('lasi')) {
            // 拉丝游戏默认使用第一个选项：得分相同按出身得分排序
            defaultRankingConfig = 'score.win_loss.reverse_score';
        } else if (sysRuleName && sysRuleName.includes('8421')) {
            // 8421游戏保持原有默认值
            defaultRankingConfig = 'indicator.reverse_indicator';
        } else {
            // 其他游戏类型
            defaultRankingConfig = 'score.reverse_score';
        }

        const config = {
            red_blue_config: '4_固拉',
            bootstrap_order: convertToUserIds(players),
            ranking_tie_resolve_config: defaultRankingConfig,
            playerIndicatorConfig: {}
        };

        // 8421游戏需要设置默认球员配置
        if (this.needsPlayerConfig(sysRuleName)) {
            const defaultPlayerConfig = {
                "Birdie": 8,
                "Par": 4,
                "Par+1": 2,
                "Par+2": 1
            };

            for (const player of players) {
                config.playerIndicatorConfig[String(player.user_id)] = { ...defaultPlayerConfig };
            }
        }

        return config;
    },
};

// CommonJS 导出，包含所有需要的常量和对象
module.exports = {
    GambleMetaConfig,
    GOLF_SCORE_TYPES,
    MEAT_VALUE_CONFIG_TYPES,
};