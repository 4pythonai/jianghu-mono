import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../stores/gameStore'

Page({
    usingComponents: {
        'bbs': './bbs/bbs',
        'gamble': './gamble/gamble',
        'ScoreTable': './ScoreTable/ScoreTable'
    },
    data: {
        gameId: '',
        groupId: '',
        currentTab: 0, // 新增
    },

    onLoad(options) {
        // ** 核心:创建 Store 和 Page 的绑定 **
        this.storeBindings = createStoreBindings(this, {
            store: gameStore, // 需要绑定的 store
            fields: ['gameData', 'loading', 'error', 'players', 'scores', 'holes'], // 移除 currentTab
            actions: ['fetchGameDetail'], // 移除 setCurrentTab
        });

        const gameId = options?.gameId;
        const groupId = options?.groupId; // 新增:获取 groupId 参数

        this.setData({ gameId, groupId });

        if (gameId) {
            if (groupId) {
                console.log('🎯 加载指定分组的比赛详情', { gameId, groupId });
                this.fetchGameDetail(gameId, groupId);
            } else {
                console.log('🎯 加载比赛详情', { gameId });
                this.fetchGameDetail(gameId);
            }
        } else {
            console.warn('⚠️ 无效的比赛ID');
            wx.showToast({
                title: '比赛ID无效',
                icon: 'none'
            });
        }
    },

    onUnload() {
        // ** 关键:在页面销毁时清理绑定 **
        this.storeBindings.destroyStoreBindings();
    },

    // 重试加载
    retryLoad() {
        if (this.data.loading) return;

        const { gameId, groupId } = this.data;

        if (gameId) {
            if (groupId) {
                this.fetchGameDetail(gameId, groupId);
            } else {
                this.fetchGameDetail(gameId);
            }
        }
    },

    // 切换tab页方法
    switchTab: function (e) {
        const newTab = Number.parseInt(e.currentTarget.dataset.tab, 10);
        this.setData({ currentTab: newTab }); // 直接 setData
    },

    // 页面显示时检查数据
    onShow() {
        // 每次页面显示都强制刷新数据，确保记分tab有最新的球员和球洞
        const { gameId, groupId } = this.data;
        if (gameId) {
            if (groupId) {
                this.fetchGameDetail(gameId, groupId);
            } else {
                this.fetchGameDetail(gameId);
            }
        }
    },

    onCellClick(e) {
        const { holeIndex, playerIndex, unique_key } = e.detail;
        const scoreInputPanel = this.selectComponent('#scoreInputPanel');
        if (scoreInputPanel) {
            scoreInputPanel.show({ holeIndex, playerIndex, unique_key });
        } else {
            console.error("无法找到 #scoreInputPanel 组件");
        }
    },

    onShowAddPlayer(e) {
        console.log('📊 [GameDetail] 显示添加球员面板');
        const addPlayerHubPanel = this.selectComponent('#addPlayerHubPanel');
        if (addPlayerHubPanel) {
            addPlayerHubPanel.show({
                gameId: this.data.gameId
            });
        } else {
            console.error("无法找到 # addPlayerHubPanel 组件");
        }
    },

    onAddPlayerConfirm(e) {
        console.log('📊 [GameDetail] 添加球员确认', e.detail);
        wx.showToast({
            title: '添加球员成功',
            icon: 'success'
        });
    },




    onShowGameOperation(e) {
        console.log('📊 [GameDetail] 显示游戏操作面板');
        const gameOperationPanel = this.selectComponent('#gameOperationPanel');
        if (gameOperationPanel) {
            gameOperationPanel.show({
                gameId: this.data.gameId
            });
        } else {
            console.error("无法找到 #gameOperationPanel 组件");
        }
    },



    // OperationBar 功能选项点击事件
    onOptionClick(e) {
        const { option } = e.detail;
        console.log('📊 [GameDetail] OperationBar 功能选项被点击:', option);

        // TODO: 根据不同选项实现具体功能
        switch (option) {
            case 'edit':
                console.log('执行修改功能');
                break;
            case 'qrcode':
                console.log('显示比赛码');
                break;
            case 'scorecard':
                console.log('生成成绩卡');
                break;
            case 'poster':
                console.log('生成海报');
                break;
            case 'feedback':
                console.log('提交反馈');
                break;
            case 'style':
                console.log('切换风格');
                break;
            case 'account':
                console.log('查看账本');
                break;
            default:
                console.log('未知选项:', option);
        }
    },

    // OperationBar 取消比赛事件
    onCancelGame(e) {
        console.log('📊 [GameDetail] OperationBar 取消比赛被触发');
        // TODO: 实现取消比赛功能
    },

    onFinishGame(e) {
        console.log('📊 [GameDetail] OperationBar 结束比赛被触发');
        // TODO: 实现结束比赛功能
    }
});