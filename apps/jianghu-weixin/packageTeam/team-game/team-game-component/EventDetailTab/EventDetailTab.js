/**
 * 赛事详情Tab组件
 * 展示赛事基本信息、流程、奖项，包含报名和更多操作功能
 */
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../../../stores/game/gameStore'

Component({
    properties: {
        /** 是否已报名（本地状态，需要从主页面传入） */
        isRegistered: {
            type: Boolean,
            value: false
        }
    },

    data: {
        // Store 数据默认值（防止 store 绑定前 WXML 报错）
        eventDetail: {
            title: '',
            teamName: '',
            teamAvatar: '',
            teams: [],
            location: '',
            dateTime: '',
            fee: '',
            deadline: '',
            schedule: [],
            awards: [],
            backgroundImage: '',
            coverType: 'default',
            covers: []
        },
        match_format: '',
        gameType: 'single_team',
        gameTags: [],
        isCreator: false,
        gameid: null,
        // 弹窗状态
        showMoreActions: false,
        showRegisterPopup: false,
        selectedTagId: null,
        registerForm: {
            show_name: '',
            mobile: '',
            gender: 'unknown',
            genderText: '未知'
        }
    },

    observers: {
        'eventDetail': function (eventDetail) {
            console.log('[EventDetailTab] eventDetail 变化:', {
                eventDetail,
                backgroundImage: eventDetail?.backgroundImage,
                backgroundImageType: typeof eventDetail?.backgroundImage,
                isNull: eventDetail?.backgroundImage === null,
                isUndefined: eventDetail?.backgroundImage === undefined
            })
        }
    },

    lifetimes: {
        attached() {
            // 绑定 gameStore
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: [
                    'eventDetail',
                    'match_format',
                    'gameType',
                    'gameTags',
                    'isCreator',
                    'gameid'
                ],
                actions: [
                    'loadTagMembers',
                    'loadGameTags'
                ]
            })

            // 初始化时也打印一次
            console.log('[EventDetailTab] attached, 初始 eventDetail:', {
                eventDetail: gameStore.eventDetail,
                backgroundImage: gameStore.eventDetail?.backgroundImage,
                backgroundImageType: typeof gameStore.eventDetail?.backgroundImage
            })
        },
        detached() {
            if (this.storeBindings) {
                this.storeBindings.destroyStoreBindings()
            }
        }
    },

    methods: {
        /**
         * 打开报名弹窗
         */
        onRegister() {
            const app = getApp()
            const userInfo = app?.globalData?.userInfo

            if (!userInfo) {
                wx.showToast({ title: '请先登录', icon: 'none' })
                return
            }

            // 获取性别文本
            const genderMap = { male: '男', female: '女', unknown: '未知' }
            const gender = userInfo.gender || 'unknown'
            const genderText = genderMap[gender] || '未知'

            // 填充表单数据
            this.setData({
                showRegisterPopup: true,
                selectedTagId: null,
                registerForm: {
                    show_name: userInfo.show_name || '未设置',
                    mobile: userInfo.mobile || '',
                    gender: gender,
                    genderText: genderText
                }
            })
        },

        /**
         * 关闭报名弹窗
         */
        onCloseRegisterPopup() {
            this.setData({
                showRegisterPopup: false,
                selectedTagId: null
            })
        },

        /**
         * 选择分队
         */
        onSelectTag(e) {
            const tagId = e.currentTarget.dataset.tagId
            this.setData({ selectedTagId: tagId })
        },

        /**
         * 选择性别
         */
        onGenderSelect(e) {
            const gender = e.currentTarget.dataset.gender
            this.setData({ 'registerForm.gender': gender })
        },

        /**
         * 昵称输入
         */
        onDisplayNameInput(e) {
            this.setData({ 'registerForm.show_name': e.detail.value })
        },

        /**
         * 手机号输入
         */
        onMobileInput(e) {
            this.setData({ 'registerForm.mobile': e.detail.value })
        },

        /**
         * 提交报名
         */
        async onSubmitRegister() {
            const { selectedTagId, registerForm } = this.data
            const gameId = this.data.gameid

            if (!selectedTagId) {
                wx.showToast({ title: '请选择分队', icon: 'none' })
                return
            }

            wx.showLoading({ title: '报名中...' })

            try {
                const app = getApp()
                const result = await app.api.teamgame.registerGame({
                    game_id: gameId,
                    tag_id: selectedTagId,
                    show_name: registerForm.show_name,
                    gender: registerForm.gender,
                    mobile: registerForm.mobile
                })

                wx.hideLoading()

                if (result.code === 200) {
                    wx.showToast({ title: '报名成功', icon: 'success' })
                    this.setData({
                        showRegisterPopup: false,
                        selectedTagId: null
                    })
                    // 刷新报名人员列表
                    await this.loadTagMembers(gameId)
                    // 通知主页面更新 isRegistered 状态
                    this.triggerEvent('onSubmitRegister', {
                        tagId: selectedTagId,
                        formData: registerForm
                    })
                } else {
                    wx.showToast({ title: result.message || '报名失败', icon: 'none' })
                }
            } catch (err) {
                wx.hideLoading()
                console.error('[EventDetailTab] 报名失败:', err)
                wx.showToast({ title: '报名失败，请稍后重试', icon: 'none' })
            }
        },

        /**
         * 点击更多按钮
         */
        onMore() {
            this.setData({ showMoreActions: true })
        },

        /**
         * 关闭更多操作弹窗
         */
        onCloseMoreActions() {
            this.setData({ showMoreActions: false })
        },

        /**
         * 处理更多操作
         */
        onActionTap(e) {
            const action = e.detail?.action || e.currentTarget.dataset.action
            this.setData({ showMoreActions: false })
            // 通知主页面处理操作
            this.triggerEvent('onActionTap', { action })
        },

        /**
         * 分享事件
         */
        onShare() {
            this.triggerEvent('onShare')
        },

        /**
         * 取消报名
         */
        onCancelRegister() {
            wx.showModal({
                title: '确认取消',
                content: '确定要取消报名吗？',
                success: (res) => {
                    if (res.confirm) {
                        this.triggerEvent('onCancelRegister')
                    }
                }
            })
        },

        /**
         * 底部操作栏点击事件
         */
        onRegisterTap() {
            if (this.data.isRegistered) {
                this.onCancelRegister()
            } else {
                this.onRegister()
            }
        }
    }
})
