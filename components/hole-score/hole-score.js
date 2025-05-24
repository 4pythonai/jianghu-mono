
Component({
    properties: {
        userid: {
            type: String,
            value: ''
        },
        par: {
            type: Number,
            value: 0
        },
        holeid: {
            type: String,
            value: ''
        },
        putt: {
            type: Number,
            value: 0
        },
        diff: {
            type: Number,
            value: 0
        },
        score: {
            type: Number,
            value: 0
        }
    },

    data: {
        formattedPutt: '',
        formattedDiff: '',
        formattedScore: '',
        scoreClass: ''
    },

    lifetimes: {
        attached() {
            // 初始化数据
            const { putt = 0, diff = 0, score = 0 } = this.properties;
            this.setData({
                formattedPutt: putt !== 0 ? putt.toString() : '0',
                formattedDiff: diff !== 0 ? (diff > 0 ? '+' : '') + diff.toString() : '0',
                formattedScore: score !== 0 ? score.toString() : '0'
            });

            // 单独调用更新样式类的方法
            this.updateScoreClass(diff);


            // 预绑定observer方法
            this.observers = {
                'putt': function (putt) {
                    if (putt !== undefined && putt !== null) {
                        this.setData({
                            formattedPutt: putt.toString()
                        });
                    }
                }.bind(this),
                'diff': function (diff) {
                    if (diff !== undefined && diff !== null) {
                        const prefix = diff > 0 ? '+' : '';
                        this.setData({
                            formattedDiff: prefix + diff.toString()
                        });
                        if (typeof this.updateScoreClass === 'function') {
                            this.updateScoreClass(diff);
                        }
                    }
                }.bind(this),
                'score, par': function (score, par) {
                    if (score !== undefined && score !== null && par !== undefined && par !== null) {
                        this.setData({
                            formattedScore: score.toString()
                        });

                        // 计算diff如果没有提供
                        if (this.properties.diff === 0 && score > 0 && par > 0) {
                            const calculatedDiff = score - par;
                            const prefix = calculatedDiff > 0 ? '+' : '';
                            this.setData({
                                formattedDiff: prefix + calculatedDiff.toString()
                            });
                            if (typeof this.updateScoreClass === 'function') {
                                this.updateScoreClass(calculatedDiff);
                            }
                        }
                    }
                }.bind(this)
            };
        }
    },

    methods: {
        updateScoreClass: function (diff) {
            let scoreClass = '';
            if (diff < 0) {
                scoreClass = 'score-under-par';
            } else if (diff > 0) {
                scoreClass = 'score-over-par';
            } else if (diff === 0) {
                scoreClass = 'score-par';
            }
            this.setData({
                scoreClass: scoreClass
            });
        }
    }
})