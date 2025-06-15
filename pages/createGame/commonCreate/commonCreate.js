Page({
    data: {
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
        },

        // 时间选择器配置
        timePickerRange: [
            // 日期范围（未来30天）
            [],
            // 小时范围
            [
                { label: '06:00', value: '06:00' },
                { label: '06:30', value: '06:30' },
                { label: '07:00', value: '07:00' },
                { label: '07:30', value: '07:30' },
                { label: '08:00', value: '08:00' },
                { label: '08:30', value: '08:30' },
                { label: '09:00', value: '09:00' },
                { label: '09:30', value: '09:30' },
                { label: '10:00', value: '10:00' },
                { label: '10:30', value: '10:30' },
                { label: '11:00', value: '11:00' },
                { label: '11:30', value: '11:30' },
                { label: '12:00', value: '12:00' },
                { label: '12:30', value: '12:30' },
                { label: '13:00', value: '13:00' },
                { label: '13:30', value: '13:30' },
                { label: '14:00', value: '14:00' },
                { label: '14:30', value: '14:30' },
                { label: '15:00', value: '15:00' },
                { label: '15:30', value: '15:30' },
                { label: '16:00', value: '16:00' },
                { label: '16:30', value: '16:30' },
                { label: '17:00', value: '17:00' },
                { label: '17:30', value: '17:30' },
                { label: '18:00', value: '18:00' }
            ]
        ],
        timePickerValue: [0, 0] // 时间选择器当前值
    },

    /**
     * 生成日期选择器数据
     */
    generateDateRange() {
        const dates = [];
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];

            dates.push({
                label: `${month}月${day}日 ${weekDay}`,
                value: `${year}-${month}-${day}`
            });
        }

        return dates;
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
     * 开球时间选择
     */
    onOpenTimeChange(e) {
        const values = e.detail.value;
        const dateIndex = values[0];
        const timeIndex = values[1];

        const selectedDate = this.data.timePickerRange[0][dateIndex];
        const selectedTime = this.data.timePickerRange[1][timeIndex];

        const openTime = `${selectedDate.label} ${selectedTime.label}`;

        this.setData({
            timePickerValue: values,
            'formData.openTime': openTime
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
        this.appendPlayersToGroup(players, groupIndex, '老牌组合');
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
        this.appendPlayersToGroup(players, groupIndex, '好友');
    },

    /**
     * 通用的追加玩家到组的方法
     * 确保每组最多4个玩家，新玩家追加到已有玩家后面，避免重复用户
     */
    appendPlayersToGroup(players, groupIndex, sourceType) {
        console.log(`📥 准备追加${sourceType}到第${groupIndex + 1}组:`, players);

        const gameGroups = [...this.data.formData.gameGroups];

        // 确保组存在
        if (!gameGroups[groupIndex]) {
            gameGroups[groupIndex] = { players: [] };
        }

        // 过滤掉null值，获取当前已有的真实玩家
        const currentPlayers = gameGroups[groupIndex].players.filter(player => player !== null);
        console.log(`📊 第${groupIndex + 1}组当前已有 ${currentPlayers.length} 名玩家:`, currentPlayers);

        // 获取当前组中已有的用户ID列表
        const existingUserIds = currentPlayers.map(player => player.userid.toString());
        console.log(`🔍 第${groupIndex + 1}组已有用户ID:`, existingUserIds);

        // 过滤掉重复的用户（根据userid判断）
        const newPlayers = players.filter(player => {
            const userId = player.userid.toString();
            const isDuplicate = existingUserIds.includes(userId);
            if (isDuplicate) {
                console.log(`⚠️ 用户 ${player.wx_nickname || player.nickname} (ID: ${userId}) 已在第${groupIndex + 1}组中，跳过`);
            }
            return !isDuplicate;
        });

        const duplicateCount = players.length - newPlayers.length;
        console.log(`🔄 过滤重复用户后，${newPlayers.length} 名用户待添加，${duplicateCount} 名重复用户被跳过`);

        if (newPlayers.length === 0) {
            const message = duplicateCount > 0
                ? `所有${sourceType}已在第${groupIndex + 1}组中，无需重复添加`
                : `没有${sourceType}需要添加`;

            wx.showToast({
                title: message,
                icon: 'none',
                duration: 2000
            });
            return;
        }

        // 计算可以添加的玩家数量（每组最多4个）
        const maxPlayers = 4;
        const availableSlots = maxPlayers - currentPlayers.length;
        console.log(`🎯 第${groupIndex + 1}组还可以添加 ${availableSlots} 名玩家`);

        if (availableSlots <= 0) {
            wx.showToast({
                title: `第${groupIndex + 1}组已满（最多${maxPlayers}人）`,
                icon: 'none',
                duration: 2000
            });
            return;
        }

        // 取要添加的玩家（如果超过可用位置，只取前面的）
        const playersToAdd = newPlayers.slice(0, availableSlots);
        const capacitySkippedCount = newPlayers.length - playersToAdd.length;

        // 追加玩家到现有玩家后面
        const updatedPlayers = [...currentPlayers, ...playersToAdd];
        gameGroups[groupIndex].players = updatedPlayers;

        console.log(`✅ 成功追加 ${playersToAdd.length} 名${sourceType}到第${groupIndex + 1}组`);
        console.log(`📊 更新后的第${groupIndex + 1}组玩家:`, updatedPlayers);

        this.setData({
            'formData.gameGroups': gameGroups
        });

        // 生成详细的成功提示信息
        let message = `已添加${playersToAdd.length}名${sourceType}到第${groupIndex + 1}组`;

        const totalSkipped = duplicateCount + capacitySkippedCount;
        if (totalSkipped > 0) {
            const skipReasons = [];
            if (duplicateCount > 0) {
                skipReasons.push(`${duplicateCount}人已存在`);
            }
            if (capacitySkippedCount > 0) {
                skipReasons.push(`${capacitySkippedCount}人因组已满`);
            }
            message += `（${skipReasons.join('，')}被跳过）`;
        }

        wx.showToast({
            title: message,
            icon: 'success',
            duration: 2500
        });

        console.log(`🎉 第${groupIndex + 1}组更新完成，当前${updatedPlayers.length}/${maxPlayers}人`);
        console.log(`📈 统计：添加${playersToAdd.length}人，重复跳过${duplicateCount}人，容量跳过${capacitySkippedCount}人`);
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
        this.appendPlayersToGroup([user], groupIndex, '手工添加用户');
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
     * 表单验证
     */
    validateForm() {
        const { formData, selectedCourse, selectedCourt } = this.data;

        // 验证球场选择
        if (!selectedCourse) {
            wx.showToast({
                title: '请先选择球场',
                icon: 'none'
            });
            return false;
        }

        if (!selectedCourt) {
            wx.showToast({
                title: '请先选择半场',
                icon: 'none'
            });
            return false;
        }

        // 验证比赛名称
        if (!formData.gameName.trim()) {
            wx.showToast({
                title: '请填写比赛名称',
                icon: 'none'
            });
            return false;
        }

        // 验证开球时间
        if (!formData.openTime) {
            wx.showToast({
                title: '请选择开球时间',
                icon: 'none'
            });
            return false;
        }

        // 验证参赛组别和玩家
        const hasValidGroup = formData.gameGroups.some(group =>
            group.players && group.players.length > 0
        );

        if (!hasValidGroup) {
            wx.showToast({
                title: '请至少添加一名参赛玩家',
                icon: 'none'
            });
            return false;
        }

        // 验证私密比赛密码
        if (formData.isPrivate && !formData.password.trim()) {
            wx.showToast({
                title: '私密比赛需要设置密码',
                icon: 'none'
            });
            return false;
        }

        return true;
    },

    /**
     * 处理创建比赛
     */
    handleCreateGame() {
        console.log('=== 创建比赛数据收集 ===');

        // 表单验证
        if (!this.validateForm()) {
            return;
        }

        // 收集所有数据
        const gameData = {
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

        // 初始化日期选择器数据
        const dateRange = this.generateDateRange();
        this.setData({
            'timePickerRange[0]': dateRange
        });
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

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉刷新
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
}); 