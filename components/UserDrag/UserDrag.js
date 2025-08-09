Component({
    properties: {
        userList: {
            type: Array,
            value: []
        }
    },

    lifetimes: {
        attached() {
            console.log('🚀 UserDrag 组件 attached');
            console.log('  - userList:', this.properties.userList);
        }
    },

    methods: {
        // 用户项点击事件（暂时没有拖拽功能）
        onUserTap(e) {
            const index = e.currentTarget.dataset.index;
            const user = this.data.userList[index];
            console.log('👤 点击用户:', user);
        }
    }
});