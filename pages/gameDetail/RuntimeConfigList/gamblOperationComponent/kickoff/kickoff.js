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
        // 洞序列表（从 gameStore 取）
        holePlayList: [],
        showMultiplierSelector: false,
        selectedHole: null,
        holeMultipliers: {} // 存储每个洞的倍数
    },

    lifetimes: {
        attached() {
            // 绑定 mobx store
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: {
                    gameData: 'gameData',
                    players: 'players'
                }
            });
            // 初始化洞序列表
            this.setData({
                holePlayList: gameStore.gameData.holeList || []
            });
        },
        detached() {
            this.storeBindings.destroyStoreBindings();
        }
    },

    methods: {
        // 处理 checkbox 选择变化
        onCheckboxChange(e) {
            // e.detail.selectedIdList 是 RuntimeConfigSelector 组件传递的选中 id 数组
            this.setData({
                selectedIdList: e.detail.selectedIdList
            });
        },

        // 选择洞号
        onSelectHole(e) {
            const { index, hindex } = e.currentTarget.dataset;
            const hole = this.data.holePlayList[index];

            console.log(`[kickoff] 选择球洞: ${hole.holename} (洞号: ${hindex})`);

            this.setData({
                selectedHole: hole,
                showMultiplierSelector: true
            });
        },

        // 倍数选择确认
        onMultiplierConfirm(e) {
            const { hindex, multiplier, customValue } = e.detail;
            const holeName = this.data.selectedHole?.holename || `洞号${hindex}`;

            // 更新倍数数据
            const holeMultipliers = { ...this.data.holeMultipliers };
            holeMultipliers[hindex] = multiplier;

            this.setData({
                holeMultipliers,
                showMultiplierSelector: false
            });

            // 详细的console.log输出
            if (customValue) {
                console.log(`[kickoff] 球洞 "${holeName}" (洞号: ${hindex}) 设置自定义倍数为: ${multiplier}`);
            } else {
                console.log(`[kickoff] 球洞 "${holeName}" (洞号: ${hindex}) 设置倍数为: ${multiplier}`);
            }

            // 显示当前所有已配置的洞号倍数
            console.log('[kickoff] 当前已配置的洞号倍数:', holeMultipliers);
        },

        // 倍数选择取消
        onMultiplierCancel() {
            console.log('[kickoff] 取消倍数选择');
            this.setData({
                showMultiplierSelector: false
            });
        },

        // 确定按钮点击
        onConfirm() {
            const { selectedIdList, holeMultipliers } = this.data;

            console.log('=== [kickoff] 踢一脚配置确认 ===');
            console.log('[kickoff] 选中的游戏配置ID:', selectedIdList);
            console.log('[kickoff] 洞号倍数配置详情:');

            // 详细显示每个洞的倍数配置
            if (Object.keys(holeMultipliers).length > 0) {
                Object.keys(holeMultipliers).forEach(hindex => {
                    const multiplier = holeMultipliers[hindex];
                    const hole = this.data.holePlayList.find(h => h.hindex == hindex);
                    const holeName = hole ? hole.holename : `洞号${hindex}`;
                    console.log(`  - ${holeName} (洞号: ${hindex}): ${multiplier}倍`);
                });
            } else {
                console.log('  - 未配置任何洞号倍数');
            }

            console.log('[kickoff] 完整配置数据:', {
                selectedIdList,
                holeMultipliers
            });
            console.log('=== [kickoff] 配置确认完成 ===');

            // 触发事件传递给父组件
            this.triggerEvent('confirm', {
                selectedIdList,
                holeMultipliers
            });
        },

        // 关闭弹窗
        close() {
            this.triggerEvent('close');
        },

        // 空方法，阻止冒泡
        noop() { }
    }
});
