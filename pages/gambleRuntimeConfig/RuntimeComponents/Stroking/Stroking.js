// Stroking 组件 - 让杆配置
import { gameStore } from '../../../../stores/gameStore';
import { autorun } from 'mobx-miniprogram';

Component({
    properties: {
        // 让杆配置数据
        strokingConfig: {
            type: Array,
            value: []
        }
    },

    data: {
        // 是否启用让杆功能
        enableStroking: false,
        // 是否显示配置弹窗
        showConfigModal: false,
        // 当前选中的用户
        selectedUser: null,
        // 当前用户的让杆配置
        currentConfig: {
            PAR3: 0,
            PAR4: 0,
            PAR5: 0
        },
        // 洞范围选择
        holeRange: {
            startHole: null,
            endHole: null
        },
        // 玩家列表
        players: [],
        // 洞列表
        holeList: [],
        // PAR值选项
        parOptions: [-1, -0.5, 0, 0.5, 1],
        // 洞选择器的索引值
        startHoleIndex: -1,
        endHoleIndex: -1,
        // PAR值选择器的索引值
        par3Index: 2,
        par4Index: 2,
        par5Index: 2,
        // 临时配置存储，用于保存用户的未保存设置
        tempConfigs: {}
    },

    observers: {
        'strokingConfig': function (newConfig) {
            console.log('Stroking 监听到配置变化:', newConfig);
            this.initConfig();
        }
    },

    lifetimes: {
        attached() {
            console.log('Stroking 组件已挂载');
            this.initData();
            this.disposer = autorun(() => {
                const { players, gameData } = gameStore.getState();
                const holeList = gameStore.getHolePlayList || [];
                this.updateData(players, holeList);
            });
        },
        detached() {
            this.disposer?.();
        }
    },

    methods: {
        /**
         * 初始化数据
         */
        initData() {
            const { players, gameData } = gameStore.getState();
            const holeList = gameStore.getHolePlayList || [];
            this.updateData(players, holeList);
            this.initConfig();
        },

        /**
         * 更新数据
         */
        updateData(players, holeList) {
            this.setData({
                players: players || [],
                holeList: holeList || []
            });
            this.updateHoleIndexes();
            this.updateParIndexes();
        },

        /**
         * 初始化配置
         */
        initConfig() {
            const config = this.properties.strokingConfig || [];
            const hasConfig = config.length > 0;

            this.setData({
                enableStroking: hasConfig
            });

            if (hasConfig) {
                // 如果有配置，选择第一个用户
                const firstConfig = config[0];
                this.selectUser(firstConfig.userid);
            }
        },

        /**
         * 选择用户
         */
        selectUser(userid) {
            const user = this.data.players.find(p => p.userid === userid);
            if (!user) {
                console.warn('未找到用户:', userid);
                return;
            }

            // 在切换用户前，保存当前用户的临时配置
            this.saveCurrentTempConfig();

            // 优先从临时配置中查找，如果没有再从正式配置中查找
            const tempConfig = this.data.tempConfigs[userid];
            const existingConfig = this.properties.strokingConfig?.find(c => c.userid === userid);

            // 使用临时配置或正式配置
            const configToUse = tempConfig || existingConfig;

            this.setData({
                selectedUser: user,
                currentConfig: configToUse ? {
                    PAR3: configToUse.PAR3 || 0,
                    PAR4: configToUse.PAR4 || 0,
                    PAR5: configToUse.PAR5 || 0
                } : {
                    PAR3: 0,
                    PAR4: 0,
                    PAR5: 0
                },
                holeRange: configToUse ? {
                    startHole: configToUse.holeRanges?.[0] || null,
                    endHole: configToUse.holeRanges?.[configToUse.holeRanges.length - 1] || null
                } : {
                    startHole: null,
                    endHole: null
                }
            });
            this.updateHoleIndexes();
            this.updateParIndexes();
        },

        /**
         * 保存当前用户的临时配置
         */
        saveCurrentTempConfig() {
            if (!this.data.selectedUser) return;

            const currentTempConfig = {
                userid: this.data.selectedUser.userid,
                PAR3: this.data.currentConfig.PAR3,
                PAR4: this.data.currentConfig.PAR4,
                PAR5: this.data.currentConfig.PAR5,
                holeRanges: this.data.holeRange.startHole && this.data.holeRange.endHole ?
                    this.generateHoleRanges(this.data.holeRange.startHole, this.data.holeRange.endHole) : []
            };

            // 更新临时配置存储
            const tempConfigs = { ...this.data.tempConfigs };
            tempConfigs[this.data.selectedUser.userid] = currentTempConfig;
            this.setData({
                tempConfigs: tempConfigs
            });
        },

        /**
         * 生成洞范围数组
         */
        generateHoleRanges(startHole, endHole) {
            const ranges = [];
            for (let i = startHole; i <= endHole; i++) {
                ranges.push(i);
            }
            return ranges;
        },

        /**
         * 用户选择事件
         */
        onUserSelect(e) {
            const userid = e.currentTarget.dataset.userid;
            this.selectUser(userid);
        },

        /**
         * 让杆选择改变事件
         */
        onStrokingChange(e) {
            const value = e.detail.value;
            const enableStroking = value === 'enable';

            this.setData({
                enableStroking: enableStroking
            });

            // 如果选择让杆，打开配置弹窗
            if (enableStroking) {
                this.openConfigModal();
            } else {
                // 如果选择不让杆，清除所有配置
                this.clearAllConfigs();
            }
        },

        /**
         * 打开配置弹窗
         */
        openConfigModal() {
            this.setData({
                showConfigModal: true
            });
        },

        /**
         * 关闭配置弹窗
         */
        closeConfigModal() {
            this.setData({
                showConfigModal: false
            });
        },

        /**
         * 清除所有配置
         */
        clearAllConfigs() {
            // 清除临时配置
            this.clearTempConfigs();
            // 触发清空事件，传递空配置
            this.triggerEvent('save', { config: [] });
        },

        /**
         * PAR值变化事件
         */
        onParValueChange(e) {
            const parType = e.currentTarget.dataset.parType;
            const value = this.data.parOptions[e.detail.value];
            this.setData({
                [`currentConfig.${parType}`]: value
            });
            this.updateParIndexes();
            // 保存临时配置
            this.saveCurrentTempConfig();
        },

        /**
         * 更新洞选择器索引
         */
        updateHoleIndexes() {
            const { holeList, holeRange } = this.data;
            let startHoleIndex = -1;
            let endHoleIndex = -1;

            if (holeList && holeList.length > 0) {
                if (holeRange.startHole) {
                    startHoleIndex = holeList.findIndex(h => h.hindex === holeRange.startHole);
                }
                if (holeRange.endHole) {
                    endHoleIndex = holeList.findIndex(h => h.hindex === holeRange.endHole);
                }
            }

            this.setData({
                startHoleIndex: startHoleIndex >= 0 ? startHoleIndex : 0,
                endHoleIndex: endHoleIndex >= 0 ? endHoleIndex : 0
            });
        },

        /**
         * 更新PAR值选择器索引
         */
        updateParIndexes() {
            const { parOptions, currentConfig } = this.data;
            const par3Index = parOptions.indexOf(currentConfig.PAR3);
            const par4Index = parOptions.indexOf(currentConfig.PAR4);
            const par5Index = parOptions.indexOf(currentConfig.PAR5);

            this.setData({
                par3Index: par3Index >= 0 ? par3Index : 2,
                par4Index: par4Index >= 0 ? par4Index : 2,
                par5Index: par5Index >= 0 ? par5Index : 2
            });
        },

        /**
         * 起始洞选择事件
         */
        onStartHoleChange(e) {
            const index = e.detail.value;
            const selectedHole = this.data.holeList[index];
            if (selectedHole) {
                this.setData({
                    'holeRange.startHole': selectedHole.hindex,
                    startHoleIndex: index
                });
                // 保存临时配置
                this.saveCurrentTempConfig();
            }
        },

        /**
         * 结束洞选择事件
         */
        onEndHoleChange(e) {
            const index = e.detail.value;
            const selectedHole = this.data.holeList[index];
            if (selectedHole) {
                this.setData({
                    'holeRange.endHole': selectedHole.hindex,
                    endHoleIndex: index
                });
                // 保存临时配置
                this.saveCurrentTempConfig();
            }
        },

        /**
         * 取消配置
         */
        onCancel() {
            // 取消时清除临时配置
            this.clearTempConfigs();
            // 关闭弹窗
            this.closeConfigModal();
            // 如果没有正式配置，重置为不让杆
            const hasConfig = this.properties.strokingConfig && this.properties.strokingConfig.length > 0;
            if (!hasConfig) {
                this.setData({
                    enableStroking: false
                });
            }
        },

        /**
         * 清除所有临时配置
         */
        clearTempConfigs() {
            this.setData({
                tempConfigs: {}
            });
        },

        /**
         * 保存配置
         */
        onSave() {
            if (!this.data.selectedUser) {
                wx.showToast({
                    title: '请选择用户',
                    icon: 'none'
                });
                return;
            }

            if (!this.data.holeRange.startHole || !this.data.holeRange.endHole) {
                wx.showToast({
                    title: '请选择洞范围',
                    icon: 'none'
                });
                return;
            }

            // 生成洞范围数组
            const startIndex = this.data.holeRange.startHole;
            const endIndex = this.data.holeRange.endHole;
            const holeRanges = [];
            for (let i = startIndex; i <= endIndex; i++) {
                holeRanges.push(i);
            }

            // 构建配置数据
            const newConfig = {
                userid: this.data.selectedUser.userid,
                holeRanges: holeRanges,
                PAR3: this.data.currentConfig.PAR3,
                PAR4: this.data.currentConfig.PAR4,
                PAR5: this.data.currentConfig.PAR5
            };

            // 更新现有配置或添加新配置
            const existingConfigs = this.properties.strokingConfig || [];
            const existingIndex = existingConfigs.findIndex(c => c.userid === newConfig.userid);

            let updatedConfigs;
            if (existingIndex >= 0) {
                // 更新现有配置
                updatedConfigs = [...existingConfigs];
                updatedConfigs[existingIndex] = newConfig;
            } else {
                // 添加新配置
                updatedConfigs = [...existingConfigs, newConfig];
            }

            console.log('保存让杆配置:', updatedConfigs);
            this.triggerEvent('save', { config: updatedConfigs });

            // 保存成功后清除临时配置并关闭弹窗
            this.clearTempConfigs();
            this.closeConfigModal();
        },

        /**
         * 空事件处理
         */
        noTap() {
            return;
        }
    }
});
