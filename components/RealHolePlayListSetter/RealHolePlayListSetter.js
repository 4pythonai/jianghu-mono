// RealHolePlayListSetter
import { gameStore } from '../../stores/gameStore';

Component({
    options: {
        styleIsolation: 'apply-shared',
    },

    data: {
        holeList: [],
        holePlayList: [],
        selectedHindexArray: [], // 只存储选中的hindex数组
        selectedMap: {}, // 选中状态映射，用于WXML渲染
        dragStartIndex: null,
        dragCurrentIndex: null,
        holeRects: []
    },

    lifetimes: {
        attached() {
            const { holeList, holePlayList, rangeHolePlayList } = gameStore.getState();
            console.log(' ⭕️ rangeHolePlayList:', rangeHolePlayList);
            // 初始化时全选，把所有hindex都加入选中数组
            const selectedHindexArray = holePlayList ? holePlayList.map(hole => hole.hindex) : [];
            // 构建初始selectedMap
            const selectedMap = {};
            for (const hindex of selectedHindexArray) {
                selectedMap[hindex] = true;
            }
            this.setData({
                holeList,
                holePlayList,
                selectedHindexArray,
                selectedMap
            });
        },
        ready() {
            // 获取所有球洞的位置信息，用于拖选计算
            this.getHoleRects();
        },
    },

    methods: {
        getHoleRects() {
            wx.createSelectorQuery().in(this)
                .selectAll('.hole-item')
                .boundingClientRect(rects => {
                    if (rects && rects.length > 0) {
                        this.setData({ holeRects: rects });
                    }
                }).exec();
        },

        onHoleTouchStart(e) {
            const index = Number(e.currentTarget.dataset.index);
            this.setData({
                dragStartIndex: index,
                dragCurrentIndex: index
            });
            this.updateSelectedRange(index, index);
            console.log(' ⭕️ gameStore:', gameStore);
        },

        onHoleTouchMove(e) {
            const touch = e.touches[0];
            const { holeRects } = this.data;
            let moveIndex = this.data.dragCurrentIndex;

            // 遍历所有球洞，找到手指当前滑过的球洞index
            for (let i = 0; i < holeRects.length; i++) {
                const rect = holeRects[i];
                // 简化检测逻辑：只检查X坐标范围，Y坐标暂时忽略
                if (
                    touch.pageX >= rect.left &&
                    touch.pageX <= rect.right
                ) {
                    moveIndex = i;
                    break;
                }
            }

            this.setData({
                dragCurrentIndex: moveIndex
            });
            this.updateSelectedRange(this.data.dragStartIndex, moveIndex);
        },


        updateSelectedRange(start, end) {
            const min = Math.min(start, end);
            const max = Math.max(start, end);

            // 获取区间内的球洞hindex
            const selectedHindexArray = [];
            for (let i = min; i <= max; i++) {
                if (this.data.holePlayList[i]) {
                    selectedHindexArray.push(this.data.holePlayList[i].hindex);
                }
            }
            // 构建selectedMap
            const selectedMap = {};
            for (const hindex of selectedHindexArray) {
                selectedMap[hindex] = true;
            }
            this.setData({
                selectedHindexArray,
                selectedMap
            });
        },

        onHideModal() {
            this.triggerEvent('cancel');
        },

        onSelectHole(e) {
            const hindex = Number(e.currentTarget.dataset.hindex);
            const sortedList = [...this.data.holeList].sort((a, b) => (a.hindex || 0) - (b.hindex || 0));
            const startIdx = sortedList.findIndex(hole => Number(hole.hindex) === hindex);
            const newHolePlayList = sortedList.slice(startIdx).concat(sortedList.slice(0, startIdx));
            this.setData({
                holePlayList: newHolePlayList
            });
        },

        onConfirmHoleOrder() {
            // 只有点击确定时，才把结果传给父组件和gameStore
            gameStore.holePlayList = this.data.holePlayList;

            const tmpArray = this.data.holePlayList.filter(hole =>
                this.data.selectedHindexArray.includes(hole.hindex)
            );
            console.log(' ⭕️⭕️⭕️⭕️⭕️  onConfirmHoleOrder - tmpArray: ', tmpArray);
            gameStore.rangeHolePlayList = tmpArray;

            this.triggerEvent('cancel');
        },

        onCancel() {
            this.triggerEvent('cancel');
        },
    }
}); 