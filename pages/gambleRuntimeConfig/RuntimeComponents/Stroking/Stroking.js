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
        tempConfigs: {},
        // 弹窗打开时的临时配置备份，用于取消时恢复
        tempConfigsBackup: {},
        // 已配置用户信息列表
        configuredUsers: []
    },

    observers: {
        'strokingConfig': function (newConfig) {
            console.log('Stroking 监听到配置变化:', newConfig);
            console.log('当前players数据:', this.data.players);
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
            const oldPlayersLength = this.data.players.length;
            this.setData({
                players: players || [],
                holeList: holeList || []
            });

            // 如果玩家数据发生变化，重新初始化配置显示
            const newPlayersLength = (players || []).length;
            if (oldPlayersLength !== newPlayersLength && newPlayersLength > 0) {
                console.log('玩家数据已更新，重新初始化配置显示');
                this.refreshConfiguredUsers();
            }

            this.updateHoleIndexes();
            this.updateParIndexes();
        },

        /**
         * 刷新已配置用户信息显示
         */
        refreshConfiguredUsers() {
            const config = this.properties.strokingConfig || [];
            const validConfigs = config.filter(c => this.isValidConfig(c) && this.hasValidParValues(c));
            const configuredUsers = this.getConfiguredUsersInfo(validConfigs);

            console.log('refreshConfiguredUsers - 刷新配置用户显示:', configuredUsers);
            this.setData({
                configuredUsers: configuredUsers
            });
        },

        /**
         * 初始化配置
         */
        initConfig() {
            const config = this.properties.strokingConfig || [];
            console.log('initConfig - 原始配置:', config);

            // 过滤出有效的配置（结构完整且至少有一个PAR值不为0）
            const validConfigs = config.filter(c => this.isValidConfig(c) && this.hasValidParValues(c));
            const hasValidConfig = validConfigs.length > 0;
            console.log('initConfig - 有效配置:', validConfigs);
            console.log('initConfig - 是否有有效配置:', hasValidConfig);

            // 如果发现无效配置，清理它们
            if (config.length > validConfigs.length) {
                console.warn('发现无效的让杆配置，已自动清理:', config.filter(c => !this.isValidConfig(c)));
                // 触发清理事件，移除无效配置
                this.triggerEvent('save', { config: validConfigs });
            }

            const configuredUsers = this.getConfiguredUsersInfo(validConfigs);
            console.log('initConfig - 准备设置configuredUsers:', configuredUsers);

            this.setData({
                enableStroking: hasValidConfig,
                configuredUsers: configuredUsers
            });

            console.log('initConfig - 设置完成，当前configuredUsers:', this.data.configuredUsers);

            if (hasValidConfig) {
                // 如果有配置，选择第一个用户
                const firstConfig = validConfigs[0];
                this.selectUser(firstConfig.userid);
            }
        },

        /**
         * 获取已配置用户信息
         */
        getConfiguredUsersInfo(configs) {
            console.log('getConfiguredUsersInfo - 输入configs:', configs);
            console.log('getConfiguredUsersInfo - 当前players:', this.data.players);

            const result = configs.map(config => {
                const user = this.data.players?.find(p => p.userid === config.userid);
                console.log(`查找用户 ${config.userid}:`, user);
                return {
                    userid: config.userid,
                    nickname: user?.wx_nickname || '未知用户',
                    holeCount: config.holeRanges?.length || 0,
                    parSummary: this.getParSummary(config)
                };
            });

            console.log('getConfiguredUsersInfo - 结果:', result);
            return result;
        },

        /**
         * 获取PAR值摘要
         */
        getParSummary(config) {
            const pars = [];
            if (config.PAR3 !== 0) pars.push(`PAR3:${config.PAR3}`);
            if (config.PAR4 !== 0) pars.push(`PAR4:${config.PAR4}`);
            if (config.PAR5 !== 0) pars.push(`PAR5:${config.PAR5}`);
            return pars.join(', ') || '无让杆';
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

            console.log(`保存临时配置 - 用户: ${this.data.selectedUser.wx_nickname}`, currentTempConfig);
            console.log('所有临时配置:', tempConfigs);

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

            // 如果选择让杆，打开配置弹窗
            if (enableStroking) {
                this.setData({
                    enableStroking: true
                });
                this.openConfigModal();
            } else {
                // 如果选择不让杆，清除所有配置（clearAllConfigs会设置enableStroking: false）
                this.clearAllConfigs();
            }
        },

        /**
         * 打开配置弹窗
         */
        openConfigModal() {
            // 🔑 备份当前的临时配置状态，用于取消时恢复
            this.setData({
                showConfigModal: true,
                tempConfigsBackup: { ...this.data.tempConfigs }  // 深拷贝备份
            });
            console.log('打开弹窗 - 备份临时配置:', this.data.tempConfigs);
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

            // 🔑 关键修复：立即清空界面状态，避免闪现
            this.setData({
                enableStroking: false,
                configuredUsers: []  // 立即清空已配置用户列表
            });
            console.log('清除所有配置 - 立即清空界面状态');

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
            // 🔑 取消时恢复到弹窗打开时的状态，而不是清除所有数据
            console.log('取消配置 - 恢复到备份状态:', this.data.tempConfigsBackup);

            this.setData({
                tempConfigs: { ...this.data.tempConfigsBackup },  // 恢复备份的临时配置
                tempConfigsBackup: {}  // 清除备份
            });

            // 如果有选中用户，重新加载该用户的配置（可能是恢复的临时配置或正式配置）
            if (this.data.selectedUser) {
                this.selectUser(this.data.selectedUser.userid);
            }

            // 关闭弹窗
            this.closeConfigModal();
        },

        /**
         * 清除所有临时配置
         */
        clearTempConfigs() {
            this.setData({
                tempConfigs: {},
                tempConfigsBackup: {}  // 同时清除备份
            });
        },

        /**
         * 保存配置
         */
        onSave() {
            // 先保存当前用户的临时配置
            this.saveCurrentTempConfig();

            // 获取所有临时配置，并过滤掉无效的配置（所有PAR值都为0的配置）
            const allTempConfigs = Object.values(this.data.tempConfigs).filter(config => {
                return this.hasValidParValues(config);
            });

            console.log('过滤前的临时配置:', Object.values(this.data.tempConfigs));
            console.log('过滤后的有效配置:', allTempConfigs);

            if (allTempConfigs.length === 0) {
                wx.showToast({
                    title: '请至少配置一个用户的让杆（PAR值不能全为0）',
                    icon: 'none',
                    duration: 2000
                });
                return;
            }

            // 验证每个临时配置
            const invalidConfigs = [];
            for (const config of allTempConfigs) {
                if (!this.isValidConfig(config)) {
                    const user = this.data.players.find(p => p.userid === config.userid);
                    invalidConfigs.push(user?.wx_nickname || config.userid);
                }
            }

            if (invalidConfigs.length > 0) {
                wx.showToast({
                    title: `${invalidConfigs.join('、')} 的配置不完整`,
                    icon: 'none',
                    duration: 2000
                });
                return;
            }

            // 开始合并配置：现有配置 + 新的临时配置
            const existingConfigs = this.properties.strokingConfig || [];
            const updatedConfigs = [...existingConfigs];

            // 遍历所有临时配置，更新或添加到最终配置中
            for (const tempConfig of allTempConfigs) {
                const existingIndex = updatedConfigs.findIndex(c => c.userid === tempConfig.userid);

                if (existingIndex >= 0) {
                    // 更新现有配置
                    updatedConfigs[existingIndex] = { ...tempConfig };
                } else {
                    // 添加新配置
                    updatedConfigs.push({ ...tempConfig });
                }
            }

            console.log('保存让杆配置 - 临时配置:', allTempConfigs);
            console.log('保存让杆配置 - 最终配置:', updatedConfigs);

            this.triggerEvent('save', { config: updatedConfigs });

            // 🔑 关键修复：保存成功后立即更新界面状态
            // 过滤出有效的配置用于界面显示（理论上updatedConfigs已经是有效的，但为了一致性还是过滤一下）
            const validSavedConfigs = updatedConfigs.filter(c => this.isValidConfig(c) && this.hasValidParValues(c));
            const configuredUsers = this.getConfiguredUsersInfo(validSavedConfigs);
            this.setData({
                enableStroking: validSavedConfigs.length > 0,
                configuredUsers: configuredUsers
            });
            console.log('保存成功 - 立即更新界面状态:', configuredUsers);

            // 保存成功提示
            const configCount = allTempConfigs.length;
            wx.showToast({
                title: `已保存 ${configCount} 个用户的让杆配置`,
                icon: 'success',
                duration: 1500
            });

            // 保存成功后清除临时配置和备份，然后关闭弹窗
            this.setData({
                tempConfigs: {},
                tempConfigsBackup: {}  // 清除备份，因为已经保存成功
            });
            this.closeConfigModal();
        },

        /**
         * 验证配置数据完整性
         */
        validateConfigData() {
            if (!this.data.selectedUser) {
                return {
                    isValid: false,
                    message: '请选择需要配置让杆的用户'
                };
            }

            if (!this.data.holeRange.startHole || !this.data.holeRange.endHole) {
                return {
                    isValid: false,
                    message: '请选择让杆的洞范围'
                };
            }

            if (this.data.holeRange.startHole > this.data.holeRange.endHole) {
                return {
                    isValid: false,
                    message: '起始洞不能大于结束洞'
                };
            }

            // 检查是否至少有一个PAR值不为0
            const { PAR3, PAR4, PAR5 } = this.data.currentConfig;
            if (PAR3 === 0 && PAR4 === 0 && PAR5 === 0) {
                return {
                    isValid: false,
                    message: '请至少设置一个PAR值的让杆数量'
                };
            }

            return {
                isValid: true,
                message: '验证通过'
            };
        },

        /**
         * 验证配置对象是否完整
         */
        isValidConfig(config) {
            if (!config || typeof config !== 'object') {
                return false;
            }

            // 必须包含用户ID
            if (!config.userid) {
                return false;
            }

            // 必须包含非空的洞范围数组
            if (!config.holeRanges || !Array.isArray(config.holeRanges) || config.holeRanges.length === 0) {
                return false;
            }

            // 必须包含PAR值
            if (typeof config.PAR3 !== 'number' || typeof config.PAR4 !== 'number' || typeof config.PAR5 !== 'number') {
                return false;
            }

            return true;
        },

        /**
         * 检查配置是否至少有一个PAR值不为0
         */
        hasValidParValues(config) {
            if (!config) return false;

            // 至少有一个PAR值不为0才算有效的让杆配置
            return config.PAR3 !== 0 || config.PAR4 !== 0 || config.PAR5 !== 0;
        },

        /**
         * 删除指定用户的让杆配置
         */
        removeUserConfig(e) {
            const userid = e.currentTarget.dataset.userid;
            const user = this.data.players.find(p => p.userid === userid);
            const username = user?.wx_nickname || '未知用户';

            wx.showModal({
                title: '删除确认',
                content: `确定要删除 ${username} 的让杆配置吗？`,
                confirmText: '删除',
                confirmColor: '#ff4757',
                success: (res) => {
                    if (res.confirm) {
                        // 从配置中移除指定用户
                        const existingConfigs = this.properties.strokingConfig || [];
                        const updatedConfigs = existingConfigs.filter(c => c.userid !== userid);

                        // 更新配置
                        this.triggerEvent('save', { config: updatedConfigs });

                        // 🔑 关键修复：删除后立即更新界面状态和清理临时数据
                        // 过滤出有效的配置（PAR值不全为0）
                        const validUpdatedConfigs = updatedConfigs.filter(c => this.isValidConfig(c) && this.hasValidParValues(c));
                        const configuredUsers = this.getConfiguredUsersInfo(validUpdatedConfigs);

                        // 清理被删除用户的临时配置
                        const tempConfigs = { ...this.data.tempConfigs };
                        if (tempConfigs[userid]) {
                            delete tempConfigs[userid];
                            console.log(`删除临时配置 - 用户: ${username}`, userid);
                        }

                        // 如果删除的是当前选中的用户，重置选中状态
                        let updateData = {
                            enableStroking: validUpdatedConfigs.length > 0,  // 基于有效配置数量决定是否关闭让杆
                            configuredUsers: configuredUsers,
                            tempConfigs: tempConfigs  // 更新临时配置
                        };

                        if (this.data.selectedUser && this.data.selectedUser.userid === userid) {
                            // 重置当前选中用户和配置
                            updateData.selectedUser = null;
                            updateData.currentConfig = { PAR3: 0, PAR4: 0, PAR5: 0 };
                            updateData.holeRange = { startHole: null, endHole: null };
                            console.log(`重置选中用户 - 因为删除了当前选中的用户: ${username}`);
                        }

                        this.setData(updateData);
                        console.log('删除成功 - 立即更新界面状态:', configuredUsers);

                        wx.showToast({
                            title: `已删除 ${username} 的让杆配置`,
                            icon: 'success',
                            duration: 1500
                        });
                    }
                }
            });
        },

        /**
         * 编辑指定用户的让杆配置
         */
        editUserConfig(e) {
            const userid = e.currentTarget.dataset.userid;
            this.selectUser(userid);
            this.openConfigModal();
        },

        /**
         * 空事件处理
         */
        noTap() {
            return;
        }
    }
});
