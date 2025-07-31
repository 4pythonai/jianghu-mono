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
            const multiplier = Number.parseInt(e.currentTarget.dataset.multiplier);
            this.setData({
                selectedMultiplier: multiplier,
                isCustomActive: false
            });
        },


        onResetMultiplier(e) {
            const multiplier = 1;
            this.setData({
                selectedMultiplier: multiplier,
                isCustomActive: false
            });
        },

        // onResetMultiplier

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
                multiplier = Number.parseFloat(customValue) || 1;
            } else {
                multiplier = selectedMultiplier;
            }

            // 简化的数据结构：只需要hindex和multiplier
            const result = {
                hindex: hindex,
                multiplier: multiplier
            };

            console.log('[HoleMultiplierSelector] 选择结果:', result);
            console.log(`洞号: ${hindex}, 倍数: ${multiplier}`);

            this.triggerEvent('confirm', result);
            this.close();
        },

        // 取消
        onCancel() {
            console.log('[HoleMultiplierSelector] 取消选择');
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