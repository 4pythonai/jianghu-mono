import { createWxPageHandler, findUserInGroups, handleAppendPlayersToGroup } from '../../../utils/gameGroupUtils'
import { validateForm } from '../../../utils/gameValidate'
import { uuid } from '../../../utils/tool'

const app = getApp()


Page({
    // 重写玩家添加处理函数，使用我们的统一更新方法
    handleAppendPlayersToGroup(players, groupIndex, sourceType) {
        console.log(`🎯 handleAppendPlayersToGroup 被调用:`, { players, groupIndex, sourceType });

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

        console.log(`🎯 handleAppendPlayersToGroup 处理结果:`, result);

        // 如果成功，使用我们的统一更新方法而不是直接 setData
        if (result.success && result.gameGroups) {
            this.updateGameGroups(result.gameGroups, `${sourceType}添加`);
        }

        // 显示 Toast
        if (result.uiActions && result.uiActions.showToast && wx.showToast) {
            wx.showToast(result.uiActions.showToast);
        }

        return result;
    },

    // 统一的 setData 方法，自动触发 API 同步
    updateGameGroups(newGameGroups, description = '组数据更新') {
        console.log('🌺 updateGameGroups 被调用:', newGameGroups);
        console.log('🔍 当前 gameCreated 状态:', this.data.gameCreated);
        console.log('🔍 当前 uuid:', this.data.uuid);
        console.log('🔍 描述:', description);

        // 更新页面数据
        this.setData({
            'formData.gameGroups': newGameGroups
        });

        // 确保游戏已创建且数据有效
        if (this.data.gameCreated && newGameGroups && Array.isArray(newGameGroups)) {
            console.log('✅ 条件满足，开始防抖调用');
            // 使用较短的防抖时间，因为这是统一的变化监听
            this.debounce('gameGroupsObserver', () => {
                console.log('🚀 防抖结束，开始调用 updateGameGroupAndPlayers API');
                const apiData = {
                    uuid: this.data.uuid,
                    groups: newGameGroups.map((group, index) => ({
                        groupIndex: index,
                        players: group.players || []
                    }))
                };
                console.log('📤 API 调用数据:', apiData);
                this.callUpdateAPI('updateGameGroupAndPlayers', apiData, `组数据同步-${description}`)
            }, 300) // 较短的防抖时间
        } else {
            console.log('❌ 条件不满足，跳过 API 调用');
            if (!this.data.gameCreated) {
                console.log('   原因: gameCreated = false');
            }
            if (!newGameGroups) {
                console.log('   原因: newGameGroups 为空');
            }
            if (!Array.isArray(newGameGroups)) {
                console.log('   原因: newGameGroups 不是数组');
            }
        }
    },

    data: {
        uuid: '', // 游戏唯一标识符（调试用）
        gameId: null, // 服务端返回的游戏ID
        gameCreated: false, // 标记游戏是否已创建
        selectedCourse: null, // 选中的球场信息
        selectedCourt: null,   // 选中的半场信息

        // 表单数据
        formData: {
            gameName: '',       // 比赛名称
            openTime: '',       // 开球时间
            ScoringType: 'hole',   // 赛制：hole-按洞赛, oneball-比杆赛
            gameGroups: [       // 参赛组别（至少一组） { players: [] }
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
        console.log(`🌐 开始调用 ${apiMethod} API, 描述: ${description}`);
        console.log(`🌐 API 方法存在吗:`, typeof app.api.game[apiMethod]);
        console.log(`🌐 调用数据:`, data);

        try {
            const result = await app.api.game[apiMethod](data)
            console.log(`✅ ${description}更新成功:`, result)
            return result
        } catch (error) {
            console.error(`❌ ${description}更新失败:`, error)
            console.error(`❌ 错误详情:`, error.message || error);
            // 不显示错误提示，避免影响用户体验
            return null
        }
    },

    /**
     * 防抖执行函数
     */
    debounce(key, fn, delay = 500) {
        console.log(`⏱️ debounce 被调用, key: ${key}, delay: ${delay}ms`);
        clearTimeout(this.debounceTimers[key])
        this.debounceTimers[key] = setTimeout(() => {
            console.log(`⏰ debounce 时间到，执行函数 key: ${key}`);
            fn()
        }, delay)
    },



    onGameNameInput(e) {
        const gameName = e.detail.value
        this.setData({
            'formData.gameName': gameName
        })

        // 实时更新游戏名称（防抖500ms）
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

        // updateGameScoringType
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

        console.log(`🎮 onPlayersChange 触发 - 第${groupIndex + 1}组玩家更新:`, players);

        // 使用统一的更新方法
        this.updateGameGroups(gameGroups, `第${groupIndex + 1}组玩家变化`);
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
            coverpath: createdUser.coverpath || '/images/default-avatar.png',
            handicap: createdUser.handicap || 0,
            mobile: createdUser.mobile || ''
        };

        // 使用通用追加方法添加手工创建的用户
        this.handleAppendPlayersToGroup([user], groupIndex, '手工添加用户');
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
            // 如果取消私密，清空密码
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

        // 实时更新密码（防抖500ms）
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
        console.log('🏌️ 接收到选中的球场:', course);
        this.setData({
            selectedCourse: course
        });

        wx.showToast({
            title: `已选择 ${course.name}`,
            icon: 'success'
        });

        // 实时更新球场ID（只有球场ID，没有半场信息）
        if (this.data.gameCreated) {
            const apiData = {
                uuid: this.data.uuid,
                courseid: course.id || course.courseid,
                frontNineCourtId: '', // 空值表示未选择
                backNineCourtId: ''   // 空值表示未选择
            };

            console.log('🏌️ updateGameCourseCourt API 数据（仅球场）:', apiData);

            this.callUpdateAPI('updateGameCourseCourt', apiData, '球场选择')
        }
    },

    setCourtSelection(selectionData) {
        console.log('🏌️ setCourtSelection 接收到的数据:', selectionData);

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

        // 实时更新球场ID（发送球场ID、前9、后9的courtid）
        if (this.data.gameCreated && selectionData.course) {
            // 直接从 selectionData 中提取前9和后9的courtid
            const frontNineCourtId = selectionData.frontNine?.courtid || '';
            const backNineCourtId = selectionData.backNine?.courtid || '';

            console.log('🏌️ 提取的半场信息:');
            console.log('  - 游戏类型:', selectionData.gameType);
            console.log('  - 总洞数:', selectionData.totalHoles);
            console.log('  - 前9 courtid:', frontNineCourtId);
            console.log('  - 后9 courtid:', backNineCourtId);

            const apiData = {
                uuid: this.data.uuid,
                courseid: selectionData.course.id || selectionData.course.courseid,
                frontNineCourtId: frontNineCourtId,
                backNineCourtId: backNineCourtId,
                gameType: selectionData.gameType,
                totalHoles: selectionData.totalHoles
            };

            console.log('🏌️ updateGameCourseCourt API 数据:', apiData);

            this.callUpdateAPI('updateGameCourseCourt', apiData, '球场和半场选择')
        }
    },

    /**
     * 生成半场显示名称
     */
    generateCourtDisplayName(selectionData) {
        if (selectionData.gameType === 'full') {
            return `${selectionData.frontNine?.courtname || '前九洞'} + ${selectionData.backNine?.courtname || '后九洞'}`;
        } else if (selectionData.gameType === 'front_nine') {
            return selectionData.frontNine?.courtname || '前九洞';
        } else if (selectionData.gameType === 'back_nine') {
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
     * 处理创建比赛 - 实时更新模式下主要用于最终验证和跳转
     */
    handleCreateGame() {

        // 可以跳转到游戏详情页或其他页面
        setTimeout(() => {
            // wx.navigateTo({
            //     url: `/pages/gameDetail/gameDetail?gameId=${this.data.uuid}`
            // });
        }, 2000);
    },



    /**
     * 生命周期函数--监听页面加载
     */
    async onLoad(options) {
        const gameUuid = uuid();
        this.setData({
            uuid: gameUuid
        });

        // 立即创建空白游戏
        try {
            console.log('🎮 开始创建空白游戏，UUID:', gameUuid)
            const result = await app.api.game.createBlankGame({
                uuid: gameUuid
            })

            if (result?.code === 200) {
                this.setData({
                    gameCreated: true,
                    gameId: result.data?.gameid || null // 保存服务器返回的gameid
                })
                console.log('✅ 空白游戏创建成功:', result)
                console.log('📝 服务器返回的gameid:', result.data?.gameid)
            } else {
                console.error('❌ 空白游戏创建失败:', result)
            }
        } catch (error) {
            console.error('❌ 创建空白游戏异常:', error)
        }
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