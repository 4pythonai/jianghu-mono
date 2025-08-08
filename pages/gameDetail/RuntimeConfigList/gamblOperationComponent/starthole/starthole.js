import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';
import { toJS } from 'mobx-miniprogram';
Component({
    properties: {
        // 传入的 runtimeConfigs 列表
        selectType: {
            type: String,
            value: 'start'
        },
        // 控制弹窗显示状态
        isStartholeVisible: {
            type: Boolean,
            value: false
        }
    },

    data: {
        holeList: [],
        ifShowModal: false,
    },


    lifetimes: {
        attached() {

            // 直接从 gameStore 获取洞数据
            const holeList = gameStore.gameData?.holeList || [];

            this.setData({ holeList });

        },
        detached() {
            this.disposer?.();
        }
    },


    methods: {

        // 确定按钮点击
        onConfirm() {

        },

        // 关闭弹窗
        close() {
            this.triggerEvent('close');
        },

        // 空方法，阻止冒泡
        noTap() { },

        // RealHolePlayListSetter 取消事件
        onModalCancel() {
            this.triggerEvent('close');
        },

        // RealHolePlayListSetter 确认事件
        onModalConfirm(e) {
            console.log('[starthole] 确认选择:', e.detail);
            // 这里可以处理确认逻辑
            this.triggerEvent('close');
        }
    }
});
