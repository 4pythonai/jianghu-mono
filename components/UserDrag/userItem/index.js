Component({
    properties: {
        // 用户数据
        itemData: {
            type: Object,
            value: {}
        },
        // 索引（保留兼容性）
        index: {
            type: Number,
            value: 0
        },
        // 当前实际位置（拖拽后的动态位置）
        currentPosition: {
            type: Number,
            value: 0
        },
        // 分组配置（保留兼容性，但实际不使用）
        redBlueConfig: {
            type: String,
            value: '4_固拉'
        }
    },

    data: {
        // 组件内部数据
    },

    methods: {
        // 点击事件
        itemClick(e) {
            // 向父组件传递点击事件
            this.triggerEvent('click', {
                itemData: this.data.itemData,
                index: this.data.currentPosition
            });
        },

        // 获取分组颜色
        getGroupColor() {
            const { currentPosition } = this.data;
            // 统一的分组逻辑：1、2名（currentPosition 0、1）蓝色，3、4名（currentPosition 2、3）红色
            return currentPosition < 2 ? '🔵' : '🔴';
        }
    },

    observers: {
        'currentPosition': function (currentPosition) {
            // 当位置变化时，分组颜色和序号会自动更新
            // console.log(`UserItem - currentPosition: ${currentPosition}, 显示: #${currentPosition + 1}, 颜色: ${currentPosition < 2 ? '🔵' : '🔴'}`);
        }
    }
});