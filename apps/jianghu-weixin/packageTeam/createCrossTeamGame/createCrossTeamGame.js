import { getNavBarHeight } from '@/utils/systemInfo'

Page({
    data: {
        navBarHeight: 88
    },

    onLoad() {
        const navBarHeight = getNavBarHeight()
        this.setData({ navBarHeight })
    },

    handleTeamsConfirm(e) {
        const { selectedTeams } = e.detail
        wx.setStorageSync('selectedTeamsForCrossGame', selectedTeams)
        wx.navigateTo({
            url: '/packageTeam/createCrossTeamGame/crossTeamGameForm/crossTeamGameForm'
        })
    },

    handleBack() {
        wx.navigateBack({ delta: 1 })
    }
})
