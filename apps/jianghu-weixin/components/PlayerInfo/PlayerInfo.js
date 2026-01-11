Component({
    properties: {
        // 球员序号
        index: {
            type: Number,
            value: 0
        },
        // 球员对象
        player: {
            type: Object,
            value: {},
            observer: function (newVal) {
                if (!newVal) return;

                // 处理 T台颜色
                const validTees = ['black', 'blue', 'white', 'gold', 'red'];
                const normalizedTee = newVal.tee ? newVal.tee.toLowerCase() : '';
                const isValid = validTees.includes(normalizedTee);

                this.setData({
                    currentTee: normalizedTee,
                    isValidTee: isValid,
                    displayText: isValid ? 'T' : 'X',
                    nickname: newVal.wx_nickname,
                    avatar: newVal.avatar,
                    handicap: newVal.handicap,
                    userId: newVal.userid
                });
            }
        }
    },

    data: {
        currentTee: '',
        isValidTee: false,
        displayText: 'X',
        nickname: '',
        avatar: '',
        handicap: 0,
        userId: 0
    }
})