/**
 * 进行中 Tab 组件
 * 展示进行中的分组列表
 */
import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'

Component({
    data: {
        groups: []
    },
    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['groups', 'gameid']
            })
        },
        detached() {
            if (this.storeBindings) {
                this.storeBindings.destroyStoreBindings()
            }
        }
    },
    methods: {
        onGroupTap(e) {
            const { groupid } = e.currentTarget.dataset
            const { gameid } = this.data

            wx.navigateTo({
                url: `/packageGame/gameDetail/score/score?gameid=${gameid}&groupid=${groupid}`
            })
        }
    }
});
