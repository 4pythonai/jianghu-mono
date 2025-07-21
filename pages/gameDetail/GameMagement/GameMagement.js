Component({
    properties: {
        // 这里可以定义需要从父页面传递的数据属性
    },
    methods: {
        onCellClick(e) {
            this.triggerEvent('cellclick', e.detail);
        },
        onShowAddPlayer(e) {
            this.triggerEvent('showaddplayer', e.detail);
        },
        onAddPlayerConfirm(e) {
            this.triggerEvent('addplayerconfirm', e.detail);
        },
        onShowGameOperation(e) {
            this.triggerEvent('showgameoperation', e.detail);
        },
        onOptionClick(e) {
            this.triggerEvent('optionclick', e.detail);
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