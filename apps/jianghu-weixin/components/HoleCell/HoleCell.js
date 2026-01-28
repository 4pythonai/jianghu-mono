import { getScoreClass } from '@/utils/gameUtils'

Component({
    properties: {
        playerIndex: Number,
        holeIndex: Number,
        holeList: Array,
        players: Array,
        displayScores: Array
    },

    data: {
        formattedputts: '',
        formattedDiff: '',
        formattedScore: '',
        scoreClass: '',
        colorTag: '',
        unique_key: ''
    },

    observers: {
        'playerIndex, holeIndex, holeList, players, displayScores': function (playerIndex, holeIndex, holeList, players, displayScores) {
            console.log('HoleCell OBSERVER:', {
                playerIndex,
                playerIndexType: typeof playerIndex,
                holeIndex,
                holeIndexType: typeof holeIndex,
                holeListLength: holeList?.length,
                playersLength: players?.length,
                displayScoresLength: displayScores?.length,
            });
            // 数据校验
            if (!holeList || !players || !displayScores ||
                playerIndex < 0 || holeIndex < 0 ||
                playerIndex >= displayScores.length || holeIndex >= holeList.length) {
                console.error('HoleCell VALIDATION FAILED:', {
                    playerIndex,
                    holeIndex,
                    displayScoresLength: displayScores?.length,
                    holeListLength: holeList?.length,
                });
                return;
            }

            const hole = holeList[holeIndex];
            const scoreData = displayScores[playerIndex]?.[holeIndex] || {};
            const { score, putts, colorTag } = scoreData;
            const par = hole?.par || 0;
            const unique_key = hole?.unique_key || '';

            // 计算所有显示值
            let formattedScore = '';
            let formattedputts = '';
            let formattedDiff = '';
            let scoreClass = '';

            if (score !== undefined && score !== null && score !== 0 && score !== '') {
                formattedScore = String(score);
                formattedputts = (putts !== undefined && putts !== null) ? String(putts) : '0';

                // 计算 diff
                const diff = (score > 0 && par > 0) ? score - par : 0;
                if (diff !== 0) {
                    formattedDiff = (diff > 0 ? '+' : '') + diff;
                } else {
                    formattedDiff = '0';
                }
                scoreClass = getScoreClass(diff);
            }

            // 单次 setData 更新所有数据
            this.setData({
                colorTag: colorTag || '',
                unique_key,
                formattedScore,
                formattedputts,
                formattedDiff,
                scoreClass
            });
        }
    },

    methods: {
        recordScore: function (e) {
            this.triggerEvent('cellclick', {
                holeIndex: this.properties.holeIndex,
                playerIndex: this.properties.playerIndex,
                unique_key: String(this.data.unique_key || '')
            });
        }
    }
})