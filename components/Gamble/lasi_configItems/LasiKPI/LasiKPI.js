import { G4PLasiStore } from '../../../../stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js'
import { generateLasiRuleName } from '../../../../utils/ruleNameGenerator.js'

Component({
    data: {
        // 当前选中的指标
        selectedIndicators: [],
        // 选中状态的映射对象
        isSelected: {
            best: true,
            worst: true,
            total: true
        },
        totalCalculationType: 'add_total',
        // 各KPI的分值配置
        kpiValues: {
            best: 1,    // 较好成绩PK分值
            worst: 1,   // 较差成绩PK分值
            total: 1    // 双方总杆PK分值
        },
        // 生成的规则名称
        generatedRuleName: '',
        // 总分
        totalScore: 0
    },

    lifetimes: {
        attached() {
            // 初始化时从Store获取当前配置
            let selectedIndicators = G4PLasiStore.lasi_config?.indicators || [];
            const kpiValues = G4PLasiStore.lasi_config?.kpiValues || this.data.kpiValues;

            // 如果没有配置或配置为空，则默认选中3个指标
            if (!selectedIndicators || selectedIndicators.length === 0) {
                selectedIndicators = ['best', 'worst', 'total'];
            }

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

            // 如果设置了默认指标，需要同步到Store中
            if (selectedIndicators.length > 0) {
                this.updateStore();
            }

            // 打印初始KPI配置
            this.printCurrentKpiConfig();
        }
    },

    methods: {
        // 监听KPI配置变化（供外部调用）
        onKpiConfigChange() {
            this.printCurrentKpiConfig();
        },

        // 选择拉丝指标
        onSelectIndicator(e) {
            const { value } = e.currentTarget.dataset;
            const { selectedIndicators, isSelected } = this.data;

            const newSelectedIndicators = selectedIndicators.includes(value)
                ? selectedIndicators.filter(item => item !== value)
                : [...selectedIndicators, value];

            const newIsSelected = { ...isSelected };
            newIsSelected[value] = !selectedIndicators.includes(value);

            this.setData({
                selectedIndicators: newSelectedIndicators,
                isSelected: newIsSelected
            });

            this.calculateTotalScore();
            this.generateRuleName();
            this.updateStore();
            this.printCurrentKpiConfig();
        },

        // 切换总杆计算方式  
        onToggleTotalType() {
            const newType = this.data.totalCalculationType === 'add_total' ? 'multiply_total' : 'add_total';
            this.setData({
                totalCalculationType: newType
            });

            this.generateRuleName();
            this.updateStore();

            // 打印当前KPI配置
            this.printCurrentKpiConfig();
        },

        // KPI分值变化处理
        onKpiValueChange(e) {
            const { kpi } = e.currentTarget.dataset;
            const value = Number.parseInt(e.detail.value) + 1; // picker的value从0开始，所以+1

            const { kpiValues } = this.data;
            kpiValues[kpi] = value;

            this.setData({
                kpiValues
            });

            this.calculateTotalScore();
            this.generateRuleName();
            this.updateStore();
            this.printCurrentKpiConfig();
        },

        // 计算总分
        calculateTotalScore() {
            const { selectedIndicators, kpiValues } = this.data;
            let total = 0;

            for (const indicator of selectedIndicators) {
                total += kpiValues[indicator] || 0;
            }

            this.setData({
                totalScore: total
            });
        },

        // 生成规则名称
        generateRuleName() {
            const { selectedIndicators, kpiValues, totalCalculationType } = this.data;

            // 使用统一的规则名称生成器
            const ruleName = generateLasiRuleName(selectedIndicators, kpiValues, totalCalculationType);

            // 更新数据并立即触发事件
            this.setData({ generatedRuleName: ruleName });

            // 立即触发事件，传递最新的规则名称
            this.triggerEvent('kpiConfigChange', {
                selectedIndicators: this.data.selectedIndicators,
                hasTotalType: this.data.selectedIndicators.includes('total'),
                generatedRuleName: ruleName
            });
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

        // 通知奖励配置组件更新
        notifyRewardConfigUpdate() {
            // 触发自定义事件，通知父组件KPI配置已更新
            this.triggerEvent('kpiConfigChange', {
                selectedIndicators: this.data.selectedIndicators,
                hasTotalType: this.data.selectedIndicators.includes('total'),
                generatedRuleName: this.data.generatedRuleName
            });
        },

        // 获取配置结果 - 返回指定格式的数组
        getConfigResult() {
            const { selectedIndicators, kpiValues, totalCalculationType } = this.data;

            const result = [];

            // 添加选中的KPI配置
            for (const indicator of selectedIndicators) {
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
            }

            return result;
        },

        // 获取配置数据（供SysEdit页面调用）
        getConfigData() {
            const { selectedIndicators, kpiValues, totalCalculationType } = this.data;

            // 返回扁平化的数据结构，与UserRuleEdit的collectConfigData方法兼容
            return {
                kpis: JSON.stringify({
                    indicators: selectedIndicators,
                    kpiValues,
                    totalCalculationType
                })
            };
        },

        // 打印当前KPI配置
        printCurrentKpiConfig() {
            const { selectedIndicators, kpiValues, totalCalculationType, totalScore } = this.data;

            // 打印配置结果数组
            const configResult = this.getConfigResult();
        },

        // 初始化配置数据 - 供UserRuleEdit页面调用
        initConfigData(configData) {

            if (!configData) {
                return;
            }

            // 从配置数据中提取KPI相关配置
            // 支持三种数据结构：
            // 1. 直接包含kpi相关字段
            // 2. 嵌套在kpis字段中的对象
            // 3. 嵌套在kpis字段中的JSON字符串
            let kpiConfig = configData;
            if (configData.kpis) {
                if (typeof configData.kpis === 'object') {
                    kpiConfig = configData.kpis;
                } else if (typeof configData.kpis === 'string') {
                    try {
                        kpiConfig = JSON.parse(configData.kpis);
                    } catch (error) {
                        kpiConfig = configData;
                    }
                }
            }


            // 支持两种字段名：selectedIndicators 和 indicators
            const selectedIndicators = kpiConfig.selectedIndicators || kpiConfig.indicators || ['best', 'worst', 'total'];
            const kpiValues = kpiConfig.kpiValues || {
                best: 1,
                worst: 1,
                total: 1
            };
            const totalCalculationType = kpiConfig.totalCalculationType || 'add_total';



            // 构建选中状态映射
            const isSelected = {
                best: selectedIndicators.includes('best'),
                worst: selectedIndicators.includes('worst'),
                total: selectedIndicators.includes('total')
            };

            this.setData({
                selectedIndicators,
                isSelected,
                kpiValues,
                totalCalculationType
            });

            this.calculateTotalScore();
            this.generateRuleName();
            this.updateStore();
            this.printCurrentKpiConfig();

        },


    }
});