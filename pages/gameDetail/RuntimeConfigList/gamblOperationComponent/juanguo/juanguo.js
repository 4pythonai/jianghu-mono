import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';
import { holeRangeStore } from '../../../../../stores/holeRangeStore';
import { toJS } from 'mobx-miniprogram';
Component({
    properties: {
        runtimeConfigs: Array
    },
    data: {
        selectedIdList: [], // 选中的配置ID数组
        donationType: 'normal', // 捐锅方式: normal-普通, bigpot-大锅饭
        donationPoints: 1, // 默认每洞捐1分
        totalFee: '', // 总费用（大锅饭模式）
    },
    lifetimes: {
        attached() {
            console.log('[juanguo] 组件已挂载, runtimeConfigs:', this.data.runtimeConfigs);
            console.log('[juanguo] gameStore:', toJS(gameStore));
            console.log('[juanguo] holeRangeStore:', toJS(holeRangeStore));
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: ['gameData', 'players'],
                actions: [],
            });
        },
        detached() {
            this.storeBindings.destroyStoreBindings();
        }
    },
    methods: {
        // 处理checkbox-group选中变化
        onCheckboxGroupChange(e) {
            this.setData({
                selectedIdList: e.detail.value
            });
            console.log('[juanguo] 选中ID变化:', e.detail.value);
        },

        // 处理checkbox选择变化
        onCheckboxChange(e) {
            const id = e.currentTarget.dataset.id;
            const selectedIdList = [...this.data.selectedIdList];

            // 切换选中状态
            const index = selectedIdList.indexOf(id);
            if (index > -1) {
                selectedIdList.splice(index, 1);
            } else {
                selectedIdList.push(id);
            }

            this.setData({
                selectedIdList
            });

            console.log('[juanguo] 选中状态变化:', { id, selected: selectedIdList.includes(id) });
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

        // 确定按钮点击
        onConfirm() {
            // 直接用selectedIdList
            const selectedIds = this.data.selectedIdList;

            // 构建捐锅配置数据
            const donationConfig = {
                selectedIds,
                donationType: this.data.donationType,
                donationPoints: this.data.donationType === 'normal' ? Number(this.data.donationPoints) : 0,
                totalFee: this.data.donationType === 'bigpot' ? Number(this.data.totalFee) : 0,
            };

            console.log('[juanguo] 捐锅配置:', donationConfig);

            // 可以触发事件传递给父组件
            this.triggerEvent('confirm', { donationConfig });

            // 关闭弹窗
            this.close();
        },

        close() {
            this.triggerEvent('close');
        },

        noop() {
            // 空方法，阻止冒泡
        }
    }
}); 