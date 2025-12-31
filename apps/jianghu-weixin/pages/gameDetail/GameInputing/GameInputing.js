import { gameStore } from '@/stores/game/gameStore';

Component({
    data: {
        isGameOperationPanelVisible: false // 用于控制 GameOperationPanel 显示
    },
    properties: {
        gameid: String,
        groupid: String
    },
    methods: {
        onCellClick(e) {
            const { holeIndex, playerIndex, unique_key } = e.detail;
            const scoreInputPanel = this.selectComponent('#scoreInputPanel');
            if (scoreInputPanel) {
                scoreInputPanel.show({ holeIndex, playerIndex, unique_key });
            } else {
                console.error('无法找到 #scoreInputPanel 组件');
            }
        },
        onShowAddPlayer(e) {
            const addPlayerHubPanel = this.selectComponent('#addPlayerHubPanel');
            if (addPlayerHubPanel) {
                addPlayerHubPanel.show({});
            } else {
                console.error('无法找到 #addPlayerHubPanel 组件');
            }
        },
        onAddPlayerConfirm(e) {
            wx.showToast({
                title: '添加球员成功',
                icon: 'success'
            });
        },
        onShowGameOperation(e) {
            // 调用组件的 show 方法
            const gameOperationPanel = this.selectComponent('#gameOperationPanel');
            if (gameOperationPanel) {
                gameOperationPanel.show({ gameid: this.data.gameid });
            } else {
                console.error('无法找到 #gameOperationPanel 组件');
            }
        },
        onOptionClick(e) {
            // 关闭操作面板
            this.setData({ isGameOperationPanelVisible: false });
            const { option } = e.detail;
            // 这里直接处理所有操作逻辑
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
        showScoreInputPanel(options) {
            const scoreInputPanel = this.selectComponent('#scoreInputPanel');
            if (scoreInputPanel) {
                scoreInputPanel.show(options);
            } else {
                console.error('无法找到 #scoreInputPanel 组件');
            }
        },
        showAddPlayerHubPanel(options) {
            const addPlayerHubPanel = this.selectComponent('#addPlayerHubPanel');
            if (addPlayerHubPanel) {
                addPlayerHubPanel.show(options);
            }
        },
        refresh() {
            this.fetchGameDetail();
        },

        fetchGameDetail() {
            const { gameid, groupid } = this.data;
            if (!gameid) return;
            // 直接调用gameStore，不需要在组件中再次设置red_blue
            gameStore.fetchGameDetail(gameid, groupid);
        }
    }
}); 