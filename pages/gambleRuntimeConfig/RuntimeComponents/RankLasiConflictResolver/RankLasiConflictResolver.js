// RankingSelector组件 - 排名规则选择器
const RuntimeComponentsUtils = require('../common-utils.js');

Component({
    properties: {
        // 当前选中的配置
        selectedConfig: {
            type: String,
            value: ''  // 移除硬编码的默认值，让父组件决定
        },
        // 让杆配置
        strokingConfig: {
            type: Array,
            value: []
        }
    },


    data: {
        // 排名配置选项
        // score:成绩,即杆数
        // stroking 让完的杆数
        rankingOptions: [
            {
                value: 'STscore.reverse_STscore',
                label: '1受让成绩相同按出身受让成绩排序',
                requiresStroking: true
            },
            {
                value: 'STscore.win_loss.reverse_STscore',
                label: '2受让成绩相同按输赢排序，输赢相同按出身受让成绩排序',
                requiresStroking: true
            },
            {
                value: 'STscore.win_loss.reverse_win',
                label: '3受让成绩相同按输赢排序，输赢相同按出身受让成绩排序',
                requiresStroking: true
            },
            {
                value: 'score.reverse_score',
                label: '4成绩相同按出身成绩排序',
                requiresStroking: false
            },
            {
                value: 'score.win_loss.reverse_score',
                label: '5成绩相同按输赢排序，输赢相同按出身成绩排序',
                requiresStroking: false
            },
            {
                value: 'score.win_loss.reverse_win',
                label: '6成绩相同按输赢排序，输赢相同按出身输赢排序',
                requiresStroking: false
            },


        ],

        // 当前选中的索引
        selectedIndex: 0,  // 改为 0，作为默认值

        // 是否有让杆配置
        hasStroking: false
    },

    lifetimes: {
        attached() {
            this.updateStrokingStatus();
            this.updateSelectedIndex();
        }
    },

    observers: {
        'selectedConfig': function (selectedConfig) {
            this.updateSelectedIndex();
        },
        'strokingConfig': function (strokingConfig) {
            this.updateStrokingStatus();
        }
    },

    methods: {
        // 更新让杆状态
        updateStrokingStatus() {
            const hasStroking = Array.isArray(this.properties.strokingConfig) &&
                                this.properties.strokingConfig.length > 0;

            this.setData({ hasStroking });

            RuntimeComponentsUtils.logger.log('RANKING_SELECTOR', '更新让杆状态', {
                hasStroking,
                strokingConfigLength: this.properties.strokingConfig?.length || 0
            });

            // 如果当前选中的选项需要让杆但没有让杆配置，自动切换到第一个不需要让杆的选项
            if (!hasStroking) {
                const currentOption = this.data.rankingOptions[this.data.selectedIndex];
                if (currentOption?.requiresStroking) {
                    const firstValidIndex = this.data.rankingOptions.findIndex(opt => !opt.requiresStroking);
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
            const { selectedConfig, rankingOptions, hasStroking } = this.data;

            // 如果 selectedConfig 为空，使用默认值
            if (!selectedConfig) {
                // 如果有让杆配置，默认选择第一个选项；否则选择第一个不需要让杆的选项
                const defaultIndex = hasStroking ? 0 : rankingOptions.findIndex(opt => !opt.requiresStroking);
                this.setData({
                    selectedIndex: Math.max(0, defaultIndex)
                });
                return;
            }

            const selectedIndex = rankingOptions.findIndex(option => option.value === selectedConfig);
            const validIndex = Math.max(0, selectedIndex);

            // 检查选中的选项是否需要让杆但没有让杆配置
            const selectedOption = rankingOptions[validIndex];
            if (!hasStroking && selectedOption?.requiresStroking) {
                // 切换到第一个不需要让杆的选项
                const firstValidIndex = rankingOptions.findIndex(opt => !opt.requiresStroking);
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

            // 检查该选项是否需要让杆配置
            if (selectedOption.requiresStroking && !this.data.hasStroking) {
                wx.showToast({
                    title: '该选项需要配置让杆',
                    icon: 'none'
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