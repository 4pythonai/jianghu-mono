/**
 * 游戏常量配置文件
 * 统一管理所有游戏相关的常量配置，避免重复定义
 */

// 高尔夫球成绩类型常量
export const GOLF_SCORE_TYPES = {
    // 英文键名
    BETTER_THAN_BIRDIE: 'BetterThanBirdie',
    BIRDIE: 'Birdie',
    PAR: 'Par',
    WORSE_THAN_PAR: 'WorseThanPar',

    // 中文标签映射
    LABELS: {
        'BetterThanBirdie': '比鸟更好',
        'Birdie': '鸟',
        'Par': '帕',
        'WorseThanPar': '比帕更差'
    },

    // 渲染顺序
    KEYS: ['BetterThanBirdie', 'Birdie', 'Par', 'WorseThanPar']
};

// 游戏类型映射常量 - 统一配置
export const GAME_TYPE_MAP = {
    // 2人游戏
    '2p-gross': {
        name: '2人比杆',
        components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'],
        hasPlayerConfig: false,
        hasGrouping: false
    },
    '2p-hole': {
        name: '2人比洞',
        components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'],
        hasPlayerConfig: false,
        hasGrouping: false
    },
    '2p-8421': {
        name: '2人8421',
        components: ['Summary', 'HoleRangeSelector', 'PlayerIndicator', 'RedBlueConfig', 'RankingSelector'],
        hasPlayerConfig: true,
        hasGrouping: false
    },

    // 3人游戏
    '3p-doudizhu': {
        name: '3人斗地主',
        components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'],
        hasPlayerConfig: false,
        hasGrouping: true
    },
    '3p-dizhupo': {
        name: '3人地主婆',
        components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'],
        hasPlayerConfig: false,
        hasGrouping: true
    },
    '3p-8421': {
        name: '3人8421',
        components: ['Summary', 'HoleRangeSelector', 'PlayerIndicator', 'RedBlueConfig', 'RankingSelector'],
        hasPlayerConfig: true,
        hasGrouping: true
    },

    // 4人游戏
    '4p-lasi': {
        name: '4人拉丝',
        components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'],
        hasPlayerConfig: false,
        hasGrouping: true
    },
    '4p-8421': {
        name: '4人8421',
        components: ['Summary', 'HoleRangeSelector', 'PlayerIndicator', 'RedBlueConfig', 'RankingSelector'],
        hasPlayerConfig: true,
        hasGrouping: true
    },
    '4p-dizhupo': {
        name: '4人地主婆',
        components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'],
        hasPlayerConfig: false,
        hasGrouping: true
    },
    '4p-3da1': {
        name: '4人3打1',
        components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'],
        hasPlayerConfig: false,
        hasGrouping: true
    },
    '4p-bestak': {
        name: '4人Bestak',
        components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'],
        hasPlayerConfig: false,
        hasGrouping: true
    },

    // 多人游戏
    'mp-labahua': {
        name: '多人喇叭花',
        components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'],
        hasPlayerConfig: false,
        hasGrouping: true
    },
    'mp-dabudui': {
        name: '多人大部队',
        components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'],
        hasPlayerConfig: false,
        hasGrouping: true
    }
};

// 路由映射配置
export const ROUTE_MAP = {
    // 2人游戏路由
    '2p-gross': '/pages/ruleConfig/2player/2p-gross/2p-gross',
    '2p-hole': '/pages/ruleConfig/2player/2p-hole/2p-hole',
    '2p-8421': '/pages/ruleConfig/2player/2p-8421/2p-8421',

    // 3人游戏路由
    '3p-doudizhu': '/pages/ruleConfig/3player/3p-doudizhu/3p-doudizhu',
    '3p-dizhupo': '/pages/ruleConfig/3player/3p-dizhupo/3p-dizhupo',
    '3p-8421': '/pages/ruleConfig/3player/3p-8421/3p-8421',

    // 4人游戏路由
    '4p-lasi': '/pages/ruleConfig/4player/4p-lasi/4p-lasi',
    '4p-8421': '/pages/ruleConfig/4player/4p-8421/4p-8421',
    '4p-dizhupo': '/pages/ruleConfig/4player/4p-dizhupo/4p-dizhupo',
    '4p-3da1': '/pages/ruleConfig/4player/4p-3da1/4p-3da1',
    '4p-bestak': '/pages/ruleConfig/4player/4p-bestak/4p-bestak',

    // 多人游戏路由
    'mp-labahua': '/pages/ruleConfig/mplayer/mp-labahua/mp-labahua',
    'mp-dabudui': '/pages/ruleConfig/mplayer/mp-dabudui/mp-dabudui'
};

