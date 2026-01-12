/**
 * 创建队际赛入口页面
 * 支持多选球队，选择时设置球队简称
 */
const app = getApp()
import { getNavBarHeight } from '@/utils/systemInfo'

Page({
    data: {
        navBarHeight: 88,       // 导航栏高度
        loading: true,
        searchKeyword: '',
        allTeams: [],           // 所有可选的球队列表
        filteredTeams: [],      // 搜索过滤后的球队列表（含isSelected标记）
        selectedTeams: [],      // 已选择的球队 [{team_id, team_name, team_alias, team_avatar}]

        // 简称设置弹窗
        showAliasModal: false,
        currentTeam: null,      // 当前设置简称的球队
        currentAlias: '',       // 当前输入的简称
        editingTeamId: null     // 编辑模式下的球队ID
    },

    async onLoad() {
        const navBarHeight = getNavBarHeight()
        this.setData({ navBarHeight })
        await this.loadAllTeams()
    },

    /**
     * 更新球队列表的选中状态
     */
    updateTeamsSelectedState(teams, selectedTeams) {
        const selectedIds = selectedTeams.map(t => t.team_id)
        return teams.map(t => ({
            ...t,
            isSelected: selectedIds.includes(t.id)
        }))
    },

    /**
     * 加载所有球队（包括用户所属的球队和可搜索的球队）
     */
    async loadAllTeams() {
        this.setData({ loading: true })

        try {
            // 并行加载：用户所属球队 + 所有球队
            const [myTeamsResult, allTeamsResult] = await Promise.all([
                app.api.team.getMyTeams(),
                app.api.team.searchTeams({ keyword: '' })
            ])

            // 获取用户所属球队的 ID 集合
            const myTeamIds = new Set()
            if (myTeamsResult.code === 200) {
                (myTeamsResult.teams || []).forEach(t => myTeamIds.add(t.id))
            }

            // 处理所有球队，标记用户所属的球队
            let teams = []
            if (allTeamsResult.code === 200) {
                teams = (allTeamsResult.teams || []).map(t => ({
                    ...t,
                    isMember: myTeamIds.has(t.id)
                }))
                // 排序：用户所属球队优先
                teams.sort((a, b) => (b.isMember ? 1 : 0) - (a.isMember ? 1 : 0))
            }

            const teamsWithState = this.updateTeamsSelectedState(teams, this.data.selectedTeams)

            this.setData({
                allTeams: teams,
                filteredTeams: teamsWithState,
                loading: false
            })
        } catch (error) {
            console.error('加载球队列表失败:', error)
            this.setData({ loading: false })
            wx.showToast({
                title: '加载失败，请重试',
                icon: 'none'
            })
        }
    },

    /**
     * 搜索输入
     */
    onSearchInput(e) {
        const keyword = e.detail.value.trim()
        this.setData({ searchKeyword: keyword })
        this.filterTeams(keyword)
    },

    /**
     * 搜索球队
     */
    onSearch() {
        const keyword = this.data.searchKeyword.trim()
        // 直接使用本地过滤，因为 allTeams 已包含所有球队
        this.filterTeams(keyword)
    },

    /**
     * 过滤球队
     */
    filterTeams(keyword) {
        let filtered
        if (!keyword) {
            filtered = this.data.allTeams
        } else {
            filtered = this.data.allTeams.filter(t =>
                t.team_name.toLowerCase().includes(keyword.toLowerCase())
            )
        }
        const filteredWithState = this.updateTeamsSelectedState(filtered, this.data.selectedTeams)
        this.setData({ filteredTeams: filteredWithState })
    },

    /**
     * 选择球队 - 弹出简称确认框
     */
    onTeamSelect(e) {
        const teamId = e.currentTarget.dataset.teamId

        // 检查是否已选择
        if (this.data.selectedTeams.find(t => t.team_id === teamId)) {
            wx.showToast({ title: '该球队已选择', icon: 'none' })
            return
        }

        const team = this.data.allTeams.find(t => t.id === teamId)
        if (team) {
            this.setData({
                showAliasModal: true,
                currentTeam: team,
                currentAlias: team.team_name // 默认简称为全称
            })
        }
    },

    /**
     * 简称输入
     */
    onAliasInput(e) {
        this.setData({ currentAlias: e.detail.value })
    },

    /**
     * 确认添加球队
     */
    confirmTeamAlias() {
        const { currentTeam, currentAlias, selectedTeams, editingTeamId } = this.data

        if (!currentAlias.trim()) {
            wx.showToast({ title: '请输入球队简称', icon: 'none' })
            return
        }

        let newSelectedTeams

        // 编辑已选球队的简称
        if (editingTeamId) {
            newSelectedTeams = selectedTeams.map(t =>
                t.team_id === editingTeamId
                    ? { ...t, team_alias: currentAlias.trim() }
                    : t
            )
        } else {
            // 添加新球队
            const newTeam = {
                team_id: currentTeam.id,
                team_name: currentTeam.team_name,
                team_alias: currentAlias.trim(),
                team_avatar: currentTeam.team_avatar
            }
            newSelectedTeams = [...selectedTeams, newTeam]
        }

        // 更新选中状态
        const filteredWithState = this.updateTeamsSelectedState(
            this.data.filteredTeams.map(t => ({ ...t, isSelected: undefined })),
            newSelectedTeams
        )

        this.setData({
            selectedTeams: newSelectedTeams,
            filteredTeams: filteredWithState,
            showAliasModal: false,
            currentTeam: null,
            currentAlias: '',
            editingTeamId: null
        })

        wx.showToast({ title: editingTeamId ? '已修改' : '已添加', icon: 'success' })
    },

    /**
     * 取消简称设置
     */
    cancelAliasModal() {
        this.setData({
            showAliasModal: false,
            currentTeam: null,
            currentAlias: '',
            editingTeamId: null
        })
    },

    /**
     * 移除已选球队
     */
    removeTeam(e) {
        const teamId = e.currentTarget.dataset.teamId
        const newSelectedTeams = this.data.selectedTeams.filter(t => t.team_id !== teamId)

        // 更新选中状态
        const filteredWithState = this.updateTeamsSelectedState(
            this.data.filteredTeams.map(t => ({ ...t, isSelected: undefined })),
            newSelectedTeams
        )

        this.setData({
            selectedTeams: newSelectedTeams,
            filteredTeams: filteredWithState
        })
    },

    /**
     * 编辑球队简称
     */
    editTeamAlias(e) {
        const teamId = e.currentTarget.dataset.teamId
        const team = this.data.selectedTeams.find(t => t.team_id === teamId)

        if (team) {
            this.setData({
                showAliasModal: true,
                currentTeam: { id: team.team_id, team_name: team.team_name, team_avatar: team.team_avatar },
                currentAlias: team.team_alias,
                editingTeamId: teamId
            })
        }
    },

    /**
     * 进入表单页
     */
    goToForm() {
        const { selectedTeams } = this.data

        if (selectedTeams.length < 2) {
            wx.showToast({ title: '请至少选择2个球队', icon: 'none' })
            return
        }

        // 缓存选中的球队信息
        wx.setStorageSync('selectedTeamsForCrossGame', selectedTeams)

        wx.navigateTo({
            url: '/pages/createCrossTeamGame/crossTeamGameForm/crossTeamGameForm'
        })
    },

    /**
     * 返回上一页
     */
    handleBack() {
        wx.navigateBack({ delta: 1 })
    },

    /**
     * 阻止弹窗冒泡
     */
    preventBubble() {
        // 空函数，用于阻止事件冒泡
    }
})
