// RealHolePlayListSetter
import { gameStore } from '../../stores/gameStore';

Component({
    options: {
        styleIsolation: 'apply-shared',
    },

    properties: {
        // 新增属性：起始洞索引和结束洞索引
        startHoleindex: {
            type: Number,
            value: null
        },
        endHoleindex: {
            type: Number,
            value: null
        }
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

            // 根据传入的startHoleindex和endHoleindex设置初始选中范围
            let selectedHindexArray = [];

            if (this.properties.startHoleindex !== null && this.properties.endHoleindex !== null) {
                // 如果有传入起始和结束洞索引，根据这些参数设置选中范围
                const startIndex = this.properties.startHoleindex;
                const endIndex = this.properties.endHoleindex;

                // 确保startIndex <= endIndex
                const minIndex = Math.min(startIndex, endIndex);
                const maxIndex = Math.max(startIndex, endIndex);

                // 从holePlayList中找到对应hindex的洞
                for (let i = minIndex; i <= maxIndex; i++) {
                    const hole = holePlayList.find(h => h.hindex === i);
                    if (hole) {
                        selectedHindexArray.push(i);
                    }
                }

                console.log(' ⭕️ 根据传入参数设置选中范围:', {
                    startHoleindex: this.properties.startHoleindex,
                    endHoleindex: this.properties.endHoleindex,
                    selectedHindexArray
                });
            } else {
                // 如果没有传入参数，使用原有的逻辑（全选）
                selectedHindexArray = holePlayList ? holePlayList.map(hole => hole.hindex) : [];
                console.log(' ⭕️ 使用默认全选逻辑:', selectedHindexArray);
            }

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

            // 更新gameStore中的startHoleindex和endHoleindex
            if (tmpArray.length > 0) {
                gameStore.startHoleindex = tmpArray[0].hindex;
                gameStore.endHoleindex = tmpArray[tmpArray.length - 1].hindex;
                console.log(' ⭕️⭕️⭕️⭕️⭕️  onConfirmHoleOrder - 更新洞范围索引:', {
                    startHoleindex: gameStore.startHoleindex,
                    endHoleindex: gameStore.endHoleindex
                });
            }

            this.triggerEvent('cancel');
        },

        onCancel() {
            this.triggerEvent('cancel');
        },
    }
}); 