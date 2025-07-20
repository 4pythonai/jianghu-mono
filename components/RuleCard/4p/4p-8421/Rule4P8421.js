Component({
    /**
     * 组件的属性列表
     */
    properties: {
        item: {
            type: Object,
            value: {}
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        configDetails: [] // 存储解析后的配置详情
    },

    /**
     * 组件生命周期
     */
    lifetimes: {
        attached() {
            console.log('🎯 [R4P8421] 组件已加载, item:', this.data.item);
            this.parseConfigDetails();
        },

    },

    /**
     * 监听属性变化
     */
    observers: {
        'item': function (item) {
            console.log('🎯 [R4P8421] item数据变化:', item);
            this.parseConfigDetails();
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 解析配置详情
         */
        parseConfigDetails() {
            const { item } = this.data;
            if (!item) return;

            const details = {
                koufen: '无',
                eatmeat: '无',
                draw: '无'
            };

            // 解析扣分配置
            if (item.sub8421_config_string) {
                const koufenDetail = this.parseKoufenConfig(item);
                if (koufenDetail) details.koufen = koufenDetail;
            }

            // 解析吃肉配置
            if (item.meat_value_config_string) {
                const eatmeatDetail = this.parseEatmeatConfig(item);
                if (eatmeatDetail) details.eatmeat = eatmeatDetail;
            }

            // 解析顶洞配置
            if (item.draw8421_config) {
                const drawDetail = this.parseDrawConfig(item);
                if (drawDetail) details.draw = drawDetail;
            }

            console.log('🎯 [R4P8421] 解析的配置详情:', details);
            this.setData({ configDetails: details });
        },

        /**
         * 解析扣分配置
         */
        parseKoufenConfig(item) {
            const { sub8421_config_string, max8421_sub_value, duty_config } = item;

            let detail = '';

            // 解析扣分开始条件
            if (sub8421_config_string === 'NoSub') {
                detail = '不扣分';
            } else if (sub8421_config_string.startsWith('Par+')) {
                const score = sub8421_config_string.replace('Par+', '');
                detail = `从帕+${score}开始扣分`;
            } else if (sub8421_config_string.startsWith('DoublePar+')) {
                const score = sub8421_config_string.replace('DoublePar+', '');
                detail = `从双帕+${score}开始扣分`;
            }

            // 解析封顶条件
            if (max8421_sub_value && max8421_sub_value !== "10000000" && max8421_sub_value !== 10000000) {
                detail += `，扣${max8421_sub_value}分封顶`;
            } else if (sub8421_config_string !== 'NoSub') {
                detail += '，不封顶';
            }

            // 解析同伴惩罚
            if (duty_config) {
                switch (duty_config) {
                    case 'NODUTY':
                        detail += '，不包负分';
                        break;
                    case 'DUTY_CODITIONAL':
                        detail += '，同伴顶头包负分';
                        break;
                    case 'DUTY_NEGATIVE':
                        detail += '，包负分';
                        break;
                }
            }

            return detail || null;
        },

        /**
         * 解析吃肉配置
         */
        parseEatmeatConfig(item) {
            const { meat_value_config_string, meat_max_value, eating_range } = item;

            console.log('🎯 [R4P8421] 解析吃肉配置:', { meat_value_config_string, meat_max_value, eating_range });

            let detail = '';

            // 解析吃肉数量 - 处理JSON字符串格式
            if (eating_range) {
                let eatRangeObj = null;

                // 如果是JSON字符串，需要解析
                if (typeof eating_range === 'string') {
                    try {
                        eatRangeObj = JSON.parse(eating_range);
                        console.log('🎯 [R4P8421] 解析eating_range成功:', eatRangeObj);
                    } catch (e) {
                        console.error('🎯 [R4P8421] 解析eating_range失败:', e);
                    }
                } else if (typeof eating_range === 'object') {
                    eatRangeObj = eating_range;
                    console.log('🎯 [R4P8421] eating_range是对象:', eatRangeObj);
                }

                if (eatRangeObj) {
                    // 键到中文标签的映射
                    const eatRangeLabels = {
                        "BetterThanBirdie": "帕以上",
                        "Birdie": "鸟",
                        "Par": "帕",
                        "WorseThanPar": "鸟以下"
                    };

                    // 按顺序显示
                    const eatRangeKeys = ["BetterThanBirdie", "Birdie", "Par", "WorseThanPar"];
                    const eatDetails = eatRangeKeys.map(key => {
                        const value = eatRangeObj[key];
                        const label = eatRangeLabels[key];
                        return `${label}${value}个`;
                    }).join('、');

                    detail = `${eatDetails}`;
                    console.log('🎯 [R4P8421] 吃肉数量解析结果:', detail);
                }
            }

            // 解析分值计算
            if (meat_value_config_string) {
                switch (meat_value_config_string) {
                    case 'MEAT_AS_1':
                        detail += '，肉算1分';
                        break;
                    case 'SINGLE_DOUBLE':
                        detail += '，分值翻倍';
                        break;
                    case 'CONTINUE_DOUBLE':
                        detail += '，分值连续翻倍';
                        break;
                }
                console.log('🎯 [R4P8421] 肉值计算解析结果:', detail);
            }

            // 解析封顶条件
            if (meat_max_value && meat_max_value !== "10000000" && meat_max_value !== 10000000) {
                detail += `，${meat_max_value}分封顶`;
            } else {
                detail += '，不封顶';
            }

            console.log('🎯 [R4P8421] 吃肉配置最终结果:', detail);
            return detail || null;
        },

        /**
         * 解析顶洞配置
         */
        parseDrawConfig(item) {
            const { draw8421_config } = item;

            if (!draw8421_config) return null;

            switch (draw8421_config) {
                case 'DrawEqual':
                    return '得分打平';
                case 'NoDraw':
                    return '无顶洞';
                default:
                    if (draw8421_config.startsWith('Diff_')) {
                        const score = draw8421_config.replace('Diff_', '');
                        return `得分${score}分以内`;
                    }
                    return null;
            }
        },

        /**
         * 编辑规则
         */
        onEditRule(e) {
            const { item } = e.currentTarget.dataset;
            console.log('🎯 [R4P8421] 编辑规则:', item);
            // 触发父组件的事件
            this.triggerEvent('editRule', { item, group: 'fourPlayers', id: item.userRuleId });
        },

        /**
         * 查看规则详情
         */
        onViewRule(e) {
            const { item } = e.currentTarget.dataset;
            console.log('🎯 [R4P8421] 查看规则:', item);
            // 触发父组件的事件
            this.triggerEvent('viewRule', { item, group: 'fourPlayers', id: item.userRuleId });
        },

        /**
         * 长按规则
         */
        onLongPressRule(e) {
            const { item } = e.currentTarget.dataset;
            console.log('🎯 [R4P8421] 长按规则:', item);
            // 触发父组件的事件
            this.triggerEvent('longPressRule', { item, group: 'fourPlayers', id: item.userRuleId });
        }
    }
})
