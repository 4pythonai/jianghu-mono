Component({
    properties: {
        gameName: String,
        course: String,
        players: Array,
        watchersNumber: Number,
        gameStart: String,
        completedHoles: Number,
        holes: Number,
        starType: {
            type: String,
            value: 'gray' // gray或yellow
        },
        have_gamble: {
            type: Boolean,
            value: false
        },
        gameId: {
            type: String,
            value: ''
        }
    },
    data: {
        avatarUrls: []
    },
    observers: {
        'players': function (players) {
            this.setData({
                avatarUrls: players.map(p => p.avatar)
            });
        }
    },
    methods: {
        onMatchItemTap() {
            wx.navigateTo({
                url: `/pages/gameDetail/gameDetail?gameId=${this.properties.gameId}`
            });
        }
    }
})