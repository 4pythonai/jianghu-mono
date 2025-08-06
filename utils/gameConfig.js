/**
 * 游戏配置管理 - 统一管理所有游戏相关配置
 */

// 高尔夫球成绩类型
export const GOLF_SCORE_TYPES = {
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
export const MEAT_VALUE_CONFIG_TYPES = {
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
export const GAME_TYPES = {
    // 2人游戏
    '2p-gross': { name: '2人比杆', hasPlayerConfig: false, hasGrouping: false, hasStroking: false },
    '2p-hole': { name: '2人比洞', hasPlayerConfig: false, hasGrouping: false, hasStroking: false },
    '2p-8421': { name: '2人8421', hasPlayerConfig: true, hasGrouping: false, hasStroking: false },

    // 3人游戏  
    '3p-doudizhu': { name: '3人斗地主', hasPlayerConfig: false, hasGrouping: true, hasStroking: false },
    '3p-dizhupo': { name: '3人地主婆', hasPlayerConfig: false, hasGrouping: true, hasStroking: false },
    '3p-8421': { name: '3人8421', hasPlayerConfig: true, hasGrouping: true, hasStroking: false },

    // 4人游戏
    '4p-lasi': { name: '4人拉丝', hasPlayerConfig: true, hasGrouping: true, hasStroking: true },
    '4p-8421': { name: '4人8421', hasPlayerConfig: true, hasGrouping: true, hasStroking: false },
    '4p-dizhupo': { name: '4人地主婆', hasPlayerConfig: false, hasGrouping: true, hasStroking: false },
    '4p-3da1': { name: '4人3打1', hasPlayerConfig: false, hasGrouping: true, hasStroking: false },
    '4p-bestak': { name: '4人Bestak', hasPlayerConfig: false, hasGrouping: true, hasStroking: false },

    // 多人游戏
    'mp-labahua': { name: '多人喇叭花', hasPlayerConfig: false, hasGrouping: true, hasStroking: false },
    'mp-dabudui': { name: '多人大部队', hasPlayerConfig: false, hasGrouping: true, hasStroking: false }
};

// 路由映射 - 已迁移到新的SysEdit页面
export const ROUTES = {
    '2p-gross': '/pages/rules/SysEdit/SysEdit',
    '2p-hole': '/pages/rules/SysEdit/SysEdit',
    '2p-8421': '/pages/rules/SysEdit/SysEdit',
    '3p-doudizhu': '/pages/rules/SysEdit/SysEdit',
    '3p-dizhupo': '/pages/rules/SysEdit/SysEdit',
    '3p-8421': '/pages/rules/SysEdit/SysEdit',
    '4p-lasi': '/pages/rules/SysEdit/SysEdit',
    '4p-8421': '/pages/rules/SysEdit/SysEdit',
    '4p-dizhupo': '/pages/rules/SysEdit/SysEdit',
    '4p-3da1': '/pages/rules/SysEdit/SysEdit',
    '4p-bestak': '/pages/rules/SysEdit/SysEdit',
    'mp-labahua': '/pages/rules/SysEdit/SysEdit',
    'mp-dabudui': '/pages/rules/SysEdit/SysEdit'
};

// 用户规则映射
export const USER_RULES = {
    twoPlayers: { '8421': '2p-8421', 'gross': '2p-gross', 'hole': '2p-hole' },
    threePlayers: { '8421': '3p-8421', 'doudizhu': '3p-doudizhu', 'dizhupo': '3p-dizhupo' },
    fourPlayers: { '8421': '4p-8421', 'lasi': '4p-lasi', 'dizhupo': '4p-dizhupo', '3da1': '4p-3da1', 'bestak': '4p-bestak' }
};

// 游戏配置管理器
export const GameConfig = {
    /**
     * 获取游戏类型配置
     */
    getGameType(gameType) {
        return GAME_TYPES[gameType];
    },

    /**
     * 获取游戏名称
     */
    getGameName(gameType) {
        return GAME_TYPES[gameType]?.name;
    },

    /**
     * 检查是否需要球员配置
     */
    needsPlayerConfig(gameType) {
        return GAME_TYPES[gameType]?.hasPlayerConfig;
    },

    /**
     * 检查是否需要分组
     */
    needsGrouping(gameType) {
        return GAME_TYPES[gameType]?.hasGrouping;
    },

    /**
     * 检查是否需要让杆
     */
    needsStroking(gameType) {
        return GAME_TYPES[gameType]?.hasStroking;
    },

    /**
     * 获取路由地址
     */
    getRoute(gameType) {
        return ROUTES[gameType];
    },

    /**
     * 获取用户规则映射
     */
    getUserRule(group, ruleType) {
        return USER_RULES[group]?.[ruleType];
    },

    /**
     * 获取默认配置
     */
    getDefaultConfig(gameType, players = []) {
        const config = {
            red_blue_config: '4_固拉',
            bootstrap_order: players.map(p => Number.parseInt(p.userid)),
            ranking_tie_resolve_config: 'indicator.reverse',
            playerIndicatorConfig: {}
        };

        // 8421游戏需要设置默认球员配置
        if (this.needsPlayerConfig(gameType)) {
            const defaultPlayerConfig = {
                "Birdie": 8,
                "Par": 4,
                "Par+1": 2,
                "Par+2": 1
            };

            for (const player of players) {
                config.playerIndicatorConfig[String(player.userid)] = { ...defaultPlayerConfig };
            }
        }

        return config;
    },

    /**
     * 获取成绩类型标签
     */
    getScoreLabel(key) {
        return GOLF_SCORE_TYPES.LABELS[key] || key;
    },

    /**
     * 获取所有游戏类型
     */
    getAllGameTypes() {
        return Object.keys(GAME_TYPES);
    },

    /**
     * 验证游戏类型
     */
    isValidGameType(gameType) {
        return !!GAME_TYPES[gameType];
    },


};

// 导出兼容接口（如果其他地方还在使用旧的命名）
export const GameTypeManager = GameConfig;
export const GAME_TYPE_MAP = GAME_TYPES;
export const GameConstantsUtils = GameConfig;

// CommonJS 导出，包含所有需要的常量和对象
module.exports = {
    GameConfig,
    GOLF_SCORE_TYPES,
    MEAT_VALUE_CONFIG_TYPES,
    GAME_TYPES,
    ROUTES,
    USER_RULES,
    GameTypeManager: GameConfig,
    GAME_TYPE_MAP: GAME_TYPES,
    GameConstantsUtils: GameConfig
};