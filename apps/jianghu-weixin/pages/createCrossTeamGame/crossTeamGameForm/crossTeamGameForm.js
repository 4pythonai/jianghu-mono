/**
 * 队际赛表单页面
 * 复用队内赛表单逻辑，适配多球队模式
 */
const app = getApp()

// 赛制选项配置
const MATCH_FORMATS = [
    { value: 'individual_stroke', label: '个人比杆赛', requireSubteam: false, isMatch: false },
    { value: 'fourball_best_stroke', label: '四人四球最好成绩比杆赛', requireSubteam: true, isMatch: false },
    { value: 'fourball_oneball_stroke', label: '四人四球最佳球位比杆赛(旺波)', requireSubteam: true, isMatch: false },
    { value: 'foursome_stroke', label: '四人两球比杆赛', requireSubteam: true, isMatch: false },
    { value: 'individual_match', label: '个人比洞赛', requireSubteam: false, isMatch: true },
    { value: 'fourball_best_match', label: '四人四球最好成绩比洞赛', requireSubteam: true, isMatch: true },
    { value: 'fourball_oneball_match', label: '四人四球最佳球位比洞赛(旺波)', requireSubteam: true, isMatch: true },
    { value: 'foursome_match', label: '四人两球比洞赛', requireSubteam: true, isMatch: true }
]