// 用户规则映射配置（用于MyRules组件）
export const USER_RULE_MAP = {
    'twoPlayers': {
        '8421': '2p-8421',
        'gross': '2p-gross',
        'hole': '2p-hole'
    },
    'threePlayers': {
        '8421': '3p-8421',
        'doudizhu': '3p-doudizhu',
        'dizhupo': '3p-dizhupo'
    },
    'fourPlayers': {
        '8421': '4p-8421',
        'lasi': '4p-lasi',
        'dizhupo': '4p-dizhupo',
        '3da1': '4p-3da1',
        'bestak': '4p-bestak'
    }
};

// 分组显示名称
export const GROUP_DISPLAY_NAMES = {
    twoPlayers: '2人游戏',
    threePlayers: '3人游戏',
    fourPlayers: '4人游戏'
};

// 工具函数
export const GameConstantsUtils = {
    /**
     * 获取成绩类型的中文标签
     * @param {string} key 英文键名
     * @returns {string} 中文标签
     */
    getScoreTypeLabel(key) {
        return GOLF_SCORE_TYPES.LABELS[key] || key;
    },

    /**
     * 获取所有成绩类型的键名数组
     * @returns {Array} 键名数组
     */
    getScoreTypeKeys() {
        return GOLF_SCORE_TYPES.KEYS;
    },

    /**
     * 获取游戏类型配置
     * @param {string} gameType 游戏类型
     * @returns {Object|null} 游戏类型配置
     */
    getGameTypeConfig(gameType) {
        return GAME_TYPE_MAP[gameType] || null;
    },

    /**
     * 获取游戏类型显示名称
     * @param {string} gameType 游戏类型
     * @returns {string} 显示名称
     */
    getGameTypeName(gameType) {
        const config = this.getGameTypeConfig(gameType);
        return config ? config.name : gameType;
    },

    /**
     * 获取游戏类型需要的组件
     * @param {string} gameType 游戏类型
     * @returns {Array} 组件名称数组
     */
    getRequiredComponents(gameType) {
        const config = this.getGameTypeConfig(gameType);
        return config ? config.components : ['Summary', 'HoleRangeSelector'];
    },

    /**
     * 检查是否需要球员配置
     * @param {string} gameType 游戏类型
     * @returns {boolean}
     */
    needsPlayerConfig(gameType) {
        const config = this.getGameTypeConfig(gameType);
        if (config) {
            return config.hasPlayerConfig;
        }

        // 如果精确匹配失败，尝试部分匹配
        const matchingGameType = Object.keys(GAME_TYPE_MAP).find(key =>
            key.includes(gameType) || gameType.includes(key)
        );

        if (matchingGameType) {
            const matchedConfig = GAME_TYPE_MAP[matchingGameType];
            console.log(`[GameConstantsUtils] 部分匹配成功: '${gameType}' -> '${matchingGameType}'`);
            return matchedConfig.hasPlayerConfig;
        }

        // 最后检查是否包含 '8421' 关键字
        if (gameType.includes('8421')) {
            console.log(`[GameConstantsUtils] 通过关键字匹配: '${gameType}' 包含 '8421'`);
            return true;
        }

        return false;
    },

    /**
     * 检查是否需要分组配置
     * @param {string} gameType 游戏类型
     * @returns {boolean}
     */
    needsGrouping(gameType) {
        const config = this.getGameTypeConfig(gameType);
        return config ? config.hasGrouping : false;
    },

    /**
     * 获取路由地址
     * @param {string} gameType 游戏类型
     * @returns {string|null} 路由地址
     */
    getRoutePath(gameType) {
        return ROUTE_MAP[gameType] || null;
    },

    /**
     * 获取用户规则映射
     * @param {string} group 分组
     * @param {string} ruleType 规则类型
     * @returns {string|null} 映射后的规则类型
     */
    getUserRuleMapping(group, ruleType) {
        return USER_RULE_MAP[group]?.[ruleType] || null;
    },

    /**
     * 获取分组显示名称
     * @param {string} group 分组
     * @returns {string} 显示名称
     */
    getGroupDisplayName(group) {
        return GROUP_DISPLAY_NAMES[group] || '未知';
    },

    /**
     * 获取所有游戏类型
     * @returns {Array} 游戏类型数组
     */
    getAllGameTypes() {
        return Object.keys(GAME_TYPE_MAP);
    },

    /**
     * 验证游戏类型是否有效
     * @param {string} gameType 游戏类型
     * @returns {boolean}
     */
    isValidGameType(gameType) {
        return !!this.getGameTypeConfig(gameType);
    }
}; 