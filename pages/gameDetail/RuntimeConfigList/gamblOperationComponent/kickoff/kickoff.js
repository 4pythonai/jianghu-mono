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
        // 简化的数据结构：存储当前选择的洞号和倍数
        currentHindex: null,
        currentMultiplier: null,
        // 新增：运行时倍数数据
        runtimeMultipliers: []
    },

    lifetimes: {
        attached() {
            // 绑定 mobx store
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: {
                    gameData: 'gameData',
                    players: 'players',
                    runtimeMultipliers: 'runtimeMultipliers' // 新增：绑定运行时倍数数据
                }
            });
            // 初始化洞序列表

            console.log('[kickoff] attached🟢🟡🟢🟡🟢🟡 gameStore:', toJS(gameStore));

            this.setData({
                holePlayList: gameStore.gameData?.holeList || []
            });
        },
        detached() {
            this.storeBindings.destroyStoreBindings();
        }
    },

    observers: {
        'runtimeMultipliers': (runtimeMultipliers) => {
            console.log('[kickoff] runtimeMultipliers 数据变化');
            console.log('[kickoff] runtimeMultipliers 数据:', runtimeMultipliers);
            console.log('[kickoff] runtimeMultipliers 数据类型:', typeof runtimeMultipliers);
            console.log('[kickoff] runtimeMultipliers 数据长度:', runtimeMultipliers?.length || 0);

            // 如果数据不为空，打印详细信息
            if (runtimeMultipliers && runtimeMultipliers.length > 0) {
                console.log('[kickoff] runtimeMultipliers 详细数据:', JSON.stringify(runtimeMultipliers, null, 2));
            }
        }
    },

    methods: {

        onCheckboxChange(e) {
            console.log(" 踢一脚:🈲🈲🈲🈲🈲🈲🈲🈲🈲🈲🈲🈲🈲🈲🈲🈲", this.data.runtimeMultipliers)
            this.setData({
                selectedIdList: e.detail.selectedIdList
            });
        },

        // 选择洞号
        onSelectHole(e) {
            const { index, hindex } = e.currentTarget.dataset;
            const hole = this.data.holePlayList[index];

            console.log(`[kickoff] 选择球洞: ${hole.holename} (洞号: ${hindex})`);

            // 检查当前洞是否已有倍数配置
            const existingMultiplier = this.getHoleMultiplier(hindex);
            if (existingMultiplier) {
                console.log(`[kickoff] 洞号 ${hindex} 当前倍数: ${existingMultiplier}`);
            }

            this.setData({
                selectedHole: hole,
                showMultiplierSelector: true
            });
        },

        // 获取指定洞号的倍数配置
        getHoleMultiplier(hindex) {
            const { runtimeMultipliers } = this.data;
            const multiplierConfig = runtimeMultipliers.find(item => item.hindex === hindex);
            return multiplierConfig?.multiplier || null;
        },

        // 倍数选择确认
        onMultiplierConfirm(e) {
            const { hindex, multiplier } = e.detail;
            const holeName = this.data.selectedHole?.holename || `洞号${hindex}`;

            this.setData({
                currentHindex: hindex,
                currentMultiplier: multiplier,
                showMultiplierSelector: false
            });

            console.log(`[kickoff] 球洞 "${holeName}" (洞号: ${hindex}) 设置倍数为: ${multiplier}`);
            console.log('[kickoff] 当前选择:', { hindex, multiplier });
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
            const { selectedIdList, currentHindex, currentMultiplier } = this.data;

            console.log('=== [kickoff] 踢一脚配置确认 ===');
            console.log('[kickoff] 选中的游戏配置ID:', selectedIdList);

            if (currentHindex && currentMultiplier) {
                const hole = this.data.holePlayList.find(h => h.hindex === currentHindex);
                const holeName = hole ? hole.holename : `洞号${currentHindex}`;
                console.log(`[kickoff] 选择的球洞: ${holeName} (洞号: ${currentHindex})`);
                console.log(`[kickoff] 设置的倍数: ${currentMultiplier}`);
            } else {
                console.log('[kickoff] 未选择球洞或倍数');
            }

            console.log('[kickoff] 完整配置数据:', {
                selectedIdList,
                hindex: currentHindex,
                multiplier: currentMultiplier
            });
            console.log('=== [kickoff] 配置确认完成 ===');

            // 触发事件传递给父组件
            this.triggerEvent('confirm', {
                selectedIdList,
                hindex: currentHindex,
                multiplier: currentMultiplier
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
