Component({
    properties: {
        // 运行时配置列表
        runtimeConfigs: {
            type: Array,
            value: []
        },
        // 已选中的id列表
        selectedIdList: {
            type: Array,
            value: []
        },
        // 标题
        title: {
            type: String,
            value: '请选择'
        }
    },
    methods: {
        // 选中项变化时触发
        onCheckboxChange(e) {
            // 通过自定义事件把选中的id数组传递给父组件/页面
            this.triggerEvent('checkboxChange', { selectedIdList: e.detail.value });
        }
    }
});