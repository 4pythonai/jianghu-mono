const app = getApp()

// createGame.js
Page({
    data: {
        canCreate: true
    },

    onLoad: function () {
        this.profilePrompting = false
        this.redirectingToProfile = false

        this.checkProfileAndUpdateUI()
    },

    onShow() {
        this.redirectingToProfile = false
        this.checkProfileAndUpdateUI()
    },

    // 处理菜单项点击
    handleMenuClick(e) {
        if (!this.data.canCreate) {
            this.checkProfileAndUpdateUI()
            return
        }

        const { type } = e.currentTarget.dataset;
        let url = '';

        switch (type) {
            case 'moreCreate':
                url = '/pages/createGame/moreCreate/moreCreate';
                break;
            case 'commonCreate':
                url = '/pages/createGame/commonCreate/commonCreate';
                break;
            case 'quickCreate':
                url = '/pages/createGame/quickCreate/quickCreate';
                break;
            case 'teamCreate':
                url = '/packageTeam/createSingleTeamGame/createSingleTeamGame';
                break;
            case 'crossTeamCreate':
                url = '/packageTeam/createCrossTeamGame/createCrossTeamGame';
                break;
        }

        if (url) {
            wx.navigateTo({
                url
            });
        }
    },

    /**
     * 检查用户资料完整性并更新UI状态
     * 使用统一的 profile-checker 工具
     */
    checkProfileAndUpdateUI({ onSuccess } = {}) {
        if (this.redirectingToProfile || this.profilePrompting) {
            return false
        }

        // 使用统一的 profile-checker 进行检查
        const isComplete = app.profileChecker.ensureProfileCompleted({
            source: 'create-game',
            modalTitle: '完善资料',
            modalContent: '创建比赛前请先设置昵称和头像，方便队友识别你。',
            showModal: false, // 先不显示弹窗，由本页面控制
            onSuccess: () => {
                // 资料完整
                if (!this.data.canCreate) {
                    this.setData({ canCreate: true })
                }
                if (typeof onSuccess === 'function') {
                    onSuccess()
                }
            },
            onIncomplete: ({ hasNickname, hasAvatar }) => {
                // 资料不完整
                if (this.data.canCreate) {
                    this.setData({ canCreate: false })
                }
            }
        })

        // 如果资料不完整且需要显示提示
        if (!isComplete && !this.data.canCreate) {
            this.showProfileIncompleteModal()
        }

        return isComplete
    },

    /**
     * 显示资料不完整的提示弹窗
     */
    showProfileIncompleteModal() {
        if (this.profilePrompting) {
            return
        }

        this.profilePrompting = true
        wx.showModal({
            title: '完善资料',
            content: '创建比赛前请先设置昵称和头像，方便队友识别你。',
            confirmText: '去完善',
            cancelText: '稍后',
            success: (res) => {
                this.profilePrompting = false
                if (res.confirm) {
                    this.redirectingToProfile = true
                    app.globalData.pendingMineEntrySource = 'create-game'
                    wx.switchTab({
                        url: '/pages/mine/mine',
                        fail: () => {
                            this.redirectingToProfile = false
                            app.globalData.pendingMineEntrySource = null
                            wx.showToast({
                                title: '跳转失败，请稍后重试',
                                icon: 'none'
                            })
                        }
                    })
                } else {
                    wx.showToast({
                        title: '已取消创建',
                        icon: 'none'
                    })
                }
            },
            fail: () => {
                this.profilePrompting = false
            }
        })
    },

    handleBack() {
        wx.navigateBack({
            delta: 1
        });
    },

    // 处理图片加载错误
    onImageError(e) {
        const imgName = e.currentTarget.dataset.img;
        console.error(`[createGame] 图片加载失败: ${imgName}`, e.detail);

        // 可以在这里设置备用图片或显示提示
        // 目前静默处理，避免影响用户体验
    }
});
