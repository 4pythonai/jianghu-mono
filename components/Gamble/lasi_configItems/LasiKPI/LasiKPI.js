import { G4PLasiStore } from '../../../../stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js'
import { observable, action } from 'mobx-miniprogram'

Component({
    properties: {
        // 组件属性
    },

    data: {
        // 当前选中的指标
        selectedIndicators: [],
        // 选中状态的映射对象
        isSelected: {
            best: false,
            worst: false,
            total: false
        },
        // 总杆计算方式: 'add_total' 或 'plus_total'
        totalCalculationType: 'add_total',
        // 各KPI的分值配置
        kpiValues: {
            best: 2,    // 较好成绩PK分值
            worst: 1,   // 较差成绩PK分值
            total: 1    // 双方总杆PK分值
        },
        // 是否显示详细说明
        showDetail: true,
        // 生成的规则名称
        generatedRuleName: '',
        // 总分
        totalScore: 0,
        // 强制更新标记
        forceUpdate: 0
    },

    lifetimes: {
        attached() {
            console.log('🎯 [LasiKPI] 拉丝KPI配置组件加载');
            // 初始化时从Store获取当前配置
            const selectedIndicators = G4PLasiStore.lasi_config?.indicators || [];
            const kpiValues = G4PLasiStore.lasi_config?.kpiValues || {
                best: 2,
                worst: 1,
                total: 1
            };

            // 构建选中状态映射
            const isSelected = {
                best: selectedIndicators.includes('best'),
                worst: selectedIndicators.includes('worst'),
                total: selectedIndicators.includes('total')
            };

            this.setData({
                selectedIndicators,
                isSelected,
                totalCalculationType: G4PLasiStore.lasi_config?.totalCalculationType || 'add_total',
                kpiValues
            });
            this.calculateTotalScore();
            this.generateRuleName();

            // 打印初始KPI配置
            this.printCurrentKpiConfig();
        }
    },

    methods: {
        // 选择拉丝指标
        onSelectIndicator(e) {
            const { value } = e.currentTarget.dataset;
            const { selectedIndicators, isSelected } = this.data;

            console.log('🎯 [LasiKPI] 选择指标:', value);
            console.log('🎯 [LasiKPI] 当前选中状态:', isSelected);
            console.log('🎯 [LasiKPI] 当前选中数组:', selectedIndicators);

            let newSelectedIndicators;
            let newIsSelected = { ...isSelected };

            if (selectedIndicators.includes(value)) {
                // 取消选择
                newSelectedIndicators = selectedIndicators.filter(item => item !== value);
                newIsSelected[value] = false;
                console.log('🎯 [LasiKPI] 取消选择:', value);
            } else {
                // 添加选择
                newSelectedIndicators = [...selectedIndicators, value];
                newIsSelected[value] = true;
                console.log('🎯 [LasiKPI] 添加选择:', value);
            }

            console.log('🎯 [LasiKPI] 新的选中状态:', newIsSelected);
            console.log('🎯 [LasiKPI] 新的选中数组:', newSelectedIndicators);

            // 使用setTimeout确保数据更新
            this.setData({
                selectedIndicators: newSelectedIndicators,
                isSelected: newIsSelected
            }, () => {
                console.log('🎯 [LasiKPI] setData完成后的状态:', this.data.isSelected);
                // 强制更新视图
                this.setData({
                    forceUpdate: Date.now()
                });

                // 打印当前KPI配置
                this.printCurrentKpiConfig();
            });

            this.calculateTotalScore();
            this.updateStore();
            this.generateRuleName();
        },

        // 切换总杆计算方式 plus_total
        onToggleTotalType() {
            const newType = this.data.totalCalculationType === 'add_total' ? 'plus_total' : 'add_total';
            this.setData({
                totalCalculationType: newType
            });

            this.updateStore();
            this.generateRuleName();

            // 打印当前KPI配置
            this.printCurrentKpiConfig();
        },

        // 切换详细说明显示
        onToggleDetail() {
            this.setData({
                showDetail: !this.data.showDetail
            });
        },

        // 计算总分
        calculateTotalScore() {
            const { selectedIndicators, kpiValues } = this.data;
            let total = 0;

            selectedIndicators.forEach(indicator => {
                total += kpiValues[indicator] || 0;
            });

            this.setData({
                totalScore: total
            });
        },

        // 生成规则名称
        generateRuleName() {
            const { selectedIndicators, totalCalculationType } = this.data;

            if (selectedIndicators.length === 0) {
                this.setData({ generatedRuleName: '四人拉丝' });
                return;
            }

            if (selectedIndicators.length === 1) {
                const indicator = selectedIndicators[0];
                const indicatorMap = {
                    'best': '较好',
                    'worst': '较差',
                    'total': totalCalculationType === 'add_total' ? '加法总杆' : '乘法总杆'
                };
                this.setData({ generatedRuleName: `拉丝${indicatorMap[indicator]}` });
                return;
            }

            if (selectedIndicators.length === 2) {
                const [first, second] = selectedIndicators;
                const indicatorMap = {
                    'best': '头',
                    'worst': '尾',
                    'total': totalCalculationType === 'add_total' ? '加' : '乘'
                };
                this.setData({ generatedRuleName: `${indicatorMap[first]}${indicatorMap[second]}` });
                return;
            }

            if (selectedIndicators.length === 3) {
                const indicatorMap = {
                    'best': '2',
                    'worst': '1',
                    'total': '1'
                };
                const name = selectedIndicators.map(indicator => indicatorMap[indicator]).join('');
                this.setData({ generatedRuleName: name });
                return;
            }

            this.setData({ generatedRuleName: '四人拉丝' });
        },

        // 更新Store
        updateStore() {
            const config = {
                indicators: this.data.selectedIndicators,
                totalCalculationType: this.data.totalCalculationType,
                kpiValues: this.data.kpiValues
            };

            G4PLasiStore.updateLasiConfig(config);
        },

        // 获取配置结果 - 返回指定格式的数组
        getConfigResult() {
            const { selectedIndicators, kpiValues, totalCalculationType } = this.data;

            const result = [];

            // 添加选中的KPI配置
            selectedIndicators.forEach(indicator => {
                if (indicator === 'total') {
                    // 总杆类型需要特殊处理
                    result.push({
                        kpi: totalCalculationType,
                        value: kpiValues.total
                    });
                } else {
                    result.push({
                        kpi: indicator,
                        value: kpiValues[indicator]
                    });
                }
            });

            return result;
        },

        // 获取当前配置的完整信息
        getCurrentConfig() {
            return {
                selectedIndicators: this.data.selectedIndicators,
                totalCalculationType: this.data.totalCalculationType,
                kpiValues: this.data.kpiValues,
                totalScore: this.data.totalScore,
                configResult: this.getConfigResult()
            };
        },

        // 设置KPI分值
        setKpiValue(kpi, value) {
            const { kpiValues } = this.data;
            kpiValues[kpi] = value;

            this.setData({
                kpiValues
            });

            this.calculateTotalScore();
            this.updateStore();
        },

        // 重置配置
        resetConfig() {
            this.setData({
                selectedIndicators: [],
                isSelected: {
                    best: false,
                    worst: false,
                    total: false
                },
                totalCalculationType: 'add_total',
                kpiValues: {
                    best: 2,
                    worst: 1,
                    total: 1
                }
            });

            this.calculateTotalScore();
            this.updateStore();
            this.generateRuleName();
        },

        // 调试方法 - 打印当前状态
        debugState() {
            console.log('当前组件状态:', {
                selectedIndicators: this.data.selectedIndicators,
                isSelected: this.data.isSelected,
                totalScore: this.data.totalScore
            });
        },

        // 测试方法 - 手动设置选中状态
        testSetSelected() {
            console.log('🎯 [LasiKPI] 测试设置选中状态');
            this.setData({
                isSelected: {
                    best: true,
                    worst: false,
                    total: true
                },
                selectedIndicators: ['best', 'total']
            });
            console.log('🎯 [LasiKPI] 测试设置完成');
        },

        // 打印当前KPI配置
        printCurrentKpiConfig() {
            const { selectedIndicators, kpiValues, totalCalculationType, totalScore } = this.data;

            console.log('🎯 [LasiKPI] ===== 当前KPI配置 =====');
            console.log('🎯 [LasiKPI] 选中的指标:', selectedIndicators);
            console.log('🎯 [LasiKPI] KPI分值配置:', kpiValues);
            console.log('🎯 [LasiKPI] 总杆计算方式:', totalCalculationType);
            console.log('🎯 [LasiKPI] 当前总分:', totalScore);

            // 打印详细的选中状态
            console.log('🎯 [LasiKPI] 详细选中状态:');
            console.log('  - 较好成绩PK:', selectedIndicators.includes('best') ? `选中 (${kpiValues.best}分)` : '未选中');
            console.log('  - 较差成绩PK:', selectedIndicators.includes('worst') ? `选中 (${kpiValues.worst}分)` : '未选中');
            console.log('  - 双方总杆PK:', selectedIndicators.includes('total') ? `选中 (${kpiValues.total}分, ${totalCalculationType === 'add_total' ? '加法总杆PK' : '乘法总杆PK'})` : '未选中');

            // 打印配置结果数组
            const configResult = this.getConfigResult();
            console.log('🎯 [LasiKPI] 配置结果数组:', configResult);
            console.log('🎯 [LasiKPI] ========================');
        }
    }
});