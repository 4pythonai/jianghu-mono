Component({
    properties: {
        visible: {
            type: Boolean,
            value: false
        },
        hindex: {
            type: Number,
            value: 0
        },
        holename: {
            type: String,
            value: ''
        }
    },

    data: {
        selectedMultiplier: 1,
        customValue: '',
        isCustomActive: false
    },

    methods: {
        // 选择倍数
        onSelectMultiplier(e) {
            const multiplier = parseInt(e.currentTarget.dataset.multiplier);
            this.setData({
                selectedMultiplier: multiplier,
                isCustomActive: false
            });
        },

        // 自定义输入变化
        onCustomInputChange(e) {
            const value = e.detail.value;
            this.setData({
                customValue: value,
                selectedMultiplier: 0,
                isCustomActive: true
            });
        },

        // 自定义输入框点击
        onCustomInputTap() {
            this.setData({
                selectedMultiplier: 0,
                isCustomActive: true
            });
        },

        // 确认选择
        onConfirm() {
            const { hindex, selectedMultiplier, customValue, isCustomActive } = this.data;
            let multiplier;

            if (isCustomActive && customValue) {
                multiplier = parseFloat(customValue) || 1;
            } else {
                multiplier = selectedMultiplier;
            }

            this.triggerEvent('confirm', {
                hindex,
                multiplier,
                customValue: isCustomActive ? customValue : ''
            });

            this.close();
        },

        // 取消
        onCancel() {
            this.triggerEvent('cancel');
            this.close();
        },

        // 关闭弹窗
        close() {
            this.setData({
                visible: false,
                selectedMultiplier: 1,
                customValue: '',
                isCustomActive: false
            });
        },

        // 阻止冒泡
        noop() { }
    }
});