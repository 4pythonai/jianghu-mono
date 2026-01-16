// 引入API
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'

const app = getApp()

Page({
    behaviors: [storeBindingsBehavior],
    storeBindings: {
        store: gameStore,
        fields: {
            storePlayers: 'players'
        }
    },

    data: {
        groupIndex: 0,
        slotIndex: 0,
        remarkName: '',
        mobile: '',
        gender: 'male',
        isSubmitting: false,
        scene: '', // 场景参数
        gameid: '' // 游戏ID参数
    },

    onShow() {
        // Page 不支持 observers
    },

    onLoad(options) {
        console.log('🎯 [manualAdd] 页面初始化，接收参数:', options);
        console.log('🔵 [manualAdd] gameStore.players:', gameStore.players);

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

        // 处理场景参数
        if (options.scene !== undefined) {
            this.setData({
                scene: options.scene
            });
        }

        // 处理游戏ID参数
        if (options.gameid !== undefined) {
            this.setData({
                gameid: options.gameid
            });
        }

        // 打印场景和游戏ID参数
        console.log('📋 [manualAdd] 场景(scene):', this.data.scene);
        console.log('🎮 [manualAdd] 游戏ID(gameid):', this.data.gameid);
    },

    /**
     * 昵称输入处理
     */
    onNicknameInput(e) {
        const remarkName = e.detail.value.trim()
        console.log('🖊️ 用户输入昵称:', remarkName)
        this.setData({
            remarkName
        })
    },

    /**
     * 手机号输入处理
     */
    onMobileInput(e) {
        const mobile = e.detail.value.trim()
        this.setData({
            mobile
        })
    },

    /**
     * 性别选择
     */
    onGenderSelect(e) {
        const gender = e.currentTarget.dataset.gender
        this.setData({
            gender
        })
    },

    /**
     * 表单验证
     */
    validateForm() {
        const { remarkName, gender } = this.data
        // 昵称长度至少2位, 性别必选
        const isNicknameValid = remarkName.length >= 2
        const isGenderSelected = Boolean(gender)
        return isNicknameValid && isGenderSelected
    },

    /**
     * 提交表单
     */
    async onManualUserAdded() {
        // 防止重复提交
        if (this.data.isSubmitting) {
            return;
        }

        if (!this.validateForm()) {
            wx.showToast({
                title: '请完善选手资料',
                icon: 'none'
            });
            return;
        }

        this.setData({ isSubmitting: true });

        try {
            // 准备用户数据
            const userData = {
                remarkName: this.data.remarkName,
                mobile: this.data.mobile || '',
                gender: this.data.gender,
                join_type: 'manualAdd'
            };

            // 调用创建用户API
            const res = await app.api.user.createAndSelect(userData, {
                loadingTitle: '正在创建用户...'
            });
            console.log("创建用户API返回:", res);

            const createdUser = res.user;

            // 处理创建成功的用户
            this.handleUserCreated(createdUser);

        } catch (error) {
            console.error('创建用户失败:', error);
            wx.showToast({
                title: error.message || '创建用户失败',
                icon: 'none'
            });
        } finally {
            this.setData({ isSubmitting: false });
        }
    },

    /**
     * 处理用户创建成功后的回调
     * 将创建的用户添加到组中, 类似好友选择的处理方式
     */
    async handleUserCreated(user) {
        console.log('🎯 handleUserCreated 被调用, 接收用户数据:', user);
        console.log('📍 当前页面参数:', { groupIndex: this.data.groupIndex, slotIndex: this.data.slotIndex });

        // 转换用户数据格式, 适配PlayerSelector组件的格式
        // API (User/createAndSelect) 返回 t_user 表记录:
        // - id: 用户ID (转换为 user_id 供组件使用)
        // - display_name: 显示名称
        // - wx_name: 微信名称
        // - avatar, handicap, mobile, gender 等
        const createdUser = {
            user_id: user.id,
            display_name: user.display_name || user.wx_name || this.data.remarkName,
            avatar: user.avatar || '/images/default-avatar.png',
            handicap: user.handicap || 0,
            mobile: user.mobile || this.data.mobile || '',
            gender: user.gender || this.data.gender,
            tee: user.tee || 'blue'
        };


        // 获取当前页面栈
        const pages = getCurrentPages();
        const entryPage = pages[0];
        console.log('🔴🟢🔵 entryPage ', entryPage.route);

        // 从创建比赛页面进入的.
        if (entryPage.route === 'pages/createGame/createGame') {
            const commonCreatePage = pages[pages.length - 3];
            commonCreatePage.onUserCreated(createdUser, this.data.groupIndex, this.data.slotIndex);
            wx.showToast({
                title: '创建并添加成功',
                icon: 'success',
                duration: 1500
            });

            setTimeout(() => {
                const targetDelta = 2;
                wx.navigateBack({
                    delta: targetDelta
                });
            }, 1500);
        }
        // 从比赛详情进入的
        if (entryPage.route === 'pages/live/live') {
            const result = await app.api.game.joinGame({
                gameid: this.data.gameid,
                user_id: user.id,
                source: 'manualAdd'
            }, {
                loadingTitle: '加入中...'
            });

            if (result?.code !== 200) {
                throw new Error(result?.message || '加入失败');
            }

            if (result?.code == 200) {
                console.log('🔴🟢🔵 >>> 手工加入成功 , 返回 pages/gameDetail/gameDetail ');
                wx.navigateBack({
                    delta: 1
                });
            }
        }
    },

    onCancel() {
        wx.navigateBack({
            delta: 1
        });
    }
})
