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
        par5Index: 2
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
            if (config.length > 0) {
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

            // 查找该用户的现有配置
            const existingConfig = this.properties.strokingConfig && this.properties.strokingConfig.find(c => c.userid === userid);

            this.setData({
                selectedUser: user,
                currentConfig: existingConfig ? {
                    PAR3: existingConfig.PAR3 || 0,
                    PAR4: existingConfig.PAR4 || 0,
                    PAR5: existingConfig.PAR5 || 0
                } : {
                    PAR3: 0,
                    PAR4: 0,
                    PAR5: 0
                },
                holeRange: existingConfig ? {
                    startHole: existingConfig.holeRanges && existingConfig.holeRanges[0] || null,
                    endHole: existingConfig.holeRanges && existingConfig.holeRanges[existingConfig.holeRanges.length - 1] || null
                } : {
                    startHole: null,
                    endHole: null
                }
            });
            this.updateHoleIndexes();
            this.updateParIndexes();
        },

        /**
         * 用户选择事件
         */
        onUserSelect(e) {
            const userid = e.currentTarget.dataset.userid;
            this.selectUser(userid);
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
            }
        },

        /**
         * 取消配置
         */
        onCancel() {
            this.triggerEvent('cancel');
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
        },

        /**
         * 空事件处理
         */
        noTap() {
            return;
        }
    }
});
