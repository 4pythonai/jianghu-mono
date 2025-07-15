// 引入API
const app = getApp()

Page({
    data: {
        groupIndex: 0,
        slotIndex: 0,
        remarkName: '',
        mobile: '',
        isFormValid: false,
        isSubmitting: false
    },

    onLoad(options) {
        console.log('manualAdd页面加载，参数:', options);
        console.log('📊 初始页面数据:', this.data);

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

        console.log('📊 参数处理后的页面数据:', this.data);

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
        console.log('🔍 表单验证 - remarkName:', remarkName, ', mobile:', mobile)

        // 昵称长度至少2位，手机号11位数字
        const isNicknameValid = remarkName.length >= 2
        console.log('✅ 昵称验证结果:', isNicknameValid, '(长度:', remarkName.length, ')')

        // const isMobileValid = /^1[3-9]\d{9}$/.test(mobile)

        this.setData({
            isFormValid: isNicknameValid
        }, () => {
            console.log('🎯 表单状态更新完成 - isFormValid:', this.data.isFormValid)
        })
    },

    /**
     * 提交表单
     */
    async onSubmit() {
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
     * 将创建的用户添加到组中，类似好友选择的处理方式
     */
    handleUserCreated(user) {
        console.log('🎯 handleUserCreated 被调用, 接收用户数据:', user);
        console.log('📍 当前页面参数:', { groupIndex: this.data.groupIndex, slotIndex: this.data.slotIndex });

        // 转换用户数据格式，适配PlayerSelector组件的格式
        const createdUser = {
            userid: user.id || user.userid, // API返回的是 user.id
            wx_nickname: user.wx_nickname || user.nickname || this.data.remarkName,
            nickname: user.nickname || user.wx_nickname || this.data.remarkName,
            avatar: user.avatar || '/images/default-avatar.png',
            handicap: user.handicap || 0,
            mobile: user.mobile || this.data.mobile || '',
            tee: user.tee || 'blue'  // 添加T台字段，默认蓝T
        };

        console.log('🔄 转换后的用户数据:', createdUser);

        // 获取当前页面栈
        const pages = getCurrentPages();
        console.log('📚 当前页面栈:', pages.map(p => p.route));

        // 查找 commonCreate 页面
        let commonCreatePage = null;
        for (let i = pages.length - 1; i >= 0; i--) {
            const page = pages[i];
            console.log(`🔍 检查页面 ${i}: ${page.route}`);
            if (page.route && (page.route.includes('commonCreate') || page.route.includes('createGame'))) {
                commonCreatePage = page;
                console.log('✅ 找到创建游戏页面:', page.route);
                break;
            }
        }

        if (commonCreatePage) {
            console.log('🎯 commonCreatePage 可用方法:', Object.getOwnPropertyNames(commonCreatePage));

            if (typeof commonCreatePage.onUserCreated === 'function') {
                console.log('📞 调用 onUserCreated 方法');
                commonCreatePage.onUserCreated(createdUser, this.data.groupIndex, this.data.slotIndex);
            } else if (typeof commonCreatePage.onFriendsSelected === 'function') {
                console.log('📞 调用 onFriendsSelected 方法');
                commonCreatePage.onFriendsSelected([createdUser], this.data.groupIndex, this.data.slotIndex);
            } else {
                console.log('❌ commonCreate 页面没有可用的回调方法');
            }
        } else {
            console.log('❌ 未找到 commonCreate 页面');
        }

        // 显示成功提示
        wx.showToast({
            title: '创建并添加成功',
            icon: 'success',
            duration: 1500
        });

        // 延迟返回到创建游戏页面
        setTimeout(() => {
            // 手工添加的页面导航路径:commonCreate -> player-select -> manualAdd
            // 所以应该返回 2 层到 commonCreate 页面
            const targetDelta = 2;

            console.log('🚀 从手工添加页面返回到创建游戏页面');
            console.log('📍 返回层级:', targetDelta);

            wx.navigateBack({
                delta: targetDelta
            });
        }, 1500);
    }

}) 