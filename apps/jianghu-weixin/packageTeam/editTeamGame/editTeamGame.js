/**
 * 编辑队内赛/队际赛表单页面
 */
import {
    goToCourseSelect as goToCourseSelectCommon,
    generateCourtDisplayName,
    handleBack as handleBackCommon,
    handleCourtSelection,
    loadCachedCourtData,
    validateBasicInfo
} from '@/utils/createGameCommons'
import { MATCH_FORMATS, getMatchFormatsWithDisabled, getMatchFormatByValue } from '../constants/matchFormats'

const app = getApp()

Page({
    data: {
        loading: true,
        submitting: false,

        gameId: null,
        gameType: 'single_team',
        gameUuid: '',

        // 队内赛
        teamId: null,
        teamName: '',
        selectedTeam: {},

        // 队际赛
        selectedTeams: [],

        // 球场信息
        selectedCourse: null,
        selectedCourt: null,
        courtSelection: null,
        originalCourseId: null,

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
        originalGameTags: [],
        removedTagIds: [],

        // 赛制选项
        matchFormats: [],
        currentFormat: MATCH_FORMATS[0]
    },

    onLoad(options) {
        const gameId = options.game_id || null
        const gameType = options.game_type || 'single_team'

        if (!gameId) {
            wx.showToast({ title: '参数错误', icon: 'none' })
            setTimeout(() => wx.navigateBack(), 1500)
            return
        }

        this.setData({ gameId, gameType })
        this.loadGameDetail(gameId, gameType)
    },

    onShow() {
        loadCachedCourtData(this, this.setCourtSelection)
        this.syncReselectedTeams()
    },

    handleBack() {
        handleBackCommon()
    },

    syncReselectedTeams() {
        if (this.data.gameType === 'single_team') {
            const selectedTeam = wx.getStorageSync('selectedTeamForEditTeamGame')
            if (selectedTeam && selectedTeam.id) {
                this.applyReselectedSingleTeam(selectedTeam)
                wx.removeStorageSync('selectedTeamForEditTeamGame')
            }
            return
        }

        const selectedTeams = wx.getStorageSync('selectedTeamsForEditCrossGame')
        if (Array.isArray(selectedTeams) && selectedTeams.length > 0) {
            this.applyReselectedCrossTeams(selectedTeams)
            wx.removeStorageSync('selectedTeamsForEditCrossGame')
        }
    },

    applyReselectedSingleTeam(selectedTeam) {
        this.setData({
            teamId: selectedTeam.id,
            teamName: selectedTeam.team_name,
            selectedTeam
        })
    },

    async applyReselectedCrossTeams(selectedTeams) {
        wx.showLoading({ title: '更新球队中...' })
        try {
            const addedTeams = []
            for (const team of selectedTeams) {
                const result = await app.api.teamgame.addGameTag({
                    game_id: this.data.gameId,
                    team_id: team.team_id,
                    team_alias: team.team_alias
                })

                if (!result || result.code !== 200 || !result.data || !result.data.tag_id) {
                    throw new Error(result?.message || '添加球队失败')
                }

                addedTeams.push({
                    ...team,
                    tag_id: result.data.tag_id
                })
            }

            this.setData({ selectedTeams: addedTeams })
            this.updateCrossTeamMatchFormats(addedTeams.length)
            wx.showToast({ title: '球队已更新', icon: 'success' })
        } catch (error) {
            console.error('[editTeamGame] 更新参赛球队失败:', error)
            wx.showToast({ title: error.message || '更新失败', icon: 'none' })
        } finally {
            wx.hideLoading()
        }
    },

    buildMatchFormats(gameType, teamCount) {
        if (gameType === 'cross_teams') {
            return getMatchFormatsWithDisabled(teamCount)
        }
        return MATCH_FORMATS.map(format => ({ ...format, disabled: false }))
    },

    normalizeDateTimeValue(value) {
        if (!value || typeof value !== 'string') return ''
        const parts = value.split(' ')
        if (parts.length < 2) return value
        const datePart = parts[0]
        const timePart = parts[1]
        return `${datePart} ${timePart.slice(0, 5)}`
    },

    parseScheduleData(rawSchedule) {
        if (!rawSchedule) return []
        if (Array.isArray(rawSchedule)) {
            return rawSchedule
        }
        if (typeof rawSchedule === 'string') {
            try {
                const parsed = JSON.parse(rawSchedule)
                return Array.isArray(parsed) ? parsed : []
            } catch (error) {
                console.error('[editTeamGame] 解析赛事流程失败:', error)
                return []
            }
        }
        return []
    },

    async loadGameDetail(gameId, gameType) {
        this.setData({ loading: true })

        try {
            const apiMethod = gameType === 'cross_teams'
                ? app.api.teamgame.getCrossTeamGameDetail
                : app.api.teamgame.getSingleTeamGameDetail

            const res = await apiMethod({ game_id: gameId })

            if (!res || res.code !== 200 || !res.data) {
                throw new Error(res?.message || '加载失败')
            }

            const data = res.data
            const resolvedGameType = data.game_type || gameType
            const schedule = this.parseScheduleData(data.schedule)
            const matchFormat = data.match_format || 'individual_stroke'
            const matchFormats = this.buildMatchFormats(
                resolvedGameType,
                resolvedGameType === 'cross_teams' ? (data.cross_teams || []).length : 0
            )
            const currentFormat = getMatchFormatByValue(matchFormat) || matchFormats[0]

            const entryFeeValue = data.entry_fee === null || data.entry_fee === undefined
                ? ''
                : String(data.entry_fee)

            const formData = {
                name: data.name || '',
                openTime: this.normalizeDateTimeValue(data.open_time),
                registrationDeadline: this.normalizeDateTimeValue(data.registration_deadline),
                entryFee: entryFeeValue,
                matchFormat: matchFormat,
                awards: data.awards || '',
                schedule: schedule,
                groupingPermission: data.grouping_permission || 'admin',
                isPublic: data.is_public_registration || 'y',
                topNRanking: data.top_n_ranking ? String(data.top_n_ranking) : ''
            }

            const selectedCourse = data.courseid
                ? { courseid: data.courseid, name: data.course_name }
                : null

            const nextData = {
                loading: false,
                gameType: resolvedGameType,
                gameUuid: data.uuid || '',
                formData,
                selectedCourse,
                originalCourseId: data.courseid || null,
                matchFormats,
                currentFormat
            }

            if (resolvedGameType === 'single_team') {
                const gameTags = (data.gameTags || []).map(tag => ({
                    id: tag.id,
                    name: tag.tag_name,
                    color: tag.color
                }))
                nextData.teamId = data.team_id || null
                nextData.teamName = data.team_name || ''
                nextData.selectedTeam = {
                    id: data.team_id,
                    team_name: data.team_name,
                    team_avatar: data.team_avatar
                }
                nextData.gameTags = gameTags
                nextData.originalGameTags = gameTags.map(tag => ({ ...tag }))
                nextData.removedTagIds = []
            } else {
                nextData.selectedTeams = (data.cross_teams || []).map(team => ({
                    tag_id: team.tag_id,
                    team_id: team.team_id,
                    team_name: team.team_name,
                    team_alias: team.team_alias,
                    team_avatar: team.team_avatar
                }))
            }

            this.setData(nextData)
        } catch (error) {
            console.error('[editTeamGame] 加载赛事失败:', error)
            wx.showToast({ title: error.message || '加载失败', icon: 'none' })
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
        })

        if (this.data.gameType !== 'single_team') return

        if (format.isMatch && this.data.gameTags.length > 2) {
            const removedTags = this.data.gameTags.slice(2)
            const removedTagIds = removedTags
                .filter(tag => tag.id)
                .map(tag => tag.id)

            this.setData({
                gameTags: this.data.gameTags.slice(0, 2),
                removedTagIds: [...this.data.removedTagIds, ...removedTagIds]
            })
            wx.showToast({ title: '比洞赛最多2个分队', icon: 'none' })
        }

        if (format.requireGameTag && this.data.gameTags.length === 0) {
            this.setData({
                gameTags: [
                    { name: '红队', color: '#D32F2F' },
                    { name: '蓝队', color: '#1976D2' }
                ]
            })
        }
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

    // ==================== 球队选择（编辑模式） ====================

    goToSingleTeamSelect() {
        wx.navigateTo({
            url: '/packageTeam/createSingleTeamGame/createSingleTeamGame?reselect=true&storage_key=selectedTeamForEditTeamGame'
        })
    },

    goToCrossTeamSelect() {
        wx.navigateTo({
            url: '/packageTeam/createCrossTeamGame/createCrossTeamGame?reselect=true&storage_key=selectedTeamsForEditCrossGame'
        })
    },

    // ==================== 队际赛球队管理 ====================

    editTeamAlias(e) {
        const teamId = e.currentTarget.dataset.teamId
        const team = this.data.selectedTeams.find(item => item.team_id === teamId)

        if (!team) return

        wx.showModal({
            title: '修改球队简称',
            editable: true,
            placeholderText: team.team_alias || team.team_name,
            content: team.team_alias || '',
            success: async (res) => {
                if (!res.confirm || res.content === undefined) return

                const newAlias = res.content.trim() || team.team_name
                if (newAlias === team.team_alias) return

                wx.showLoading({ title: '更新中...' })
                try {
                    const result = await app.api.teamgame.updateCrossTeamAlias({
                        game_id: this.data.gameId,
                        team_id: teamId,
                        team_alias: newAlias
                    })
                    wx.hideLoading()

                    if (result?.code === 200) {
                        const selectedTeams = this.data.selectedTeams.map(item =>
                            item.team_id === teamId ? { ...item, team_alias: newAlias } : item
                        )
                        this.setData({ selectedTeams })
                        wx.showToast({ title: '更新成功', icon: 'success' })
                    } else {
                        wx.showToast({ title: result?.message || '更新失败', icon: 'none' })
                    }
                } catch (error) {
                    wx.hideLoading()
                    console.error('[editTeamGame] 更新球队简称失败:', error)
                    wx.showToast({ title: '更新失败，请稍后重试', icon: 'none' })
                }
            }
        })
    },

    updateCrossTeamMatchFormats(teamCount) {
        const matchFormats = this.buildMatchFormats('cross_teams', teamCount)
        const current = matchFormats.find(item => item.value === this.data.formData.matchFormat)

        if (!current || current.disabled) {
            const fallback = matchFormats.find(item => !item.disabled) || matchFormats[0]
            this.setData({
                matchFormats,
                currentFormat: fallback,
                'formData.matchFormat': fallback.value
            })
            if (current && current.disabled) {
                wx.showToast({ title: '超过2个球队不能选择比洞赛', icon: 'none' })
            }
            return
        }

        this.setData({
            matchFormats,
            currentFormat: current
        })
    },

    deleteSingleTeam() {
        wx.showModal({
            title: '删除球队',
            content: '确定删除该球队吗？',
            success: (res) => {
                if (!res.confirm) return
                this.setData({
                    teamId: null,
                    teamName: '',
                    selectedTeam: {}
                })
                this.goToSingleTeamSelect()
            }
        })
    },

    deleteCrossTeam(e) {
        const teamId = e.currentTarget.dataset.teamId
        const tagId = e.currentTarget.dataset.tagId
        const team = this.data.selectedTeams.find(item => item.team_id === teamId)

        if (!team) return

        wx.showModal({
            title: '删除球队',
            content: '确定删除该球队吗？',
            success: async (res) => {
                if (!res.confirm) return
                wx.showLoading({ title: '删除中...' })
                try {
                    const result = await app.api.teamgame.deleteGameTag({
                        tag_id: tagId
                    })
                    wx.hideLoading()

                    if (!result || result.code !== 200) {
                        throw new Error(result?.message || '删除失败')
                    }

                    const selectedTeams = this.data.selectedTeams.filter(item => item.team_id !== teamId)
                    this.setData({ selectedTeams })
                    this.updateCrossTeamMatchFormats(selectedTeams.length)

                    if (selectedTeams.length === 0) {
                        this.goToCrossTeamSelect()
                    }
                } catch (error) {
                    wx.hideLoading()
                    console.error('[editTeamGame] 删除球队失败:', error)
                    wx.showToast({ title: error.message || '删除失败，请稍后重试', icon: 'none' })
                }
            }
        })
    },

    // ==================== 分队管理（队内赛） ====================

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
                if (!res.confirm || !res.content) return
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
        })
    },

    onTagNameInput(e) {
        const { index, value } = e.detail
        const gameTags = [...this.data.gameTags]
        gameTags[index].name = value
        this.setData({ gameTags })
    },

    deleteGameTag(e) {
        const { index } = e.detail
        const gameTags = [...this.data.gameTags]

        if (gameTags.length <= 2 && this.data.currentFormat.requireGameTag) {
            wx.showToast({ title: '至少需要2个分队', icon: 'none' })
            return
        }

        const removed = gameTags.splice(index, 1)[0]
        const removedTagIds = [...this.data.removedTagIds]
        if (removed && removed.id) {
            removedTagIds.push(removed.id)
        }

        this.setData({ gameTags, removedTagIds })
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

    async syncGameTags(gameId) {
        const { gameTags, originalGameTags, removedTagIds } = this.data
        const originalMap = new Map(originalGameTags.map(tag => [String(tag.id), tag]))

        for (const tag of gameTags) {
            const tagName = tag.name?.trim()
            if (!tagName) continue

            if (tag.id) {
                const original = originalMap.get(String(tag.id))
                const changed = !original || original.name !== tag.name || original.color !== tag.color
                if (changed) {
                    await app.api.teamgame.updateTeamGameTag({
                        tag_id: tag.id,
                        tag_name: tagName,
                        color: tag.color
                    })
                }
            } else {
                await app.api.teamgame.addGameTag({
                    game_id: gameId,
                    tag_name: tagName,
                    color: tag.color
                })
            }
        }

        for (const tagId of removedTagIds) {
            await app.api.teamgame.deleteGameTag({
                tag_id: tagId
            })
        }
    },

    async updateCourseIfNeeded() {
        const { selectedCourse, courtSelection, originalCourseId, gameUuid } = this.data

        if (!selectedCourse || !courtSelection || !gameUuid) {
            return
        }

        if (originalCourseId && String(originalCourseId) === String(selectedCourse.courseid)) {
            return
        }

        const result = await app.api.game.updateGameCourseCourt({
            uuid: gameUuid,
            courseid: selectedCourse.courseid,
            frontNineCourtId: courtSelection.frontNineCourtId,
            backNineCourtId: courtSelection.backNineCourtId
        })

        if (!result || result.code !== 200) {
            throw new Error(result?.message || '更新球场失败')
        }
    },

    async onSubmit() {
        if (!this.validateForm()) return
        if (this.data.submitting) return

        this.setData({ submitting: true })

        try {
            const { gameId, formData, selectedCourse, courtSelection } = this.data

            const validSchedule = formData.schedule.filter(item => item.time || item.content)
            const schedulePayload = validSchedule.length > 0 ? JSON.stringify(validSchedule) : ''

            const payload = {
                game_id: gameId,
                name: formData.name.trim(),
                courseid: selectedCourse.courseid,
                match_format: formData.matchFormat,
                open_time: formData.openTime,
                registration_deadline: formData.registrationDeadline || '',
                entry_fee: formData.entryFee ? parseFloat(formData.entryFee) : 0,
                awards: formData.awards || '',
                schedule: schedulePayload,
                grouping_permission: formData.groupingPermission,
                is_public_registration: formData.isPublic,
                top_n_ranking: formData.topNRanking ? parseInt(formData.topNRanking) : null
            }

            if (!payload.top_n_ranking) {
                delete payload.top_n_ranking
            }

            if (this.data.gameType === 'single_team' && this.data.teamId) {
                payload.team_id = this.data.teamId
            }

            if (this.data.gameType === 'cross_teams') {
                payload.team_id = this.data.selectedTeams.map(team => team.team_id).join(',')
            }

            const result = await app.api.teamgame.updateTeamGame(payload)

            if (!result || result.code !== 200) {
                throw new Error(result?.message || '保存失败')
            }

            if (this.data.gameType === 'single_team') {
                await this.syncGameTags(gameId)
            }

            if (courtSelection) {
                await this.updateCourseIfNeeded()
            }

            wx.showToast({ title: '保存成功', icon: 'success' })
            wx.setStorageSync('teamGameDetailNeedsRefresh', true)
            setTimeout(() => wx.navigateBack(), 1200)
        } catch (error) {
            console.error('[editTeamGame] 保存失败:', error)
            wx.showToast({ title: error.message || '保存失败，请重试', icon: 'none' })
        } finally {
            this.setData({ submitting: false })
        }
    }
})
