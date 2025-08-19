import { G4PLasiStore } from '../../../../stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js'

Component({
    data: {
        // 组件内部状态
        visible: false,
        displayValue: '请配置顶洞规则',
        disabled: false, // 禁用状态

        selected: 0,
        // 分数选择器相关
        diffScores: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        selectedDiffScore: 1
    },

    lifetimes: {
        attached() {
            // 组件初始化时, 根据store中的值设置选中状态
            this.syncSelectedFromStore();
            // 计算显示值
            this.updateDisplayValue();
        }
    },

    methods: {
        // 空操作，用于阻止事件冒泡
        noTap() {
            // 什么都不做，只是阻止事件冒泡
        },

        // 计算显示值
        updateDisplayValue() {
            const store = G4PLasiStore;
            let displayValue = '';

            // 映射英文格式到中文显示
            if (store.lasi_dingdong_config) {
                switch (store.lasi_dingdong_config) {
                    case 'DrawEqual':
                        displayValue = '得分打平';
                        break;
                    case 'Diff_1':
                        displayValue = '得分1分以内';
                        break;
                    case 'NoDraw':
                        displayValue = '无顶洞';
                        break;
                    default:
                        // 处理 Diff_X 格式
                        if (store.lasi_dingdong_config.startsWith('Diff_')) {
                            const score = store.lasi_dingdong_config.replace('Diff_', '');
                            displayValue = `得分${score}分以内`;
                        } else {
                            displayValue = store.lasi_dingdong_config;
                        }
                        break;
                }
            } else {
                displayValue = '请配置顶洞规则';
            }

            this.setData({
                displayValue: displayValue
            });

        },

        syncSelectedFromStore() {
            const currentValue = G4PLasiStore.lasi_dingdong_config;
            if (currentValue) {
                if (currentValue === 'DrawEqual') {
                    this.setData({ selected: 0 });
                } else if (currentValue.startsWith('Diff_')) {
                    // 解析分数值
                    const score = Number.parseInt(currentValue.replace('Diff_', ''));
                    this.setData({
                        selected: 1,
                        selectedDiffScore: score || 1
                    });
                } else if (currentValue === 'NoDraw') {
                    this.setData({ selected: 2 });
                }
            }
        },

        onSelect(e) {
            const index = Number.parseInt(e.currentTarget.dataset.index);
            this.setData({ selected: index });
        },

        // 分数选择器相关方法
        onDiffScoreChange(e) {
            const selectedIndex = e.detail.value;
            const selectedScore = this.data.diffScores[selectedIndex];
            this.setData({ selectedDiffScore: selectedScore });
        },

        onShowConfig() {
            this.setData({ visible: true });
            // 只在第一次显示时重新加载配置，避免覆盖用户选择
            if (this.data.selected === 0 && !G4PLasiStore.lasi_dingdong_config) {
                this.syncSelectedFromStore();
            }
        },

        onCancel() {
            this.setData({ visible: false });
            this.triggerEvent('cancel');
        },

        onConfirm() {
            let selectedValue = '';

            // 根据选择的选项生成配置值
            if (this.data.selected === 0) {
                selectedValue = 'DrawEqual';
            } else if (this.data.selected === 1) {
                selectedValue = `Diff_${this.data.selectedDiffScore}`;
            } else if (this.data.selected === 2) {
                selectedValue = 'NoDraw';
            }

            // 调用store的action更新数据
            G4PLasiStore.updateDingdongConfig(selectedValue);
            // 更新显示值
            this.updateDisplayValue();
            // 关闭弹窗
            this.setData({ visible: false });
            // 向父组件传递事件
            this.triggerEvent('confirm', {
                value: selectedValue
            });
        },

        // 获取配置数据（供SysEdit页面调用）
        getConfigData() {
            const { selected, selectedDiffScore } = this.data;

            // 根据选择的选项生成配置值
            let selectedValue = '';
            if (selected === 0) {
                selectedValue = 'DrawEqual';
            } else if (selected === 1) {
                selectedValue = `Diff_${selectedDiffScore}`;
            } else if (selected === 2) {
                selectedValue = 'NoDraw';
            }

            return {
                drawConfig: selectedValue,
            };
        },


        // 初始化配置数据 - 供UserRuleEdit页面调用
        initConfigData(configData) {

            if (!configData) {
                console.warn('🎯 [LasiDingDong] 配置数据为空，使用默认值');
                return;
            }

            // 从配置数据中提取顶洞相关配置
            const dingdongConfig = configData.dingdongConfig || 'DrawEqual';

            // 解析配置值
            let selected = 0;
            let selectedDiffScore = 1;

            if (dingdongConfig === 'DrawEqual') {
                selected = 0;
            } else if (dingdongConfig.startsWith('Diff_')) {
                selected = 1;
                selectedDiffScore = Number.parseInt(dingdongConfig.replace('Diff_', '')) || 1;
            } else if (dingdongConfig === 'NoDraw') {
                selected = 2;
            }

            this.setData({
                selected,
                selectedDiffScore
            });

            this.updateDisplayValue();
        }
    }
});