// RankingSelector组件 - 排名规则选择器
const RuntimeComponentsUtils = require('../common-utils.js');

Component({
    properties: {
        // 当前选中的配置
        selectedConfig: {
            type: String,
            value: 'score.reverse'
        }
    },


    data: {
        // 排名配置选项
        rankingOptions: [
            {
                value: 'indicator.reverse',
                label: '得分相同按出身得分排序',
            },
            {
                value: 'indicator.win_loss.reverse_win',
                label: '得分相同按输赢排序，输赢相同按出身得分排序',
            },
            {
                value: 'indicator.win_loss.reverse_indicator',
                label: '得分相同按输赢排序，输赢相同按出身输赢排序',
            },
            {
                value: 'score.reverse',
                label: '成绩相同按出身成绩排序',
            },
            {
                value: 'score.win_loss.reverse_win',
                label: '成绩相同按输赢排序，输赢相同按出身成绩排序',
            },
            {
                value: 'score.win_loss.reverse_score',
                label: '成绩相同按输赢排序，输赢相同按出身输赢排序',
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


    }
}); 