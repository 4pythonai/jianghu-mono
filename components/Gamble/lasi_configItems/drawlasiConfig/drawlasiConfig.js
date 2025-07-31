import { G4PLasiStore } from '../../../../stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js'
import { observable, action } from 'mobx-miniprogram'

Component({
    properties: {
        // 组件属性
    },

    data: {
        // 拉丝指标选项
        indicatorOptions: [
            { value: 'best', label: '最好成绩', desc: '取组内最好成绩进行比较' },
            { value: 'worst', label: '最差成绩', desc: '取组内最差成绩进行比较' },
            { value: 'sum', label: '总杆和', desc: '组内所有成绩相加' },
            { value: 'product', label: '总杆乘积', desc: '组内所有成绩相乘' }
        ],
        // 当前选中的指标
        selectedIndicators: [],
        // 总杆计算方式
        totalCalculation: 'sum',
        // 是否显示详细说明
        showDetail: false,
        // 生成的规则名称
        generatedRuleName: ''
    },

    lifetimes: {
        attached() {
            console.log('�� [DrawLasiConfig] 拉丝配置组件加载');
            // 初始化时从Store获取当前配置
            this.setData({
                selectedIndicators: G4PLasiStore.lasi_config.indicators || [],
                totalCalculation: G4PLasiStore.lasi_config.totalCalculation || 'sum'
            });
            this.generateRuleName();
        }
    },

    methods: {
        // 选择拉丝指标
        onSelectIndicator(e) {
            const { value } = e.currentTarget.dataset;
            const { selectedIndicators } = this.data;

            let newSelectedIndicators;
            if (selectedIndicators.includes(value)) {
                // 取消选择
                newSelectedIndicators = selectedIndicators.filter(item => item !== value);
            } else {
                // 添加选择
                newSelectedIndicators = [...selectedIndicators, value];
            }

            this.setData({
                selectedIndicators: newSelectedIndicators
            });

            // 更新Store
            G4PLasiStore.updateLasiConfig({
                indicators: newSelectedIndicators
            });

            this.generateRuleName();
        },

        // 切换总杆计算方式
        onToggleCalculation() {
            const newCalculation = this.data.totalCalculation === 'sum' ? 'product' : 'sum';
            this.setData({
                totalCalculation: newCalculation
            });

            // 更新Store
            G4PLasiStore.updateLasiConfig({
                totalCalculation: newCalculation
            });

            this.generateRuleName();
        },

        // 切换详细说明显示
        onToggleDetail() {
            this.setData({
                showDetail: !this.data.showDetail
            });
        },

        // 生成规则名称
        generateRuleName() {
            const { selectedIndicators, totalCalculation } = this.data;

            if (selectedIndicators.length === 0) {
                this.setData({ generatedRuleName: '四人拉丝' });
                return;
            }

            if (selectedIndicators.length === 1) {
                const indicator = selectedIndicators[0];
                const indicatorMap = {
                    'best': '最好',
                    'worst': '最差',
                    'sum': totalCalculation === 'sum' ? '总和' : '乘积',
                    'product': totalCalculation === 'sum' ? '总和' : '乘积'
                };
                this.setData({ generatedRuleName: `拉丝${indicatorMap[indicator]}` });
                return;
            }

            if (selectedIndicators.length === 2) {
                const [first, second] = selectedIndicators;
                const indicatorMap = {
                    'best': '头',
                    'worst': '尾',
                    'sum': '总',
                    'product': '积'
                };
                this.setData({ generatedRuleName: `${indicatorMap[first]}${indicatorMap[second]}` });
                return;
            }

            if (selectedIndicators.length === 3) {
                const indicatorMap = {
                    'best': '2',
                    'worst': '1',
                    'sum': '2',
                    'product': '1'
                };
                const name = selectedIndicators.map(indicator => indicatorMap[indicator]).join('');
                this.setData({ generatedRuleName: name });
                return;
            }

            this.setData({ generatedRuleName: '四人拉丝' });
        },

        // 获取指标描述
        getIndicatorDescription(value) {
            const option = this.data.indicatorOptions.find(opt => opt.value === value);
            return option ? option.desc : '';
        },

        // 获取指标标签
        getIndicatorLabel(value) {
            const option = this.data.indicatorOptions.find(opt => opt.value === value);
            return option ? option.label : '';
        }
    }
});