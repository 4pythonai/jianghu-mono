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

            for (const config of runtimeConfigs) {
                const donationCfgStr = config.donationCfg;
                console.log('[juanguo] 配置', config.id, '的 donationCfg:', donationCfgStr, '类型:', typeof donationCfgStr);

                // 解析 JSON 字符串
                const donationCfg = JSON.parse(donationCfgStr);
                console.log('[juanguo] 解析后:', donationCfg);

                if (donationCfg?.donationType && donationCfg.donationType !== 'none') {
                    configsWithDonation.push(config);
                } else {
                    configsWithoutDonation.push(config.id);
                }
            }

            console.log('[juanguo] 分析结果:', {
                configsWithDonation: configsWithDonation,
                configsWithoutDonation: configsWithoutDonation
            });

            // 设置选中的ID列表 - 确保ID是字符串类型并去重
            const selectedIds = [...new Set(configsWithDonation.map(item => String(item.id)))];
            console.log('[juanguo] 设置选中的ID列表:', selectedIds);

            // 先设置其他数据
            this.setData({
                forceRefresh: this.data.forceRefresh + 1
            });

            // 延迟设置 selectedIdList，确保组件已完全渲染
            setTimeout(() => {
                this.setData({
                    selectedIdList: selectedIds
                });
                console.log('[juanguo] 延迟设置 selectedIdList 完成');
            }, 100);

            // 回显捐锅方式UI
            if (configsWithDonation.length > 0) {
                // 使用第一个有捐锅配置的项来回显（后台确保所有配置都一样）
                const firstConfig = configsWithDonation[0];
                const firstDonationConfig = JSON.parse(firstConfig.donationCfg);
                console.log('[juanguo] 使用第一个配置回显:', firstDonationConfig);
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
            const oldValue = this.data.donationType;

            this.setData({
                donationType: value,
                // 切换到normal时自动填1分
                donationPoints: value === 'normal' ? 1 : this.data.donationPoints
            });

            console.log('[juanguo] 捐锅方式变更为:', value);

            // 切换捐锅方式后，验证相关输入值是否仍然有效
            this.validateAfterTypeChange(value, oldValue);
        },

        /**
         * 捐锅方式切换后的验证
         * @param {string} newType 新的捐锅方式
         * @param {string} oldType 旧的捐锅方式
         */
        validateAfterTypeChange(newType, oldType) {
            // 如果从其他方式切换到normal，确保donationPoints有效
            if (newType === 'normal' && oldType !== 'normal') {
                if (!this.data.donationPoints || Number(this.data.donationPoints) <= 0) {
                    this.setData({ donationPoints: 1 });
                }
            }

            // 如果切换到需要maxDonationPoints的方式，确保值有效
            if ((newType === 'normal' || newType === 'all') &&
                (!this.data.maxDonationPoints || Number(this.data.maxDonationPoints) <= 0)) {
                // 清空无效值，让用户重新输入
                this.setData({ maxDonationPoints: '' });
            }

            // 如果切换到bigpot方式，确保totalFee有效
            if (newType === 'bigpot' && (!this.data.totalFee || Number(this.data.totalFee) <= 0)) {
                // 清空无效值，让用户重新输入
                this.setData({ totalFee: '' });
            }
        },

        // 捐锅分数输入
        onDonationPointsInput(e) {
            const donationPoints = e.detail.value;
            this.setData({ donationPoints });
            // 实时验证输入值
            this.validateSingleInput('donationPoints', donationPoints);
        },

        // 总费用输入（大锅饭模式）
        onTotalFeeInput(e) {
            const totalFee = e.detail.value;
            this.setData({ totalFee });
            // 实时验证输入值
            this.validateSingleInput('totalFee', totalFee);
        },

        // 最大捐锅点数输入
        onMaxDonationPointsInput(e) {
            const maxDonationPoints = e.detail.value;
            this.setData({ maxDonationPoints });
            // 实时验证输入值
            this.validateSingleInput('maxDonationPoints', maxDonationPoints);
        },

        /**
         * 实时验证单个输入值
         * @param {string} field 字段名
         * @param {string} value 输入值
         */
        validateSingleInput(field, value) {
            const numValue = Number(value);

            // 检查是否为空或非数字
            if (!value || isNaN(numValue)) {
                return false;

            }

            // 检查是否小于等于0
            if (numValue <= 0) {
                return false;
            }

            // 特殊验证：每洞捐分不能超过最大捐锅点数
            if (field === 'donationPoints' && this.data.donationType === 'normal') {
                const maxPoints = Number(this.data.maxDonationPoints);
                if (maxPoints && numValue > maxPoints) {
                    return false;
                }
            }

            return true;
        },

        // 确定按钮点击
        onConfirm() {
            // 获取所有配置的 id 列表
            const allRuntimeIDs = this.properties.runtimeConfigs?.map(config => config.id) || [];

            // 确保 selectedIds 去重
            const selectedIds = [...new Set(this.data.selectedIdList || [])];

            // 根据捐锅方式验证输入值
            const validationResult = this.validateInputs();
            if (!validationResult.isValid) {
                wx.showToast({
                    title: validationResult.message,
                    icon: 'none',
                    duration: 2000
                });
                return;
            }

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

            // 触发事件传递给父组件，让父组件决定是否关闭弹窗
            this.triggerEvent('confirmDonation', { donationConfig });
            // 注意：不再在这里自动关闭弹窗，由父组件控制
        },

        /**
         * 验证输入值
         * @returns {{isValid: boolean, message: string}} 验证结果
         */
        validateInputs() {
            const { donationType, donationPoints, totalFee, maxDonationPoints } = this.data;

            // 根据捐锅方式验证相应的输入值
            switch (donationType) {
                case 'normal':
                    // 普通模式：验证每洞捐分和最大捐锅点数
                    if (!donationPoints || Number(donationPoints) <= 0) {
                        return { isValid: false, message: '每洞捐分必须大于0' };
                    }
                    if (!maxDonationPoints || Number(maxDonationPoints) <= 0) {
                        return { isValid: false, message: '最大合计点数必须大于0' };
                    }
                    // 验证每洞捐分不能超过最大捐锅点数
                    if (Number(donationPoints) > Number(maxDonationPoints)) {
                        return { isValid: false, message: '每洞捐分不能超过最大合计点数' };
                    }
                    break;

                case 'all':
                    // 全捐模式：验证最大捐锅点数
                    if (!maxDonationPoints || Number(maxDonationPoints) <= 0) {
                        return { isValid: false, message: '最大合计点数必须大于0' };
                    }
                    break;

                case 'bigpot':
                    // 大锅饭模式：验证总费用
                    if (!totalFee || Number(totalFee) <= 0) {
                        return { isValid: false, message: '总费用必须大于0' };
                    }
                    break;

                case 'none':
                    // 不捐锅模式：不需要验证
                    break;

                default:
                    return { isValid: false, message: '请选择有效的捐锅方式' };
            }

            return { isValid: true, message: '' };
        },

        // 关闭弹窗
        close() {
            this.triggerEvent('close');
        },

        // 空方法，阻止冒泡
        noop() { }
    }
}); 