// RankingSelector组件 - 排名规则选择器
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
                value: 'score_based',
                label: '基于得分排名',
                description: '根据玩家当前得分进行排名，得分低的排名靠前'
            },
            {
                value: 'handicap_based',
                label: '基于差点排名',
                description: '根据玩家差点进行排名，差点高的排名靠前'
            },
            {
                value: 'random',
                label: '随机排名',
                description: '完全随机分配排名，不考虑得分或差点'
            },
            {
                value: 'previous_hole_based',
                label: '基于上一洞表现',
                description: '根据玩家上一洞的表现进行排名'
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

            console.log('🏆 [RankingSelector] 更新选中配置:', {
                selectedConfig,
                selectedIndex: this.data.selectedIndex
            });
        },

        // 选择排名配置
        onSelectRanking(e) {
            const { index } = e.currentTarget.dataset;
            const selectedIndex = parseInt(index);
            const selectedOption = this.data.rankingOptions[selectedIndex];

            if (!selectedOption) {
                console.error('🏆 [RankingSelector] 无效的选项索引:', selectedIndex);
                return;
            }

            this.setData({
                selectedIndex
            });

            console.log('🏆 [RankingSelector] 选择排名配置:', selectedOption);

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