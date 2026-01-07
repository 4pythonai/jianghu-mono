/**
 * 底部操作栏组件
 * 支持双按钮模式：分享 + 主操作（报名/取消报名等）
 */
Component({
    properties: {
        /** 左侧按钮文字 */
        leftText: {
            type: String,
            value: '分享'
        },
        /** 右侧按钮文字 */
        rightText: {
            type: String,
            value: '报名'
        },
        /** 右侧按钮类型: primary(绿色) | warning(黄色) | danger(红色) */
        rightType: {
            type: String,
            value: 'primary'
        },
        /** 是否禁用右侧按钮 */
        rightDisabled: {
            type: Boolean,
            value: false
        },
        /** 是否显示左侧按钮 */
        showLeft: {
            type: Boolean,
            value: true
        },
        /** 是否显示右侧按钮 */
        showRight: {
            type: Boolean,
            value: true
        }
    },

    methods: {
        onLeftTap() {
            if (!this.properties.showLeft) return
            this.triggerEvent('leftTap')
        },

        onRightTap() {
            if (!this.properties.showRight || this.properties.rightDisabled) return
            this.triggerEvent('rightTap')
        }
    }
})
