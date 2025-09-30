// RankingSelector组件 - 排名规则选择器
const RuntimeComponentsUtils = require('../common-utils.js');

Component({
    properties: {
        // 当前选中的配置
        selectedConfig: {
            type: String,
            value: 'indicator.reverse_indicator'
        },
        // 球员指标配置
        playerIndicatorConfig: {
            type: Object,
            value: {}
        }
    },


    data: {
        // 排名配置选项
        rankingOptions: [
            {
                value: 'indicator.reverse_indicator',
                label: '1得分相同按出身得分排序',
                requiresDifferentIndicators: true
            },
            {
                value: 'indicator.win_loss.reverse_win',
                label: '2得分相同按输赢排序，输赢相同按出身输赢排序',
                requiresDifferentIndicators: true
            },
            {
                value: 'indicator.win_loss.reverse_indicator',
                label: '3得分相同按输赢排序，输赢相同按出身得分排序',
                requiresDifferentIndicators: true
            },
            {
                value: 'score.reverse_score',
                label: '4成绩相同按出身成绩排序',
                requiresDifferentIndicators: false
            },
            {
                value: 'score.win_loss.reverse_win',
                label: '5成绩相同按输赢排序，输赢相同按出身输赢排序',
                requiresDifferentIndicators: false
            },
            {
                value: 'score.win_loss.reverse_score',
                label: '6成绩相同按输赢排序，输赢相同按出身成绩排序',
                requiresDifferentIndicators: false
            }

        ],

        // 当前选中的索引
        selectedIndex: 0,

        // 是否有差异化的指标配置
        hasDifferentIndicators: false
    },

    lifetimes: {
        attached() {
            console.log('[Rank8421] 🚀 组件挂载, properties:', {
                playerIndicatorConfig: this.properties.playerIndicatorConfig,
                selectedConfig: this.properties.selectedConfig
            });
            this.updateIndicatorStatus();
            this.updateSelectedIndex();
        }
    },

    observers: {
        'selectedConfig': function (selectedConfig) {
            console.log('[Rank8421] 📝 selectedConfig 变化:', selectedConfig);
            this.updateSelectedIndex();
        },
        'playerIndicatorConfig': function (playerIndicatorConfig) {
            console.log('[Rank8421] 🎯 playerIndicatorConfig 变化:', playerIndicatorConfig);
            this.updateIndicatorStatus();
        }
    },

    methods: {
        // 更新指标差异化状态
        updateIndicatorStatus() {
            const config = this.properties.playerIndicatorConfig || {};
            const indicators = Object.values(config);

            // 将对象转换为 JSON 字符串进行比较
            const indicatorsJSON = indicators.map(i => JSON.stringify(i));
            const uniqueJSONCount = new Set(indicatorsJSON).size;

            console.log('[Rank8421] 🔍 检查指标配置:', {
                config,
                indicators,
                indicatorsLength: indicators.length,
                indicatorsJSON,
                uniqueJSONStrings: [...new Set(indicatorsJSON)],
                uniqueJSONCount
            });

            // 检查是否所有球员的指标配置都相同
            // 使用 JSON 字符串比较，因为 indicators 是对象数组
            const hasDifferentIndicators = indicators.length > 0 &&
                                          uniqueJSONCount > 1;

            console.log('[Rank8421] 📊 差异化检查结果:', {
                hasDifferentIndicators,
                reason: indicators.length === 0 ? '无配置' :
                       uniqueJSONCount === 1 ? '所有配置相同' : '有差异配置'
            });

            this.setData({ hasDifferentIndicators });

            RuntimeComponentsUtils.logger.log('RANKING_SELECTOR', '更新指标状态', {
                hasDifferentIndicators,
                indicators,
                uniqueJSONCount
            });

            // 如果当前选中的选项需要差异化指标但没有差异化配置，自动切换到有效选项
            if (!hasDifferentIndicators) {
                const currentOption = this.data.rankingOptions[this.data.selectedIndex];
                if (currentOption?.requiresDifferentIndicators) {
                    const firstValidIndex = this.data.rankingOptions.findIndex(
                        opt => !opt.requiresDifferentIndicators
                    );
                    if (firstValidIndex >= 0) {
                        this.setData({ selectedIndex: firstValidIndex });
                        RuntimeComponentsUtils.logger.log('RANKING_SELECTOR', '自动切换到有效选项', {
                            newIndex: firstValidIndex
                        });
                    }
                }
            }
        },

        // 更新选中的索引
        updateSelectedIndex() {
            const { selectedConfig, rankingOptions, hasDifferentIndicators } = this.data;

            // 如果 selectedConfig 为空，使用默认值
            if (!selectedConfig) {
                const defaultIndex = hasDifferentIndicators ?
                    0 :
                    rankingOptions.findIndex(opt => !opt.requiresDifferentIndicators);
                this.setData({
                    selectedIndex: Math.max(0, defaultIndex)
                });
                return;
            }

            const selectedIndex = rankingOptions.findIndex(option => option.value === selectedConfig);
            const validIndex = Math.max(0, selectedIndex);

            // 检查选中的选项是否需要差异化指标但没有差异化配置
            const selectedOption = rankingOptions[validIndex];
            if (!hasDifferentIndicators && selectedOption?.requiresDifferentIndicators) {
                // 切换到第一个不需要差异化指标的选项
                const firstValidIndex = rankingOptions.findIndex(
                    opt => !opt.requiresDifferentIndicators
                );
                this.setData({
                    selectedIndex: Math.max(0, firstValidIndex)
                });
            } else {
                this.setData({
                    selectedIndex: validIndex
                });
            }

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

            // 检查该选项是否需要差异化指标配置
            if (selectedOption.requiresDifferentIndicators && !this.data.hasDifferentIndicators) {
                wx.showToast({
                    title: '该选项需要差异化的球员指标配置',
                    icon: 'none',
                    duration: 2000
                });
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