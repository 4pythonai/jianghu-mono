Component({
    properties: {
        show: {
            type: Boolean,
            value: false
        }
    },

    methods: {
        onClose() {
            this.triggerEvent('close')
        },

        onActionTap(e) {
            const action = e.currentTarget.dataset.action
            this.triggerEvent('action', { action })
        }
    }
})
