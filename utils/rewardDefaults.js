// 奖励规则默认值常量
export const REWARD_DEFAULTS = {
    // 加法奖励默认配置
    ADD_REWARD_ITEMS: [
        { scoreName: 'Par', rewardValue: 0 },
        { scoreName: 'Birdie', rewardValue: 1 },
        { scoreName: 'Eagle', rewardValue: 3 },
        { scoreName: 'Albatross/HIO', rewardValue: 10 }
    ],

    // 乘法奖励默认配置
    MULTIPLY_REWARD_ITEMS: [
        { scoreName: 'Par', rewardValue: 1 },
        { scoreName: 'Birdie', rewardValue: 2 },
        { scoreName: 'Eagle', rewardValue: 4 },
        { scoreName: 'Albatross/HIO', rewardValue: 10 },
        { scoreName: 'Birdie+Birdie', rewardValue: 4 },
        { scoreName: 'Birdie+Eagle', rewardValue: 8 },
        { scoreName: 'Eagle+Eagle', rewardValue: 16 }
    ],

    // 默认奖励配置（用于store初始化）
    DEFAULT_REWARD_JSON: {
        rewardType: 'add',
        rewardPreCondition: 'total_ignore', // 修正：与实际数据保持一致
        rewardPair: [
            { scoreName: 'Par', rewardValue: 0 },
            { scoreName: 'Birdie', rewardValue: 1 },
            { scoreName: 'Eagle', rewardValue: 3 },
            { scoreName: 'Albatross/HIO', rewardValue: 10 }
        ]
    }
}; 