// RankingSelector组件 - 排名规则选择器
const RuntimeComponentsUtils = require('../common-utils.js');

Component({
    properties: {
        // 当前选中的配置
        selectedConfig: {
            type: String,
            value: 'score_based'
        }
    },

    data: {
        // 排名配置选项
        rankingOptions: [
            {
                value: 'score.reverse',
                label: '按成绩排序，冲突时回溯成绩',
            },
            {
                value: 'score.win_loss.reverse_win',
                label: '按成绩排序，按输赢，回溯输赢',
            },
            {
                value: 'score.win_loss.reverse_score',
                label: '按成绩排序，按输赢，回溯成绩',
            },
            {
                value: 'indicator.reverse',
                label: '按得分排序，冲突时回溯得分',
            },
            {
                value: 'indicator.win_loss.reverse_win',
                label: '按得分排序，按输赢，回溯输赢',
            },
            {
                value: 'indicator.win_loss.reverse_indicator',
                label: '按得分排序，按输赢，回溯得分',
            }
        ],

        // 当前选中的索引
        selectedIndex: 0
    },

    lifetimes: {
        attached() {
            this.updateSelectedIndex();
        }
    },

    observers: {
        'selectedConfig': function (selectedConfig) {
            this.updateSelectedIndex();
        }
    },

    methods: {
        // 更新选中的索引
        updateSelectedIndex() {
            const { selectedConfig, rankingOptions } = this.data;
            const selectedIndex = rankingOptions.findIndex(option => option.value === selectedConfig);

            this.setData({
                selectedIndex: Math.max(0, selectedIndex)
            });

            RuntimeComponentsUtils.logger.log('RANKING_SELECTOR', '更新选中配置', {
                selectedConfig,
                selectedIndex: this.data.selectedIndex
            });
        },

        // 选择排名配置
        onSelectRanking(e) {
            const { index } = e.currentTarget.dataset;
            const selectedIndex = Number.parseInt(index);
            const selectedOption = this.data.rankingOptions[selectedIndex];

            if (!selectedOption) {
                RuntimeComponentsUtils.logger.error('RANKING_SELECTOR', '无效的选项索引', selectedIndex);
                return;
            }

            this.setData({
                selectedIndex
            });

            RuntimeComponentsUtils.logger.log('RANKING_SELECTOR', '选择排名配置', selectedOption);

            // 触发变更事件
            this.triggerEvent('change', {
                ranking_tie_resolve_config: selectedOption.value
            });
        },

        // 获取当前选中的配置信息
        getCurrentConfig() {
            const { selectedIndex, rankingOptions } = this.data;
            return rankingOptions[selectedIndex] || rankingOptions[0];
        }
    }
}); 