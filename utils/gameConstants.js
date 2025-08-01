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



// 吃肉规则配置常量
export const EATMEAT_CONFIG = {

    // 数值范围
    RANGES: {
        EAT_VALUE: Array.from({ length: 20 }, (_, i) => i + 1), // 1-20, 吃肉数量范围
        TOP_SCORE: Array.from({ length: 20 }, (_, i) => i + 1)  // 1-20, 封顶分数范围
    }
};

// 扣分规则配置常量
export const KOUFEN_CONFIG = {
    // 扣分开始条件
    SUB_OPTIONS: [
        { label: '不扣分', value: 'NoSub' },
        { label: '从帕+X开始扣分', value: 'Par+X' },
        { label: '从双帕+Y开始扣分', value: 'DoublePar+Y' }
    ],

    // 同伴惩罚配置
    DUTY_OPTIONS: [
        { label: '不包负分', value: 'NODUTY' },
        { label: '同伴顶头包负分', value: 'DUTY_CODITIONAL' },
        { label: '包负分', value: 'DUTY_NEGATIVE' }
    ],

    // 数值范围
    RANGES: {
        PA_SCORE: Array.from({ length: 21 }, (_, i) => i),      // 0-20, 帕分数范围
        DOUBLE_PAR_SCORE: Array.from({ length: 21 }, (_, i) => i), // 0-20, 双帕分数范围
        MAX_SUB_SCORE: Array.from({ length: 21 }, (_, i) => i + 1) // 1-21, 封顶分数范围
    }
};

// 顶洞规则配置常量
export const DINGDONG_CONFIG = {
    // 顶洞条件选项
    DRAW_OPTIONS: [
        { label: '得分打平', value: 'DrawEqual' },
        { label: '得分X分以内', value: 'Diff_X' },
        { label: '无顶洞', value: 'NoDraw' }
    ]
};

// 游戏类型映射常量
export const GAME_TYPE_MAP = {
    // 2人游戏
    '2p-gross': { name: '2人比杆', components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'], hasPlayerConfig: false, hasGrouping: false },
    '2p-hole': { name: '2人比洞', components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'], hasPlayerConfig: false, hasGrouping: false },
    '2p-8421': { name: '2人8421', components: ['Summary', 'HoleRangeSelector', 'PlayerIndicator', 'RedBlueConfig', 'RankingSelector'], hasPlayerConfig: true, hasGrouping: false },

    // 3人游戏
    '3p-doudizhu': { name: '3人斗地主', components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'], hasPlayerConfig: false, hasGrouping: true },
    '3p-dizhupo': { name: '3人地主婆', components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'], hasPlayerConfig: false, hasGrouping: true },
    '3p-8421': { name: '3人8421', components: ['Summary', 'HoleRangeSelector', 'PlayerIndicator', 'RedBlueConfig', 'RankingSelector'], hasPlayerConfig: true, hasGrouping: true },

    // 4人游戏
    '4p-lasi': { name: '4人拉死', components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'], hasPlayerConfig: false, hasGrouping: true },
    '4p-8421': { name: '4人8421', components: ['Summary', 'HoleRangeSelector', 'PlayerIndicator', 'RedBlueConfig', 'RankingSelector'], hasPlayerConfig: true, hasGrouping: true },
    '4p-dizhupo': { name: '4人地主婆', components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'], hasPlayerConfig: false, hasGrouping: true },
    '4p-3da1': { name: '4人3打1', components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'], hasPlayerConfig: false, hasGrouping: true },
    '4p-bestak': { name: '4人Bestak', components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'], hasPlayerConfig: false, hasGrouping: true },

    // 多人游戏
    'mp-labahua': { name: '多人喇叭花', components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'], hasPlayerConfig: false, hasGrouping: true },
    'mp-dabudui': { name: '多人大部队', components: ['Summary', 'HoleRangeSelector', 'RedBlueConfig', 'RankingSelector'], hasPlayerConfig: false, hasGrouping: true }
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
    }
}; 