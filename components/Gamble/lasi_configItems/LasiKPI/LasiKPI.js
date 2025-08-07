import { G4PLasiStore } from '../../../../stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js'

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
        // 总杆计算方式: 'add_total' 或 'plus_total'
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
            console.log('🎯 [LasiKPI] 拉丝KPI配置组件加载');
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
            this.updateStore();
            this.generateRuleName();
            this.printCurrentKpiConfig();
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
            this.updateStore();
            this.generateRuleName();
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

            // 通知奖励配置组件更新
            this.notifyRewardConfigUpdate();
        },

        // 通知奖励配置组件更新
        notifyRewardConfigUpdate() {
            // 触发自定义事件，通知父组件KPI配置已更新
            this.triggerEvent('kpiConfigChange', {
                selectedIndicators: this.data.selectedIndicators,
                hasTotalType: this.data.selectedIndicators.includes('total')
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

            console.log('🎯 [LasiKPI] ===== 当前KPI配置 =====');
            console.log('🎯 [LasiKPI] 配置对象:', {
                selectedIndicators,
                kpiValues,
                totalCalculationType,
                totalScore
            });

            // 打印配置结果数组
            const configResult = this.getConfigResult();
        },

        // 初始化配置数据 - 供UserRuleEdit页面调用
        initConfigData(configData) {
            console.log('🎯 [LasiKPI] 初始化配置数据:', configData);

            if (!configData) {
                console.warn('🎯 [LasiKPI] 配置数据为空，使用默认值');
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
                        console.log('🎯 [LasiKPI] 成功解析kpis字符串:', kpiConfig);
                    } catch (error) {
                        console.error('🎯 [LasiKPI] 解析kpis字符串失败:', error);
                        kpiConfig = configData;
                    }
                }
            }

            console.log('🎯 [LasiKPI] 提取的KPI配置:', kpiConfig);

            // 支持两种字段名：selectedIndicators 和 indicators
            const selectedIndicators = kpiConfig.selectedIndicators || kpiConfig.indicators || ['best', 'worst', 'total'];
            const kpiValues = kpiConfig.kpiValues || {
                best: 1,
                worst: 1,
                total: 1
            };
            const totalCalculationType = kpiConfig.totalCalculationType || 'add_total';

            console.log('🎯 [LasiKPI] 解析后的配置:', {
                selectedIndicators,
                kpiValues,
                totalCalculationType
            });

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

            console.log('🎯 [LasiKPI] 配置数据初始化完成');
        }
    }
});