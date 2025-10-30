import { findUserInGroups, handleAppendPlayersToGroup } from '@/utils/gameGroupUtils'
import { uuid } from '@/utils/tool'

const app = getApp()


Page({
    // 重写玩家添加处理函数, 使用我们的统一更新方法
    handleAppendPlayersToGroup(players, groupIndex, sourceType) {
        // 获取当前页面的游戏组数据
        const gameGroups = this.data.formData.gameGroups;

        // 调用通用处理函数
        const result = handleAppendPlayersToGroup(
            players,
            groupIndex,
            sourceType,
            gameGroups,
            { dataPath: 'formData.gameGroups' }
        );


        // 如果成功, 使用我们的统一更新方法而不是直接 setData
        if (result.success && result.gameGroups) {
            this.updateGameGroups(result.gameGroups, `${sourceType}添加`);
        }

        // 显示 Toast
        if (result.uiActions?.showToast && wx.showToast) {
            wx.showToast(result.uiActions.showToast);
        }

        return result;
    },

    // 统一的 setData 方法, 自动触发 API 同步
    updateGameGroups(newGameGroups, description = '组数据更新') {

        // 更新页面数据
        this.setData({
            'formData.gameGroups': newGameGroups
        });

        // 确保游戏已创建且数据有效
        if (this.data.gameCreated && newGameGroups && Array.isArray(newGameGroups)) {
            // 使用较短的防抖时间, 因为这是统一的变化监听
            this.debounce('gameGroupsObserver', async () => {
                const apiData = {
                    uuid: this.data.uuid,
                    groups: newGameGroups.map((group, index) => ({
                        groupIndex: index,
                        players: group.players || []
                    }))
                };

                // 调用API并获取返回结果
                const result = await this.callUpdateAPI('updateGameGroupAndPlayers', apiData, `组数据同步-${description}`);
            }, 300) // 较短的防抖时间
        }
    },

    data: {
        uuid: '', // 游戏唯一标识符(调试用)
        gameid: null, // 服务端返回的游戏ID
        groupid: null,
        gameCreated: false, // 标记游戏是否已创建
        shareReady: false,  // 分享入口是否可用
        selectedCourse: null, // 选中的球场信息
        selectedCourt: null,   // 选中的半场信息

        // 表单数据
        formData: {
            gameName: '',       // 比赛名称
            openTime: '',       // 开球时间
            ScoringType: 'hole',   // 赛制:hole-按洞赛, oneball-比杆赛
            gameGroups: [       // 参赛组别(至少一组) { players: [] }
                { players: [] }     // 默认创建第一组
            ],
            isPrivate: false,   // 是否秘密比赛
            password: ''        // 密码
        }
    },

    // 防抖定时器
    debounceTimers: {},

    /**
     * 实时更新API调用 - 带防抖和错误处理
     */
    async callUpdateAPI(apiMethod, data, description) {

        try {
            const result = await app.api.game[apiMethod](data)
            return result
        } catch (error) {
            // 不显示错误提示, 避免影响用户体验
            return null
        }
    },

    /**
     * 防抖执行函数
     */
    debounce(key, fn, delay = 500) {
        clearTimeout(this.debounceTimers[key])
        this.debounceTimers[key] = setTimeout(() => {
            fn()
        }, delay)
    },



    onGameNameInput(e) {
        const gameName = e.detail.value
        this.setData({
            'formData.gameName': gameName
        })

        // 实时更新游戏名称(防抖500ms)
        if (this.data.gameCreated) {
            this.debounce('gameName', () => {
                this.callUpdateAPI('updateGameName', {
                    uuid: this.data.uuid,
                    gameName
                }, '游戏名称')
            })
        }
    },

    onOpenTimeChange(e) {
        const { value, display } = e.detail
        this.setData({ 'formData.openTime': display })

        // 实时更新开球时间
        if (this.data.gameCreated) {
            this.callUpdateAPI('updateGameOpenTime', {
                uuid: this.data.uuid,
                openTime: value
            }, '开球时间')
        }
    },

    onScoringTypeChange(e) {


        this.setData({
            'formData.ScoringType': e.detail.value
        });

        if (this.data.gameCreated) {
            this.debounce('scoringType', () => {
                this.callUpdateAPI('updateGameScoringType', {
                    uuid: this.data.uuid,
                    scoringType: e.detail.value
                }, '游戏名称')
            })
        }




    },

    onPlayersChange(e) {
        const { groupIndex, players } = e.detail;
        const gameGroups = [...this.data.formData.gameGroups];
        gameGroups[groupIndex].players = players;

        // 使用统一的更新方法
        this.updateGameGroups(gameGroups, `第${groupIndex + 1}组玩家变化`);
    },

    /**
     * 处理老牌组合选择回调
     * 从 combineSelect 页面返回时调用
     */
    onCombinationSelected(combination, groupIndex, slotIndex) {
        if (!combination || !Array.isArray(combination) || combination.length === 0) {
            wx.showToast({
                title: '组合数据无效',
                icon: 'none'
            });
            return;
        }

        // 转换组合数据格式, 适配PlayerSelector组件的格式
        const players = combination.map(member => ({
            userid: member.userid,
            wx_nickname: member.nickname || '未知玩家',
            nickname: member.nickname || '未知玩家',
            avatar: member.avatar || '/images/default-avatar.png',
            handicap: member.handicap || 0,
            join_type: 'combineSelect',  // 添加来源字段
            tee: member.tee || 'blue'  // 添加T台字段, 默认蓝T
        }));

        // 使用追加模式添加老牌组合到组中
        this.handleAppendPlayersToGroup(players, groupIndex, 'combineSelect');
    },

    /**
     * 处理好友选择回调
     * 从 friendSelect 页面返回时调用
     */
    onFriendsSelected(selectedFriends, groupIndex, slotIndex) {
        if (!selectedFriends || !Array.isArray(selectedFriends) || selectedFriends.length === 0) {
            wx.showToast({
                title: '好友数据无效',
                icon: 'none'
            });
            return;
        }

        // 转换好友数据格式, 适配PlayerSelector组件的格式
        const players = selectedFriends.map(friend => ({
            userid: friend.userid,
            wx_nickname: friend.nickname || friend.wx_nickname || '未知好友',
            nickname: friend.nickname || friend.wx_nickname || '未知好友',
            avatar: friend.avatar || friend.avatar || '/images/default-avatar.png',
            handicap: friend.handicap || 0,
            join_type: 'friendSelect',  // 添加来源字段
            tee: friend.tee || 'blue'  // 添加T台字段, 默认蓝T
        }));

        // 使用追加模式添加好友到组中
        this.handleAppendPlayersToGroup(players, groupIndex, 'friendSelect');
    },



    checkUserInGroups(userid) {
        return findUserInGroups(userid, this.data.formData.gameGroups);
    },

    onUserCreated(createdUser, groupIndex, slotIndex) {
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
            avatar: createdUser.avatar || '/images/default-avatar.png',
            handicap: createdUser.handicap || 0,
            mobile: createdUser.mobile || '',
            join_type: 'manualAdd',  // 添加来源字段
            tee: createdUser.tee || 'blue'  // 添加T台字段, 默认蓝T
        };

        // 使用通用追加方法添加手工创建的用户
        this.handleAppendPlayersToGroup([user], groupIndex, 'manualAdd');
    },

    addGroup() {
        const gameGroups = [...this.data.formData.gameGroups];
        gameGroups.push({
            players: []
        });

        // 使用统一的更新方法
        this.updateGameGroups(gameGroups, '添加新组');

        wx.showToast({
            title: `已添加第${gameGroups.length}组`,
            icon: 'success'
        });
    },

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

        // 使用统一的更新方法
        this.updateGameGroups(gameGroups, `删除第${index + 1}组`);

        wx.showToast({
            title: '已删除该组',
            icon: 'success'
        });
    },

    onPrivateChange(e) {
        const isPrivate = e.detail.value;

        this.setData({
            'formData.isPrivate': isPrivate,
            // 如果取消私密, 清空密码
            'formData.password': isPrivate ? this.data.formData.password : ''
        });

        // 实时更新私有设置
        if (this.data.gameCreated) {
            this.callUpdateAPI('updateGamePrivate', {
                uuid: this.data.uuid,
                isPrivate
            }, '私有设置')
        }
    },

    onPasswordInput(e) {
        const password = e.detail.value
        this.setData({
            'formData.password': password
        });

        // 实时更新密码(防抖500ms)
        if (this.data.gameCreated && this.data.formData.isPrivate) {
            this.debounce('password', () => {
                this.callUpdateAPI('updateGamepPivacyPassword', {
                    uuid: this.data.uuid,
                    password
                }, '密码')
            })
        }
    },



    handleBack() {
        wx.navigateBack({
            delta: 1
        });
    },


    goToCourseSelect() {
        wx.navigateTo({
            url: '/pages/course-select/course-select'
        });
    },

    setSelectedCourse(course) {
        this.setData({
            selectedCourse: course
        });

        wx.showToast({
            title: `已选择 ${course.name}`,
            icon: 'success'
        });

        // 实时更新球场ID(只有球场ID, 没有半场信息)
        if (this.data.gameCreated) {
            const apiData = {
                uuid: this.data.uuid,
                courseid: course.courseid,
                frontNineCourtId: '', // 空值表示未选择
                backNineCourtId: ''   // 空值表示未选择
            };

            this.callUpdateAPI('updateGameCourseCourt', apiData, '球场选择')
        }
    },

    setCourtSelection(selectionData) {
        // 创建一个显示用的 court 对象
        const displayCourt = {
            name: this.generateCourtDisplayName(selectionData),
            gameType: selectionData.gameType,
            totalHoles: selectionData.totalHoles
        };

        this.setData({
            selectedCourse: selectionData.course,
            selectedCourt: displayCourt
        });

        // 根据选择类型生成提示信息
        let toastTitle = '';
        if (selectionData.gameType === 'full') {
            toastTitle = `已选择 ${selectionData.course?.name || '球场'} - 18洞`
        } else if (selectionData.gameType === 'front_nine') {
            toastTitle = `已选择 ${selectionData.course?.name || '球场'} - 前9洞`
        } else if (selectionData.gameType === 'back_nine') {
            toastTitle = `已选择 ${selectionData.course?.name || '球场'} - 后9洞`
        } else {
            toastTitle = `已选择 ${selectionData.course?.name || '球场'}`
        }

        wx.showToast({
            title: toastTitle,
            icon: 'success',
            duration: 2000
        });

        // 实时更新球场ID(发送球场ID、前9、后9的courtid)
        if (this.data.gameCreated && selectionData.course) {
            // 直接从 selectionData 中提取前9和后9的courtid
            const frontNineCourtId = selectionData.frontNine?.courtid || '';
            const backNineCourtId = selectionData.backNine?.courtid || '';

            const apiData = {
                uuid: this.data.uuid,
                courseid: selectionData.course.courseid,
                frontNineCourtId: frontNineCourtId,
                backNineCourtId: backNineCourtId,
                gameType: selectionData.gameType,
                totalHoles: selectionData.totalHoles
            };

            this.callUpdateAPI('updateGameCourseCourt', apiData, '球场和半场选择')
        }
    },

    /**
     * 生成半场显示名称
     */
    generateCourtDisplayName(selectionData) {
        if (selectionData.gameType === 'full') {
            return `${selectionData.frontNine?.courtname || '前九洞'} + ${selectionData.backNine?.courtname || '后九洞'}`;
        }
        if (selectionData.gameType === 'front_nine') {
            return selectionData.frontNine?.courtname || '前九洞';
        }
        if (selectionData.gameType === 'back_nine') {
            return selectionData.backNine?.courtname || '后九洞';
        }
        return '未知半场';
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
     * 跳转到T台选择页面
     */
    goToTeeSelect() {
        // 收集所有已添加的玩家
        const allPlayers = [];
        this.data.formData.gameGroups.forEach((group, groupIndex) => {
            if (group.players && Array.isArray(group.players)) {
                group.players.forEach((player, playerIndex) => {
                    if (player) {
                        allPlayers.push({
                            ...player,
                            groupIndex,
                            playerIndex
                        });
                    }
                });
            }
        });

        if (allPlayers.length === 0) {
            wx.showToast({
                title: '请先添加球员',
                icon: 'none'
            });
            return;
        }

        // 跳转到T台选择页面, 传递UUID用于回传数据
        wx.navigateTo({
            url: `/pages/tland-select/tland-select?uuid=${this.data.uuid}`
        });
    },

    /**
     * T台选择完成回调
     * 从 tland-select 页面返回时调用
     */
    onTeeSelectionComplete(updatedPlayers) {
        // 更新formData中的玩家T台信息
        const updatedGameGroups = [...this.data.formData.gameGroups];

        for (const player of updatedPlayers) {
            const { groupIndex, playerIndex, tee } = player;

            if (updatedGameGroups?.[groupIndex]?.players?.[playerIndex]) {
                // 更新对应位置玩家的T台信息
                updatedGameGroups[groupIndex].players[playerIndex].tee = tee;
            }
        }

        // 更新数据
        this.setData({
            'formData.gameGroups': updatedGameGroups
        });

        // 显示统计信息
        const teeStats = this.calculateTeeStatistics(updatedPlayers);
        const statsText = Object.entries(teeStats).map(([tee, count]) =>
            `${this.getTeeDisplayName(tee)}: ${count}人`
        ).join(', ');

        wx.showToast({
            title: `T台分配完成 - ${statsText}`,
            icon: 'none',
            duration: 3000
        });
    },

    /**
     * 计算T台统计信息
     */
    calculateTeeStatistics(players) {
        const stats = {};
        for (const player of players) {
            const tee = player.tee || 'blue';
            stats[tee] = (stats[tee] || 0) + 1;
        }
        return stats;
    },

    /**
     * 获取T台显示名称
     */
    getTeeDisplayName(tee) {
        const teeNames = {
            black: '黑T',
            blue: '蓝T',
            white: '白T',
            gold: '金T',
            red: '红T'
        };
        return teeNames[tee] || '未知T台';
    },

    /**
     * 构建分享路径
     */
    buildSharePath() {
        const { uuid, gameid } = this.data;
        if (!uuid) {
            return '/pages/createGame/createGame';
        }
        const query = [`uuid=${uuid}`];
        if (gameid) {
            query.push(`gameid=${gameid}`);
        }
        const gameName = this.data.formData?.gameName;
        if (gameName) {
            query.push(`title=${encodeURIComponent(gameName)}`);
        }
        return `/pages/player-select/joinGame/joinGame?${query.join('&')}`;
    },

    /**
     * 更新分享按钮可用态
     */
    updateShareState() {
        const shareReady = Boolean(this.data.gameCreated && this.data.uuid && this.data.gameid);
        if (shareReady !== this.data.shareReady) {
            this.setData({ shareReady });
        }
    },

    /**
     * 打开二维码邀请页
     */
    onShowInviteQrcode() {
        if (!this.data.shareReady) {
            wx.showToast({
                title: '比赛信息未就绪',
                icon: 'none'
            });
            return;
        }

        const { uuid, gameid, formData } = this.data;
        let url = `/pages/player-select/qrcode/qrcode?uuid=${uuid}`;
        if (gameid) {
            url += `&gameid=${gameid}`;
        }
        if (formData?.gameName) {
            url += `&title=${encodeURIComponent(formData.gameName)}`;
        }

        wx.navigateTo({
            url
        });
    },

    /**
     * 点击“开始计分”按钮, 跳转到 gameDetail 记分界面
     */
    onStartScoring() {
        if (!this.data.gameid) {
            wx.showToast({ title: '请先创建比赛', icon: 'none' });
            return;
        }
        wx.navigateTo({
            url: `/pages/gameDetail/score/score?gameid=${this.data.gameid}`
        });
    },

    /**
     * 分享给好友
     */
    onShareAppMessage() {
        if (!this.data.shareReady) {
            return {
                title: '高尔夫江湖 - 创建你的比赛',
                path: '/pages/createGame/createGame'
            };
        }

        const { formData } = this.data;
        const title = formData.gameName
            ? `${formData.gameName} 邀请你加入比赛`
            : '高尔夫江湖邀请你加入比赛';

        return {
            title,
            path: this.buildSharePath()
        };
    },

    /**
     * 生命周期函数--监听页面加载
     */
    async onLoad(options) {
        const gameUuid = uuid();
        this.setData({
            uuid: gameUuid
        });

        try {
            wx.showShareMenu({
                withShareTicket: true,
                menus: ['shareAppMessage']
            });
        } catch (error) {
            // 静默处理, 某些基础库版本不支持 menus 参数
            wx.showShareMenu();
        }

        // 立即创建空白游戏
        try {
            const result = await app.api.game.createBlankGame({
                uuid: gameUuid
            })

            if (result?.code === 200) {
                const gameid = result.gameid || null;
                this.setData({
                    gameCreated: true,
                    gameid,
                    shareReady: Boolean(gameid)
                });
                this.updateShareState();
            }
        } catch (error) {
            // 静默处理错误
        }
    },


    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 检查本地缓存中是否有选择的半场数据(备用方案)
        try {
            const cachedCourtData = wx.getStorageSync('selectedCourtData')
            if (cachedCourtData) {
                this.setCourtSelection(cachedCourtData)
                // 清除缓存, 避免重复使用
                wx.removeStorageSync('selectedCourtData')
            }
        } catch (error) {
            // 静默处理错误
        }
    },
}); 
