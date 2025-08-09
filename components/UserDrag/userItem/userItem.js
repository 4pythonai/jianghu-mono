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

    observers: {},

    methods: {
        /**
         * 点击事件
         */
        itemClick(e) {
            const { itemData, index } = this.properties;

            // 数据验证
            if (!itemData || !itemData.id) {
                console.warn('⚠️ userItem: 无效的itemData', itemData);
                return;
            }

            this.triggerEvent('click', {
                itemData,
                index
            });
        },

        /**
         * 图片加载成功
         */
        onImageLoad(e) {
            // 图片加载成功，静默处理
        },

        /**
         * 图片加载失败
         */
        onImageError(e) {
            // 图片加载失败，静默处理
        }
    }
});