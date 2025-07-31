import { G4PLasiStore } from '../../../../stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js'
import { observable, action } from 'mobx-miniprogram'

Component({
    properties: {
        // 组件属性
    },

    data: {
        // 奖励规则选项
        rewardOptions: [
            { value: 'addition', label: '加法奖励', desc: '在基础分数上增加奖励分数' },
            { value: 'multiplier', label: '倍数奖励', desc: '基础分数乘以倍数' },
            { value: 'fixed', label: '固定奖励', desc: '获得固定的奖励分数' }
        ],
        // 当前选中的奖励类型
        selectedRewardType: '',
        // 奖励前置条件
        rewardConditions: [],
        // 是否启用奖励
        enabled: false,
        // 是否显示详细说明
        showDetail: false,
        // 前置条件选项
        conditionOptions: [
            { value: 'has_total_score', label: '有总杆指标', desc: '当拉丝指标包含总杆时' },
            { value: 'has_best_score', label: '有最好成绩', desc: '当拉丝指标包含最好成绩时' },
            { value: 'has_worst_score', label: '有最差成绩', desc: '当拉丝指标包含最差成绩时' }
        ]
    },

    lifetimes: {
        attached() {
            console.log('�� [LasiRewardConfig] 拉丝奖励配置组件加载');
            // 初始化时从Store获取当前配置
            this.setData({
                enabled: G4PLasiStore.lasi_reward_config.enabled || false,
                selectedRewardType: G4PLasiStore.lasi_reward_config.type || '',
                rewardConditions: G4PLasiStore.lasi_reward_config.conditions || []
            });
        }
    },

    methods: {
        // 切换奖励启用状态
        onToggleEnabled() {
            const newEnabled = !this.data.enabled;
            this.setData({
                enabled: newEnabled
            });

            // 更新Store
            G4PLasiStore.updateRewardConfig({
                enabled: newEnabled
            });
        },

        // 选择奖励类型
        onSelectRewardType(e) {
            const { value } = e.currentTarget.dataset;
            this.setData({
                selectedRewardType: value
            });

            // 更新Store
            G4PLasiStore.updateRewardConfig({
                type: value
            });
        },

        // 选择前置条件
        onSelectCondition(e) {
            const { value } = e.currentTarget.dataset;
            const { rewardConditions } = this.data;

            let newConditions;
            if (rewardConditions.includes(value)) {
                // 取消选择
                newConditions = rewardConditions.filter(item => item !== value);
            } else {
                // 添加选择
                newConditions = [...rewardConditions, value];
            }

            this.setData({
                rewardConditions: newConditions
            });

            // 更新Store
            G4PLasiStore.updateRewardConfig({
                conditions: newConditions
            });
        },



        // 获取奖励类型描述
        getRewardTypeDescription(value) {
            const option = this.data.rewardOptions.find(opt => opt.value === value);
            return option ? option.desc : '';
        },

        // 获取奖励类型标签
        getRewardTypeLabel(value) {
            const option = this.data.rewardOptions.find(opt => opt.value === value);
            return option ? option.label : '';
        },

        // 获取条件描述
        getConditionDescription(value) {
            const option = this.data.conditionOptions.find(opt => opt.value === value);
            return option ? option.desc : '';
        },

        // 获取条件标签
        getConditionLabel(value) {
            const option = this.data.conditionOptions.find(opt => opt.value === value);
            return option ? option.label : '';
        },

        // 检查前置条件是否可选
        isConditionSelectable() {
            // 检查当前拉丝配置中是否有总杆指标
            const hasTotalScore = G4PLasiStore.lasi_config.indicators.includes('sum') ||
                G4PLasiStore.lasi_config.indicators.includes('product');
            return hasTotalScore;
        }
    }
});