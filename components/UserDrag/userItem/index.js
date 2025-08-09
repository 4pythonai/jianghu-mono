Component({
    properties: {
        // 用户数据
        itemData: {
            type: Object,
            value: {}
        },
        // 索引
        index: {
            type: Number,
            value: 0
        }
    },

    lifetimes: {
        attached() {
            console.log('🔧 userItem attached');
            console.log('  - index:', this.properties.index);
            console.log('  - itemData:', this.properties.itemData);
        }
    },

    observers: {
        'itemData': function (itemData) {
            console.log('👤 userItem observers 触发');
            console.log('  - itemData:', itemData);
        }
    },
    methods: {
        // 点击事件
        itemClick(e) {
            this.triggerEvent('click', {
                itemData: this.data.itemData,
                index: this.data.index
            });
        }
    }
});