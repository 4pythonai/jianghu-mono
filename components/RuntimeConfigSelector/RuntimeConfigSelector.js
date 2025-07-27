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
    lifetimes: {
        attached() {
            // 确保 selectedIdList 中的值都是字符串类型
            this.ensureStringIds();
            console.log('[RuntimeConfigSelector] 组件已附加，selectedIdList:', this.data.selectedIdList);

            // 延迟调试，确保数据已设置
            setTimeout(() => {
                this.debugCheckboxStatus();
            }, 200);
        }
    },
    observers: {
        // 监听 selectedIdList 变化，确保ID是字符串类型并去重
        'selectedIdList': function (newVal) {
            console.log('[RuntimeConfigSelector] selectedIdList 变化:', newVal);
            if (newVal && newVal.length > 0) {
                // 转换为字符串并去重
                const stringIds = [...new Set(newVal.map(id => String(id)))];
                console.log('[RuntimeConfigSelector] 转换并去重后的字符串ID:', stringIds);
                if (JSON.stringify(stringIds) !== JSON.stringify(newVal)) {
                    this.setData({ selectedIdList: stringIds });
                }

                // 延迟调试
                setTimeout(() => {
                    this.debugCheckboxStatus();
                }, 100);
            } else {
                console.log('[RuntimeConfigSelector] selectedIdList 为空或未定义');
            }
        }
    },
    methods: {
        // 确保ID是字符串类型并去重
        ensureStringIds() {
            const selectedIdList = this.data.selectedIdList || [];
            console.log('[RuntimeConfigSelector] ensureStringIds - 原始数据:', selectedIdList);
            if (selectedIdList.length > 0) {
                // 转换为字符串并去重
                const stringIds = [...new Set(selectedIdList.map(id => String(id)))];
                console.log('[RuntimeConfigSelector] ensureStringIds - 转换并去重后:', stringIds);
                this.setData({ selectedIdList: stringIds });
            }
        },

        // 选中项变化时触发
        onCheckboxChange(e) {
            console.log('[RuntimeConfigSelector] checkbox变化:', e.detail.value);
            // 通过自定义事件把选中的id数组传递给父组件/页面
            this.triggerEvent('checkboxChange', { selectedIdList: e.detail.value });
        },

        // 调试方法：检查checkbox状态
        debugCheckboxStatus() {
            console.log('[RuntimeConfigSelector] 调试checkbox状态:');
            console.log('  selectedIdList:', this.data.selectedIdList);
            console.log('  runtimeConfigs:', this.data.runtimeConfigs);
            console.log('  checkbox-group value:', this.data.selectedIdList);

            // 检查每个checkbox的value
            this.data.runtimeConfigs.forEach((config, index) => {
                const checkboxValue = '' + config.id;
                const isSelected = this.data.selectedIdList.includes(checkboxValue);
                console.log(`  checkbox ${index}: value="${checkboxValue}", selected=${isSelected}`);
            });
        }
    }
});