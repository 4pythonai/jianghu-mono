import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';
import { toJS } from 'mobx-miniprogram';
Component({
    properties: {
        // 传入的 runtimeConfigs 列表
        runtimeConfigs: {
            type: Array,
            value: []
        }
    },

    data: {
        // 当前选中的配置 id 列表
        selectedIdList: [],
        // 洞序列表（从 gameStore 取）
        holePlayList: []
    },

    lifetimes: {
        attached() {
            // 绑定 mobx store
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: {
                    gameData: 'gameData',
                    players: 'players'
                }
            });
            // 初始化洞序列表
            this.setData({
                holePlayList: gameStore.gameData.holeList || []
            });
        },
        detached() {
            this.storeBindings.destroyStoreBindings();
        }
    },

    methods: {
        // 处理 checkbox 选择变化
        onCheckboxChange(e) {
            // e.detail.selectedIdList 是 RuntimeConfigSelector 组件传递的选中 id 数组
            this.setData({
                selectedIdList: e.detail.selectedIdList
            });
        },

        // 确定按钮点击
        onConfirm() {
            // 直接用 selectedIdList
            const { selectedIdList } = this.data;
            console.log('[kickoff] 所有选中的ID:', selectedIdList);
            // 触发事件传递给父组件
            this.triggerEvent('confirm', { selectedIdList });
        },

        // 关闭弹窗
        close() {
            this.triggerEvent('close');
        },

        // 空方法，阻止冒泡
        noTap() { }
    }
});
