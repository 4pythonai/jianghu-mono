import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';
import { toJS } from 'mobx-miniprogram';
Component({
    properties: {
        // 传入的 runtimeConfigs 列表
        runtimeConfigs: {
            type: Array,
            value: []
        }
    },
    data: {
        // 当前选中的配置 id 列表
        selectedIdList: [],
        // 捐锅方式: normal-普通, all-全捐, bigpot-大锅饭, none-不捐锅
        donationType: 'normal',
        // 默认每洞捐1分
        donationPoints: 1,
        // 总费用（大锅饭模式）
        totalFee: '',
        // 最大合计捐锅点数
        maxDonationPoints: '',
        // 强制刷新标识
        forceRefresh: 0
    },
    lifetimes: {
        attached() {
            // 绑定 mobx store
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameData', 'players'],
                actions: []
            });

            // 分析捐锅配置并回显
            this.analyzeAndRestoreDonationConfig();
        },
        detached() {
            this.storeBindings.destroyStoreBindings();
        }
    },
    methods: {
        /**
         * 分析捐锅配置并回显UI
         */
        analyzeAndRestoreDonationConfig() {
            const runtimeConfigs = this.properties.runtimeConfigs || [];
            console.log('[juanguo] 分析捐锅配置，runtimeConfigs:', runtimeConfigs);

            if (runtimeConfigs.length === 0) {
                console.log('[juanguo] 没有运行时配置数据');
                return;
            }

            // 收集所有有捐锅配置的项
            const configsWithDonation = [];
            const configsWithoutDonation = [];

            runtimeConfigs.forEach(config => {
                // 优先使用解析后的 donationCfg_parsed，如果没有则使用原始的 donationCfg
                let donationCfg = config.donationCfg_parsed || config.donationCfg;
                console.log(`[juanguo] 配置 ${config.id} 的 donationCfg:`, donationCfg);

                // 如果 donationCfg 是字符串，尝试解析为对象
                if (donationCfg && typeof donationCfg === 'string') {
                    try {
                        donationCfg = JSON.parse(donationCfg);
                        console.log(`[juanguo] 解析后的 donationCfg:`, donationCfg);
                    } catch (e) {
                        console.error(`[juanguo] 解析 donationCfg 失败:`, e);
                        donationCfg = null;
                    }
                }

                if (donationCfg && typeof donationCfg === 'object' && Object.keys(donationCfg).length > 0) {
                    // 检查是否不是 {"donationType":"none"}
                    if (donationCfg.donationType && donationCfg.donationType !== 'none') {
                        configsWithDonation.push({
                            id: config.id,
                            donationCfg: donationCfg
                        });
                    } else {
                        configsWithoutDonation.push(config.id);
                    }
                } else {
                    configsWithoutDonation.push(config.id);
                }
            });

            console.log('[juanguo] 分析结果:', {
                configsWithDonation: configsWithDonation,
                configsWithoutDonation: configsWithoutDonation
            });

            // 设置选中的ID列表 - 确保ID是字符串类型并去重
            const selectedIds = [...new Set(configsWithDonation.map(item => String(item.id)))];
            console.log('[juanguo] 设置选中的ID列表:', selectedIds);
            this.setData({
                selectedIdList: selectedIds,
                forceRefresh: this.data.forceRefresh + 1
            });

            // 回显捐锅方式UI
            if (configsWithDonation.length > 0) {
                // 使用第一个有捐锅配置的项来回显（后台确保所有配置都一样）
                const firstDonationConfig = configsWithDonation[0].donationCfg;
                this.restoreDonationUI(firstDonationConfig);
            } else {
                // 所有配置都没有捐锅配置，选中"不捐锅"
                this.setData({
                    donationType: 'none',
                    donationPoints: 1,
                    totalFee: '',
                    maxDonationPoints: ''
                });
            }
        },

        /**
         * 根据捐锅配置回显UI
         * @param {Object} donationCfg 捐锅配置对象
         */
        restoreDonationUI(donationCfg) {
            console.log('[juanguo] 回显捐锅UI，配置:', donationCfg);

            const donationType = donationCfg.donationType || 'normal';
            let donationPoints = 1;
            let totalFee = '';
            let maxDonationPoints = '';

            switch (donationType) {
                case 'normal':
                    donationPoints = donationCfg.donationPoints || 1;
                    maxDonationPoints = donationCfg.maxDonationPoints || '';
                    break;
                case 'all':
                    maxDonationPoints = donationCfg.maxDonationPoints || '';
                    break;
                case 'bigpot':
                    totalFee = donationCfg.totalFee || '';
                    break;
                case 'none':
                    // 不捐锅，保持默认值
                    break;
            }

            this.setData({
                donationType: donationType,
                donationPoints: donationPoints,
                totalFee: totalFee,
                maxDonationPoints: maxDonationPoints
            });

            console.log('[juanguo] UI回显完成:', {
                donationType: donationType,
                donationPoints: donationPoints,
                totalFee: totalFee,
                maxDonationPoints: maxDonationPoints
            });
        },

        // 处理 RuntimeConfigSelector 组件的 checkbox 变化
        onCheckboxChange(e) {
            const selectedIdList = e.detail.selectedIdList || [];
            console.log('[juanguo] 选中ID变化:', selectedIdList);
            // 去重处理
            const uniqueSelectedIds = [...new Set(selectedIdList)];
            console.log('[juanguo] 去重后的选中ID:', uniqueSelectedIds);
            this.setData({
                selectedIdList: uniqueSelectedIds,
                forceRefresh: this.data.forceRefresh + 1
            });
        },

        // 捐锅方式切换
        onDonationTypeChange(e) {
            const value = e.detail.value;
            this.setData({
                donationType: value,
                // 切换到normal时自动填1分
                donationPoints: value === 'normal' ? 1 : this.data.donationPoints
            });
            console.log('[juanguo] 捐锅方式变更为:', value);
        },

        // 捐锅分数输入
        onDonationPointsInput(e) {
            const donationPoints = e.detail.value;
            this.setData({ donationPoints });
        },

        // 总费用输入（大锅饭模式）
        onTotalFeeInput(e) {
            const totalFee = e.detail.value;
            this.setData({ totalFee });
        },

        // 最大捐锅点数输入
        onMaxDonationPointsInput(e) {
            const maxDonationPoints = e.detail.value;
            this.setData({ maxDonationPoints });
        },

        // 确定按钮点击
        onConfirm() {
            // 获取所有配置的 id 列表
            const allRuntimeIDs = this.properties.runtimeConfigs?.map(config => config.id) || [];

            // 确保 selectedIds 去重
            const selectedIds = [...new Set(this.data.selectedIdList || [])];

            // 构建捐锅配置数据
            const donationConfig = {
                selectedIds: selectedIds,
                allRuntimeIDs: allRuntimeIDs,
                donationType: this.data.donationType,
                donationPoints: this.data.donationType === 'normal' ? Number(this.data.donationPoints) : 0,
                totalFee: this.data.donationType === 'bigpot' ? Number(this.data.totalFee) : 0,
                maxDonationPoints: (this.data.donationType === 'normal' || this.data.donationType === 'all') ? Number(this.data.maxDonationPoints) : 0
            };
            console.log('[juanguo] 捐锅配置:', donationConfig);
            // 触发事件传递给父组件
            this.triggerEvent('confirmDonation', { donationConfig });
            // 关闭弹窗
            this.close();
        },

        // 关闭弹窗
        close() {
            this.triggerEvent('close');
        },

        // 空方法，阻止冒泡
        noop() { }
    }
}); 