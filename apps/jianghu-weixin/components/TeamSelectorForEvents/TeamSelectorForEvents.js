const app = getApp()

Component({
    properties: {
        teamGameType: {
            type: String,
            value: 'single_team'
        }
    },

    data: {
        loading: true,
        searchKeyword: '',
        allTeams: [],
        filteredTeams: [],
        selectedTeams: [],
        showAliasModal: false,
        currentTeam: null,
        currentAlias: '',
        editingTeamId: null,
        myTeams: []
    },

    lifetimes: {
        attached() {
            this.loadTeams()
        }
    },

    methods: {
        loadTeams() {
            this.loadAllTeams()
        },

        updateTeamsSelectedState(teams, selectedTeams) {
            const selectedIds = selectedTeams.map(team => team.team_id)
            return teams.map(team => ({
                ...team,
                isSelected: selectedIds.includes(team.id)
            }))
        },

        async loadAllTeams() {
            this.setData({ loading: true })

            try {
                const [myTeamsResult, allTeamsResult] = await Promise.all([
                    app.api.team.getMyTeams(),
                    app.api.team.searchTeams({ keyword: '' })
                ])

                const myTeams = myTeamsResult.code === 200 ? (myTeamsResult.teams || []) : []
                const myTeamIds = new Set()
                if (myTeamsResult.code === 200) {
                    myTeams.forEach(team => myTeamIds.add(team.id))
                }
                const myTeamMap = new Map(myTeams.map(team => [team.id, team]))

                let teams = []
                if (allTeamsResult.code === 200) {
                    teams = (allTeamsResult.teams || []).map(team => ({
                        ...team,
                        isMember: myTeamIds.has(team.id),
                        role: myTeamMap.get(team.id)?.role || team.role
                    }))
                    teams.sort((a, b) => (b.isMember ? 1 : 0) - (a.isMember ? 1 : 0))
                }

                const teamsWithState = this.updateTeamsSelectedState(teams, this.data.selectedTeams)

                this.setData({
                    myTeams,
                    allTeams: teams,
                    filteredTeams: teamsWithState,
                    loading: false
                })
                this.triggerEvent('loaded', { teams, myTeams })
            } catch (error) {
                console.error('加载球队列表失败:', error)
                this.setData({ loading: false })
                wx.showToast({
                    title: '加载失败，请重试',
                    icon: 'none'
                })
            }
        },

        onSearchInput(e) {
            const keyword = e.detail.value.trim()
            this.setData({ searchKeyword: keyword })
            this.filterTeams(keyword)
        },

        onSearch() {
            const keyword = this.data.searchKeyword.trim()
            this.filterTeams(keyword)
        },

        filterTeams(keyword) {
            let filtered
            if (!keyword) {
                filtered = this.data.allTeams
            } else {
                filtered = this.data.allTeams.filter(team =>
                    team.team_name.toLowerCase().includes(keyword.toLowerCase())
                )
            }

            const filteredWithState = this.updateTeamsSelectedState(filtered, this.data.selectedTeams)
            this.setData({ filteredTeams: filteredWithState })
        },

        onTeamSelect(e) {
            const teamId = e.currentTarget.dataset.teamId
            const team = this.data.allTeams.find(item => item.id === teamId)
            if (!team) {
                return
            }

            const alreadySelected = this.data.selectedTeams.find(item => item.team_id === teamId)

            if (this.properties.teamGameType === 'single_team') {
                if (alreadySelected && this.data.selectedTeams.length === 1) {
                    return
                }

                const newSelectedTeams = [{ ...team, team_id: team.id }]
                const filteredWithState = this.updateTeamsSelectedState(
                    this.data.filteredTeams.map(item => ({ ...item, isSelected: undefined })),
                    newSelectedTeams
                )

                this.setData({
                    selectedTeams: newSelectedTeams,
                    filteredTeams: filteredWithState
                })
                return
            }

            if (alreadySelected) {
                wx.showToast({ title: '该球队已选择', icon: 'none' })
                return
            }

            this.setData({
                showAliasModal: true,
                currentTeam: team,
                currentAlias: team.team_name
            })
        },

        onAliasInput(e) {
            this.setData({ currentAlias: e.detail.value })
        },

        confirmTeamAlias() {
            const { currentTeam, currentAlias, selectedTeams, editingTeamId } = this.data

            if (!currentAlias.trim()) {
                wx.showToast({ title: '请输入球队简称', icon: 'none' })
                return
            }

            let newSelectedTeams

            if (editingTeamId) {
                newSelectedTeams = selectedTeams.map(team =>
                    team.team_id === editingTeamId
                        ? { ...team, team_alias: currentAlias.trim() }
                        : team
                )
            } else {
                const newTeam = {
                    team_id: currentTeam.id,
                    id: currentTeam.id,
                    team_name: currentTeam.team_name,
                    team_alias: currentAlias.trim(),
                    team_avatar: currentTeam.team_avatar
                }
                newSelectedTeams = [...selectedTeams, newTeam]
            }

            const filteredWithState = this.updateTeamsSelectedState(
                this.data.filteredTeams.map(team => ({ ...team, isSelected: undefined })),
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

        cancelAliasModal() {
            this.setData({
                showAliasModal: false,
                currentTeam: null,
                currentAlias: '',
                editingTeamId: null
            })
        },

        removeTeam(e) {
            const teamId = e.currentTarget.dataset.teamId
            const newSelectedTeams = this.data.selectedTeams.filter(team => team.team_id !== teamId)

            const filteredWithState = this.updateTeamsSelectedState(
                this.data.filteredTeams.map(team => ({ ...team, isSelected: undefined })),
                newSelectedTeams
            )

            this.setData({
                selectedTeams: newSelectedTeams,
                filteredTeams: filteredWithState
            })
        },

        editTeamAlias(e) {
            const teamId = e.currentTarget.dataset.teamId
            const team = this.data.selectedTeams.find(item => item.team_id === teamId)

            if (team) {
                this.setData({
                    showAliasModal: true,
                    currentTeam: {
                        id: team.team_id,
                        team_name: team.team_name,
                        team_avatar: team.team_avatar
                    },
                    currentAlias: team.team_alias,
                    editingTeamId: teamId
                })
            }
        },

        confirmSelection() {
            const { selectedTeams } = this.data
            const minSelected = this.properties.teamGameType === 'cross_teams' ? 2 : 1

            if (selectedTeams.length < minSelected) {
                wx.showToast({ title: `请至少选择${minSelected}个球队`, icon: 'none' })
                return
            }

            this.triggerEvent('confirm', {
                teamGameType: this.properties.teamGameType,
                selectedTeams
            })
        },

        preventBubble() {
        }
    }
})
