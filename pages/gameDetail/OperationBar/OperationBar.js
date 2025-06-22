import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { gameStore } from '../../../stores/gameStore'

Component({


    /**
     * 组件的初始数据
     */
    data: {
        isExpanded: false, // 控制详细信息是否展开
        showMorePanel: false // 控制更多面板是否显示
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
            this.setData({
                showMorePanel: true
            });
            this.triggerEvent('moreclick', {});
        },

        // 隐藏更多面板
        hideMorePanel() {
            console.log('📊 [OperationBar] 隐藏更多面板');
            this.setData({
                showMorePanel: false
            });
        },

        // 阻止冒泡
        stopPropagation() {
            // 空函数，用于阻止点击面板内容时关闭弹窗
        },

        // 功能选项点击
        onOptionClick(e) {
            const option = e.currentTarget.dataset.option;
            console.log('📊 [OperationBar] 点击功能选项:', option);

            // 隐藏面板
            this.hideMorePanel();

            // 触发自定义事件，传递选项类型
            this.triggerEvent('optionclick', { option });

            // 根据选项显示不同的提示
            const optionNames = {
                edit: '修改',
                qrcode: '比赛码',
                scorecard: '成绩卡',
                poster: '海报',
                feedback: '反馈',
                style: '风格',
                account: '账本'
            };

            wx.showToast({
                title: `${optionNames[option]}功能开发中`,
                icon: 'none'
            });
        },

        // 取消比赛
        onCancelGame() {
            console.log('📊 [OperationBar] 点击取消比赛');
            this.hideMorePanel();

            wx.showModal({
                title: '确认取消',
                content: '确定要取消这场比赛吗？',
                success: (res) => {
                    if (res.confirm) {
                        this.triggerEvent('cancelgame', {});
                        wx.showToast({
                            title: '取消比赛功能开发中',
                            icon: 'none'
                        });
                    }
                }
            });
        },

        // 结束比赛
        onFinishGame() {
            console.log('📊 [OperationBar] 点击结束比赛');
            this.hideMorePanel();

            wx.showModal({
                title: '确认结束',
                content: '确定要结束这场比赛吗？',
                success: (res) => {
                    if (res.confirm) {
                        this.triggerEvent('finishgame', {});
                        wx.showToast({
                            title: '结束比赛功能开发中',
                            icon: 'none'
                        });
                    }
                }
            });
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