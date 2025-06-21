import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../../stores/gameStore'

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        // 移除原有的属性，改为从store获取
    },

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
        // 点击添加按钮
        onAddClick() {
            console.log('📊 [OperationBar] 点击添加按钮');
            this.triggerEvent('addclick', {});
        },

        // 点击更多按钮
        onMoreClick() {
            console.log('📊 [OperationBar] 点击更多按钮');
            this.triggerEvent('moreclick', {});
        },

        // 点击下拉按钮
        onDropdownClick() {
            console.log('📊 [OperationBar] 点击下拉按钮');
            this.setData({
                isExpanded: !this.data.isExpanded
            });
            this.triggerEvent('dropdownclick', {
                isExpanded: !this.data.isExpanded
            });
        }
    }
}) 