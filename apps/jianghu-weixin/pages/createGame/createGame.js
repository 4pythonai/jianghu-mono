const app = getApp()

// createGame.js
Page({
    data: {
        isMenuOpen: false, // 默认关闭菜单
        animations: {
            point1: null,
            point2: null,
            point3: null,
        },
        canCreate: true
    },

    onLoad: function () {
        this.profilePrompting = false
        this.redirectingToProfile = false

        // 初始化动画状态，确保图片可见
        this.initAnimationState();

        this.ensureProfileCompleted({
            onSuccess: () => {
                if (!this.data.isMenuOpen) {
                    this.toggleMenu()
                }
            }
        })
    },

    onShow() {
        this.redirectingToProfile = false
        this.ensureProfileCompleted()
    },

    // 处理菜单项点击
    handleMenuClick(e) {
        if (!this.data.canCreate) {
            this.ensureProfileCompleted()
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
        }

        if (url) {
            wx.navigateTo({
                url
            });
        }
    },

    // 初始化动画状态
    initAnimationState() {
        const initAnim = wx.createAnimation({ duration: 0 });
        initAnim.scale(1).opacity(1).step();
        const animationExport = initAnim.export();

        this.setData({
            animations: {
                point1: animationExport,
                point2: animationExport,
                point3: animationExport,
            }
        });
    },

    // 切换菜单显示状态
    toggleMenu() {
        if (!this.data.canCreate && !this.data.isMenuOpen) {
            this.ensureProfileCompleted()
            return
        }

        const isOpen = !this.data.isMenuOpen;

        if (isOpen) {
            // 确保初始状态正确
            this.initAnimationState();

            // 展开菜单时的卫星动画
            const points = ['point1', 'point2', 'point3'];
            setTimeout(() => {
                for (const [index, point] of points.entries()) {
                    const animation = wx.createAnimation({
                        duration: 300,
                        timingFunction: 'ease-out',
                        delay: index * 80  // 每个菜单项延迟80ms
                    });

                    // 从中心弹出效果 - 先设置初始状态，再动画到最终状态
                    animation.scale(0).opacity(0).step();
                    animation.scale(1).opacity(1).step();

                    this.setData({
                        [`animations.${point}`]: animation.export()
                    });
                }
            }, 50); // 延迟50ms确保初始状态先设置
        } else {
            // 关闭菜单时恢复初始状态
            const resetAnim = wx.createAnimation({ duration: 0 });
            resetAnim.scale(1).opacity(1).step();

            const points = ['point1', 'point2', 'point3'];
            for (const point of points) {
                this.setData({
                    [`animations.${point}`]: resetAnim.export()
                });
            }
        }

        this.setData({
            isMenuOpen: isOpen
        });
    },

    ensureProfileCompleted({ onSuccess } = {}) {
        const { profileStatus, userInfo } = this.getProfileSnapshot()
        const hasNickname = this.resolveHasNickname(profileStatus, userInfo)
        const hasAvatar = this.resolveHasAvatar(profileStatus, userInfo)
        const canCreate = hasNickname && hasAvatar

        if (canCreate) {
            if (!this.data.canCreate) {
                this.setData({ canCreate: true })
            }
            if (typeof onSuccess === 'function') {
                onSuccess()
            }
            return true
        }

        if (this.data.canCreate) {
            this.setData({ canCreate: false })
        }

        if (this.redirectingToProfile) {
            return false
        }

        if (this.profilePrompting) {
            return false
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

        return false
    },

    getProfileSnapshot() {
        const state = typeof app.getUserState === 'function' ? app.getUserState() : {}
        const profileStatus = state.profileStatus
            || (app.storage && typeof app.storage.getProfileStatus === 'function' ? app.storage.getProfileStatus() : null)
            || {}
        const userInfo = state.userInfo
            || (app.storage && typeof app.storage.getUserInfo === 'function' ? app.storage.getUserInfo() : null)
            || {}

        return { profileStatus, userInfo }
    },

    resolveHasNickname(profileStatus, userInfo) {
        if (profileStatus && typeof profileStatus.hasNickname === 'boolean') {
            return profileStatus.hasNickname
        }

        return !!(userInfo
            && (userInfo.nickName || userInfo.nickname || userInfo.wx_nickname))
    },

    resolveHasAvatar(profileStatus, userInfo) {
        if (profileStatus && typeof profileStatus.hasAvatar === 'boolean') {
            return profileStatus.hasAvatar
        }

        const avatarUrl = userInfo && (userInfo.avatarUrl || userInfo.avatar || '')
        return !!(avatarUrl && !this.isDefaultAvatar(avatarUrl))
    },

    isDefaultAvatar(avatarUrl) {
        if (!avatarUrl) {
            return true
        }

        return avatarUrl.endsWith('/images/default-avatar.png') || avatarUrl === '/images/default-avatar.png'
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
