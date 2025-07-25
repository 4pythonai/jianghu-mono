import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';
import { toJS } from 'mobx-miniprogram';
Component({
    properties: {
        runtimeConfigs: Array
    },

    data: {
        selectedIds: {}, // 存储选中的配置ID
        selectedIdList: [], // 存储选中的ID数组,
        holePlayList: [] // 存储洞序（实际来源于 gameStore.gameData.holePlayList）
    },

    lifetimes: {
        attached() {
            console.log('[kickoff] 组件已挂载, runtimeConfigs:', this.data.runtimeConfigs);
            console.log('[kickoff] ⭕️⭕️⭕️ holeList:', toJS(gameStore.gameData.holeList));

            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: {
                    gameData: 'gameData',
                    players: 'players',
                },
                actions: [],
            });
            // 监听 gameData 变化，手动同步 holePlayList
            this.setData({
                holePlayList: gameStore.gameData.holeList || []
            });
            // 如果 gameData 是异步赋值，建议在 observer 或 autorun 里同步 holePlayList

            setTimeout(() => {
                console.log('[kickoff] this.data.holePlayList:', this.data.holePlayList);
            }, 1000);
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
            for (const id of selectedIdList) {
                selectedIds[id] = true;
            }
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
