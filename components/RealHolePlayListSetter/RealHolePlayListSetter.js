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
        },
        // 新增属性：选择类型（start/end）
        selectType: {
            type: String,
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

            } else {
                // 创建模式 - 默认全选所有洞
                selectedHindexArray = plainHolePlayList ? plainHolePlayList.map(hole => hole.hindex) : [];
            }

            // 如果没有 holePlayList 数据，尝试从 holeList 生成
            if (!holePlayList || holePlayList.length === 0) {
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
            // this.getHoleRects();
        },
    },

    methods: {


        onHideModal() {
            this.triggerEvent('cancel');
        },

        onSelectHole(e) {

            const selectType = this.properties.selectType; // 获取选择类型


            if (selectType === 'start') {
                const hindex = Number(e.currentTarget.dataset.hindex);
                const sortedList = [...this.data.holeList].sort((a, b) => (a.hindex || 0) - (b.hindex || 0));
                const startIdx = sortedList.findIndex(hole => Number(hole.hindex) === hindex);
                const newHolePlayList = sortedList.slice(startIdx).concat(sortedList.slice(0, startIdx));
                this.setData({
                    holePlayList: newHolePlayList
                });
            }


            if (selectType === 'end') {

                // const hindex = Number(e.currentTarget.dataset.hindex);
                // const sortedList = [...this.data.holeList].sort((a, b) => (a.hindex || 0) - (b.hindex || 0));
                // const startIdx = sortedList.findIndex(hole => Number(hole.hindex) === hindex);
                // const newHolePlayList = sortedList.slice(startIdx).concat(sortedList.slice(0, startIdx));
                // this.setData({
                //     holePlayList: newHolePlayList
                // });

            }









        },

        onConfirmHoleOrder() {
            // 只有点击确定时，才把结果传给父组件和holeRangeStore

            // 1. 更新 holePlayList（保持完整的洞顺序）
            holeRangeStore.updateHolePlayList(this.data.holePlayList);

            // 2. 设置洞范围（选中的洞）
            const selectedHoles = this.data.holePlayList.filter(hole =>
                this.data.selectedHindexArray.includes(hole.hindex)
            );

            // 将 selectedHoles 转换为普通对象数组
            const plainSelectedHoles = selectedHoles.map(hole => toJS(hole));

            console.log(' ⭕️+++  onConfirmHoleOrder - selectedHoles: ', plainSelectedHoles);

            // 使用 holeRangeStore 更新洞范围
            holeRangeStore.setHoleRangeFromSelected(plainSelectedHoles);

            this.triggerEvent('cancel');
        },

        onCancel() {
            this.triggerEvent('cancel');
        },
    }
}); 