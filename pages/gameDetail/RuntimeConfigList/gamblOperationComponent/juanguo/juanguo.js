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
        // 捐锅方式: normal-普通, all-全捐, bigpot-大锅饭
        donationType: 'normal',
        // 默认每洞捐1分
        donationPoints: 1,
        // 总费用（大锅饭模式）
        totalFee: '',
        // 最大合计捐锅点数
        maxDonationPoints: ''
    },
    lifetimes: {
        attached() {
            // 绑定 mobx store
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameData', 'players'],
                actions: []
            });
        },
        detached() {
            this.storeBindings.destroyStoreBindings();
        }
    },
    methods: {
        // 处理 RuntimeConfigSelector 组件的 checkbox 变化
        onCheckboxChange(e) {
            this.setData({
                selectedIdList: e.detail.selectedIdList
            });
            console.log('[juanguo] 选中ID变化:', e.detail.selectedIdList);
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

            // 构建捐锅配置数据
            const donationConfig = {
                selectedIds: this.data.selectedIdList,
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