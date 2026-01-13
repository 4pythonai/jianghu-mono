import { findUserInGroups, handleAppendPlayersToGroup } from '@/utils/gameGroupUtils'
import { uuid } from '@/utils/tool'
import { validateForm } from '@/utils/gameValidate'
import { gameStore } from '@/stores/game/gameStore'
import {
    goToCourseSelect as goToCourseSelectCommon,
    generateCourtDisplayName,
    handleBack as handleBackCommon,
    loadCachedCourtData
} from '@/utils/createGameCommons'

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
        if (result.uiActions?.showToast && wx.showModal) {
            wx.showModal(result.uiActions.showToast);
        }

        return result;
    },

    /**
     * 同步玩家数据到 gameStore
     * 从 gameGroups 提取所有玩家，扁平化后同步到 store
     */
    syncPlayersToStore(gameGroups) {
        if (!gameGroups || !Array.isArray(gameGroups)) return;

        const allPlayers = [];
        gameGroups.forEach(group => {
            if (group.players && Array.isArray(group.players)) {
                allPlayers.push(...group.players);
            }
        });

        gameStore.setPlayers(allPlayers);
    },

    // 统一的 setData 方法, 自动触发 API 同步
    updateGameGroups(newGameGroups, description = '组数据更新') {

        // 更新页面数据
        this.setData({
            'formData.gameGroups': newGameGroups
        });

        // 同步玩家数据到 gameStore，保持数据一致性
        this.syncPlayersToStore(newGameGroups);

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

                // 确保同步成功后标记为已同步
                if (result?.code === 200 && !this.data.groupsSynced) {
                    this.setData({ groupsSynced: true });
                    this.updateShareState();
                }
            }, 300) // 较短的防抖时间
        }
    },

    data: {
        uuid: '', // 游戏唯一标识符(调试用)
        gameid: null, // 服务端返回的游戏ID
        groupid: null,
        gameCreated: false, // 标记游戏是否已创建
        groupsSynced: false, // 标记创建者组数据是否已同步到后端
        shareReady: false,  // 分享入口是否可用(需创建比赛+球场+开球时间+组数据同步)
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
        this.updateShareState();

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
            wx.showModal({
                title: '组合数据无效',
                icon: 'error'
            });
            return;
        }

        // 转换组合数据格式, 适配PlayerSelector组件的格式
        // member 数据来自后端，字段: userid, nickname, avatar, handicap
        const players = combination.map(member => ({
            userid: member.userid,
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
            wx.showModal({
                title: '好友数据无效',
                icon: 'error'
            });
            return;
        }

        // 转换好友数据格式, 适配PlayerSelector组件的格式
        // friend 来自后端 User/getFriendList API，字段: userid, nickname, avatar, handicap
        const players = selectedFriends.map(friend => ({
            userid: friend.userid,
            nickname: friend.nickname || '未知好友',
            avatar: friend.avatar || '/images/default-avatar.png',
            handicap: friend.handicap || 0,
            join_type: 'friendSelect',
            tee: friend.tee || 'blue'
        }));

        // 使用追加模式添加好友到组中
        this.handleAppendPlayersToGroup(players, groupIndex, 'friendSelect');
    },



    checkUserInGroups(userid) {
        return findUserInGroups(userid, this.data.formData.gameGroups);
    },

    onUserCreated(createdUser, groupIndex, slotIndex) {
        if (!createdUser) {
            wx.showModal({
                title: '用户数据无效',
                icon: 'error'
            });
            return;
        }

        // 确保用户数据格式正确
        // createdUser 来自 manualAdd.js，已标准化为 t_user 表字段结构
        const user = {
            userid: createdUser.userid,
            nickname: createdUser.nickname,
            avatar: createdUser.avatar || '/images/default-avatar.png',
            handicap: createdUser.handicap || 0,
            mobile: createdUser.mobile || '',
            join_type: 'manualAdd',
            tee: createdUser.tee || 'blue'
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

        wx.showModal({
            title: `已添加第${gameGroups.length}组`,
            icon: 'success'
        });
    },

    deleteGroup(e) {
        const index = e.currentTarget.dataset.index;
        const gameGroups = [...this.data.formData.gameGroups];

        if (gameGroups.length <= 1) {
            wx.showModal({
                title: '至少需要保留一组',
                icon: 'error'
            });
            return;
        }

        gameGroups.splice(index, 1);

        // 使用统一的更新方法
        this.updateGameGroups(gameGroups, `删除第${index + 1}组`);

        wx.showModal({
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

        // 如果取消秘密比赛，立即同步到后端
        if (this.data.gameCreated && !isPrivate) {
            this.callUpdateAPI('updateGamePrivateWithPassword', {
                uuid: this.data.uuid,
                isPrivate: false,
                password: ''
            }, '取消秘密比赛')
        }
        // 如果开启秘密比赛，等待用户输入密码后再同步（在 onPasswordInput 中处理）
    },

    onPasswordInput(e) {
        const password = e.detail.value
        this.setData({
            'formData.password': password
        });

        // 实时更新秘密比赛设置(防抖500ms)
        // 只有同时有 isPrivate=true 和 password 才会设置为秘密比赛
        if (this.data.gameCreated && this.data.formData.isPrivate) {
            this.debounce('privateSettings', () => {
                this.callUpdateAPI('updateGamePrivateWithPassword', {
                    uuid: this.data.uuid,
                    isPrivate: true,
                    password: password
                }, '秘密比赛设置')
            })
        }
    },



    handleBack() {
        handleBackCommon()
    },


    goToCourseSelect() {
        goToCourseSelectCommon()
    },

    setSelectedCourse(course) {
        this.setData({
            selectedCourse: course
        });
        this.updateShareState();

        wx.showModal({
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
        this.updateShareState();

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

        wx.showModal({
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
     * 生成半场显示名称 - 使用公共函数
     */
    generateCourtDisplayName(selectionData) {
        return generateCourtDisplayName(selectionData)
    },

    /**
     * 清除选中的球场和半场
     */
    clearSelectedCourse() {
        this.setData({
            selectedCourse: null,
            selectedCourt: null
        });
        this.updateShareState();
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
            wx.showModal({
                title: '请先添加球员',
                icon: 'error'
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

        wx.showModal({
            title: `T台分配完成 - ${statsText}`,
            icon: 'success',
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
        return `/packagePlayer/player-select/wxShare/wxShare?${query.join('&')}`;
    },

    /**
     * 更新分享按钮可用态
     */
    updateShareState() {
        const hasGame = Boolean(this.data.gameCreated && this.data.uuid && this.data.gameid);
        const hasCourse = Boolean(this.data.selectedCourse);
        const openTime = this.data.formData && this.data.formData.openTime;
        const hasOpenTime = typeof openTime === 'string'
            ? openTime.trim().length > 0
            : Boolean(openTime);
        const hasGroupsSynced = Boolean(this.data.groupsSynced); // 确保创建者数据已同步
        const shareReady = hasGame && hasCourse && hasOpenTime && hasGroupsSynced;
        if (shareReady !== this.data.shareReady) {
            this.setData({ shareReady });
        }
    },

    /**
     * 分享入口提示
     */
    showShareNotReadyToast() {
        wx.showModal({
            title: '提示',
            content: '请选择球场/开球时间',
            showCancel: false,
            success(res) { }
        })
    },

    /**
     * 分享邀请按钮点击
     */
    onShareButtonTap() {
        if (!this.data.shareReady) {
            this.showShareNotReadyToast();
            return;
        }

        // 跳转到微信分享预览页面
        const { uuid, gameid, formData, selectedCourse } = this.data;
        let url = `/packagePlayer/player-select/wxForward/wxForward?uuid=${uuid}`;

        if (gameid) {
            url += `&gameid=${gameid}`;
        }
        if (formData?.gameName) {
            url += `&title=${encodeURIComponent(formData.gameName)}`;
        }
        if (formData?.openTime) {
            url += `&openTime=${encodeURIComponent(formData.openTime)}`;
        }
        if (selectedCourse) {
            url += `&courseName=${encodeURIComponent(selectedCourse.name || '')}`;
            if (selectedCourse.address) {
                url += `&courseAddress=${encodeURIComponent(selectedCourse.address)}`;
            }
        }

        wx.navigateTo({
            url
        });
    },

    /**
     * 打开二维码邀请页
     */
    onShowInviteQrcode() {
        if (!this.data.shareReady) {
            this.showShareNotReadyToast();
            return;
        }

        const { uuid, gameid, formData } = this.data;
        let url = `/packagePlayer/player-select/qrcode/qrcode?uuid=${uuid}`;
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
     * 点击"开始记分"按钮, 跳转到 gameDetail 记分界面
     */
    onStartScoring() {
        // 验证表单完整性（球场、开球时间、参赛玩家等）
        const validationData = {
            formData: this.data.formData,
            selectedCourse: this.data.selectedCourse,
            selectedCourt: this.data.selectedCourt
        };

        if (!validateForm(validationData)) {
            // 验证失败，validateForm 内部已显示具体的错误提示
            return;
        }

        // 确保后端游戏已创建完成
        if (!this.data.gameid) {
            wx.showModal({
                title: '比赛数据同步中，请稍后重试',
                icon: 'none'
            });
            return;
        }

        // 所有验证通过，进入记分页面
        wx.navigateTo({
            url: `/packageGame/gameDetail/score/score?gameid=${this.data.gameid}`
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
        // 创建新比赛时，清理旧的 gameStore 数据，避免数据污染
        gameStore.reset();

        const gameUuid = uuid();
        const userInfo = app.globalData.userInfo;

        // 构建创建者 player 对象
        // userInfo 已通过 normalizeUserInfo 标准化，字段: id, nickname, avatar, gender, handicap
        const creator = {
            userid: userInfo?.id,
            nickname: userInfo?.nickname || '我',
            avatar: userInfo?.avatar || '/images/default-avatar.png',
            handicap: userInfo?.handicap || 0,
            join_type: 'creator',
            tee: 'blue'
        };

        // 验证创建者数据
        if (!creator.userid) {
            wx.showModal({
                title: '用户信息不完整',
                content: '无法获取用户ID，请重新登录',
                showCancel: false,
                success: () => {
                    wx.reLaunch({ url: '/pages/mine/mine' });
                }
            });
            return;
        }

        // 初始化第一组时包含创建者
        this.setData({
            uuid: gameUuid,
            'formData.gameGroups': [{ players: [creator] }]
        });

        // 设置比赛名称缺省值
        const nickname = userInfo?.nickname || '我';
        const defaultGameName = `${nickname}的球局`;
        this.setData({
            'formData.gameName': defaultGameName
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

                // 同步 gameid 和初始玩家到 gameStore
                gameStore.setGameid(gameid);
                gameStore.setCreatorid(creator.userid);
                this.syncPlayersToStore(this.data.formData.gameGroups);

                // 立即同步创建者到后端第一组
                const syncResult = await this.callUpdateAPI('updateGameGroupAndPlayers', {
                    uuid: gameUuid,
                    groups: [{
                        groupIndex: 0,
                        players: [creator]
                    }]
                }, '创建者加入第一组');

                // 标记组数据已同步，允许分享
                if (syncResult?.code === 200) {
                    this.setData({ groupsSynced: true });
                    this.updateShareState();
                }

                // 如果游戏已创建，同步缺省的游戏名称
                if (defaultGameName) {
                    this.debounce('gameName', () => {
                        this.callUpdateAPI('updateGameName', {
                            uuid: this.data.uuid,
                            gameName: defaultGameName
                        }, '游戏名称')
                    })
                }
            }
        } catch (error) {
            // 静默处理错误
        }
    },


    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 使用公共函数读取球场缓存数据
        loadCachedCourtData(this, this.setCourtSelection)
    },
}); 
