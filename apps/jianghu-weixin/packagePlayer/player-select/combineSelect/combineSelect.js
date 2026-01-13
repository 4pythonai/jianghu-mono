import api from '@/api/index'

Page({
    data: {
        groupIndex: 0,
        slotIndex: 0,
        combinations: [], // 老牌组合数据
        selectedCombination: -1 // 选中的组合索引
    },

    onLoad(options) {

        if (options.groupIndex !== undefined) {
            this.setData({
                groupIndex: Number.parseInt(options.groupIndex)
            });
        }

        if (options.slotIndex !== undefined) {
            this.setData({
                slotIndex: Number.parseInt(options.slotIndex)
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
            const result = await api.game.getPlayerCombination({}, {
                loadingTitle: '加载组合中...'
            });

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

        // 查找最终的目标页面(commonCreate)
        let targetPage = null;
        for (let i = pages.length - 1; i >= 0; i--) {
            const page = pages[i];
            if (page?.route?.includes('commonCreate')) {
                targetPage = page;
                break;
            }
        }

        // 引入 navigationHelper
        const navigationHelper = require('@/utils/navigationHelper.js');

        // 如果找到了最终目标页面, 直接调用它的方法
        if (targetPage && typeof targetPage.onCombinationSelected === 'function') {
            targetPage.onCombinationSelected(combination, this.data.groupIndex, this.data.slotIndex);
            // 计算需要返回的层级
            const deltaLevel = pages.length - pages.indexOf(targetPage) - 1;
            navigationHelper.navigateBack(deltaLevel)
                .catch(err => {
                    console.error('智能返回失败:', err);
                    wx.showToast({ title: '返回失败', icon: 'none' });
                });
            return;
        }

        // 如果没有找到最终目标页面, 尝试调用 PlayerSelector 组件的方法
        const playerSelector = this.selectComponent('/components/PlayerSelector/PlayerSelector');
        if (playerSelector) {
            playerSelector.addPlayerToSlot(this.data.slotIndex, combination[0], 'combineSelect');
            navigationHelper.navigateBack()
                .catch(err => {
                    console.error('返回失败:', err);
                    wx.showToast({ title: '返回失败', icon: 'none' });
                });
            return;
        }

        // 如果都不成功, 显示错误提示
        wx.showToast({
            title: '无法添加玩家',
            icon: 'none'
        });
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
            path: '/packagePlayer/player-select/combineSelect/combineSelect'
        };
    }
}); 