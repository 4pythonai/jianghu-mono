import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';
import { holeRangeStore } from '../../../../../stores/holeRangeStore';
import { toJS } from 'mobx-miniprogram';
Component({
    properties: {
        runtimeConfigs: Array
    },
    data: {
        // 可根据需要添加本地状态
    },
    lifetimes: {
        attached() {
            console.log('[kickoff] 组件已挂载，runtimeConfigs:', this.data.runtimeConfigs);
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
        close() {
            this.triggerEvent('close');
        },
        noop() {
            // 空方法，阻止冒泡
        }
    }
});
