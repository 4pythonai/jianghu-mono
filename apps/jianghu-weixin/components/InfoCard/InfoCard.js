/**
 * 通用信息卡片组件
 * 支持标题 + 内容区域（slot）
 */
Component({
    options: {
        multipleSlots: true
    },

    properties: {
        /** 卡片标题 */
        title: {
            type: String,
            value: ''
        },
        /** 是否显示标题 */
        showTitle: {
            type: Boolean,
            value: true
        },
        /** 内边距大小: normal | compact | none */
        padding: {
            type: String,
            value: 'normal'
        }
    },

    methods: {}
})
