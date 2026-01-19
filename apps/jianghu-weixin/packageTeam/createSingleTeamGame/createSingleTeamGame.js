Page({
    data: {
        isReselect: false,
        pendingTeamId: null
    },

    onLoad(options) {
        const teamId = options.team_id ? parseInt(options.team_id) : null
        const isReselect = options.reselect === 'true'

        this.setData({
            isReselect,
            pendingTeamId: teamId
        })
    },

    handleTeamsLoaded(e) {
        const myTeams = e.detail.myTeams || []

        if (this.data.isReselect) {
            return
        }

        if (this.data.pendingTeamId) {
            const matchedTeam = myTeams.find(team => team.id === this.data.pendingTeamId)
            if (matchedTeam) {
                this.handleTeamsConfirm({ detail: { selectedTeams: [matchedTeam] } })
                return
            }
        }

        if (myTeams.length === 1) {
            this.handleTeamsConfirm({ detail: { selectedTeams: myTeams } })
        }
    },

    handleTeamsConfirm(e) {
        const { selectedTeams } = e.detail
        const team = selectedTeams[0]

        wx.setStorageSync('selectedTeamForCreate', team)

        if (this.data.isReselect) {
            wx.navigateBack()
            return
        }

        wx.navigateTo({
            url: `/packageTeam/commonTeamGameForm/commonTeamGameForm?game_type=single_team&team_id=${team.id}&team_name=${encodeURIComponent(team.team_name)}`
        })
    }
})
