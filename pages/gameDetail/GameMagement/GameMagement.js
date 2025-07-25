import { gameStore } from '../../../stores/gameStore';

Component({
    data: {
        red_blue: [],
        isGameOperationPanelVisible: false // 新增，用于控制 GameOperationPanel 显示
    },
    properties: {
        gameId: String,
        groupId: String
    },
    methods: {
        onCellClick(e) {
            // 直接弹出 ScoreInputPanel
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
            // 只用 data 变量控制显示
            this.setData({ isGameOperationPanelVisible: true });
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
            } else {
                console.error('无法找到 #addPlayerHubPanel 组件');
            }
        },
        // showGameOperationPanel(options) 方法已废弃，不再使用
        refresh() {
            console.log('[GameMagement] refresh called');
            this.fetchGameDetail();
        },

        fetchGameDetail() {
            const { gameId, groupId } = this.data;
            console.log('[GameMagement] fetchGameDetail called', { gameId, groupId });
            if (!gameId) return;
            // 假设gameStore.fetchGameDetail返回Promise或你有回调
            gameStore.fetchGameDetail(gameId, groupId).then(res => {
                console.log('接口返回red_blue:', res?.red_blue);
                if (res?.red_blue) {
                    this.setData({ red_blue: res.red_blue });
                    console.log('页面data.red_blue:', this.data.red_blue);
                }
            });
        }
    }
}); 