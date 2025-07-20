// RealHolePlayListSetter
import { gameStore } from '../../stores/gameStore';
import { holeRangeStore } from '../../stores/holeRangeStore';
import { toJS } from 'mobx-miniprogram';

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
            // 从 holeRangeStore 获取洞数据
            const { holeList, holePlayList, rangeHolePlayList, startHoleindex, endHoleindex } = holeRangeStore.getState();

            // 使用 toJS 转换 observable 对象为普通对象
            const plainHoleList = toJS(holeList);
            const plainHolePlayList = toJS(holePlayList);
            const plainRangeHolePlayList = toJS(rangeHolePlayList);

            console.log(' ⭕️ RealHolePlayListSetter attached - holeRangeStore数据 (observable):',
                {
                    holeList, holePlayList, rangeHolePlayList, startHoleindex, endHoleindex,
                });

            console.log(' ⭕️ RealHolePlayListSetter attached - holeRangeStore数据 (plain):',
                {
                    holeList: plainHoleList,
                    holePlayList: plainHolePlayList,
                    rangeHolePlayList: plainRangeHolePlayList,
                    startHoleindex, endHoleindex,
                });

            // 根据传入的startHoleindex和endHoleindex设置初始选中范围
            let selectedHindexArray = [];

            if (this.properties.startHoleindex !== null && this.properties.endHoleindex !== null) {
                // 如果有传入起始和结束洞索引，根据这些参数设置选中范围（编辑模式）
                const startIndex = this.properties.startHoleindex;
                const endIndex = this.properties.endHoleindex;

                // 确保startIndex <= endIndex
                const minIndex = Math.min(startIndex, endIndex);
                const maxIndex = Math.max(startIndex, endIndex);

                // 从plainHolePlayList中找到对应hindex的洞
                for (let i = minIndex; i <= maxIndex; i++) {
                    const hole = plainHolePlayList.find(h => h.hindex === i);
                    if (hole) {
                        selectedHindexArray.push(i);
                    }
                }

                console.log(' ⭕️ 编辑模式 - 根据传入参数设置选中范围:', {
                    startHoleindex: this.properties.startHoleindex,
                    endHoleindex: this.properties.endHoleindex,
                    selectedHindexArray,
                    holePlayList: plainHolePlayList.map(h => ({ hindex: h.hindex, holename: h.holename }))
                });
            } else {
                // 创建模式 - 默认全选所有洞
                selectedHindexArray = plainHolePlayList ? plainHolePlayList.map(hole => hole.hindex) : [];
                console.log(' ⭕️ 创建模式 - 默认全选所有洞:', selectedHindexArray);
            }

            // 如果没有 holePlayList 数据，尝试从 holeList 生成
            if (!holePlayList || holePlayList.length === 0) {
                console.log(' ⭕️ holePlayList 为空，从 holeList 生成');
                const generatedHolePlayList = holeList ? [...holeList] : [];
                this.setData({
                    holeList,
                    holePlayList: generatedHolePlayList,
                    selectedHindexArray,
                    selectedMap: {}
                });
                return;
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
            // 只有点击确定时，才把结果传给父组件和holeRangeStore

            // 1. 更新 holePlayList（保持完整的洞顺序）
            holeRangeStore.updateHolePlayList(this.data.holePlayList);

            // 2. 设置洞范围（选中的洞）
            const selectedHoles = this.data.holePlayList.filter(hole =>
                this.data.selectedHindexArray.includes(hole.hindex)
            );
            console.log(' ⭕️⭕️⭕️⭕️⭕️  onConfirmHoleOrder - selectedHoles: ', selectedHoles);

            // 使用 holeRangeStore 更新洞范围
            holeRangeStore.setHoleRangeFromSelected(selectedHoles);

            this.triggerEvent('cancel');
        },

        onCancel() {
            this.triggerEvent('cancel');
        },
    }
}); 