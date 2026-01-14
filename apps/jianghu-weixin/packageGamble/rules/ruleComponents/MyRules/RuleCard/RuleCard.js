import { parseGambleRule } from '../../../../utils/gambleRuleParser.js';
import { GambleMetaConfig } from '@/utils/GambleMetaConfig.js';

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        item: {
            type: Object,
            value: {}
        },
        showEdit: {
            type: Boolean,
            value: false
        },
        minPlayerCount: {
            type: Number,
            value: 0 // 最少玩家数量要求
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        configDetails: {}, // 存储解析后的配置详情
        playerCount: 0, // 玩家数量
        ruleTypeLabel: '' // 规则类型标签
    },

    /**
     * 组件生命周期
     */
    lifetimes: {
        attached() {
            this.parseConfigDetails();
        }
    },

    /**
     * 监听属性变化
     */
    observers: {
        'item': function (item) {
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
            if (!item?.gambleSysName) return;

            // 解析规则配置
            const details = parseGambleRule(item, item.gambleSysName);

            // 根据规则类型设置玩家数量和标签
            const gameType = GambleMetaConfig.getGambleType(item.gambleSysName);
            const playerCount = gameType?.playerCount || 0;
            const ruleTypeLabel = gameType?.ruleTypeLabel || '未知';

            this.setData({
                configDetails: details,
                playerCount,
                ruleTypeLabel
            });
        },

        /**
         * 获取规则组别
         */
        getRuleGroup() {
            const { playerCount } = this.data;
            const groupMap = {
                2: 'twoPlayers',
                3: 'threePlayers',
                4: 'fourPlayers'
            };
            return groupMap[playerCount] || 'fourPlayers';
        },

        /**
         * 编辑规则
         */
        onEditRule(e) {
            const { item } = e.currentTarget.dataset;
            const group = this.getRuleGroup();
            this.triggerEvent('editRule', { item, group, id: item.userRuleId });
        },

        /**
         * 查看规则详情
         */
        onCreateGamble(e) {
            const { item } = e.currentTarget.dataset;
            const group = this.getRuleGroup();
            const { minPlayerCount } = this.properties;
            this.triggerEvent('createNewGamble', { item, group, id: item.userRuleId, minPlayerCount });
        },

        /**
         * 长按规则
         */
        onLongPressRule(e) {
            const { item } = e.currentTarget.dataset;
            const group = this.getRuleGroup();
            this.triggerEvent('longPressRule', { item, group, id: item.userRuleId });
        },

        /**
         * 空事件处理
         */
        noTap() {
            return;
        }
    }
}) 