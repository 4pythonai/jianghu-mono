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

                // 计算选中状态对象
                const isSelected = {};
                for (const config of this.data.runtimeConfigs) {
                    isSelected[config.id] = stringIds.includes(String(config.id));
                }

                // 只有在数据真正不同时才设置，避免无限循环
                if (JSON.stringify(stringIds) !== JSON.stringify(newVal)) {
                    setTimeout(() => {
                        this.setData({
                            selectedIdList: stringIds,
                            isSelected: isSelected
                        });
                        console.log('[RuntimeConfigSelector] 延迟设置 selectedIdList 完成');
                    }, 50);
                } else {
                    // 只更新 isSelected
                    this.setData({ isSelected: isSelected });
                }

                // 延迟调试
                setTimeout(() => {
                    this.debugCheckboxStatus();
                }, 100);
            } else {
                console.log('[RuntimeConfigSelector] selectedIdList 为空或未定义');
                // 清空选中状态
                const isSelected = {};
                for (const config of this.data.runtimeConfigs) {
                    isSelected[config.id] = false;
                }
                this.setData({ isSelected: isSelected });
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

        // 点击项目时触发
        onItemTap(e) {
            const itemId = String(e.currentTarget.dataset.id);
            console.log('[RuntimeConfigSelector] 点击项目:', itemId);

            const currentSelectedIdList = this.data.selectedIdList || [];
            console.log('[RuntimeConfigSelector] 当前选中列表:', currentSelectedIdList);

            let newSelectedIdList;

            if (currentSelectedIdList.includes(itemId)) {
                // 如果已选中，则取消选中
                newSelectedIdList = currentSelectedIdList.filter(id => id !== itemId);
                console.log('[RuntimeConfigSelector] 取消选中:', itemId);
            } else {
                // 如果未选中，则选中
                newSelectedIdList = [...currentSelectedIdList, itemId];
                console.log('[RuntimeConfigSelector] 选中:', itemId);
            }

            console.log('[RuntimeConfigSelector] 新的选中列表:', newSelectedIdList);

            // 计算新的选中状态对象
            const isSelected = {};
            for (const config of this.data.runtimeConfigs) {
                isSelected[config.id] = newSelectedIdList.includes(String(config.id));
            }

            this.setData({
                selectedIdList: newSelectedIdList,
                isSelected: isSelected
            }, () => {
                console.log('[RuntimeConfigSelector] setData 完成，当前状态:', this.data.selectedIdList);
            });

            // 触发父组件事件
            this.triggerEvent('checkboxChange', { selectedIdList: newSelectedIdList });
        },

        // 调试方法：检查checkbox状态
        debugCheckboxStatus() {
            console.log('[RuntimeConfigSelector] 调试checkbox状态:');
            console.log('  selectedIdList:', this.data.selectedIdList);
            console.log('  runtimeConfigs:', this.data.runtimeConfigs);
            console.log('  checkbox-group value:', this.data.selectedIdList);

            // 检查每个checkbox的value
            for (let i = 0; i < this.data.runtimeConfigs.length; i++) {
                const config = this.data.runtimeConfigs[i];
                const checkboxValue = `${config.id}`;
                const isSelected = this.data.selectedIdList.includes(checkboxValue);
                console.log(`  checkbox ${i}: value="${checkboxValue}", selected=${isSelected}`);
            }
        }
    }
});