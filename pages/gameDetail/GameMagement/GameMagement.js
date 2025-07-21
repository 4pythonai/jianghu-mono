Component({
    properties: {
        // 这里可以定义需要从父页面传递的数据属性
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
            const gameOperationPanel = this.selectComponent('#gameOperationPanel');
            if (gameOperationPanel) {
                gameOperationPanel.show({});
            } else {
                console.error('无法找到 #gameOperationPanel 组件');
            }
        },
        onOptionClick(e) {
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
        showGameOperationPanel(options) {
            const gameOperationPanel = this.selectComponent('#gameOperationPanel');
            if (gameOperationPanel) {
                gameOperationPanel.show(options);
            } else {
                console.error('无法找到 #gameOperationPanel 组件');
            }
        }
    }
}); 