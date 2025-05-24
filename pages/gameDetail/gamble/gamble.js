// 游戏(Gamble)模块逻辑
Component({
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
            // TODO: 实际游戏初始化逻辑
            setTimeout(() => {
                this.setData({ loading: false });
            }, 1500);
        }
    },

    // 生命周期
    lifetimes: {
        attached() {
            this.initGame();
        }
    }
});