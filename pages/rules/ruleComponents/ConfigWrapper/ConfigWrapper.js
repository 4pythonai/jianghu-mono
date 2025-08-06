// 配置组件包装器
Component({
    properties: {
        // 组件名称
        componentName: {
            type: String,
            value: ''
        },
        // 组件标题
        title: {
            type: String,
            value: ''
        },
        // 模式：SysConfig | UserEdit
        mode: {
            type: String,
            value: 'SysConfig'
        },
        // 配置数据
        configData: {
            type: Object,
            value: null
        },
        // 游戏类型
        gameType: {
            type: String,
            value: ''
        }
    },

    data: {
        // 内部状态
        isInitialized: false
    },

    lifetimes: {
        attached() {
            console.log('📋 [ConfigWrapper] 组件加载:', this.properties.componentName);
        },

        detached() {
            console.log('📋 [ConfigWrapper] 组件卸载:', this.properties.componentName);
        }
    },

    observers: {
        // 监听配置数据变化
        'configData': function (configData) {
            if (configData && this.data.isInitialized) {
                this.initComponentData(configData);
            }
        }
    },

    methods: {
        // 初始化组件数据
        initComponentData(configData) {
            const componentInstance = this.selectComponent(`#${this.properties.componentName}`);
            if (componentInstance && componentInstance.initConfigData) {
                componentInstance.initConfigData(configData);
            }
        },

        // 获取配置数据
        getConfigData() {
            const componentInstance = this.selectComponent(`#${this.properties.componentName}`);
            if (componentInstance && componentInstance.getConfigData) {
                return componentInstance.getConfigData();
            }
            return null;
        },

        // 空方法，用于处理禁用状态下的点击事件
        noTap() {
            return;
        }
    }
}); 