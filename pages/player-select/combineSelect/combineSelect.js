import api from '../../../api/index'

Page({
    data: {
        groupIndex: 0,
        slotIndex: 0,
        combinations: [], // 老牌组合数据
        loading: false,
        selectedCombination: -1 // 选中的组合索引
    },

    onLoad(options) {
        console.log('combineSelect页面加载，参数:', options);

        if (options.groupIndex !== undefined) {
            this.setData({
                groupIndex: parseInt(options.groupIndex)
            });
        }

        if (options.slotIndex !== undefined) {
            this.setData({
                slotIndex: parseInt(options.slotIndex)
            });
        }

        // 加载老牌组合数据
        this.loadCombinations();
    },

    /**
     * 加载老牌组合数据
     */
    async loadCombinations() {
        try {
            this.setData({ loading: true });

            const result = await api.game.getPlayerCombination({});

            if (result?.code === 200 && result?.combination) {
                this.setData({
                    combinations: result.combination
                });
                console.log('老牌组合数据加载成功:', result.combination);
            } else {
                wx.showToast({
                    title: '加载失败',
                    icon: 'none'
                });
            }
        } catch (error) {
            console.error('加载老牌组合失败:', error);
            wx.showToast({
                title: '网络错误',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    /**
     * 选择组合
     */
    selectCombination(e) {
        const { index } = e.currentTarget.dataset;
        const combination = this.data.combinations[index];

        if (!combination || combination.length === 0) {
            wx.showToast({
                title: '组合数据有误',
                icon: 'none'
            });
            return;
        }

        this.setData({
            selectedCombination: index
        });

        // 显示确认弹窗
        wx.showModal({
            title: '确认选择',
            content: `确定选择这个老牌组合吗？包含${combination.length}名玩家。`,
            success: (res) => {
                if (res.confirm) {
                    this.confirmSelection(combination);
                } else {
                    // 取消选择
                    this.setData({
                        selectedCombination: -1
                    });
                }
            }
        });
    },

    /**
     * 确认选择组合
     */
    confirmSelection(combination) {
        // 获取当前页面栈
        const pages = getCurrentPages();

        // 查找 commonCreate 页面
        let commonCreatePage = null;
        for (let i = pages.length - 1; i >= 0; i--) {
            const page = pages[i];
            if (page.route.includes('commonCreate')) {
                commonCreatePage = page;
                break;
            }
        }

        if (commonCreatePage && typeof commonCreatePage.onCombinationSelected === 'function') {
            // 调用 commonCreate 页面的回调函数
            commonCreatePage.onCombinationSelected(combination, this.data.groupIndex, this.data.slotIndex);

            // 直接返回到 commonCreate 页面
            const deltaLevel = pages.length - 1 - pages.findIndex(page => page.route.includes('commonCreate'));

            if (deltaLevel > 0) {
                wx.navigateBack({
                    delta: deltaLevel
                });
            } else {
                // 如果找不到 commonCreate 页面，则直接跳转
                wx.navigateTo({
                    url: '/pages/createGame/commonCreate/commonCreate'
                });
            }

        } else {
            // 备用方案：通过上一个页面传递
            const prevPage = pages[pages.length - 2];
            if (prevPage && typeof prevPage.onCombinationSelected === 'function') {
                prevPage.onCombinationSelected(combination, this.data.groupIndex, this.data.slotIndex);
            }

            // 返回上一页
            wx.navigateBack();
        }
    },

    /**
     * 刷新数据
     */
    onPullDownRefresh() {
        this.loadCombinations().finally(() => {
            wx.stopPullDownRefresh();
        });
    },

    onReady() {
        // 页面准备完成
    },

    onShow() {
        // 页面显示时重置选择状态
        this.setData({
            selectedCombination: -1
        });
    },

    onHide() {

    },

    onUnload() {

    },

    onReachBottom() {

    },

    onShareAppMessage() {
        return {
            title: '老牌组合选择',
            path: '/pages/player-select/combineSelect/combineSelect'
        };
    }
}); 