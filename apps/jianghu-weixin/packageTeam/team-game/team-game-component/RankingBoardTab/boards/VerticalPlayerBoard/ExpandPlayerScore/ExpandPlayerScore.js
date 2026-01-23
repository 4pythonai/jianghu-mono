/**
 * 展开球员成绩详情组件
 */
Component({
    properties: {
        /** 球洞列表 */
        holeList: {
            type: Array,
            value: []
        },
        /** 该球员的成绩数据 { holes: [...], outDiffText, inDiffText, ... } */
        playerScores: {
            type: Object,
            value: {
                holes: [],
                outDiff: 0,
                outDiffText: '',
                inDiff: 0,
                inDiffText: ''
            }
        }
    }
});
