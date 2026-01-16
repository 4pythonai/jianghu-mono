const app = getApp();

Page({
    /**
     * 页面的初始数据
     */
    data: {
        uuid: '',           // 游戏UUID, 用于标识数据来源
        players: [],        // 玩家列表
        originalPlayers: [] // 原始玩家数据(用于取消时恢复)
    },

    /**
     * T台选择事件
     */
    onTeeSelect(e) {
        const { playerIndex, tee } = e.currentTarget.dataset;

        // 只更新特定玩家的T台, 避免整个数组重新渲染
        if (this.data.players[playerIndex]) {
            this.setData({
                [`players[${playerIndex}].tee`]: tee
            });

            // 打印API调用所需的参数
            const player = this.data.players[playerIndex];
            console.log('🏌️ T台更新 - API参数:', {
                uuid: this.data.uuid,
                userid: player.user_id,
                tee: tee
            });

            app.api.game.setTee({
                uuid: this.data.uuid,
                userid: player.user_id,
                tee: tee
            }).then(res => {
                console.log('🏌️ T台更新 - API响应:', res);
            });

        }
    },

    /**
     * 确认T台选择
     */
    onConfirm() {
        console.log('🏌️ 确认T台选择:', this.data.players);

        // 获取当前页面栈
        const pages = getCurrentPages();

        // 查找 commonCreate 页面
        let commonCreatePage = null;
        for (let i = pages.length - 1; i >= 0; i--) {
            const page = pages[i];
            if (page.route && page.route.includes('commonCreate')) {
                commonCreatePage = page;
                break;
            }
        }

        if (commonCreatePage && typeof commonCreatePage.onTeeSelectionComplete === 'function') {
            // 调用commonCreate页面的回调方法
            commonCreatePage.onTeeSelectionComplete(this.data.players);

            wx.showToast({
                title: 'T台设置完成',
                icon: 'success'
            });

            // 返回上一页
            setTimeout(() => {
                wx.navigateBack();
            }, 1500);
        } else {
            console.error('❌ 无法找到commonCreate页面或回调方法');
            wx.showToast({
                title: '数据更新失败',
                icon: 'error'
            });
        }
    },

    /**
     * 取消T台选择
     */
    onCancel() {
        wx.showModal({
            title: '确认取消',
            content: '取消后将不保存当前的T台设置',
            success: (res) => {
                if (res.confirm) {
                    console.log('🏌️ 用户取消T台选择');
                    wx.navigateBack();
                }
            }
        });
    },

    /**
     * 从commonCreate页面获取玩家数据
     */
    loadPlayersFromCommonCreate() {
        const pages = getCurrentPages();

        // 查找 commonCreate 页面
        let commonCreatePage = null;
        for (let i = pages.length - 1; i >= 0; i--) {
            const page = pages[i];
            if (page.route && page.route.includes('commonCreate')) {
                commonCreatePage = page;
                break;
            }
        }

        if (commonCreatePage && commonCreatePage.data && commonCreatePage.data.formData) {
            const gameGroups = commonCreatePage.data.formData.gameGroups;
            const players = [];

            // 收集所有玩家数据
            gameGroups.forEach((group, groupIndex) => {
                if (group.players && Array.isArray(group.players)) {
                    group.players.forEach((player, playerIndex) => {
                        if (player) {
                            players.push({
                                ...player,
                                groupIndex,
                                playerIndex,
                                tee: player.tee || 'blue' // 确保有默认T台
                            });
                        }
                    });
                }
            });

            console.log('🏌️ 从commonCreate页面加载玩家数据:', players);

            this.setData({
                players: players,
                originalPlayers: JSON.parse(JSON.stringify(players)) // 深拷贝原始数据
            });

            return true;
        }

        return false;
    },

    /**
     * 快速设置所有玩家为同一T台(可选功能)
     */
    setAllPlayersToSameTee(teeColor) {
        const players = this.data.players.map(player => ({
            ...player,
            tee: teeColor
        }));

        this.setData({
            players
        });

        console.log(`🏌️ 所有玩家T台设置为: ${teeColor}`);
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

        if (options.uuid) {
            this.setData({
                uuid: options.uuid
            });
        }
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        console.log('🏌️ T台选择页面显示');

        // 从commonCreate页面加载玩家数据
        const success = this.loadPlayersFromCommonCreate();

        if (!success) {
            console.error('❌ 无法加载玩家数据');
            wx.showModal({
                title: '数据加载失败',
                content: '无法获取玩家信息, 请返回重试',
                showCancel: false,
                success: () => {
                    wx.navigateBack();
                }
            });
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        console.log('🏌️ T台选择页面隐藏');
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        console.log('🏌️ T台选择页面卸载');
    }
}); 