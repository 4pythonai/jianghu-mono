Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {
        isVisible: true, // 默认显示用于UI预览
        players: [ // 模拟玩家数据
            { avatar: '/images/default-avatar.png', score: 5 },
            { avatar: '/images/default-avatar.png', score: 4 },
            { avatar: '/images/default-avatar.png', score: 4 },
            { avatar: '/images/default-avatar.png', score: 0 },
        ],
        // 假设每个player-item的高度是固定的（头像80rpx + 上下margin等），比如 120rpx
        // 这个值需要和WXSS中 .player-item 的实际高度保持一致
        playerItemHeight: 120
    },

    /**
     * 组件的方法列表
     */
    methods: {

    }
}) 