import { createWxPageHandler, findUserInGroups } from '../../../utils/gameGroupUtils'
import { validateForm } from '../../../utils/gameValidate'
import { uuid } from '../../../utils/tool'

Page({
    // 创建绑定了当前页面的处理函数
    handleAppendPlayersToGroup: createWxPageHandler('formData.gameGroups'),

    data: {
        uuid: '', // 游戏唯一标识符（调试用）
        selectedCourse: null, // 选中的球场信息
        selectedCourt: null,   // 选中的半场信息

        // 表单数据
        formData: {
            gameName: '',       // 比赛名称
            openTime: '',       // 开球时间
            ScoringType: 'hole',   // 赛制：hole-按洞赛, oneball-比杆赛
            gameGroups: [       // 参赛组别（至少一组）
                {
                    players: []
                }
            ],
            isPrivate: false,   // 是否秘密比赛
            password: ''        // 密码
        }
    },



    /**
     * 比赛名称输入
     */
    onGameNameInput(e) {
        this.setData({
            'formData.gameName': e.detail.value
        });
    },


    /**
     * 时间选择器变化事件（来自组件）
     */
    onOpenTimeChange(e) {
        const { value, display } = e.detail;

        console.log('🕐 接收到时间选择器变化:', {
            value,      // 如: "2024-12-19 14:30"
            display     // 如: "12月19日 周四 14:30"
        });

        this.setData({
            'formData.openTime': display
        });
    },

    /**
     * 赛制选择
     */
    onScoringTypeChange(e) {
        this.setData({
            'formData.ScoringType': e.detail.value
        });
    },

    /**
     * 处理玩家变化
     */
    onPlayersChange(e) {
        const { groupIndex, players } = e.detail;
        const gameGroups = [...this.data.formData.gameGroups];
        gameGroups[groupIndex].players = players;

        this.setData({
            'formData.gameGroups': gameGroups
        });

        console.log(`第${groupIndex + 1}组玩家更新:`, players);
    },

    /**
     * 处理老牌组合选择回调
     * 从 combineSelect 页面返回时调用
     */
    onCombinationSelected(combination, groupIndex, slotIndex) {
        console.log('接收到老牌组合选择:', { combination, groupIndex, slotIndex });

        if (!combination || !Array.isArray(combination) || combination.length === 0) {
            wx.showToast({
                title: '组合数据无效',
                icon: 'none'
            });
            return;
        }

        // 转换组合数据格式，适配PlayerSelector组件的格式
        const players = combination.map(member => ({
            userid: member.userid,
            wx_nickname: member.nickname || '未知玩家',
            nickname: member.nickname || '未知玩家',
            coverpath: member.coverpath || '/images/default-avatar.png',
            handicap: member.handicap || 0
        }));

        // 使用追加模式添加老牌组合到组中
        this.handleAppendPlayersToGroup(players, groupIndex, '老牌组合');
    },

    /**
     * 处理好友选择回调
     * 从 friendSelect 页面返回时调用
     */
    onFriendsSelected(selectedFriends, groupIndex, slotIndex) {
        console.log('接收到好友选择:', { selectedFriends, groupIndex, slotIndex });

        if (!selectedFriends || !Array.isArray(selectedFriends) || selectedFriends.length === 0) {
            wx.showToast({
                title: '好友数据无效',
                icon: 'none'
            });
            return;
        }

        // 转换好友数据格式，适配PlayerSelector组件的格式
        const players = selectedFriends.map(friend => ({
            userid: friend.userid,
            wx_nickname: friend.nickname || friend.wx_nickname || '未知好友',
            nickname: friend.nickname || friend.wx_nickname || '未知好友',
            coverpath: friend.coverpath || friend.avatar || '/images/default-avatar.png',
            handicap: friend.handicap || 0
        }));

        // 使用追加模式添加好友到组中
        this.handleAppendPlayersToGroup(players, groupIndex, '好友');
    },



    /**
     * 检查用户是否已存在于任何组中（使用工具函数）
     */
    checkUserInGroups(userid) {
        return findUserInGroups(userid, this.data.formData.gameGroups);
    },

    /**
     * 处理手工创建用户回调
     * 从 manualAdd 页面返回时调用
     */
    onUserCreated(createdUser, groupIndex, slotIndex) {
        console.log('🎯 commonCreate.onUserCreated 被调用!');
        console.log('📋 接收到手工创建用户:', { createdUser, groupIndex, slotIndex });

        if (!createdUser) {
            wx.showToast({
                title: '用户数据无效',
                icon: 'none'
            });
            return;
        }

        // 确保用户数据格式正确
        const user = {
            userid: createdUser.userid,
            wx_nickname: createdUser.wx_nickname || createdUser.nickname,
            nickname: createdUser.nickname || createdUser.wx_nickname,
            coverpath: createdUser.coverpath || '/images/default-avatar.png',
            handicap: createdUser.handicap || 0,
            mobile: createdUser.mobile || ''
        };

        // 使用通用追加方法添加手工创建的用户
        this.handleAppendPlayersToGroup([user], groupIndex, '手工添加用户');
    },

    /**
     * 添加新组
     */
    addGroup() {
        const gameGroups = [...this.data.formData.gameGroups];
        gameGroups.push({
            players: []
        });

        this.setData({
            'formData.gameGroups': gameGroups
        });

        wx.showToast({
            title: `已添加第${gameGroups.length}组`,
            icon: 'success'
        });
    },

    /**
     * 删除组
     */
    deleteGroup(e) {
        const index = e.currentTarget.dataset.index;
        const gameGroups = [...this.data.formData.gameGroups];

        if (gameGroups.length <= 1) {
            wx.showToast({
                title: '至少需要保留一组',
                icon: 'none'
            });
            return;
        }

        gameGroups.splice(index, 1);

        this.setData({
            'formData.gameGroups': gameGroups
        });

        wx.showToast({
            title: '已删除该组',
            icon: 'success'
        });
    },

    /**
     * 隐私设置切换
     */
    onPrivateChange(e) {
        const isPrivate = e.detail.value;

        this.setData({
            'formData.isPrivate': isPrivate,
            // 如果取消私密，清空密码
            'formData.password': isPrivate ? this.data.formData.password : ''
        });
    },

    /**
     * 密码输入
     */
    onPasswordInput(e) {
        this.setData({
            'formData.password': e.detail.value
        });
    },



    handleBack() {
        wx.navigateBack({
            delta: 1
        });
    },

    /**
     * 跳转到球场选择页面
     */
    goToCourseSelect() {
        wx.navigateTo({
            url: '/pages/course-select/course-select'
        });
    },

    /**
     * 设置选中的球场（由球场选择页面调用）
     */
    setSelectedCourse(course) {
        console.log('接收到选中的球场:', course);
        this.setData({
            selectedCourse: course
        });

        wx.showToast({
            title: `已选择 ${course.name}`,
            icon: 'success'
        });
    },

    /**
     * 设置半场选择结果（由半场选择页面调用）
     */
    setCourtSelection(selectionData) {
        console.log('=== commonCreate.setCourtSelection 被调用 ===');
        console.log('接收到半场选择结果:', selectionData);
        console.log('selectionData.course:', selectionData.course);
        console.log('selectionData.court:', selectionData.court);

        this.setData({
            selectedCourse: selectionData.course,
            selectedCourt: selectionData.court
        });

        console.log('数据设置完成，当前页面数据:', this.data);

        wx.showToast({
            title: `已选择 ${selectionData.course?.name || '球场'} - ${selectionData.court?.name || '半场'}`,
            icon: 'success',
            duration: 2000
        });
    },

    /**
     * 清除选中的球场和半场
     */
    clearSelectedCourse() {
        this.setData({
            selectedCourse: null,
            selectedCourt: null
        });
    },

    /**
     * 处理创建比赛
     */
    handleCreateGame() {
        console.log('=== 创建比赛数据收集 ===');

        // 表单验证
        if (!validateForm(this.data)) {
            return;
        }

        // 收集所有数据
        const gameData = {
            // 游戏唯一标识符
            gameId: this.data.uuid,

            // 基本信息
            ScoringType: 'common', // 比赛类型
            createTime: new Date().toISOString(), // 创建时间

            // 球场信息
            course: this.data.selectedCourse,

            // 半场信息
            court: this.data.selectedCourt,

            // 表单数据
            ...this.data.formData,

            // 页面数据
            pageData: this.data,

            // 用户信息（如果有的话）
            userInfo: getApp().globalData?.userInfo || null,

            // 设备信息
            systemInfo: wx.getSystemInfoSync(),

            // 页面路径
            currentPage: getCurrentPages()[getCurrentPages().length - 1].route
        };

        console.log('完整的比赛数据:', gameData);
        console.log('选中的球场信息:', this.data.selectedCourse);
        console.log('选中的半场信息:', this.data.selectedCourt);
        console.log('表单数据:', this.data.formData);

        // 准备API请求数据
        const apiRequestData = {
            // 游戏唯一标识符
            uuid: this.data.uuid, // 客户端生成的游戏ID，用于防重复提交
            // 球场信息
            course_id: this.data.selectedCourse.id || this.data.selectedCourse.courseid,
            course_name: this.data.selectedCourse.name,
            course_address: this.data.selectedCourse.address,
            court_type: this.data.selectedCourt.value,
            court_name: this.data.selectedCourt.name,
            court_holes: this.data.selectedCourt.holes,
            // 如果是18洞，还包含前九洞和后九洞的详细信息
            front_nine: this.data.selectedCourt.frontNine,
            back_nine: this.data.selectedCourt.backNine,
            front_nine_holes: this.data.selectedCourt.frontNineHoles,
            back_nine_holes: this.data.selectedCourt.backNineHoles,

            // 比赛信息
            game_type: 'common',
            game_name: this.data.formData.gameName,
            open_time: this.data.formData.openTime,
            scoring_type: this.data.formData.ScoringType, // hole 或 oneball
            is_private: this.data.formData.isPrivate,
            password: this.data.formData.password,
            game_groups: this.data.formData.gameGroups,

            // 其他信息
            create_time: new Date().toISOString()
        };

        console.log('准备发送给API的数据:', apiRequestData);

        // 显示成功提示
        wx.showToast({
            title: '比赛数据已收集完成',
            icon: 'success'
        });

        // 这里可以调用API
        // this.createGameAPI(apiRequestData);
    },

    /**
     * 调用创建比赛API（示例）
     */
    async createGameAPI(data) {
        try {
            console.log('准备调用API创建比赛:', data);


            wx.showToast({
                title: '比赛创建成功',
                icon: 'success'
            });

        } catch (error) {
            console.error('创建比赛失败:', error);
            wx.showToast({
                title: '创建失败，请重试',
                icon: 'none'
            });
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log('commonCreate页面加载，参数:', options);

        // 生成唯一的游戏ID
        const gameUuid = uuid();
        console.log('🆔 生成游戏UUID:', gameUuid);

        this.setData({
            uuid: gameUuid
        });

        // 调试日志
        console.log('🆔 生成游戏UUID:', gameUuid);
        console.log('🕐 生成时间:', new Date().toLocaleString());
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        console.log('commonCreate页面显示，当前数据:', this.data);

        // 检查本地缓存中是否有选择的半场数据（备用方案）
        try {
            const cachedCourtData = wx.getStorageSync('selectedCourtData')
            if (cachedCourtData) {
                console.log('从缓存中读取到半场选择数据:', cachedCourtData)
                this.setCourtSelection(cachedCourtData)
                // 清除缓存，避免重复使用
                wx.removeStorageSync('selectedCourtData')
            }
        } catch (error) {
            console.error('读取缓存数据失败:', error)
        }
    },



}); 