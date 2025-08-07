// HoleRangeSelector 组件 - 起点洞与终点洞选择器

import { holeRangeStore } from '../../../../stores/holeRangeStore';
import { gameStore } from '../../../../stores/gameStore';
import { autorun } from 'mobx-miniprogram';
import { toJS } from 'mobx-miniprogram';

Component({
    lifetimes: {
        attached() {
            const { startHoleindex, endHoleindex, roadLength } = holeRangeStore.getState();
            const { holeList } = gameStore.getState();
            console.log(" GAME 🅰️🅱️🆎🅾️🆑++++", toJS(gameStore.gameData?.holeList));

            console.log("🅰️🅱️🆎🅾️🆑++++", toJS(holeList));


            this.updateHoleDisplay(holeList, startHoleindex, endHoleindex, roadLength);
            this.disposer = autorun(() => {
                const { holeList, startHoleindex, endHoleindex, roadLength } = holeRangeStore.getState();
                this.updateHoleDisplay(holeList, startHoleindex, endHoleindex, roadLength);
            });
        },
        detached() {
            this.disposer?.();
        }
    },
    data: {
        holeList: [],
        ifShowModal: false,
        startHoleindex: null,
        endHoleindex: null,
        selectType: null, // 新增：记录当前选择类型（start/end）
        startHole: null,  // 起始洞信息
        endHole: null,     // 终止洞信息
        roadLength: 0
    },
    methods: {
        /**
         * 更新洞显示信息
         * @param {Array} holeList 洞列表
         * @param {number} startHoleindex 起始洞索引
         * @param {number} endHoleindex 终止洞索引
         */
        updateHoleDisplay(holeList, startHoleindex, endHoleindex, roadLength) {

            console.log("startHoleindex", startHoleindex);
            console.log("endHoleindex", endHoleindex);
            console.log("roadLength", roadLength);

            const startHole = startHoleindex && holeList.length ?
                holeList.find(hole => hole.hindex === startHoleindex) : null;

            const endHole = endHoleindex && holeList.length ?
                holeList.find(hole => hole.hindex === endHoleindex) : null;


            this.setData({
                holeList,
                startHoleindex,
                endHoleindex,
                startHole,
                endHole,
                roadLength
            });
        },

        onSlectStartModal(e) {
            // 获取点击的data-type
            const dataType = e.currentTarget.dataset.type;

            // 从holeRangeStore获取当前的起始洞和结束洞索引
            const { startHoleindex, endHoleindex, roadLength } = holeRangeStore.getState();


            this.setData({
                ifShowModal: true,
                startHoleindex,
                endHoleindex,
                selectType: dataType,
                roadLength
            });
        },

        onSelectEndModal(e) {
            // 获取点击的data-type
            const dataType = e.currentTarget.dataset.type;

            // 从holeRangeStore获取当前的起始洞和结束洞索引
            const { startHoleindex, endHoleindex, roadLength } = holeRangeStore.getState();

            this.setData({
                ifShowModal: true,
                startHoleindex,
                endHoleindex,
                selectType: dataType,
                roadLength
            });
        },

        onModalCancel(e) {
            this.setData({ ifShowModal: false });
        },

        /**
         * 处理RealHolePlayListSetter的确认事件
         * @param {Object} e 事件对象
         */
        onModalConfirm(e) {
            const result = e.detail;
            console.log('🕳️ [HoleRangeSelector] 收到洞顺序确认:', result);

            // 更新holeRangeStore
            if (result.holePlayList) {
                holeRangeStore.updateHolePlayList(result.holePlayList);
            }
            if (result.roadLength) {
                holeRangeStore.setRoadLength(result.roadLength);
            }
            if (result.startHoleindex && result.endHoleindex) {
                holeRangeStore.setHoleRange(result.startHoleindex, result.endHoleindex);
            }

            this.setData({ ifShowModal: false });
        },

        // 获取当前配置（用于外部收集配置）
        getConfig() {
            const { startHoleindex, endHoleindex } = this.data;

            // 从 holeRangeStore 获取 holePlayListStr
            const { holePlayList } = holeRangeStore.getState();
            const holePlayListStr = holePlayList.map(hole => hole.hindex).join(',');

            return {
                startHoleindex: startHoleindex,
                endHoleindex: endHoleindex,
                holePlayListStr: holePlayListStr
            };
        }
    }
}); 