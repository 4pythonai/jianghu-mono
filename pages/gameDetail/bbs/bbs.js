// 互动(BBS)模块逻辑
Component({
    properties: {
        // 可接收的参数
        gameId: {
            type: String,
            value: ''
        }
    },

    data: {
        // 模块内部数据
        loading: false
    },

    methods: {
        // 模块方法
        loadData() {
            // 加载互动数据
            this.setData({ loading: true });
            console.log('加载互动数据，比赛ID:', this.properties.gameId);
            // TODO: 实际数据加载逻辑
            setTimeout(() => {
                this.setData({ loading: false });
            }, 1000);
        }
    },

    // 生命周期
    lifetimes: {
        attached() {
            this.loadData();
        }
    }
});