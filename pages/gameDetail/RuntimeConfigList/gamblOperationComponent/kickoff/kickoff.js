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
        runtimeMultipliers: [],
        // 新增：每个洞的倍数信息，用于在 WXML 中显示
        holeMultiplierMap: {}
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
        'runtimeMultipliers': function (runtimeMultipliers) {
            console.log('[kickoff] runtimeMultipliers 数据变化');
            console.log('[kickoff] runtimeMultipliers 数据:', runtimeMultipliers);
            console.log('[kickoff] runtimeMultipliers 数据类型:', typeof runtimeMultipliers);
            console.log('[kickoff] runtimeMultipliers 数据长度:', runtimeMultipliers?.length || 0);

            // 如果数据不为空，打印详细信息
            if (runtimeMultipliers && runtimeMultipliers.length > 0) {
                console.log('[kickoff] runtimeMultipliers 详细数据:', JSON.stringify(runtimeMultipliers, null, 2));

                // 遍历每个 runtime 配置，打印详细信息
                for (const [index, runtimeConfig] of runtimeMultipliers.entries()) {
                    console.log(`[kickoff] runtime配置 ${index + 1}:`, {
                        runtime_id: runtimeConfig.runtime_id,
                        holeMultipliers: runtimeConfig.holeMultipliers
                    });

                    // 打印每个洞的倍数配置
                    if (runtimeConfig.holeMultipliers && Array.isArray(runtimeConfig.holeMultipliers)) {
                        for (const holeMultiplier of runtimeConfig.holeMultipliers) {
                            console.log(`[kickoff] 洞号 ${holeMultiplier.hindex} 倍数: ${holeMultiplier.multiplier}`);
                        }
                    }
                }
            } else {
                console.log('[kickoff] runtimeMultipliers 为空或未定义');
            }

            // 更新洞号倍数映射表
            this.updateHoleMultiplierMap();
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
            console.log('[kickoff] onSelectHole - 当前 runtimeMultipliers 数据:', this.data.runtimeMultipliers);

            // 检查当前洞是否已有倍数配置
            const existingMultiplier = this.getHoleMultiplier(hindex);
            console.log(`[kickoff] onSelectHole - 洞号 ${hindex} 现有倍数:`, existingMultiplier);

            if (existingMultiplier) {
                console.log(`[kickoff] 洞号 ${hindex} 当前倍数: ${existingMultiplier}`);
            } else {
                console.log(`[kickoff] 洞号 ${hindex} 暂无倍数配置`);
            }

            this.setData({
                selectedHole: hole,
                showMultiplierSelector: true
            });
        },

        // 获取指定洞号的倍数配置
        getHoleMultiplier(hindex) {
            const { runtimeMultipliers } = this.data;
            console.log(`[kickoff] getHoleMultiplier - 查找洞号 ${hindex} 的倍数配置`);
            console.log('[kickoff] getHoleMultiplier - 当前 runtimeMultipliers:', runtimeMultipliers);

            // 遍历 runtimeMultipliers 数组，查找匹配的洞号倍数
            for (const runtimeConfig of runtimeMultipliers) {
                if (runtimeConfig.holeMultipliers && Array.isArray(runtimeConfig.holeMultipliers)) {
                    // 在 holeMultipliers 中查找匹配的洞号
                    const multiplierConfig = runtimeConfig.holeMultipliers.find(item => {
                        // 考虑 hindex 的类型，转换为字符串进行比较
                        const itemHindex = String(item.hindex);
                        const searchHindex = String(hindex);
                        return itemHindex === searchHindex;
                    });

                    if (multiplierConfig) {
                        console.log('[kickoff] getHoleMultiplier - 找到的配置:', multiplierConfig);
                        console.log('[kickoff] getHoleMultiplier - 返回倍数:', multiplierConfig.multiplier);
                        return multiplierConfig.multiplier;
                    }
                }
            }

            console.log('[kickoff] getHoleMultiplier - 未找到配置，返回 null');
            return null;
        },

        // 倍数选择确认
        onMultiplierConfirm(e) {
            const { hindex, multiplier } = e.detail;
            const holeName = this.data.selectedHole?.holename || `洞号${hindex}`;

            console.log('[kickoff] onMultiplierConfirm - 接收到倍数选择:', e.detail);
            console.log(`[kickoff] onMultiplierConfirm - hindex: ${hindex}, multiplier: ${multiplier}`);

            this.setData({
                currentHindex: hindex,
                currentMultiplier: multiplier,
                showMultiplierSelector: false
            });

            console.log(`[kickoff] 球洞 "${holeName}" (洞号: ${hindex}) 设置倍数为: ${multiplier}`);
            console.log('[kickoff] 当前选择:', { hindex, multiplier });
            console.log('[kickoff] onMultiplierConfirm - 设置后的数据:', {
                currentHindex: this.data.currentHindex,
                currentMultiplier: this.data.currentMultiplier
            });
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
            console.log('[kickoff] onConfirm - 当前所有数据:', this.data);

            if (currentHindex && currentMultiplier) {
                const hole = this.data.holePlayList.find(h => h.hindex === currentHindex);
                const holeName = hole ? hole.holename : `洞号${currentHindex}`;
                console.log(`[kickoff] 选择的球洞: ${holeName} (洞号: ${currentHindex})`);
                console.log(`[kickoff] 设置的倍数: ${currentMultiplier}`);
            } else {
                console.log('[kickoff] 未选择球洞或倍数');
                console.log('[kickoff] onConfirm - currentHindex:', currentHindex);
                console.log('[kickoff] onConfirm - currentMultiplier:', currentMultiplier);
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
        noop() { },

        // 更新洞号倍数映射表
        updateHoleMultiplierMap() {
            const { runtimeMultipliers, holePlayList } = this.data;
            const holeMultiplierMap = {};

            console.log('[kickoff] updateHoleMultiplierMap - 开始更新倍数映射表');
            console.log('[kickoff] updateHoleMultiplierMap - runtimeMultipliers:', runtimeMultipliers);
            console.log('[kickoff] updateHoleMultiplierMap - holePlayList:', holePlayList);

            // 为每个洞创建倍数映射
            for (const hole of holePlayList) {
                // 在 runtimeMultipliers 中查找该洞号的倍数配置
                let foundMultiplier = null;

                for (const runtimeConfig of runtimeMultipliers) {
                    if (runtimeConfig.holeMultipliers && Array.isArray(runtimeConfig.holeMultipliers)) {
                        // 在 holeMultipliers 中查找匹配的洞号
                        const multiplierConfig = runtimeConfig.holeMultipliers.find(item => {
                            // 考虑 hindex 的类型，转换为字符串进行比较
                            const itemHindex = String(item.hindex);
                            const holeHindex = String(hole.hindex);
                            return itemHindex === holeHindex;
                        });

                        if (multiplierConfig) {
                            foundMultiplier = multiplierConfig.multiplier;
                            break; // 找到后跳出内层循环
                        }
                    }
                }

                holeMultiplierMap[hole.hindex] = foundMultiplier;
                console.log(`[kickoff] updateHoleMultiplierMap - 洞号 ${hole.hindex} 倍数:`, foundMultiplier);
            }

            this.setData({ holeMultiplierMap });
            console.log('[kickoff] updateHoleMultiplierMap - 更新完成:', holeMultiplierMap);
        }
    }
});
