import { getNavBarHeight } from '@/utils/systemInfo'

Page({
    data: {
        navBarHeight: 88
    },

    onLoad() {
        const navBarHeight = getNavBarHeight()
        this.setData({ navBarHeight })
    },

    handleTeamsLoaded() {
    },

    handleTeamsConfirm(e) {
        const { selectedTeams } = e.detail
        wx.setStorageSync('selectedTeamsForCrossGame', selectedTeams)
        wx.navigateTo({
            url: '/packageTeam/commonTeamGameForm/commonTeamGameForm?game_type=cross_teams'
        })
    },

    handleBack() {
        wx.navigateBack({ delta: 1 })
    }
})
