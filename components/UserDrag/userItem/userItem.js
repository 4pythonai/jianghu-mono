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
            // 组件初始化
        }
    },

    observers: {
        'itemData': (itemData) => {
            // 数据变化监听
        }
    },
    methods: {
        // 点击事件
        itemClick(e) {
            this.triggerEvent('click', {
                itemData: this.properties.itemData,
                index: this.properties.index
            });
        },

        // 图片加载成功
        onImageLoad(e) {
            console.log('✅ 头像加载成功:', e.detail);
        },

        // 图片加载失败
        onImageError(e) {
            console.log('❌ 头像加载失败:', e.detail);
            console.log('❌ 头像路径:', this.properties.itemData?.avatar);
        }
    }
});