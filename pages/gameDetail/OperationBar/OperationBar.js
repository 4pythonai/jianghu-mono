import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../../stores/gameStore'

Component({


    /**
     * 组件的初始数据
     */
    data: {
        isExpanded: false // 控制详细信息是否展开
    },

    lifetimes: {
        attached() {
            // 创建 Store 和 Component 的绑定
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: {
                    // 从 store 中映射 gameData
                    gameData: 'gameData',
                },
                actions: [],
            });
        },
        detached() {
            // 在组件销毁时清理绑定
            this.storeBindings.destroyStoreBindings();
        }
    },

    observers: {
        'gameData': (newGameData) => {
            if (newGameData) {
                console.log('📊 [OperationBar] 接收到gameData:', newGameData);
                console.log('📊 [OperationBar] 可用字段:', Object.keys(newGameData));
            }
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
        // 点击添加球员按钮
        onAddPlayers() {
            console.log('📊 [OperationBar] 点击添加球员按钮');
            // 触发事件让父页面显示添加球员面板
            this.triggerEvent('showaddplayer', {});
        },

        // 点击更多按钮
        onMoreClick() {
            console.log('📊 [OperationBar] 点击更多按钮');
            // 触发事件让父页面显示游戏操作面板
            this.triggerEvent('showgameoperation', {});
        },



        // 点击下拉按钮,展示详情,通过开关  isExpanded   bug?

        onDropdownClick() {
            console.log('📊 [OperationBar] 点击下拉按钮');
            this.setData({
                isExpanded: !this.data.isExpanded
            });
        }
    }
}) 