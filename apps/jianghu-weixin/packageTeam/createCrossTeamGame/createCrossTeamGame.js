import { getNavBarHeight } from '@/utils/systemInfo'

Page({
    data: {
        navBarHeight: 88,
        isReselect: false,
        storageKey: ''
    },

    onLoad(options) {
        const navBarHeight = getNavBarHeight()
        const isReselect = options.reselect === 'true'
        const storageKey = options.storage_key || ''
        this.setData({ navBarHeight, isReselect, storageKey })
    },

    handleTeamsLoaded() {
    },

    handleTeamsConfirm(e) {
        const { selectedTeams } = e.detail
        if (this.data.isReselect) {
            const storageKey = this.data.storageKey || 'selectedTeamsForCrossGame'
            wx.setStorageSync(storageKey, selectedTeams)
            wx.navigateBack()
            return
        }

        wx.setStorageSync('selectedTeamsForCrossGame', selectedTeams)
        wx.navigateTo({
            url: '/packageTeam/commonTeamGameForm/commonTeamGameForm?game_type=cross_teams'
        })
    },

    handleBack() {
        wx.navigateBack({ delta: 1 })
    }
})
