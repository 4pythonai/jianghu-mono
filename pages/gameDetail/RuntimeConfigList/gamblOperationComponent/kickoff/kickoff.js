import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';
import { holeRangeStore } from '../../../../../stores/holeRangeStore';
import { toJS } from 'mobx-miniprogram';
Component({
    properties: {
        runtimeConfigs: Array
    },
    data: {
        selectedIds: {}, // 存储选中的配置ID
        selectedIdList: [] // 存储选中的ID数组
    },
    lifetimes: {
        attached() {
            console.log('[kickoff] 组件已挂载, runtimeConfigs:', this.data.runtimeConfigs);
            console.log('[kickoff] gameStore:', toJS(gameStore));
            console.log('[kickoff] holeRangeStore:', toJS(holeRangeStore));
            // 你也可以打印具体字段
            console.log('[kickoff] gameStore.gameData:', toJS(gameStore.gameData));
            console.log('[kickoff] gameStore.players:', toJS(gameStore.players));

            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameData', 'players'],
                actions: [],
            });

        },

        detached() {
            this.storeBindings.destroyStoreBindings();
        }
    },
    methods: {
        // 处理checkbox选择变化（标准写法）
        onCheckboxChange(e) {
            // e.detail.value 是所有被选中的 value 数组
            const selectedIdList = e.detail.value;
            // 构建 selectedIds 结构
            const selectedIds = {};
            selectedIdList.forEach(id => {
                selectedIds[id] = true;
            });
            this.setData({
                selectedIdList,
                selectedIds
            });
            console.log('[kickoff] 选中ID列表:', selectedIdList);
        },

        // 确定按钮点击
        onConfirm() {
            const selectedIds = [];

            // 收集所有选中的ID
            for (const [id, isSelected] of Object.entries(this.data.selectedIds)) {
                if (isSelected) {
                    selectedIds.push(id);
                }
            }

            console.log('[kickoff] 所有选中的ID:', selectedIds);

            // 可以触发事件传递给父组件
            this.triggerEvent('confirm', { selectedIds });
        },

        close() {
            this.triggerEvent('close');
        },

        noop() {
            // 空方法，阻止冒泡
        }
    }
});
