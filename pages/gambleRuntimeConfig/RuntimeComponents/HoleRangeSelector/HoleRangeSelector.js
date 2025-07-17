// HoleRangeSelector 组件 - 起点洞与终点洞选择器
import RuntimeComponentsUtils from '../common-utils.js';
import { gameStore } from '../../../../stores/gameStore';

Component({
    lifetimes: {
        attached() {
            const { holeList, holePlayList } = gameStore.getState();
            this.setData({ holeList, holePlayList });
        }
    },
    properties: {}, // 移除 holeList 和 holePlayList 属性

    data: {
        // 球洞列表数据
        holeList: [],
        holePlayList: [],
        // 弹框显示状态
        ifShowModal: false,
    },


    methods: {

        // 显示起始洞选择弹框
        showModal() {
            this.setData({ ifShowModal: true });
        },





        // 触发变更事件
        triggerChangeEvent() {
            // 直接触发 holePlayList 的变更事件
            this.triggerEvent('change', {
                holePlayList: this.data.holePlayList
            });
        },

        // 统一弹框显示入口
        onShowModal(e) {
            // this.showModal();
            this.setData({ ifShowModal: true });

        },


        onModalCancel(e) {
            this.setData({ ifShowModal: false });
        },


        onModalChange(e) {
            console.log('onModalChange+++++++++++++++', e);
            this.setData({ ifShowModal: false });
            this.triggerChangeEvent();
        },
    }
}); 