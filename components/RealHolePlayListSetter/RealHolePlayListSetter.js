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
        holeList: [],           // 所有洞的列表（原始数据）
        holePlayList: [],       // 游戏顺序的洞列表
        displayHoleList: [],    // 用于显示的洞列表（包含所有洞，按顺序排列）
    },

    lifetimes: {
        attached() {
            // 从 holeRangeStore 获取洞数据
            const { holeList, holePlayList, rangeHolePlayList, startHoleindex, endHoleindex } = holeRangeStore.getState();

            // 使用 toJS 转换 observable 对象为普通对象
            const plainHoleList = toJS(holeList);
            const plainHolePlayList = toJS(holePlayList);
            const plainRangeHolePlayList = toJS(rangeHolePlayList);

            // 构建显示列表：包含所有洞，按holePlayList的顺序排列
            const displayHoleList = this.buildDisplayHoleList(plainHoleList, plainHolePlayList);

            this.setData({
                holeList: plainHoleList,
                holePlayList: plainHolePlayList,
                displayHoleList
            });
        },
    },

    methods: {
        /**
         * 构建显示列表：包含所有洞，按holePlayList的顺序排列
         * @param {Array} holeList 所有洞的列表
         * @param {Array} holePlayList 游戏顺序的洞列表
         * @returns {Array} 用于显示的洞列表
         */
        buildDisplayHoleList(holeList, holePlayList) {
            if (!holeList || !Array.isArray(holeList)) {
                return [];
            }

            if (!holePlayList || !Array.isArray(holePlayList) || holePlayList.length === 0) {
                // 如果没有holePlayList，按原始顺序显示所有洞
                return holeList.map(hole => ({
                    ...hole,
                    inPlaylist: false
                }));
            }

            // 获取holePlayList中第一个洞的hindex
            const firstHoleHindex = holePlayList[0]?.hindex;

            // 找到第一个洞在holeList中的位置
            const firstHoleIndex = holeList.findIndex(hole => hole.hindex === firstHoleHindex);

            if (firstHoleIndex === -1) {
                // 如果找不到第一个洞，按原始顺序显示
                return holeList.map(hole => ({
                    ...hole,
                    inPlaylist: false
                }));
            }

            // 重新排列holeList，让第一个洞对齐holePlayList的第一个洞
            const reorderedHoleList = [
                ...holeList.slice(firstHoleIndex),
                ...holeList.slice(0, firstHoleIndex)
            ];

            // 构建holePlayList的hindex集合，用于快速判断
            const holePlayListHindexSet = new Set(holePlayList.map(hole => hole.hindex));

            // 为每个洞添加状态标记
            return reorderedHoleList.map(hole => ({
                ...hole,
                inPlaylist: holePlayListHindexSet.has(hole.hindex)
            }));
        },

        onHideModal() {
            this.triggerEvent('cancel');
        },

        onSelectHole(e) {
            const selectType = this.properties.selectType; // 获取选择类型

            if (selectType === 'start') {
                const hindex = Number(e.currentTarget.dataset.hindex);
                console.log('🕳️ 选择起始洞:', hindex);

                // 重新构建holePlayList，以选中的洞为起始
                const newHolePlayList = this.buildHolePlayListFromStart(hindex);

                // 重新构建显示列表
                const newDisplayHoleList = this.buildDisplayHoleList(this.data.holeList, newHolePlayList);

                this.setData({
                    holePlayList: newHolePlayList,
                    displayHoleList: newDisplayHoleList
                });
            }

            if (selectType === 'end') {
                const hindex = Number(e.currentTarget.dataset.hindex);
                console.log('🕳️ 选择终止洞:', hindex);

                // 实现终止洞的逻辑
                const newHolePlayList = this.buildHolePlayListToEnd(hindex);
                console.log('🕳️ 新的holePlayList:', newHolePlayList.map(h => ({ hindex: h.hindex, holename: h.holename })));

                // 重新构建显示列表
                const newDisplayHoleList = this.buildDisplayHoleList(this.data.holeList, newHolePlayList);
                console.log('🕳️ 新的displayHoleList:', newDisplayHoleList.map(h => ({ hindex: h.hindex, holename: h.holename, inPlaylist: h.inPlaylist })));

                this.setData({
                    holePlayList: newHolePlayList,
                    displayHoleList: newDisplayHoleList
                });
            }
        },

        /**
         * 根据起始洞构建新的holePlayList
         * @param {number} startHindex 起始洞的hindex
         * @returns {Array} 新的holePlayList
         */
        buildHolePlayListFromStart(startHindex) {
            const { holeList } = this.data;

            // 找到起始洞在holeList中的位置
            const startIndex = holeList.findIndex(hole => hole.hindex === startHindex);

            if (startIndex === -1) {
                return [...holeList];
            }

            // 重新排列，以起始洞为开始
            return [
                ...holeList.slice(startIndex),
                ...holeList.slice(0, startIndex)
            ];
        },

        /**
         * 根据终止洞构建新的holePlayList（包含从开始到终止洞的所有洞）
         * @param {number} endHindex 终止洞的hindex
         * @returns {Array} 新的holePlayList
         */
        buildHolePlayListToEnd(endHindex) {
            const { holeList, holePlayList, displayHoleList } = this.data;

            // 如果没有holePlayList，返回空数组
            if (!holePlayList || holePlayList.length === 0) {
                return [];
            }

            // 在displayHoleList中找到终止洞的位置
            const endIndex = displayHoleList.findIndex(hole => hole.hindex === endHindex);

            if (endIndex === -1) {
                // 如果终止洞不在displayHoleList中，返回完整的holePlayList
                return [...holePlayList];
            }

            // 从displayHoleList中获取从开始到终止洞的所有洞（包括灰色的洞）
            const selectedHoles = displayHoleList.slice(0, endIndex + 1);

            console.log('🕳️ 选择的洞（包含灰色洞）:', selectedHoles.map(h => ({ hindex: h.hindex, holename: h.holename, inPlaylist: h.inPlaylist })));

            return selectedHoles;
        },

        onConfirmHoleOrder() {
            // 只有点击确定时，才把结果传给父组件和holeRangeStore

            // 1. 更新 holePlayList（保持完整的洞顺序）
            holeRangeStore.updateHolePlayList(this.data.holePlayList);

            // 2. 设置洞范围（使用holePlayList的第一个和最后一个洞）
            if (this.data.holePlayList.length > 0) {
                const startHoleindex = this.data.holePlayList[0].hindex;
                const endHoleindex = this.data.holePlayList[this.data.holePlayList.length - 1].hindex;
                holeRangeStore.setHoleRange(startHoleindex, endHoleindex);
            }

            this.triggerEvent('cancel');
        },

        onCancel() {
            this.triggerEvent('cancel');
        },
    }
}); 