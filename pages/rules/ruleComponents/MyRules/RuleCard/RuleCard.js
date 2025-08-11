import { parseGambleRule } from '../../../../../utils/gambleRuleParser.js';

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
            const { playerCount, ruleTypeLabel } = this.getRuleTypeInfo(item.gambleSysName);

            this.setData({
                configDetails: details,
                playerCount,
                ruleTypeLabel
            });
        },

        /**
         * 根据规则类型获取玩家数量和标签
         */
        getRuleTypeInfo(gambleSysName) {
            const ruleTypeMap = {
                '4p-8421': { playerCount: 4, ruleTypeLabel: '4人' },
                '4p-lasi': { playerCount: 4, ruleTypeLabel: '4人' },
                '3p-8421': { playerCount: 3, ruleTypeLabel: '3人' },
                '3p-lasi': { playerCount: 3, ruleTypeLabel: '3人' },
                '2p-8421': { playerCount: 2, ruleTypeLabel: '2人' },
                '2p-lasi': { playerCount: 2, ruleTypeLabel: '2人' }
            };

            return ruleTypeMap[gambleSysName] || { playerCount: 0, ruleTypeLabel: '未知' };
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
            this.triggerEvent('createNewGamble', { item, group, id: item.userRuleId });
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