/**
 * 队内赛表单页面
 * 创建队内赛的主表单
 */
import {
    goToCourseSelect as goToCourseSelectCommon,
    generateCourtDisplayName,
    handleBack as handleBackCommon,
    handleCourtSelection,
    loadCachedCourtData,
    validateBasicInfo
} from '@/utils/createGameCommons'
import { MATCH_FORMATS, getMatchFormatByValue } from '@/constants/matchFormats'

const app = getApp()

Page({
    data: {
        // 球队信息
        teamId: null,
        teamName: '',
        selectedTeam: null, // 完整的球队对象(含logo、角色等)

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

        // 分队列表
        subteams: [],

        // 赛制选项
        matchFormats: MATCH_FORMATS,

        // 当前赛制配置
        currentFormat: MATCH_FORMATS[0],

        // 提交状态
        submitting: false
    },

    onLoad(options) {
        const teamId = options.team_id ? parseInt(options.team_id) : null
        const teamName = options.team_name ? decodeURIComponent(options.team_name) : ''

        if (!teamId) {
            wx.showToast({ title: '参数错误', icon: 'error' })
            setTimeout(() => wx.navigateBack(), 1500)
            return
        }

        // 尝试从缓存获取完整的球队信息
        let selectedTeam = null
        try {
            const cachedTeam = wx.getStorageSync('selectedTeamForCreate')
            if (cachedTeam && cachedTeam.id === teamId) {
                selectedTeam = cachedTeam
            }
        } catch (e) {
            console.error('读取球队缓存失败:', e)
        }

        // 设置默认比赛名称
        const defaultName = teamName ? `${teamName}队内赛` : '队内赛'

        this.setData({
            teamId,
            teamName,
            selectedTeam: selectedTeam || { id: teamId, team_name: teamName },
            'formData.name': defaultName
        })
    },

    onShow() {
        // 检查是否有重新选择的球队
        try {
            const cachedTeam = wx.getStorageSync('selectedTeamForCreate')
            if (cachedTeam && cachedTeam.id !== this.data.teamId) {
                // 球队发生变化,更新数据
                this.setData({
                    teamId: cachedTeam.id,
                    teamName: cachedTeam.team_name,
                    selectedTeam: cachedTeam
                })
                // 更新默认比赛名称(如果用户没有修改过)
                const currentName = this.data.formData.name
                const oldDefaultName = `${this.data.teamName}队内赛`
                if (!currentName || currentName === oldDefaultName || currentName.endsWith('队内赛')) {
                    this.setData({ 'formData.name': `${cachedTeam.team_name}队内赛` })
                }
                wx.showToast({ title: '已更换球队', icon: 'success' })
            }
        } catch (error) {
            console.error('读取球队缓存失败:', error)
        }

        // 使用公共函数读取球场缓存数据
        loadCachedCourtData(this, this.setCourtSelection)
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
        const format = MATCH_FORMATS.find(f => f.value === value)

        this.setData({
            'formData.matchFormat': value,
            currentFormat: format
        })

        // 如果是比洞赛且分队数超过2个，只保留前2个
        if (format.isMatch && this.data.subteams.length > 2) {
            this.setData({
                subteams: this.data.subteams.slice(0, 2)
            })
            wx.showToast({ title: '比洞赛最多2个分队', icon: 'none' })
        }

        // 如果需要分队但当前没有，添加默认分队
        if (format.requireSubteam && this.data.subteams.length === 0) {
            this.setData({
                subteams: [
                    { name: '红队', color: '#D32F2F' },
                    { name: '蓝队', color: '#1976D2' }
                ]
            })
        }
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

    // ==================== 球队选择 ====================

    goToTeamSelect() {
        wx.navigateTo({
            url: '/pages/createTeamGame/createTeamGame?reselect=true'
        })
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

    // ==================== 分队管理 ====================

    onSubteamsChange(e) {
        this.setData({ subteams: e.detail.subteams })
    },

    addSubteam() {
        const { subteams, currentFormat } = this.data

        // 比洞赛限制2个分队
        if (currentFormat.isMatch && subteams.length >= 2) {
            wx.showToast({ title: '比洞赛最多2个分队', icon: 'none' })
            return
        }

        // 弹窗让用户输入分队名称
        wx.showModal({
            title: '添加分队',
            editable: true,
            placeholderText: '请输入分队名称',
            success: (res) => {
                if (res.confirm && res.content) {
                    const name = res.content.trim()
                    if (!name) {
                        wx.showToast({ title: '请输入分队名称', icon: 'none' })
                        return
                    }

                    // 检查名称是否重复
                    if (subteams.some(s => s.name === name)) {
                        wx.showToast({ title: '分队名称已存在', icon: 'none' })
                        return
                    }

                    // 默认颜色池
                    const colors = ['#D32F2F', '#1976D2', '#388E3C', '#F57C00', '#7B1FA2', '#0097A7']
                    const usedColors = subteams.map(s => s.color)
                    const availableColor = colors.find(c => !usedColors.includes(c)) || colors[0]

                    const newSubteam = {
                        name: name,
                        color: availableColor
                    }

                    this.setData({
                        subteams: [...subteams, newSubteam]
                    })
                }
            }
        })
    },

    onSubteamNameInput(e) {
        const index = e.currentTarget.dataset.index
        const value = e.detail.value
        const subteams = [...this.data.subteams]
        subteams[index].name = value
        this.setData({ subteams })
    },

    deleteSubteam(e) {
        const index = e.currentTarget.dataset.index
        const subteams = [...this.data.subteams]

        if (subteams.length <= 2 && this.data.currentFormat.requireSubteam) {
            wx.showToast({ title: '至少需要2个分队', icon: 'none' })
            return
        }

        subteams.splice(index, 1)
        this.setData({ subteams })
    },

    // ==================== 表单验证与提交 ====================

    validateForm() {
        const { formData, selectedCourse, subteams, currentFormat } = this.data

        // 使用公共基础验证
        if (!validateBasicInfo(this.data, { nameField: 'name' })) {
            return false
        }

        // 团队赛制需要至少2个分队
        if (currentFormat.requireSubteam && subteams.length < 2) {
            wx.showToast({ title: '团队赛制需要至少2个分队', icon: 'none' })
            return false
        }

        return true
    },

    async onSubmit() {
        if (!this.validateForm()) return

        if (this.data.submitting) return
        this.setData({ submitting: true })

        try {
            const { teamId, formData, selectedCourse, subteams, courtSelection } = this.data

            // 调用创建队内赛 API
            const result = await app.api.teamgame.createTeamGame({
                team_id: teamId,
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
                'is_public_registration': formData.isPublic,
                top_n_ranking: formData.topNRanking ? parseInt(formData.topNRanking) : null
            })

            if (result?.code !== 200) {
                throw new Error(result?.message || '创建失败')
            }

            const gameId = result.data.game_id

            // 如果有分队，创建分队
            if (subteams.length > 0) {
                for (const subteam of subteams) {
                    await app.api.teamgame.addSubteam({
                        game_id: gameId,
                        subteam_name: subteam.name,
                        color: subteam.color
                    })
                }
            }

            // 开启报名
            await app.api.teamgame.startRegistration({ game_id: gameId })

            wx.showToast({ title: '创建成功', icon: 'success' })

            // 跳转到赛事详情页（暂时返回上一页）
            setTimeout(() => {
                wx.navigateBack({ delta: 2 })
            }, 1500)

        } catch (error) {
            console.error('创建队内赛失败:', error)
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