Page({
    data: {
        // 参赛球队列表
        selectedTeams: [], // [{team_id, team_name, team_alias, team_avatar}]

        // 球场信息
        selectedCourse: null,
        selectedCourt: null,
        courtSelection: null, // 半场选择信息 {frontNineCourtId, backNineCourtId, gameType}

        // 表单数据
        formData: {
            name: '',                    // 比赛名称
            openTime: '',                // 开球时间
            entryFee: '',                // 参赛费用
            matchFormat: 'individual_stroke', // 赛制
            awards: '',                  // 奖项设置
            groupingPermission: 'admin', // 分组权限
            isPublic: 'y',               // 是否公开
            topNRanking: ''              // 取前N名成绩
        },

        // 赛制选项（动态计算，比洞赛可能禁用）
        matchFormats: [],

        // 当前赛制配置
        currentFormat: MATCH_FORMATS[0],

        // 提交状态
        submitting: false
    },

    onLoad() {
        // 从缓存获取已选球队
        try {
            const selectedTeams = wx.getStorageSync('selectedTeamsForCrossGame')
            if (!selectedTeams || selectedTeams.length < 2) {
                wx.showToast({ title: '请先选择球队', icon: 'none' })
                setTimeout(() => wx.navigateBack(), 1500)
                return
            }

            // 计算赛制选项（超过2队时禁用比洞赛）
            const matchFormats = this.computeMatchFormats(selectedTeams.length)

            // 设置默认比赛名称
            const teamNames = selectedTeams.map(t => t.team_alias || t.team_name).join(' vs ')
            const defaultName = `${teamNames} 队际赛`

            this.setData({
                selectedTeams,
                matchFormats,
                'formData.name': defaultName
            })
        } catch (error) {
            console.error('读取球队缓存失败:', error)
            wx.showToast({ title: '数据加载失败', icon: 'none' })
            setTimeout(() => wx.navigateBack(), 1500)
        }
    },

    onShow() {
        // 检查是否有选择的球场数据
        try {
            const cachedCourtData = wx.getStorageSync('selectedCourtData')
            if (cachedCourtData) {
                this.setCourtSelection(cachedCourtData)
                wx.removeStorageSync('selectedCourtData')
            }
        } catch (error) {
            console.error('读取球场缓存失败:', error)
        }
    },

    /**
     * 根据球队数量计算可用赛制
     */
    computeMatchFormats(teamCount) {
        return MATCH_FORMATS.map(format => ({
            ...format,
            // 超过2队时禁用比洞赛
            disabled: format.isMatch && teamCount > 2
        }))
    },

    // ==================== 表单输入处理 ====================

    onNameInput(e) {
        this.setData({ 'formData.name': e.detail.value })
    },

    onOpenTimeChange(e) {
        const { value } = e.detail
        // 保存标准格式的时间值，用于提交给后端
        this.setData({ 'formData.openTime': value })
    },

    onEntryFeeInput(e) {
        this.setData({ 'formData.entryFee': e.detail.value })
    },

    onMatchFormatChange(e) {
        const value = e.detail.value
        const format = this.data.matchFormats.find(f => f.value === value)

        // 检查是否被禁用
        if (format.disabled) {
            wx.showToast({ title: '超过2个球队不能选择比洞赛', icon: 'none' })
            return
        }

        this.setData({
            'formData.matchFormat': value,
            currentFormat: format
        })
    },

    onAwardsInput(e) {
        this.setData({ 'formData.awards': e.detail.value })
    },

    onGroupingPermissionChange(e) {
        this.setData({ 'formData.groupingPermission': e.detail.value })
    },

    onIsPublicChange(e) {
        this.setData({ 'formData.isPublic': e.detail.value })
    },

    onTopNRankingInput(e) {
        this.setData({ 'formData.topNRanking': e.detail.value })
    },

    // ==================== 球场选择 ====================

    goToCourseSelect() {
        wx.navigateTo({
            url: '/pages/course-select/course-select'
        })
    },

    setCourtSelection(selectionData) {
        const displayCourt = {
            name: this.generateCourtDisplayName(selectionData),
            gameType: selectionData.gameType,
            totalHoles: selectionData.totalHoles
        }

        this.setData({
            selectedCourse: selectionData.course,
            selectedCourt: displayCourt,
            // 保存完整的半场信息，用于提交时传递给后端
            courtSelection: {
                frontNineCourtId: selectionData.frontNine?.courtid || null,
                backNineCourtId: selectionData.backNine?.courtid || null,
                gameType: selectionData.gameType
            }
        })

        wx.showToast({
            title: `已选择 ${selectionData.course?.name || '球场'}`,
            icon: 'success'
        })
    },

    generateCourtDisplayName(selectionData) {
        if (selectionData.gameType === 'full') {
            return `${selectionData.frontNine?.courtname || '前九洞'} + ${selectionData.backNine?.courtname || '后九洞'}`
        }
        if (selectionData.gameType === 'front_nine') {
            return selectionData.frontNine?.courtname || '前九洞'
        }
        if (selectionData.gameType === 'back_nine') {
            return selectionData.backNine?.courtname || '后九洞'
        }
        return '未知半场'
    },

    clearSelectedCourse() {
        this.setData({
            selectedCourse: null,
            selectedCourt: null
        })
    },

    // ==================== 球队管理 ====================

    /**
     * 返回重新选择球队
     */
    goBackToTeamSelect() {
        wx.navigateBack({ delta: 1 })
    },

    /**
     * 编辑球队简称
     */
    editTeamAlias(e) {
        const teamId = e.currentTarget.dataset.teamId
        const team = this.data.selectedTeams.find(t => t.team_id === teamId)

        if (!team) return

        wx.showModal({
            title: '修改球队简称',
            editable: true,
            placeholderText: team.team_alias || team.team_name,
            content: team.team_alias || '',
            success: (res) => {
                if (res.confirm && res.content !== undefined) {
                    const newAlias = res.content.trim() || team.team_name
                    const selectedTeams = this.data.selectedTeams.map(t =>
                        t.team_id === teamId ? { ...t, team_alias: newAlias } : t
                    )
                    this.setData({ selectedTeams })

                    // 更新缓存
                    wx.setStorageSync('selectedTeamsForCrossGame', selectedTeams)
                }
            }
        })
    },

    // ==================== 表单验证与提交 ====================

    validateForm() {
        const { formData, selectedCourse, selectedTeams, currentFormat } = this.data

        if (!formData.name.trim()) {
            wx.showToast({ title: '请输入比赛名称', icon: 'none' })
            return false
        }

        if (!selectedCourse) {
            wx.showToast({ title: '请选择比赛场地', icon: 'none' })
            return false
        }

        if (!formData.openTime) {
            wx.showToast({ title: '请选择比赛时间', icon: 'none' })
            return false
        }

        if (selectedTeams.length < 2) {
            wx.showToast({ title: '至少需要2个参赛球队', icon: 'none' })
            return false
        }

        // 比洞赛检查球队数量
        if (currentFormat.isMatch && selectedTeams.length > 2) {
            wx.showToast({ title: '比洞赛最多支持2个球队', icon: 'none' })
            return false
        }

        return true
    },

    async onSubmit() {
        if (!this.validateForm()) return

        if (this.data.submitting) return
        this.setData({ submitting: true })

        try {
            const { formData, selectedCourse, selectedTeams, courtSelection } = this.data

            // 准备球队ID和简称数组
            const teamIds = selectedTeams.map(t => t.team_id)
            const teamAliases = selectedTeams.map(t => t.team_alias || t.team_name)

            // 调用创建队际赛 API
            const result = await app.api.teamgame.createCrossTeamGame({
                team_ids: teamIds,
                team_aliases: teamAliases,
                name: formData.name.trim(),
                courseid: selectedCourse.courseid,
                // 传递半场信息，用于生成 holeList
                front_nine_court_id: courtSelection?.frontNineCourtId || null,
                back_nine_court_id: courtSelection?.backNineCourtId || null,
                match_format: formData.matchFormat,
                open_time: formData.openTime,
                entry_fee: formData.entryFee ? parseFloat(formData.entryFee) : 0,
                awards: formData.awards || null,
                grouping_permission: formData.groupingPermission,
                is_public_registration: formData.isPublic,
                top_n_ranking: formData.topNRanking ? parseInt(formData.topNRanking) : null
            })

            if (result?.code !== 200) {
                throw new Error(result?.message || '创建失败')
            }

            const gameId = result.data.game_id

            // 开启报名
            await app.api.teamgame.startRegistration({ game_id: gameId })

            // 清理缓存
            wx.removeStorageSync('selectedTeamsForCrossGame')

            wx.showToast({ title: '创建成功', icon: 'success' })

            // 跳转到赛事详情页（暂时返回首页）
            setTimeout(() => {
                wx.navigateBack({ delta: 2 })
            }, 1500)

        } catch (error) {
            console.error('创建队际赛失败:', error)
            wx.showToast({
                title: error.message || '创建失败，请重试',
                icon: 'none'
            })
        } finally {
            this.setData({ submitting: false })
        }
    },

    handleBack() {
        wx.navigateBack({ delta: 1 })
    }
})
