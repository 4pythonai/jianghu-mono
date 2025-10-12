import gamble from '../../../api/modules/gamble.js'

Component({
    properties: {
        gameid: {
            type: String,
            value: ''
        },
        groupid: {
            type: String,
            value: ''
        }
    },

    data: {
        SummaryResult: {},
        gambleResults: [],
        loading: false,
        lastFetchParams: null,  // 记录上次请求的参数，避免重复请求
        createTime: '',  // 创建时间，传递给 Drawer 组件
        gameStatus: '进行中',  // 游戏状态，传递给 Drawer 组件
        // 新增：显示控制状态
        currentDisplayType: 'summary', // 'summary' 或 'detail'
        currentDetailIndex: -1 // 当前显示的明细索引，-1表示显示汇总
    },

    lifetimes: {
        attached() {
            // 只有在属性已经设置的情况下才执行
            const { gameid, groupid } = this.properties;
            if (gameid && groupid) {
                this.fetchGambleSummary();
            }
        }
    },

    observers: {
        'gameid': function (gameid) {
            if (gameid) {
                this.fetchGambleSummary();
            }
        },
        'groupid': function (groupid) {
            if (groupid) {
                this.fetchGambleSummary();
            }
        }
    },

    methods: {
        /**
         * 获取赌博汇总数据
         */
        async fetchGambleSummary() {
            const { gameid, groupid } = this.properties;

            if (!gameid || !groupid) {
                return;
            }

            // 检查是否与上次请求参数相同，避免重复请求
            const currentParams = `${gameid}-${groupid}`;
            if (this.data.lastFetchParams === currentParams && this.data.loading) {
                return;
            }

            this.setData({
                loading: true,
                lastFetchParams: currentParams
            });

            try {
                // 调用API获取赌博汇总数据
                const result = await gamble.getGambleSummary({
                    gameid: gameid,
                    groupid: groupid
                });

                // 直接设置数据
                this.setData({
                    SummaryResult: result.SummaryResult,
                    gambleResults: result.gambleResults,
                    loading: false
                });

                // 添加调试日志
            } catch (error) {
                console.error('[GambleSummary] 请求失败:', error);
                this.setData({ loading: false });
            }
        },


        async handleAddGame() {
            // 引入导航助手
            const navigationHelper = require('s@/utils/navigationHelper.js');

            try {
                // 跳转到游戏规则页面
                await navigationHelper.navigateTo('/pages/rules/rules');
                console.log('🎮 成功跳转到游戏规则页面');
            } catch (err) {
                console.error('🎮 跳转游戏规则页面失败:', err);
                wx.showToast({ title: '页面跳转失败', icon: 'none' });
            }
        },





        /**
         * 导航栏图标按钮点击事件
         */
        async gotoRuntimeConfigList() {
            // 引入导航助手
            const navigationHelper = require('../../../utils/navigationHelper.js');

            const gameid = this.properties.gameid;
            const groupid = this.properties.groupid;

            try {
                await navigationHelper.navigateTo(`/pages/gameDetail/RuntimeConfigList/RuntimeConfigList?gameid=${gameid}&groupid=${groupid}`);
            } catch (error) {
                console.error('[GambleSummary] 跳转失败:', error);
                wx.showToast({ title: '页面跳转失败', icon: 'none' });
            }
        },

        /**
         * 刷新方法 - 供父组件调用
         */
        refresh() {
            this.fetchGambleSummary();
        },

        /**
         * 显示抽屉
         */
        showDrawer() {
            // 通过选择器获取 Drawer 组件实例并调用其 show 方法
            const drawer = this.selectComponent('#drawer');
            if (drawer) {
                drawer.show();
            }
        },

        /**
         * 抽屉打开事件处理
         */
        onDrawerOpen() {
        },

        /**
         * 抽屉关闭事件处理
         */
        onDrawerClose() {
        },

        /**
         * 抽屉确认事件处理
         */
        onDrawerConfirm() {
            // 可以在这里添加确认后的逻辑
            wx.showToast({
                title: '操作成功',
                icon: 'success'
            });
        },

        /**
         * 菜单项点击事件处理
         */
        onMenuAction(e) {
            const action = e.currentTarget.dataset.action;
            console.log('[GambleSummary] 菜单项点击:', action);

            switch (action) {
                case 'viewDetail':
                    this.handleViewDetail();
                    break;
                default:
                    console.warn('[GambleSummary] 未知的菜单操作:', action);
            }
        },

        /**
         * 查看明细处理方法
         */
        handleViewDetail() {
            console.log('[GambleSummary] 显示明细抽屉');
            const drawer = this.selectComponent('#drawer');
            if (drawer && drawer.show) {
                drawer.show();
            } else {
                console.warn('[GambleSummary] Drawer组件未找到或没有show方法');
                wx.showToast({
                    title: '组件加载失败',
                    icon: 'none'
                });
            }
        },

        /**
         * 切换显示汇总或明细
         */
        switchDisplay(e) {
            const { type, index } = e.detail;
            console.log('[GambleSummary] 切换显示:', { type, index });

            this.setData({
                currentDisplayType: type,
                currentDetailIndex: index
            });
        }
    }
});