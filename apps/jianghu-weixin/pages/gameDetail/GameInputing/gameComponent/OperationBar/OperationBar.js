import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '@/stores/game/gameStore'

Component({


    /**
     * 组件的初始数据
     */
    data: {
        isExpanded: false, // 控制详细信息是否展开
        formattedTeeTime: '' // 格式化后的开球时间
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
        'gameData': function (newGameData) {
            if (newGameData) {
                console.log('📊 [OperationBar] 接收到gameData:', newGameData);
                console.log('📊 [OperationBar] 可用字段:', Object.keys(newGameData));

                // 格式化开球时间为欧洲格式
                const rawTeeTime = newGameData.teeTime || newGameData.tee_time || newGameData.start_time || '2024-01-15 09:00';
                const formattedTime = this.formatEuropeanDate(rawTeeTime);

                this.setData({
                    formattedTeeTime: formattedTime
                });
            }
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
        // 格式化时间为欧洲格式 DD-MM-YYYY
        formatEuropeanDate(dateString) {
            if (!dateString) return '';

            try {
                const date = new Date(dateString);
                if (Number.isNaN(date.getTime())) {
                    return dateString; // 如果无法解析, 返回原始字符串
                }

                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');

                return `${day}-${month}-${year} ${hours}:${minutes}`;
            } catch (error) {
                console.error('时间格式化错误:', error);
                return dateString;
            }
        },

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

        // 点击下拉按钮,展示详情,通过开关 isExpanded
        onDropdownClick() {
            console.log('📊 [OperationBar] 点击下拉按钮');
            this.setData({
                isExpanded: !this.data.isExpanded
            });
        }
    }
}) 