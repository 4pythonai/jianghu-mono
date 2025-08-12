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
            const { selectedIndicators, kpiValues, totalCalculationType } = this.data;

            console.log('🎯 [LasiKPI] 生成规则名称 - 输入参数:', {
                selectedIndicators,
                kpiValues,
                totalCalculationType
            });

            if (selectedIndicators.length === 0) {
                this.setData({ generatedRuleName: '四人拉丝' });
                console.log('🎯 [LasiKPI] 规则名称: 四人拉丝 (无选中指标)');
                return;
            }

            // 获取选中指标的分值
            const selectedValues = selectedIndicators.map(indicator => kpiValues[indicator]);

            // 检查所有分值是否一致
            const allValuesEqual = selectedValues.every(value => value === selectedValues[0]);

            console.log('🎯 [LasiKPI] 选中分值:', selectedValues, '是否一致:', allValuesEqual);

            if (selectedIndicators.length === 3) {
                if (allValuesEqual) {
                    // 三个指标且分值一致，默认名称为"拉丝三点"
                    this.setData({ generatedRuleName: '拉丝三点' });
                    console.log('🎯 [LasiKPI] 规则名称: 拉丝三点 (三个指标分值一致)');
                } else {
                    // 三个指标但分值不一致，按"头尾总"顺序展示分值
                    const name = `${kpiValues.best}${kpiValues.worst}${kpiValues.total}`;
                    this.setData({ generatedRuleName: name });
                    console.log('🎯 [LasiKPI] 规则名称:', name, '(三个指标分值不一致)');
                }
                return;
            }

            if (selectedIndicators.length === 2) {
                // 按"头尾总"顺序重新排列选中的指标
                const sortedIndicators = [];
                const sortedValues = [];

                // 先添加头（best）
                if (selectedIndicators.includes('best')) {
                    sortedIndicators.push('best');
                    sortedValues.push(kpiValues.best);
                }
                // 再添加尾（worst）
                if (selectedIndicators.includes('worst')) {
                    sortedIndicators.push('worst');
                    sortedValues.push(kpiValues.worst);
                }
                // 最后添加总（total）
                if (selectedIndicators.includes('total')) {
                    sortedIndicators.push('total');
                    sortedValues.push(kpiValues.total);
                }

                if (allValuesEqual) {
                    // 两个指标且分值一致，根据勾选指标命名
                    const indicatorNames = sortedIndicators.map(indicator => {
                        if (indicator === 'best') return '头';
                        if (indicator === 'worst') return '尾';
                        if (indicator === 'total') return '总';
                        return '';
                    });
                    const ruleName = `${indicatorNames[0]}${indicatorNames[1]}两点`;
                    this.setData({ generatedRuleName: ruleName });
                    console.log('🎯 [LasiKPI] 规则名称:', ruleName, '(两个指标分值一致)');
                } else {
                    // 两个指标但分值不一致，根据勾选指标和分值命名
                    const indicatorNames = sortedIndicators.map(indicator => {
                        if (indicator === 'best') return '头';
                        if (indicator === 'worst') return '尾';
                        if (indicator === 'total') return '总';
                        return '';
                    });
                    const ruleName = `${indicatorNames[0]}${sortedValues[0]}${indicatorNames[1]}${sortedValues[1]}`;
                    this.setData({ generatedRuleName: ruleName });
                    console.log('🎯 [LasiKPI] 规则名称:', ruleName, '(两个指标分值不一致)');
                }
                return;
            }

            if (selectedIndicators.length === 1) {
                const indicator = selectedIndicators[0];
                const indicatorName = indicator === 'best' ? '最好成绩' :
                    indicator === 'worst' ? '最差成绩' : '总成绩';
                const ruleName = `拉丝一点${indicatorName}`;
                this.setData({ generatedRuleName: ruleName });
                console.log('🎯 [LasiKPI] 规则名称:', ruleName, '(单个指标)');
                return;
            }

            this.setData({ generatedRuleName: '四人拉丝' });
            console.log('🎯 [LasiKPI] 规则名称: 四人拉丝 (默认)');
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
        },

        // 测试命名规则 - 开发调试用
        testNamingRules() {
            console.log('🎯 [LasiKPI] ===== 测试拉丝规则命名 =====');

            const testCases = [
                // 测试用例1: 三个指标，分值一致
                {
                    selectedIndicators: ['best', 'worst', 'total'],
                    kpiValues: { best: 1, worst: 1, total: 1 },
                    expected: '拉丝三点'
                },
                // 测试用例2: 三个指标，分值不一致 - 按头尾总顺序
                {
                    selectedIndicators: ['best', 'worst', 'total'],
                    kpiValues: { best: 4, worst: 2, total: 1 },
                    expected: '421'
                },
                // 测试用例3: 三个指标，分值不一致 - 不同选中顺序
                {
                    selectedIndicators: ['total', 'best', 'worst'],
                    kpiValues: { best: 3, worst: 1, total: 5 },
                    expected: '315'
                },
                // 测试用例4: 两个指标，分值一致 - 头尾
                {
                    selectedIndicators: ['best', 'worst'],
                    kpiValues: { best: 2, worst: 2, total: 1 },
                    expected: '头尾两点'
                },
                // 测试用例5: 两个指标，分值一致 - 头总（按顺序排列）
                {
                    selectedIndicators: ['best', 'total'],
                    kpiValues: { best: 3, worst: 1, total: 3 },
                    expected: '头总两点'
                },
                // 测试用例6: 两个指标，分值一致 - 头总（反序排列）
                {
                    selectedIndicators: ['total', 'best'],
                    kpiValues: { best: 3, worst: 1, total: 3 },
                    expected: '头总两点'
                },
                // 测试用例7: 两个指标，分值一致 - 头尾（按顺序排列）
                {
                    selectedIndicators: ['best', 'worst'],
                    kpiValues: { best: 2, worst: 2, total: 1 },
                    expected: '头尾两点'
                },
                // 测试用例8: 两个指标，分值一致 - 头尾（反序排列）
                {
                    selectedIndicators: ['worst', 'best'],
                    kpiValues: { best: 2, worst: 2, total: 1 },
                    expected: '头尾两点'
                },
                // 测试用例9: 两个指标，分值一致 - 尾总（按顺序排列）
                {
                    selectedIndicators: ['worst', 'total'],
                    kpiValues: { best: 1, worst: 4, total: 4 },
                    expected: '尾总两点'
                },
                // 测试用例10: 两个指标，分值一致 - 尾总（反序排列）
                {
                    selectedIndicators: ['total', 'worst'],
                    kpiValues: { best: 1, worst: 4, total: 4 },
                    expected: '尾总两点'
                },
                // 测试用例11: 两个指标，分值不一致 - 头N尾M（按顺序排列）
                {
                    selectedIndicators: ['best', 'worst'],
                    kpiValues: { best: 4, worst: 2, total: 1 },
                    expected: '头4尾2'
                },
                // 测试用例12: 两个指标，分值不一致 - 头N尾M（反序排列）
                {
                    selectedIndicators: ['worst', 'best'],
                    kpiValues: { best: 4, worst: 2, total: 1 },
                    expected: '头4尾2'
                },
                // 测试用例13: 两个指标，分值不一致 - 头N总M（按顺序排列）
                {
                    selectedIndicators: ['best', 'total'],
                    kpiValues: { best: 3, worst: 1, total: 5 },
                    expected: '头3总5'
                },
                // 测试用例14: 两个指标，分值不一致 - 头N总M（反序排列）
                {
                    selectedIndicators: ['total', 'best'],
                    kpiValues: { best: 3, worst: 1, total: 5 },
                    expected: '头3总5'
                },
                // 测试用例15: 两个指标，分值不一致 - 尾N总M（按顺序排列）
                {
                    selectedIndicators: ['worst', 'total'],
                    kpiValues: { best: 1, worst: 2, total: 4 },
                    expected: '尾2总4'
                },
                // 测试用例16: 两个指标，分值不一致 - 尾N总M（反序排列）
                {
                    selectedIndicators: ['total', 'worst'],
                    kpiValues: { best: 1, worst: 2, total: 4 },
                    expected: '尾2总4'
                },
                // 测试用例17: 单个指标 - 最好成绩
                {
                    selectedIndicators: ['best'],
                    kpiValues: { best: 4, worst: 1, total: 1 },
                    expected: '拉丝一点最好成绩'
                },
                // 测试用例18: 单个指标 - 最差成绩
                {
                    selectedIndicators: ['worst'],
                    kpiValues: { best: 1, worst: 3, total: 1 },
                    expected: '拉丝一点最差成绩'
                },
                // 测试用例19: 单个指标 - 总成绩
                {
                    selectedIndicators: ['total'],
                    kpiValues: { best: 1, worst: 1, total: 5 },
                    expected: '拉丝一点总成绩'
                }
            ];

            testCases.forEach((testCase, index) => {
                console.log(`🎯 [LasiKPI] 测试用例 ${index + 1}:`, testCase);

                // 临时设置数据
                this.setData({
                    selectedIndicators: testCase.selectedIndicators,
                    kpiValues: testCase.kpiValues
                });

                // 生成规则名称
                this.generateRuleName();

                // 检查结果
                const actual = this.data.generatedRuleName;
                const passed = actual === testCase.expected;

                console.log(`🎯 [LasiKPI] 期望: "${testCase.expected}", 实际: "${actual}", 通过: ${passed ? '✅' : '❌'}`);
            });

            console.log('🎯 [LasiKPI] ===== 测试完成 =====');
        }
    }
});