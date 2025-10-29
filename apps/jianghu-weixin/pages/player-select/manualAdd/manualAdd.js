// 引入API
const app = getApp()

Page({
    data: {
        groupIndex: 0,
        slotIndex: 0,
        remarkName: '',
        mobile: '',
        isFormValid: false,
        isSubmitting: false,
        scene: '', // 场景参数
        gameid: '' // 游戏ID参数
    },

    onLoad(options) {
        console.log('🎯 [manualAdd] 页面初始化，接收参数:', options);

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

        // 执行一次初始验证
        this.validateForm();
    },

    /**
     * 昵称输入处理
     */
    onNicknameInput(e) {
        const remarkName = e.detail.value.trim()
        console.log('🖊️ 用户输入昵称:', remarkName)
        this.setData({
            remarkName
        }, () => {
            console.log('💾 昵称已保存到data:', this.data.remarkName)
            this.validateForm()
        })
    },

    /**
     * 手机号输入处理
     */
    onMobileInput(e) {
        const mobile = e.detail.value.trim()
        this.setData({
            mobile
        }, () => {
            this.validateForm()
        })
    },

    /**
     * 表单验证
     */
    validateForm() {
        const { remarkName, mobile } = this.data
        // 昵称长度至少2位, 手机号11位数字
        const isNicknameValid = remarkName.length >= 2
        this.setData({ isFormValid: isNicknameValid })
    },

    /**
     * 提交表单
     */
    async onManualUserAdded() {
        if (!this.data.isFormValid) {
            console.log("验证失败,无法创建用户")
            return;
        }

        // 防止重复提交
        if (this.data.isSubmitting) {
            return;
        }

        this.setData({ isSubmitting: true });

        try {
            // 准备用户数据
            const userData = {
                remarkName: this.data.remarkName,
                mobile: this.data.mobile || '',
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
    handleUserCreated(user) {
        console.log('🎯 handleUserCreated 被调用, 接收用户数据:', user);
        console.log('📍 当前页面参数:', { groupIndex: this.data.groupIndex, slotIndex: this.data.slotIndex });

        // 转换用户数据格式, 适配PlayerSelector组件的格式
        const createdUser = {
            userid: user.id || user.userid, // API返回的是 user.id
            wx_nickname: user.wx_nickname || user.nickname || this.data.remarkName,
            nickname: user.nickname || user.wx_nickname || this.data.remarkName,
            avatar: user.avatar || '/images/default-avatar.png',
            handicap: user.handicap || 0,
            mobile: user.mobile || this.data.mobile || '',
            tee: user.tee || 'blue'  // 添加T台字段, 默认蓝T
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
        if (entryPage.route === ' pages/live/live') {

        }
    }
}) 