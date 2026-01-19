/**
 * 队内赛/队际赛通用表单页面
 */
import {
    goToCourseSelect as goToCourseSelectCommon,
    generateCourtDisplayName,
    handleBack as handleBackCommon,
    handleCourtSelection,
    loadCachedCourtData,
    validateBasicInfo
} from '@/utils/createGameCommons'
import { MATCH_FORMATS, getMatchFormatsWithDisabled } from '../constants/matchFormats'

const app = getApp()
const DEFAULT_TAG_COLOR = '#FFFFFF'

Page({
    data: {
        gameType: 'single_team',

        // 队内赛
        teamId: null,
        teamName: '',
        selectedTeam: {},
        defaultTag: { name: '', color: DEFAULT_TAG_COLOR },

        // 队际赛
        selectedTeams: [],

        // 球场信息
        selectedCourse: null,
        selectedCourt: null,
        courtSelection: null,

        // 表单数据
        formData: {
            name: '',
            openTime: '',
            registrationDeadline: '',
            entryFee: '',
            matchFormat: 'individual_stroke',
            awards: '',
            schedule: [],
            groupingPermission: 'admin',
            isPublic: 'y',
            topNRanking: ''
        },

        // 分队列表（队内赛）
        gameTags: [],

        // 赛制选项
        matchFormats: MATCH_FORMATS.map(format => ({ ...format, disabled: false })),
        currentFormat: MATCH_FORMATS[0],

        showTopNRanking: false,
        submitting: false
    },

    onLoad(options) {
        const gameType = options.game_type || 'single_team'
        this.setData({ gameType })

        if (gameType === 'cross_teams') {
            this.initCrossTeamGame()
            return
        }

        this.initSingleTeamGame(options)
    },

    onShow() {
        loadCachedCourtData(this, this.setCourtSelection)

        if (this.data.gameType === 'single_team') {
            this.syncSingleTeamFromCache()
        }
    },

    handleBack() {
        handleBackCommon()
    },

    buildMatchFormats(gameType, teamCount = 0) {
        if (gameType === 'cross_teams') {
            return getMatchFormatsWithDisabled(teamCount)
        }
        return MATCH_FORMATS.map(format => ({ ...format, disabled: false }))
    },

    updateTopNRankingVisibility() {
        const showTopNRanking = this.data.gameType === 'cross_teams'
            || this.data.currentFormat.requireGameTag

        if (showTopNRanking !== this.data.showTopNRanking) {
            this.setData({ showTopNRanking })
        }
    },

    initSingleTeamGame(options) {
        const teamId = options.team_id ? parseInt(options.team_id) : null
        const teamName = options.team_name ? decodeURIComponent(options.team_name) : ''

        let cachedTeam = null
        try {
            cachedTeam = wx.getStorageSync('selectedTeamForCreate')
        } catch (error) {
            console.error('读取球队缓存失败:', error)
        }

        let resolvedTeam = null
        if (cachedTeam && (!teamId || cachedTeam.id === teamId)) {
            resolvedTeam = cachedTeam
        } else if (teamId) {
            resolvedTeam = { id: teamId, team_name: teamName }
        }

        if (!resolvedTeam || !resolvedTeam.id) {
            wx.showToast({ title: '参数错误', icon: 'error' })
            setTimeout(() => wx.navigateBack(), 1500)
            return
        }

        const resolvedTeamName = resolvedTeam.team_name || teamName
        const defaultName = resolvedTeamName ? `${resolvedTeamName}队内赛` : '队内赛'
        const matchFormats = this.buildMatchFormats('single_team')
        const currentFormat = matchFormats[0]
        const defaultTag = { name: resolvedTeamName, color: DEFAULT_TAG_COLOR }

        this.setData({
            teamId: resolvedTeam.id,
            teamName: resolvedTeamName,
            selectedTeam: resolvedTeam,
            defaultTag,
            gameTags: [defaultTag],
            matchFormats,
            currentFormat,
            'formData.name': defaultName
        }, () => {
            this.updateTopNRankingVisibility()
        })
    },

    syncSingleTeamFromCache() {
        let cachedTeam = null
        try {
            cachedTeam = wx.getStorageSync('selectedTeamForCreate')
        } catch (error) {
            console.error('读取球队缓存失败:', error)
        }

        if (!cachedTeam || cachedTeam.id === this.data.teamId) {
            return
        }

        const oldTeamName = this.data.teamName
        const currentName = this.data.formData.name
        const oldDefaultName = oldTeamName ? `${oldTeamName}队内赛` : '队内赛'
        const newTeamName = cachedTeam.team_name || ''
        const newDefaultName = newTeamName ? `${newTeamName}队内赛` : '队内赛'
        const defaultTag = { name: newTeamName, color: DEFAULT_TAG_COLOR }

        const nextData = {
            teamId: cachedTeam.id,
            teamName: newTeamName,
            selectedTeam: cachedTeam,
            defaultTag
        }

        if (!currentName || currentName === oldDefaultName || currentName.endsWith('队内赛')) {
            nextData['formData.name'] = newDefaultName
        }

        if (!this.data.currentFormat.requireGameTag) {
            nextData.gameTags = [defaultTag]
        }

        this.setData(nextData, () => {
            this.updateTopNRankingVisibility()
        })

        wx.showToast({ title: '已更换球队', icon: 'success' })
    },

    initCrossTeamGame() {
        try {
            const selectedTeams = wx.getStorageSync('selectedTeamsForCrossGame')
            if (!selectedTeams || selectedTeams.length < 2) {
                wx.showToast({ title: '请先选择球队', icon: 'none' })
                setTimeout(() => wx.navigateBack(), 1500)
                return
            }

            const matchFormats = this.buildMatchFormats('cross_teams', selectedTeams.length)
            const teamNames = selectedTeams.map(team => team.team_alias || team.team_name).join(' vs ')
            const defaultName = `${teamNames} 队际赛`

            this.setData({
                selectedTeams,
                matchFormats,
                currentFormat: matchFormats[0],
                'formData.name': defaultName
            }, () => {
                this.updateTopNRankingVisibility()
            })
        } catch (error) {
            console.error('读取球队缓存失败:', error)
            wx.showToast({ title: '数据加载失败', icon: 'none' })
            setTimeout(() => wx.navigateBack(), 1500)
        }
    },

    // ==================== 表单输入处理 ====================

    onNameInput(e) {
        this.setData({ 'formData.name': e.detail.value })
    },

    onOpenTimeChange(e) {
        const { value } = e.detail
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
        const format = this.data.matchFormats.find(item => item.value === value)

        if (!format) return

        if (format.disabled) {
            wx.showToast({ title: '超过2个球队不能选择比洞赛', icon: 'none' })
            return
        }

        this.setData({
            'formData.matchFormat': value,
            currentFormat: format
        }, () => {
            if (this.data.gameType === 'single_team') {
                this.updateSingleTeamTagsForFormat(format)
            }
            this.updateTopNRankingVisibility()
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

    // ==================== 球队选择 ====================

    goToTeamSelect() {
        wx.navigateTo({
            url: '/packageTeam/createSingleTeamGame/createSingleTeamGame?reselect=true'
        })
    },

    goBackToTeamSelect() {
        wx.navigateBack({ delta: 1 })
    },

    editTeamAlias(e) {
        const teamId = e.currentTarget.dataset.teamId
        const team = this.data.selectedTeams.find(item => item.team_id === teamId)

        if (!team) return

        wx.showModal({
            title: '修改球队简称',
            editable: true,
            placeholderText: team.team_alias || team.team_name,
            content: team.team_alias || '',
            success: (res) => {
                if (res.confirm && res.content !== undefined) {
                    const newAlias = res.content.trim() || team.team_name
                    const selectedTeams = this.data.selectedTeams.map(item =>
                        item.team_id === teamId ? { ...item, team_alias: newAlias } : item
                    )
                    this.setData({ selectedTeams })
                    wx.setStorageSync('selectedTeamsForCrossGame', selectedTeams)
                }
            }
        })
    },

    // ==================== 分队管理（队内赛） ====================

    updateSingleTeamTagsForFormat(format) {
        const { gameTags, defaultTag } = this.data

        if (format.isMatch && gameTags.length > 2) {
            this.setData({
                gameTags: gameTags.slice(0, 2)
            })
            wx.showToast({ title: '比洞赛最多2个分队', icon: 'none' })
        }

        if (!format.isMatch) {
            this.setData({
                gameTags: [{ name: defaultTag.name, color: defaultTag.color }]
            })
            return
        }

        this.setData({
            gameTags: [
                { name: '红队', color: '#D32F2F' },
                { name: '蓝队', color: '#1976D2' }
            ]
        })
    },

    addGameTag() {
        const { gameTags, currentFormat } = this.data

        if (currentFormat.isMatch && gameTags.length >= 2) {
            wx.showToast({ title: '比洞赛最多2个分队', icon: 'none' })
            return
        }

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

                    if (gameTags.some(tag => tag.name === name)) {
                        wx.showToast({ title: '分队名称已存在', icon: 'none' })
                        return
                    }

                    const colors = ['#D32F2F', '#1976D2', '#388E3C', '#F57C00', '#7B1FA2', '#0097A7']
                    const usedColors = gameTags.map(tag => tag.color)
                    const availableColor = colors.find(color => !usedColors.includes(color)) || colors[0]

                    this.setData({
                        gameTags: [...gameTags, { name, color: availableColor }]
                    })
                }
            }
        })
    },

    onTagNameInput(e) {
        const index = e.currentTarget.dataset.index
        const value = e.detail.value
        const gameTags = [...this.data.gameTags]
        gameTags[index].name = value
        this.setData({ gameTags })
    },

    deleteGameTag(e) {
        const index = e.currentTarget.dataset.index
        const gameTags = [...this.data.gameTags]

        if (gameTags.length <= 2 && this.data.currentFormat.requireGameTag) {
            wx.showToast({ title: '至少需要2个分队', icon: 'none' })
            return
        }

        gameTags.splice(index, 1)
        this.setData({ gameTags })
    },

    // ==================== 表单验证与提交 ====================

    validateForm() {
        const { gameTags, currentFormat, selectedTeams, gameType } = this.data

        if (!validateBasicInfo(this.data, { nameField: 'name' })) {
            return false
        }

        if (gameType === 'single_team') {
            if (currentFormat.requireGameTag && gameTags.length < 2) {
                wx.showToast({ title: '团队赛制需要至少2个分队', icon: 'none' })
                return false
            }

            if (currentFormat.isMatch && gameTags.length > 2) {
                wx.showToast({ title: '比洞赛最多2个分队', icon: 'none' })
                return false
            }

            for (const tag of gameTags) {
                if (!tag.name || !tag.name.trim()) {
                    wx.showToast({ title: '分队名称不能为空', icon: 'none' })
                    return false
                }
            }
        }

        if (gameType === 'cross_teams') {
            if (selectedTeams.length < 2) {
                wx.showToast({ title: '至少需要2个参赛球队', icon: 'none' })
                return false
            }

            if (currentFormat.isMatch && selectedTeams.length > 2) {
                wx.showToast({ title: '比洞赛最多支持2个球队', icon: 'none' })
                return false
            }
        }

        return true
    },

    async onSubmit() {
        if (!this.validateForm()) return

        if (this.data.submitting) return
        this.setData({ submitting: true })

        try {
            const { formData, selectedCourse, courtSelection } = this.data

            const validSchedule = formData.schedule.filter(item => item.time || item.content)

            if (this.data.gameType === 'cross_teams') {
                const { selectedTeams } = this.data
                const teamIds = selectedTeams.map(team => team.team_id)
                const teamGameTags = selectedTeams.map(team => team.team_alias || team.team_name)

                const result = await app.api.teamgame.createCrossTeamGame({
                    team_ids: teamIds,
                    teamGameTags: teamGameTags,
                    name: formData.name.trim(),
                    courseid: selectedCourse.courseid,
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

                wx.removeStorageSync('selectedTeamsForCrossGame')

                wx.showToast({ title: '创建成功', icon: 'success' })
                setTimeout(() => {
                    wx.switchTab({
                        url: '/pages/events/events'
                    })
                }, 1500)

                return
            }

            const { teamId, gameTags } = this.data

            const result = await app.api.teamgame.createTeamSingleGame({
                team_id: teamId,
                name: formData.name.trim(),
                courseid: selectedCourse.courseid,
                front_nine_court_id: courtSelection?.frontNineCourtId || null,
                back_nine_court_id: courtSelection?.backNineCourtId || null,
                match_format: formData.matchFormat,
                open_time: formData.openTime,
                registration_deadline: formData.registrationDeadline || null,
                entry_fee: formData.entryFee ? parseFloat(formData.entryFee) : 0,
                awards: formData.awards || null,
                schedule: validSchedule.length > 0 ? validSchedule : null,
                grouping_permission: formData.groupingPermission,
                'is_public_registration': formData.isPublic,
                top_n_ranking: formData.topNRanking ? parseInt(formData.topNRanking) : null
            })

            if (result?.code !== 200) {
                throw new Error(result?.message || '创建失败')
            }

            const gameId = result.data.game_id

            if (gameTags.length > 0) {
                for (const tag of gameTags) {
                    await app.api.teamgame.addGameTag({
                        game_id: gameId,
                        tag_name: tag.name,
                        color: tag.color
                    })
                }
            }

            wx.showToast({ title: '创建成功', icon: 'success' })
            setTimeout(() => {
                wx.switchTab({
                    url: '/pages/events/events'
                })
            }, 1500)
        } catch (error) {
            console.error('创建队赛失败:', error)
            wx.showToast({
                title: error.message || '创建失败，请重试',
                icon: 'none'
            })
        } finally {
            this.setData({ submitting: false })
        }
    }
})
