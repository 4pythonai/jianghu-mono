import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'

Component({
    behaviors: [storeBindingsBehavior],

    storeBindings: {
        store: gameStore,
        fields: {
            storePlayers: 'players',
            gameData: 'gameData'
        },
        actions: {
            removePlayer: 'removePlayer'
        }
    },

    data: {
        displayPlayers: []
    },

    lifetimes: {
        attached() {
            this.syncDisplayPlayers()
        }
    },

    observers: {
        'storePlayers': function (players) {
            console.log('🎯 [AttenedPlayers] storePlayers 变化:', players)
            this.syncDisplayPlayers()
        }
    },

    methods: {
        syncDisplayPlayers() {
            const players = gameStore.players || []
            const creatorid = gameStore.creatorid || gameStore.gameData?.creatorid

            const displayPlayers = players.map(p => ({
                show_name: p.show_name || '未知',
                avatar: p.avatar || '/images/default-avatar.png',
                showDelete: String(p.user_id) === String(creatorid) ? 'n' : 'y',
                user_id: p.user_id
            }))

            this.setData({ displayPlayers })
        },

        onDeletePlayer(e) {
            const index = e.currentTarget.dataset.index
            const player = this.data.displayPlayers[index]

            wx.showModal({
                title: '确认删除',
                content: `确定要移除球员 ${player.show_name} 吗？`,
                success: async (res) => {
                    if (res.confirm) {
                        const result = await gameStore.removePlayer(player.user_id)
                        if (result.success) {
                            wx.showToast({ title: result.message, icon: 'success' })
                        } else {
                            wx.showToast({ title: result.message, icon: 'none' })
                        }
                    }
                }
            })
        }
    }
})
