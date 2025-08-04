import { parseGambleRule } from '../../../../../../../utils/gambleRuleParser.js';

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
        configDetails: [] // 存储解析后的配置详情
    },

    /**
     * 组件生命周期
     */
    lifetimes: {
        attached() {
            this.parseConfigDetails();
        },

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
            if (!item) return;

            const details = parseGambleRule(item, '4p-lasi');
            this.setData({ configDetails: details });
        },

        /**
         * 编辑规则
         */
        onEditRule(e) {
            const { item } = e.currentTarget.dataset;
            this.triggerEvent('editRule', { item, group: 'fourPlayers', id: item.userRuleId });
        },

        /**
         * 查看规则详情
         */
        onViewRule(e) {
            const { item } = e.currentTarget.dataset;
            this.triggerEvent('viewRule', { item, group: 'fourPlayers', id: item.userRuleId });
        },

        /**
         * 长按规则
         */
        onLongPressRule(e) {
            const { item } = e.currentTarget.dataset;
            this.triggerEvent('longPressRule', { item, group: 'fourPlayers', id: item.userRuleId });
        }
    }
})
