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
            console.log('[holejump] 组件已挂载, runtimeConfigs:', this.data.runtimeConfigs);
            console.log('[holejump] gameStore:', toJS(gameStore));
            console.log('[holejump] holeRangeStore:', toJS(holeRangeStore));
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