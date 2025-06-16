import { createWxPageHandler, findUserInGroups } from '../../../utils/gameGroupUtils'
import { validateForm } from '../../../utils/gameValidate'
import { uuid } from '../../../utils/tool'

const app = getApp()


Page({
    // 创建绑定了当前页面的处理函数
    handleAppendPlayersToGroup: createWxPageHandler('formData.gameGroups'),
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
            console.log(`✅ ${description}更新成功:`, result)
            return result
        } catch (error) {
            console.error(`❌ ${description}更新失败:`, error)
            // 不显示错误提示，避免影响用户体验
            return null
        }
    },

    /**
     * 防抖执行函数
     */
    debounce(key, fn, delay = 500) {
        clearTimeout(this.debounceTimers[key])
        this.debounceTimers[key] = setTimeout(fn, delay)
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

        this.setData({
            'formData.gameGroups': gameGroups
        });

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
        this.setData({
            'formData.gameGroups': gameGroups
        });

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
        console.log('接收到选中的球场:', course);
        this.setData({
            selectedCourse: course
        });

        wx.showToast({
            title: `已选择 ${course.name}`,
            icon: 'success'
        });

        // 实时更新球场ID
        if (this.data.gameCreated) {
            this.callUpdateAPI('updateGameCourseid', {
                uuid: this.data.uuid,
                courseid: course.id || course.courseid
            }, '球场')
        }
    },

    setCourtSelection(selectionData) {
        this.setData({
            selectedCourse: selectionData.course,
            selectedCourt: selectionData.court
        });

        wx.showToast({
            title: `已选择 ${selectionData.course?.name || '球场'} - ${selectionData.court?.name || '半场'}`,
            icon: 'success',
            duration: 2000
        });

        // 实时更新球场ID（使用球场数据）
        if (this.data.gameCreated && selectionData.course) {
            this.callUpdateAPI('updateGameCourseid', {
                uuid: this.data.uuid,
                courseid: selectionData.course.id || selectionData.course.courseid
            }, '球场和半场')
        }
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