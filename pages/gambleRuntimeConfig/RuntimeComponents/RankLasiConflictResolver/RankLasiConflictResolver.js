// RankingSelector组件 - 排名规则选择器
const RuntimeComponentsUtils = require('../common-utils.js');

Component({
    properties: {
        // 当前选中的配置
        selectedConfig: {
            type: String,
            value: ''  // 移除硬编码的默认值，让父组件决定
        }
    },


    data: {
        // 排名配置选项
        rankingOptions: [
            {
                value: 'stroking.reverse',
                label: '1受让成绩相同按出身受让成绩排序',
            },
            {
                value: 'stroking.win_loss.reverse_indicator',
                label: '2受让成绩相同按输赢排序，输赢相同按前洞输赢排序',
            },
            {
                value: 'stroking.win_loss.reverse_win',
                label: '3受让成绩相同按输赢排序，输赢相同按前洞得分排序',
            },
            {
                value: 'score.reverse',
                label: '4成绩相同按出身成绩排序',
            },
            {
                value: 'score.win_loss.reverse_score',
                label: '5成绩相同按输赢排序，输赢相同按前洞输赢排序',
            },
            {
                value: 'score.win_loss.reverse_win',
                label: '6成绩相同按输赢排序，输赢相同按前洞成绩排序',
            },


        ],

        // 当前选中的索引
        selectedIndex: 0  // 改为 0，作为默认值
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

            // 如果 selectedConfig 为空，使用默认值
            if (!selectedConfig) {
                // 对于拉丝游戏，默认选择第一个选项
                this.setData({
                    selectedIndex: 0
                });
                return;
            }

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

        // 获取当前配置（用于外部收集配置）
        getConfig() {
            const selectedOption = this.data.rankingOptions[this.data.selectedIndex];
            return selectedOption ? selectedOption.value : this.data.selectedConfig;
        }
    }
}); 