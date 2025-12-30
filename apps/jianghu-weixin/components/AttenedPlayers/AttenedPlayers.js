Component({
    properties: {
        players: {
            type: Array,
            value: []
        }
    },

    lifetimes: {
        attached() {
            console.log('🎯 [AttenedPlayers] 组件已挂载, players:', this.properties.players)
        }
    },

    observers: {
        'players': function(players) {
            console.log('🎯 [AttenedPlayers] players 变化:', players)
        }
    },

    methods: {
        onDeletePlayer(e) {
            const index = e.currentTarget.dataset.index
            const player = this.properties.players[index]
            this.triggerEvent('delete', { index, player })
        }
    }
})
