import { G4PLasiStore } from '../../../../stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js'

Component({
    data: {
        // 弹窗相关
        visible: false,
        displayValue: '请配置奖励规则',
        disabled: false,

        // 当前奖励类型：'add' | 'multiply'
        rewardType: 'add',
        // 奖励前置条件：'total_win' | 'total_not_fail' | 'total_ignore'
        rewardPreCondition: 'total_win',
        // 是否显示前置条件（根据KPI中是否有total类型）
        showPreCondition: false,

        // 加法奖励项目
        addRewardItems: [
            { scoreName: 'Par', rewardValue: 0 },
            { scoreName: 'Birdie', rewardValue: 1 },
            { scoreName: 'Eagle', rewardValue: 3 },
            { scoreName: 'Albatross/HIO', rewardValue: 10 }
        ],

        // 乘法奖励项目
        multiplyRewardItems: [
            { scoreName: 'Par', rewardValue: 0 },
            { scoreName: 'Birdie', rewardValue: 0 },
            { scoreName: 'Eagle', rewardValue: 0 },
            { scoreName: 'Albatross/HIO', rewardValue: 0 },
            { scoreName: 'Birdie+Birdie', rewardValue: 0 },
            { scoreName: 'Birdie+Eagle', rewardValue: 0 },
            { scoreName: 'Eagle+Eagle', rewardValue: 0 }
        ]
    },

    lifetimes: {
        attached() {
            this.loadConfigFromStore();
            this.checkKpiTotalType();
            this.updateDisplayValue();
        }
    },

    methods: {
        // 空事件处理方法
        noTap() {
            return;
        },

        // 计算显示值
        updateDisplayValue() {
            const config = G4PLasiStore.lasi_reward_config;
            let displayValue = '';

            if (config?.rewardType) {
                const rewardTypeText = config.rewardType === 'add' ? '加法奖励' : '乘法奖励';
                const rewardPair = config.rewardPair || [];

                // 计算有效的奖励项目数量
                const validRewards = rewardPair.filter(item => item.rewardValue > 0);

                if (validRewards.length > 0) {
                    displayValue = `${rewardTypeText} (${validRewards.length}项)`;
                } else {
                    displayValue = `${rewardTypeText} (未设置)`;
                }
            } else {
                displayValue = '请配置奖励规则';
            }

            this.setData({
                displayValue: displayValue
            });
        },

        // 显示配置弹窗
        onShowConfig() {
            this.setData({ visible: true });
            // 重新加载配置，确保数据是最新的
            this.loadConfigFromStore();
        },

        // 从Store加载配置
        loadConfigFromStore() {
            const config = G4PLasiStore.lasi_reward_config || {};

            // 先设置基本数据
            this.setData({
                rewardType: config.rewardType || 'add',
                rewardPreCondition: config.rewardPreCondition || 'total_win',
                addRewardItems: config.addRewardItems || this.data.addRewardItems,
                multiplyRewardItems: config.multiplyRewardItems || this.data.multiplyRewardItems
            });

            // 如果store中有rewardPair数据，需要正确映射到对应的数组
            if (config.rewardPair && config.rewardType) {
                if (config.rewardType === 'add') {
                    this.setData({
                        addRewardItems: config.rewardPair
                    });
                } else if (config.rewardType === 'multiply') {
                    this.setData({
                        multiplyRewardItems: config.rewardPair
                    });
                }
            }

            // 确保两个数组都有默认数据
            if (!this.data.addRewardItems || this.data.addRewardItems.length === 0) {
                this.setData({
                    addRewardItems: [
                        { scoreName: 'Par', rewardValue: 0 },
                        { scoreName: 'Birdie', rewardValue: 1 },
                        { scoreName: 'Eagle', rewardValue: 3 },
                        { scoreName: 'Albatross/HIO', rewardValue: 10 }
                    ]
                });
            }

            if (!this.data.multiplyRewardItems || this.data.multiplyRewardItems.length === 0) {
                this.setData({
                    multiplyRewardItems: [
                        { scoreName: 'Par', rewardValue: 0 },
                        { scoreName: 'Birdie', rewardValue: 0 },
                        { scoreName: 'Eagle', rewardValue: 0 },
                        { scoreName: 'Albatross/HIO', rewardValue: 0 },
                        { scoreName: 'Birdie+Birdie', rewardValue: 0 },
                        { scoreName: 'Birdie+Eagle', rewardValue: 0 },
                        { scoreName: 'Eagle+Eagle', rewardValue: 0 }
                    ]
                });
            }

            this.printCurrentConfig();
        },

        // 检查KPI中是否有total类型
        checkKpiTotalType() {
            const selectedIndicators = G4PLasiStore.lasi_config?.indicators || [];
            const hasTotalType = selectedIndicators.includes('total');

            this.setData({
                showPreCondition: hasTotalType
            });
        },

        // 监听KPI配置变化（供外部调用）
        onKpiConfigChange() {
            this.checkKpiTotalType();
        },

        // 切换奖励类型
        onRewardTypeChange(e) {
            const { type } = e.currentTarget.dataset;
            this.setData({
                rewardType: type
            });

            // 实时更新Store
            this.updateStore();
            this.printCurrentConfig();
        },

        // 输入框点击处理
        onInputTap(e) {
            // 阻止事件冒泡，防止触发面板切换
            return false;
        },

        // 奖励数值变化
        onRewardValueChange(e) {
            const { scoreName, rewardType } = e.currentTarget.dataset;
            const value = Number.parseInt(e.detail.value) || 0;

            if (rewardType === 'add') {
                const addRewardItems = this.data.addRewardItems.map(item => {
                    if (item.scoreName === scoreName) {
                        return { ...item, rewardValue: value };
                    }
                    return item;
                });

                this.setData({ addRewardItems });
            } else {
                const multiplyRewardItems = this.data.multiplyRewardItems.map(item => {
                    if (item.scoreName === scoreName) {
                        return { ...item, rewardValue: value };
                    }
                    return item;
                });

                this.setData({ multiplyRewardItems });
            }

            // 实时更新Store
            this.updateStore();
            this.printCurrentConfig();
        },

        // 前置条件变化
        onPreConditionChange(e) {
            const { value } = e.currentTarget.dataset;
            this.setData({
                rewardPreCondition: value
            });

            // 实时更新Store
            this.updateStore();
            this.printCurrentConfig();
        },

        // 取消
        onCancel() {
            this.setData({ visible: false });
            this.loadConfigFromStore();
            this.triggerEvent('cancel');
        },

        // 确定保存
        onConfirm() {
            const config = this.getCurrentConfig();

            // 更新Store
            G4PLasiStore.updateRewardConfig(config);

            // 更新显示值
            this.updateDisplayValue();

            // 关闭弹窗
            this.setData({ visible: false });

            this.printCurrentConfig();
            this.triggerEvent('confirm', config);
        },

        // 获取当前配置
        getCurrentConfig() {
            const { rewardType, rewardPreCondition, addRewardItems, multiplyRewardItems } = this.data;

            return {
                rewardType,
                rewardPreCondition,
                rewardPair: rewardType === 'add' ? addRewardItems : multiplyRewardItems
            };
        },

        // 更新Store
        updateStore() {
            const config = this.getCurrentConfig();
            G4PLasiStore.updateRewardConfig(config);
        },

        // 打印当前配置
        printCurrentConfig() {
            const config = this.getCurrentConfig();
            console.log('🎯 [LasiRewardConfig] ===== 当前奖励配置 =====');
            console.log('🎯 [LasiRewardConfig] 配置对象:', config);
            console.log('🎯 [LasiRewardConfig] 奖励类型:', config.rewardType);
            console.log('🎯 [LasiRewardConfig] 前置条件:', config.rewardPreCondition);
            console.log('🎯 [LasiRewardConfig] 奖励项目:', config.rewardPair);
            console.log('🎯 [LasiRewardConfig] ========================');
        }
    }
});