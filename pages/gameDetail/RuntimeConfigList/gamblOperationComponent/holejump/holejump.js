

Component({
    properties: {
        // 传入的 runtimeConfigs 列表
    },

    data: {
        scrollTop: 0
    },

    lifetimes: {
        attached() {
        },

        detached() {
        }
    },

    methods: {
        // 空事件处理
        noop() { },

        // 拖拽排序结束事件处理
        onSortEnd(e) {
            console.log("弹框收到排序结果:", e.detail.listData);
            // 这里可以处理排序结果，比如保存到本地或传递给父组件
            this.triggerEvent('holesortend', {
                listData: e.detail.listData
            });
        },

        // 滚动事件处理
        onScroll(e) {
            this.setData({
                scrollTop: e.detail.scrollTop
            });
        },

        // 重置按钮事件
        onReset() {
            console.log("重置拖拽排序");
            // 这里可以重置排序到初始状态
            this.triggerEvent('reset');
        },

        // 确定按钮事件
        onJumpComplete() {
            console.log("跳洞设置完成");
            // 这里可以处理完成逻辑
            this.triggerEvent('complete');
        },

        // 测试拖拽功能
        testDrag() {
            console.log("测试拖拽功能");
            const holesDrag = this.selectComponent('HolesDrag');
            if (holesDrag) {
                console.log("HolesDrag component found:", holesDrag);
                const listData = holesDrag.getListData();
                console.log("Current list data:", listData);
            } else {
                console.error("HolesDrag component not found!");
            }
        },

        // 关闭弹框
        close() {
            this.triggerEvent('close');
        }
    }
});