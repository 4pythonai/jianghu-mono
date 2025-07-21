import { parseGambleRule } from '../../../../utils/gambleRuleParser.js';

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

            const details = parseGambleRule(item, '4p-8421');
            console.log('🎯 [R4P8421] 解析的配置详情:', details);
            this.setData({ configDetails: details });
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
