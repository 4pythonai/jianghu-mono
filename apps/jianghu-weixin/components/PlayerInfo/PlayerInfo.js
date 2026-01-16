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
                    show_name: newVal.show_name || '',
                    avatar: newVal.avatar,
                    handicap: newVal.handicap,
                    userId: newVal.user_id
                });
            }
        }
    },

    data: {
        currentTee: '',
        isValidTee: false,
        displayText: 'X',
        display_name: '',
        show_name: '',
        avatar: '',
        handicap: 0,
        userId: 0
    }
})