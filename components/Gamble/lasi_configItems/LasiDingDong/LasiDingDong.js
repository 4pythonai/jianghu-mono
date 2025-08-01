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
        // 计算显示值
        updateDisplayValue() {
            const store = G4PLasiStore;
            let displayValue = '';

            // 映射英文格式到中文显示
            if (store.draw8421_config) {
                switch (store.draw8421_config) {
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
                        if (store.draw8421_config.startsWith('Diff_')) {
                            const score = store.draw8421_config.replace('Diff_', '');
                            displayValue = `得分${score}分以内`;
                        } else {
                            displayValue = store.draw8421_config;
                        }
                        break;
                }
            } else {
                displayValue = '请配置顶洞规则';
            }

            this.setData({
                displayValue: displayValue
            });

            console.log('顶洞规则显示值已更新:', displayValue);
        },

        syncSelectedFromStore() {
            const currentValue = G4PLasiStore.draw8421_config;
            console.log('syncSelectedFromStore被调用，store值:', currentValue);
            if (currentValue) {
                if (currentValue === 'DrawEqual') {
                    this.setData({ selected: 0 });
                    console.log('设置selected为0');
                } else if (currentValue.startsWith('Diff_')) {
                    // 解析分数值
                    const score = Number.parseInt(currentValue.replace('Diff_', ''));
                    this.setData({
                        selected: 1,
                        selectedDiffScore: score || 1
                    });
                    console.log('设置selected为1，分数:', score || 1);
                } else if (currentValue === 'NoDraw') {
                    this.setData({ selected: 2 });
                    console.log('设置selected为2');
                }
            }
        },

        onSelect(e) {
            const index = Number.parseInt(e.currentTarget.dataset.index);
            console.log('选择选项:', index, '当前selected:', this.data.selected);
            this.setData({ selected: index });
            console.log('设置后selected:', index);
        },

        // 分数选择器相关方法
        onDiffScoreChange(e) {
            const selectedIndex = e.detail.value;
            const selectedScore = this.data.diffScores[selectedIndex];
            this.setData({ selectedDiffScore: selectedScore });
            console.log('选择分数:', selectedScore);
        },

        onShowConfig() {
            this.setData({ visible: true });
            // 只在第一次显示时重新加载配置，避免覆盖用户选择
            if (this.data.selected === 0 && !G4PLasiStore.draw8421_config) {
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
            G4PLasiStore.updateDingdongRule(selectedValue);
            // 更新显示值
            this.updateDisplayValue();
            // 关闭弹窗
            this.setData({ visible: false });
            // 向父组件传递事件
            this.triggerEvent('confirm', {
                value: selectedValue
            });
        }
    }
});