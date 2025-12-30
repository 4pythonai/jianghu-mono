Component({
    properties: {
        players: {
            type: Array,
            value: []
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
