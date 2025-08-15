Component({
    properties: {
        // 球员头像URL
        avatar: {
            type: String,
            value: ''
        },
        // 球员序号
        index: {
            type: Number,
            value: 0
        },
        nickname: {
            type: String,
            value: 'AAA'
        },
        // 球员T台颜色
        tee: {
            type: String,
            value: '',
            observer: function (newVal) {
                const validTees = ['black', 'blue', 'white', 'gold', 'red'];
                const normalizedTee = newVal ? newVal.toLowerCase() : '';
                const isValid = validTees.includes(normalizedTee);

                this.setData({
                    currentTee: normalizedTee,
                    isValidTee: isValid,
                    displayText: isValid ? 'T' : 'X'
                });

            }
        }
    },

    data: {
        currentTee: '',
        isValidTee: false,
        displayText: 'X'
    }
})