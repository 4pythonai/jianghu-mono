// RedBlueConfig组件 - 分组配置
const RuntimeComponentsUtils = require('../common-utils.js');

Component({
    properties: {
        // 所有玩家
        players: {
            type: Array,
            value: []
        },
        // 初始分组配置
        initialRedBlueConfig: {
            type: String,
            value: '4_固拉'
        },
        // 初始玩家顺序
        initialBootstrapOrder: {
            type: Array,
            value: []
        }
    },

    data: {
        scrollTop: 0,
        USERS: [
            {
                userid: 1,
                nickname: '玩家1',
            },
            {
                userid: 2,
                nickname: '玩家2',
            },
            {
                userid: 3,
                nickname: '玩家3',
            }
        ],
        // 分组方式:固拉、4_乱拉、4_高手不见面
        red_blue_config: '4_固拉',
        bootstrap_order: [],
        // 初始化标志位，避免重复触发事件
        hasInitialized: false
    },

    lifetimes: {
        attached() {
            // this.initializeConfig();
        }
    },

    observers: {
        'players, initialRedBlueConfig, initialBootstrapOrder': function (players, initialRedBlueConfig, initialBootstrapOrder) {

            console.log('[RedBlueConfig] 观察者触发，players:', players, 'initialRedBlueConfig:', initialRedBlueConfig, 'initialBootstrapOrder:', initialBootstrapOrder);

            this.initializeConfig();
        }
    },

    methods: {

        onSortEnd(e) {
            console.log("弹框收到排序结果:", e.detail.listData);
            // 保存排序结果到本地数据
            this.setData({
                holePlayList: e.detail.listData
            });
            // 这里可以处理排序结果，比如保存到本地或传递给父组件
            this.triggerEvent('holesortend', {
                listData: e.detail.listData
            });
        },

        // 滚动事件处理
        onScroll(e) {
            this.setData({
                scrollTop: e.detail.scrollTop
            });
        },

        initializeConfig() {


        }

    }
}); 