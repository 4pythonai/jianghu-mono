// Stroking 组件 - 让杆配置 (重构版)
import { gameStore } from '../../../../stores/gameStore';
import { autorun } from 'mobx-miniprogram';

Component({
    properties: {
        strokingConfig: {
            type: Array,
            value: []
        }
    },

    data: {
        // 核心状态
        enableStroking: false,
        showConfigModal: false,
        selectedUser: null,
        tempConfigs: {}, // 临时配置，键为userid

        // 当前配置状态
        currentConfig: { PAR3: 0, PAR4: 0, PAR5: 0 },
        holeRange: { startHole: null, endHole: null },

        // 数据源
        players: [],
        holeList: [],
        parOptions: [-1, -0.5, 0, 0.5, 1]
    },

    observers: {
        'strokingConfig': function (newConfig) {
            this.refreshUI();
        }
    },

    lifetimes: {
        attached() {
            this.initData();
            this.disposer = autorun(() => {
                const { players } = gameStore.getState();
                const holeList = gameStore.getHoleList || [];
                this.setData({ players, holeList });
                if (players?.length > 0) this.refreshUI();
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
            const { players } = gameStore.getState();
            const holeList = gameStore.getHoleList || [];
            this.setData({ players, holeList });
            this.refreshUI();
        },

        /**
         * 刷新UI状态 - 统一的状态更新入口
         */
        refreshUI() {
            const validConfigs = this.getValidConfigs(this.properties.strokingConfig);
            const configuredUsers = this.getConfiguredUsersInfo(validConfigs);

            this.setData({
                enableStroking: validConfigs.length > 0,
                configuredUsers
            });

            // 如果有配置且没有选中用户，选择第一个
            if (validConfigs.length > 0 && !this.data.selectedUser) {
                this.selectUser(validConfigs[0].userid);
            }
        },

        /**
         * 获取有效配置 - 统一的验证和过滤逻辑
         */
        getValidConfigs(configs) {
            return (configs || []).filter(config =>
                config?.userid &&
                Array.isArray(config.holeRanges) &&
                config.holeRanges.length > 0 &&
                (config.PAR3 !== 0 || config.PAR4 !== 0 || config.PAR5 !== 0)
            );
        },

        /**
         * 获取已配置用户信息
         */
        getConfiguredUsersInfo(configs) {
            return configs.map(config => {
                const user = this.data.players?.find(p => p.userid === config.userid);
                const pars = [];
                if (config.PAR3 !== 0) pars.push(`PAR3:${config.PAR3}`);
                if (config.PAR4 !== 0) pars.push(`PAR4:${config.PAR4}`);
                if (config.PAR5 !== 0) pars.push(`PAR5:${config.PAR5}`);

                return {
                    userid: config.userid,
                    nickname: user?.wx_nickname || '未知用户',
                    holeCount: config.holeRanges?.length || 0,
                    parSummary: pars.join(', ') || '无让杆'
                };
            });
        },

        /**
         * 选择用户
         */
        selectUser(userid) {
            const user = this.data.players.find(p => p.userid === userid);
            if (!user) return;

            // 保存当前用户的临时配置
            this.saveCurrentTempConfig();

            // 加载目标用户的配置
            const tempConfig = this.data.tempConfigs[userid];
            const existingConfig = this.properties.strokingConfig?.find(c => c.userid === userid);
            const config = tempConfig || existingConfig;

            this.setData({
                selectedUser: user,
                currentConfig: {
                    PAR3: config?.PAR3 || 0,
                    PAR4: config?.PAR4 || 0,
                    PAR5: config?.PAR5 || 0
                },
                holeRange: {
                    startHole: config?.holeRanges?.[0] || null,
                    endHole: config?.holeRanges?.[config.holeRanges?.length - 1] || null
                }
            });
        },

        /**
         * 保存当前用户的临时配置
         */
        saveCurrentTempConfig() {
            if (!this.data.selectedUser) return;

            const holeRanges = this.generateHoleRanges(
                this.data.holeRange.startHole,
                this.data.holeRange.endHole
            );

            const tempConfigs = { ...this.data.tempConfigs };
            tempConfigs[this.data.selectedUser.userid] = {
                userid: this.data.selectedUser.userid,
                PAR3: this.data.currentConfig.PAR3,
                PAR4: this.data.currentConfig.PAR4,
                PAR5: this.data.currentConfig.PAR5,
                holeRanges
            };

            this.setData({ tempConfigs });
        },

        /**
         * 生成洞范围数组
         */
        generateHoleRanges(startHole, endHole) {
            if (!startHole || !endHole) return [];
            const ranges = [];
            for (let i = startHole; i <= endHole; i++) {
                ranges.push(i);
            }
            return ranges;
        },

        /**
         * 验证当前配置
         */
        validateCurrentConfig() {
            if (!this.data.selectedUser) {
                return { valid: false, message: '请选择用户' };
            }

            const { startHole, endHole } = this.data.holeRange;
            if (!startHole || !endHole) {
                return { valid: false, message: '请选择洞范围' };
            }

            if (startHole > endHole) {
                return { valid: false, message: '起始洞不能大于结束洞' };
            }

            const { PAR3, PAR4, PAR5 } = this.data.currentConfig;
            if (PAR3 === 0 && PAR4 === 0 && PAR5 === 0) {
                return { valid: false, message: '请至少设置一个PAR值' };
            }

            return { valid: true };
        },

        /**
         * 更新最终配置 - 统一的配置更新入口
         */
        updateFinalConfig(newConfigs) {
            const validConfigs = this.getValidConfigs(newConfigs);

            // 触发保存事件
            this.triggerEvent('saveStroking', { config: validConfigs });

            // 立即更新UI
            this.setData({
                enableStroking: validConfigs.length > 0,
                configuredUsers: this.getConfiguredUsersInfo(validConfigs),
                tempConfigs: {}
            });
        },

        // ==================== 事件处理 ====================

        /**
         * 让杆开关改变
         */
        onStrokingChange(e) {
            const enableStroking = e.detail.value === 'enable';

            if (enableStroking) {
                this.setData({ enableStroking: true });
                this.openConfigModal();
            } else {
                this.updateFinalConfig([]);
            }
        },

        /**
         * 打开配置弹窗
         */
        openConfigModal() {
            this.setData({
                showConfigModal: true,
                enableStroking: true
            });
        },

        /**
         * 用户选择事件
         */
        onUserSelect(e) {
            this.selectUser(e.currentTarget.dataset.userid);
        },

        /**
         * PAR值变化
         */
        onParValueChange(e) {
            const parType = e.currentTarget.dataset.parType;
            const value = this.data.parOptions[e.detail.value];
            this.setData({
                [`currentConfig.${parType}`]: value
            });
            this.saveCurrentTempConfig();
        },

        /**
         * 洞范围选择
         */
        onStartHoleChange(e) {
            const hole = this.data.holeList[e.detail.value];
            if (hole) {
                this.setData({ 'holeRange.startHole': hole.hindex });
                this.saveCurrentTempConfig();
            }
        },

        onEndHoleChange(e) {
            const hole = this.data.holeList[e.detail.value];
            if (hole) {
                this.setData({ 'holeRange.endHole': hole.hindex });
                this.saveCurrentTempConfig();
            }
        },

        /**
         * 保存配置
         */
        onSaveStroking() {
            // 先验证当前正在配置的用户
            const validation = this.validateCurrentConfig();
            if (!validation.valid) {
                wx.showToast({ title: validation.message, icon: 'none' });
                return;
            }

            this.saveCurrentTempConfig();

            // 获取所有有效的临时配置
            const validTempConfigs = this.getValidConfigs(Object.values(this.data.tempConfigs));

            if (validTempConfigs.length === 0) {
                wx.showToast({ title: '请至少配置一个用户', icon: 'none' });
                return;
            }

            // 合并现有配置和新配置
            const existingConfigs = this.properties.strokingConfig || [];
            const updatedConfigs = [...existingConfigs];

            for (const tempConfig of validTempConfigs) {
                const index = updatedConfigs.findIndex(c => c.userid === tempConfig.userid);
                if (index >= 0) {
                    updatedConfigs[index] = tempConfig;
                } else {
                    updatedConfigs.push(tempConfig);
                }
            }

            this.updateFinalConfig(updatedConfigs);
            this.setData({ showConfigModal: false });

            wx.showToast({
                title: `已保存 ${validTempConfigs.length} 个用户配置`,
                icon: 'success'
            });
        },

        /**
         * 取消配置
         */
        onCancel() {
            this.setData({
                tempConfigs: {},
                showConfigModal: false
            });

            // 重新选择用户以恢复状态
            if (this.data.selectedUser) {
                this.selectUser(this.data.selectedUser.userid);
            }
        },

        /**
         * 删除用户配置
         */
        removeUserConfig(e) {
            const userid = e.currentTarget.dataset.userid;
            const user = this.data.players.find(p => p.userid === userid);

            wx.showModal({
                title: '删除确认',
                content: `确定要删除 ${user?.wx_nickname || '该用户'} 的让杆配置吗？`,
                success: (res) => {
                    if (res.confirm) {
                        const updatedConfigs = (this.properties.strokingConfig || [])
                            .filter(c => c.userid !== userid);

                        this.updateFinalConfig(updatedConfigs);

                        // 如果删除的是当前选中用户，重置选择
                        if (this.data.selectedUser?.userid === userid) {
                            this.setData({
                                selectedUser: null,
                                currentConfig: { PAR3: 0, PAR4: 0, PAR5: 0 },
                                holeRange: { startHole: null, endHole: null }
                            });
                        }

                        wx.showToast({
                            title: `已删除 ${user?.wx_nickname || '该用户'} 的配置`,
                            icon: 'success'
                        });
                    }
                }
            });
        },

        /**
         * 编辑用户配置
         */
        editUserConfig(e) {
            this.selectUser(e.currentTarget.dataset.userid);
            this.openConfigModal();
        },

        /**
         * 空事件处理
         */
        noTap() { },

        /**
         * 获取当前配置（用于外部收集配置）
         */
        getConfig() {
            // 保存当前用户的临时配置
            this.saveCurrentTempConfig();

            // 获取所有有效的临时配置
            const validTempConfigs = this.getValidConfigs(Object.values(this.data.tempConfigs));

            // 合并现有配置和新配置
            const existingConfigs = this.properties.strokingConfig || [];
            const updatedConfigs = [...existingConfigs];

            for (const tempConfig of validTempConfigs) {
                const index = updatedConfigs.findIndex(c => c.userid === tempConfig.userid);
                if (index >= 0) {
                    updatedConfigs[index] = tempConfig;
                } else {
                    updatedConfigs.push(tempConfig);
                }
            }

            return this.getValidConfigs(updatedConfigs);
        }
    }
});