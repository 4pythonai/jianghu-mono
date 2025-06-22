Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {
        isVisible: false, // 控制面板显示/隐藏
    },

    /**
     * 组件的方法列表
     */
    methods: {
        // 显示面板
        show(options = {}) {
            console.log('📋 [AddPlayerHubPanel] 显示面板', options);
            this.setData({
                isVisible: true,
                ...options
            });
        },

        // 隐藏面板
        hide() {
            console.log('📋 [AddPlayerHubPanel] 隐藏面板');
            this.setData({
                isVisible: false
            });
        },

        // 阻止冒泡
        stopPropagation() {
            // 空函数，用于阻止点击面板内容时关闭弹窗
        },

        // 确定按钮点击
        onConfirm() {
            console.log('📋 [AddPlayerHubPanel] 点击确定');
            // TODO: 实现添加球员逻辑

            // 触发自定义事件
            this.triggerEvent('confirm', {
                // 这里传递确认后的数据
            });

            // 隐藏面板
            this.hide();
        }
    }
}) 