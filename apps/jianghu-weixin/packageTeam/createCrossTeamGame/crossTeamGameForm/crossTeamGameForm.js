/**
 * 队际赛表单页面
 * 复用队内赛表单逻辑，适配多球队模式
 */
import {
    goToCourseSelect as goToCourseSelectCommon,
    generateCourtDisplayName,
    handleBack as handleBackCommon,
    handleCourtSelection,
    loadCachedCourtData,
    validateBasicInfo
} from '@/utils/createGameCommons'
import { MATCH_FORMATS, getMatchFormatsWithDisabled, getMatchFormatByValue } from '@/constants/matchFormats'

const app = getApp()

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
            registrationDeadline: '',    // 报名截止时间
            entryFee: '',                // 参赛费用
            matchFormat: 'individual_stroke', // 赛制
            awards: '',                  // 奖项设置
            schedule: [],                // 赛事流程 [{time, content}, ...]
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
        // 使用公共函数读取球场缓存数据
        loadCachedCourtData(this, this.setCourtSelection)
    },

    /**
     * 根据球队数量计算可用赛制 - 使用公共函数
     */
    computeMatchFormats(teamCount) {
        return getMatchFormatsWithDisabled(teamCount)
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

    onRegistrationDeadlineChange(e) {
        const { value } = e.detail
        this.setData({ 'formData.registrationDeadline': value })
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

    // ==================== 赛事流程管理 ====================

    addScheduleItem() {
        const schedule = [...this.data.formData.schedule, { time: '', content: '' }]
        this.setData({ 'formData.schedule': schedule })
    },

    deleteScheduleItem(e) {
        const index = e.currentTarget.dataset.index
        const schedule = [...this.data.formData.schedule]
        schedule.splice(index, 1)
        this.setData({ 'formData.schedule': schedule })
    },

    onScheduleTimeInput(e) {
        const index = e.currentTarget.dataset.index
        const value = e.detail.value
        const schedule = [...this.data.formData.schedule]
        schedule[index].time = value
        this.setData({ 'formData.schedule': schedule })
    },

    onScheduleContentInput(e) {
        const index = e.currentTarget.dataset.index
        const value = e.detail.value
        const schedule = [...this.data.formData.schedule]
        schedule[index].content = value
        this.setData({ 'formData.schedule': schedule })
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
        goToCourseSelectCommon()
    },

    setCourtSelection(selectionData) {
        handleCourtSelection(this, selectionData)
    },

    generateCourtDisplayName(selectionData) {
        return generateCourtDisplayName(selectionData)
    },

    clearSelectedCourse() {
        this.setData({
            selectedCourse: null,
            selectedCourt: null,
            courtSelection: null
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

        // 使用公共基础验证
        if (!validateBasicInfo(this.data, { nameField: 'name' })) {
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

            // 过滤有效的赛事流程条目
            const validSchedule = formData.schedule.filter(item => item.time || item.content)

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
                registration_deadline: formData.registrationDeadline || null,
                entry_fee: formData.entryFee ? parseFloat(formData.entryFee) : 0,
                awards: formData.awards || null,
                schedule: validSchedule.length > 0 ? validSchedule : null,
                grouping_permission: formData.groupingPermission,
                is_public_registration: formData.isPublic,
                top_n_ranking: formData.topNRanking ? parseInt(formData.topNRanking) : null
            })

            if (result?.code !== 200) {
                throw new Error(result?.message || '创建失败')
            }

            const gameId = result.data.game_id

            // 清理缓存
            wx.removeStorageSync('selectedTeamsForCrossGame')

            wx.showToast({ title: '创建成功', icon: 'success' })

            // 跳转到赛事页面
            setTimeout(() => {
                wx.switchTab({
                    url: '/pages/events/events'
                })
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
        handleBackCommon()
    }
})
