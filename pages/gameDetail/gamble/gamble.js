// 游戏(Gamble)模块逻辑
import { gameStore } from '../../../stores/gameStore'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'

Component({
    behaviors: [storeBindingsBehavior],

    storeBindings: {
        store: gameStore,
        fields: ['gameid', 'loading', 'error', 'have_gamble'],
    },

    properties: {
        // 可接收的参数
        gameId: {
            type: String,
            value: ''
        },
        players: {
            type: Array,
            value: []
        }
    },

    data: {
        // 模块内部数据
        loading: false
    },

    methods: {
        // 模块方法
        initGame() {
            // 初始化游戏
            this.setData({ loading: true });
            console.log('初始化游戏，比赛ID:', this.properties.gameId);
            console.log('参赛球员:', this.properties.players);
            console.log('gameStore中的gameid:', gameStore.gameid);
            console.log('gameStore中的have_gamble:', gameStore.have_gamble);
            // TODO: 实际游戏初始化逻辑
            setTimeout(() => {
                this.setData({ loading: false });
            }, 1500);
        },

        // 测试方法：切换游戏状态
        toggleGambleStatus() {
            gameStore.have_gamble = !gameStore.have_gamble;
            console.log('🎮 切换游戏状态为:', gameStore.have_gamble);
        },

        // 添加游戏按钮点击事件
        handleAddGame() {
            console.log('🎮 点击添加游戏按钮');

            // 跳转到游戏规则页面
            wx.navigateTo({
                url: '/pages/rules/rules',
                success: () => {
                    console.log('🎮 成功跳转到游戏规则页面');
                },
                fail: (err) => {
                    console.error('🎮 跳转失败:', err);
                    wx.showToast({
                        title: '页面跳转失败',
                        icon: 'none'
                    });
                }
            });
        }
    },

    // 生命周期
    lifetimes: {
        attached() {
            this.initGame();
        }
    }
});