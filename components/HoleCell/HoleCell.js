import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../stores/gameStore'

Component({
    properties: {
        playerIndex: Number,
        holeIndex: Number,
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
        court_key: {
            type: String,
            value: ''
        },
        unique_key: {
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
        },
        gambleflag: {
            type: String,
            value: ''
        }
    },

    data: {
        formattedPutt: '',
        formattedDiff: '',
        formattedScore: '',
        scoreClass: '',
        formattedGambleflag: ''
    },

    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameData', 'players'],
                actions: ['updateCellScore'],
            });

            const { putt = 0, diff = 0, score = 0, gambleflag = '' } = this.properties;
            this.setData({
                formattedPutt: putt !== 0 ? putt.toString() : '0',
                formattedDiff: diff !== 0 ? (diff > 0 ? '+' : '') + diff.toString() : '0',
                formattedScore: score !== 0 ? score.toString() : '0',
                formattedGambleflag: gambleflag !== '' ? gambleflag : ''
            });

            this.updateScoreClass(diff);

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
                }.bind(this),
                'gambleflag': function (gambleflag) {
                    if (gambleflag !== undefined && gambleflag !== null) {
                        this.setData({
                            formattedGambleflag: gambleflag
                        });
                    }
                }.bind(this)
            };
        },
        detached() {
            this.storeBindings.destroyStoreBindings();
        }
    },

    methods: {
        updateScoreClass: function (diff) {
            let scoreClass = '';

            if (diff <= -2) {
                scoreClass = 'under-par-2';
            }

            if (diff === -1) {
                scoreClass = 'under-par-1';
            }

            if (diff === 0) {
                scoreClass = 'score-par';
            }

            if (diff === 1) {
                scoreClass = 'over-par-1';
            }

            if (diff === 2) {
                scoreClass = 'over-par-2';
            }

            if (diff >= 3) {
                scoreClass = 'over-par-3';
            }

            this.setData({
                scoreClass: scoreClass
            });
        },

        recordScore: function (e) {
            this.triggerEvent('cellclick', {
                holeIndex: this.properties.holeIndex,
                playerIndex: this.properties.playerIndex
            });
        }
    }
})