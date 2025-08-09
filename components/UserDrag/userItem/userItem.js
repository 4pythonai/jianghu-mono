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
        'itemData': function (itemData) {
            // 数据变化监听
            if (itemData && !itemData.id) {
                console.warn('⚠️ userItem: itemData缺少id字段', itemData);
            }
        }
    },

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
            console.log('✅ 头像加载成功:', e.detail);
        },

        /**
         * 图片加载失败
         */
        onImageError(e) {
            console.log('❌ 头像加载失败:', e.detail);
            console.log('❌ 头像路径:', this.properties.itemData?.avatar);
        }
    }
});