import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';
import { toJS } from 'mobx-miniprogram';



Component({
    properties: {
        // 传入的 runtimeConfigs 列表（现在只包含一个配置项）
        runtimeConfigs: {
            type: Array,
            value: []
        }
    },

    data: {
        // 洞序列表（从 gameStore 取）
        holePlayList: [],
        showMultiplierSelector: false,
        selectedHole: null,
        // 简化的数据结构：存储当前选择的洞号和倍数
        currentHindex: null,
        currentMultiplier: null,
        // 新增：运行时倍数数据
        kickConfigs: [],
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
                    kickConfigs: 'kickConfigs' // 新增：绑定运行时倍数数据
                },
                actions: {
                    updateRuntimeMultipliers: 'updateRuntimeMultipliers' // 新增：绑定更新方法
                }
            });
            console.log('[kickoff] attached🟢🟡🟢🟡🟢🟡 gameStore:', toJS(gameStore));
            console.log('[kickoff] attached - gameStore.kickConfigs:', toJS(gameStore.kickConfigs));

            // 从 runtimeConfigs 的 holePlayListStr 获取 holePlayList
            this.updateHolePlayListFromConfig();
        },
        detached() {
            this.storeBindings.destroyStoreBindings();
        }
    },

    observers: {
        'runtimeConfigs': function (runtimeConfigs) {
            console.log('[kickoff] runtimeConfigs 数据变化:', runtimeConfigs);
            this.updateHolePlayListFromConfig();
        },

        'kickConfigs': function (kickConfigs) {
            console.log('[kickoff] kickConfigs 数据变化');
            console.log('[kickoff] kickConfigs 数据:', kickConfigs);
            console.log('[kickoff] kickConfigs 数据类型:', typeof kickConfigs);
            console.log('[kickoff] kickConfigs 数据长度:', kickConfigs?.length || 0);
            console.log('[kickoff] kickConfigs 是否为数组:', Array.isArray(kickConfigs));
            console.log('[kickoff] kickConfigs 详细内容:', JSON.stringify(kickConfigs, null, 2));

            // 获取当前配置项信息
            const currentConfig = this.data.runtimeConfigs?.[0] || {};
            const configId = currentConfig.id;
            console.log('[kickoff] 当前配置项ID:', configId);

            // 根据 runtime_id 匹配当前配置项
            if (kickConfigs && kickConfigs.length > 0) {
                console.log('[kickoff] 开始匹配 runtime_id 和 configId...');

                // 查找匹配的 runtime 配置
                const matchedRuntime = kickConfigs.find(runtime => {
                    const isMatch = String(runtime.runtime_id) === String(configId);
                    console.log(`[kickoff] 比较: runtime_id=${runtime.runtime_id} vs configId=${configId}, 匹配结果: ${isMatch}`);
                    return isMatch;
                });

                if (matchedRuntime) {
                    console.log('[kickoff] ✅ 找到匹配的 runtime 配置:', matchedRuntime);
                    console.log('[kickoff] 匹配配置的 kickConfig:', matchedRuntime.kickConfig);

                    // 更新洞号倍数映射表，只显示当前配置项的倍数信息
                    this.updateHoleMultiplierMapForConfig(matchedRuntime);
                } else {
                    console.log('[kickoff] ❌ 未找到匹配的 runtime 配置，清空倍数映射');
                    this.setData({ holeMultiplierMap: {} });
                }
            } else {
                console.log('[kickoff] kickConfigs 为空或未定义');
                this.setData({ holeMultiplierMap: {} });
            }
        }
    },

    methods: {
        // 选择洞号
        onSelectHole(e) {
            const { index, hindex } = e.currentTarget.dataset;
            const hole = this.data.holePlayList[index];

            console.log(`[kickoff] 选择球洞: ${hole.holename} (洞号: ${hindex})`);
            console.log('[kickoff] onSelectHole - 当前 kickConfigs 数据:', this.data.kickConfigs);

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
            const { kickConfigs } = this.data;
            console.log(`[kickoff] getHoleMultiplier - 查找洞号 ${hindex} 的倍数配置`);
            console.log('[kickoff] getHoleMultiplier - 当前 kickConfigs:', kickConfigs);

            // 遍历 kickConfigs 数组，查找匹配的洞号倍数
            for (const runtimeConfig of kickConfigs) {
                if (runtimeConfig.kickConfig && Array.isArray(runtimeConfig.kickConfig)) {
                    // 在 kickConfig 中查找匹配的洞号
                    const multiplierConfig = runtimeConfig.kickConfig.find(item => {
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

            // 获取当前配置项信息
            const currentConfig = this.data.runtimeConfigs?.[0] || {};
            const configId = currentConfig.id;

            // 获取当前洞在洞序列表中的索引
            const currentHoleIndex = this.data.holePlayList.findIndex(hole =>
                String(hole.hindex) === String(hindex)
            );

            if (currentHoleIndex !== -1) {
                console.log(`[kickoff] 当前洞索引: ${currentHoleIndex}, 洞号: ${hindex}`);

                // 获取现有的倍数配置
                const matchedRuntime = this.data.kickConfigs?.find(runtime => {
                    const isMatch = String(runtime.runtime_id) === String(configId);
                    return isMatch;
                });

                let kickConfig = matchedRuntime?.kickConfig || [];

                // 从当前洞开始到最后一个洞，设置相同的倍数
                for (let i = currentHoleIndex; i < this.data.holePlayList.length; i++) {
                    const targetHole = this.data.holePlayList[i];
                    const targetHindex = targetHole.hindex;

                    // 检查是否已存在该洞号的倍数配置
                    const existingIndex = kickConfig.findIndex(hole =>
                        String(hole.hindex) === String(targetHindex)
                    );

                    if (existingIndex !== -1) {
                        // 更新现有配置
                        console.log(`[kickoff] 🔄 更新洞号 ${targetHindex} 的倍数: ${kickConfig[existingIndex].multiplier} -> ${multiplier}`);
                        kickConfig[existingIndex].multiplier = multiplier;
                    } else {
                        // 新增配置
                        console.log(`[kickoff] ➕ 新增洞号 ${targetHindex} 的倍数配置: ${multiplier}`);
                        kickConfig.push({
                            hindex: targetHindex,
                            multiplier: multiplier
                        });
                    }
                }

                console.log('[kickoff] 连锁设置完成，新的倍数配置:', kickConfig);

                // 使用 gameStore 的 action 更新数据
                console.log('[kickoff] 调用 updateRuntimeMultipliers action...');
                console.log('[kickoff] configId:', configId);
                console.log('[kickoff] kickConfig:', kickConfig);

                this.updateRuntimeMultipliers(configId, kickConfig);

                console.log('[kickoff] updateRuntimeMultipliers 调用完成');
                console.log('[kickoff] 当前 kickConfigs 数据:', this.data.kickConfigs);

                // 直接更新组件的 kickConfigs 数据
                const currentRuntimeMultipliers = this.data.kickConfigs || [];
                const existingIndex = currentRuntimeMultipliers.findIndex(runtime =>
                    String(runtime.runtime_id) === String(configId)
                );

                let updatedRuntimeMultipliers;
                if (existingIndex !== -1) {
                    // 更新现有配置
                    updatedRuntimeMultipliers = [...currentRuntimeMultipliers];
                    updatedRuntimeMultipliers[existingIndex] = {
                        ...updatedRuntimeMultipliers[existingIndex],
                        kickConfig: kickConfig
                    };
                } else {
                    // 新增配置
                    updatedRuntimeMultipliers = [...currentRuntimeMultipliers, {
                        runtime_id: configId,
                        kickConfig: kickConfig
                    }];
                }

                console.log('[kickoff] 更新后的 kickConfigs:', updatedRuntimeMultipliers);
                this.setData({ kickConfigs: updatedRuntimeMultipliers });

                // 更新倍数映射表显示
                this.updateHoleMultiplierMapForConfig({
                    runtime_id: configId,
                    kickConfig: kickConfig
                });
            } else {
                console.log('[kickoff] ❌ 未找到当前洞在洞序列表中的位置');
            }

            this.setData({
                currentHindex: hindex,
                currentMultiplier: multiplier,
                showMultiplierSelector: false
            });

            console.log(`[kickoff] 球洞 "${holeName}" (洞号: ${hindex}) 设置倍数为: ${multiplier}，并连锁应用到后续洞`);
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
            const { currentHindex, currentMultiplier, runtimeConfigs, kickConfigs } = this.data;

            // 获取当前配置项信息
            const currentConfig = runtimeConfigs?.[0] || {};
            const configId = currentConfig.id;
            const configName = currentConfig.gambleUserName || currentConfig.gambleSysName || '未知配置';

            console.log('=== [kickoff] 踢一脚配置确认 ===');
            console.log('[kickoff] 当前配置信息:', {
                configId: configId,
                configName: configName,
                gambleSysName: currentConfig.gambleSysName,
                gambleUserName: currentConfig.gambleUserName
            });
            console.log('[kickoff] 最后选择的洞号:', currentHindex);
            console.log('[kickoff] 设置的倍数:', currentMultiplier);

            // 获取完整的倍数配置信息
            let completeMultiplierConfig = null;
            const matchedRuntime = kickConfigs?.find(runtime => {
                const isMatch = String(runtime.runtime_id) === String(configId);
                return isMatch;
            });

            if (matchedRuntime?.kickConfig) {
                completeMultiplierConfig = matchedRuntime.kickConfig;
                console.log('[kickoff] 完整的倍数配置:', completeMultiplierConfig);
            }

            if (currentHindex && currentMultiplier) {
                const hole = this.data.holePlayList.find(h => h.hindex === currentHindex);
                const holeName = hole ? hole.holename : `洞号${currentHindex}`;
                console.log(`[kickoff] 最后选择的球洞: ${holeName} (洞号: ${currentHindex})`);
                console.log(`[kickoff] 设置的倍数: ${currentMultiplier} (已连锁应用到后续洞)`);
            } else {
                console.log('[kickoff] 未选择球洞或倍数');
            }

            console.log('[kickoff] 完整配置数据:', {
                configId,
                configName,
                hindex: currentHindex,
                multiplier: currentMultiplier,
                completeMultiplierConfig
            });
            console.log('=== [kickoff] 配置确认完成 ===');
            // 调用 RuntimeConfigList.js 中的 onKickoffConfirm 方法。

            this.triggerEvent('confirm', {
                configId,
                configName,
                hindex: currentHindex,
                multiplier: currentMultiplier,
                completeMultiplierConfig, // 新增：完整的倍数配置
                holeMultiplierMap: this.data.holeMultiplierMap // 新增：倍数映射表
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
            const { kickConfigs, holePlayList } = this.data;
            const holeMultiplierMap = {};


            // 为每个洞创建倍数映射
            for (const hole of holePlayList) {
                // 在 kickConfigs 中查找该洞号的倍数配置
                let foundMultiplier = null;

                for (const runtimeConfig of kickConfigs) {
                    if (runtimeConfig.kickConfig && Array.isArray(runtimeConfig.kickConfig)) {
                        // 在 kickConfig 中查找匹配的洞号
                        const multiplierConfig = runtimeConfig.kickConfig.find(item => {
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
        },

        // 更新指定配置项的倍数映射表
        updateHoleMultiplierMapForConfig(matchedRuntime) {
            const { holePlayList } = this.data;
            const holeMultiplierMap = {};

            console.log('[kickoff] updateHoleMultiplierMapForConfig - 开始更新指定配置的倍数映射表');
            console.log('[kickoff] updateHoleMultiplierMapForConfig - matchedRuntime:', matchedRuntime);
            console.log('[kickoff] updateHoleMultiplierMapForConfig - holePlayList:', holePlayList);

            // 为每个洞创建倍数映射，只显示当前配置项的倍数信息
            for (const hole of holePlayList) {
                let foundMultiplier = null;

                if (matchedRuntime?.kickConfig && Array.isArray(matchedRuntime.kickConfig)) {
                    // 在匹配的配置中查找该洞号的倍数配置
                    const multiplierConfig = matchedRuntime.kickConfig.find(item => {
                        const itemHindex = String(item.hindex);
                        const holeHindex = String(hole.hindex);
                        return itemHindex === holeHindex;
                    });

                    if (multiplierConfig) {
                        foundMultiplier = multiplierConfig.multiplier;
                    }
                }

                holeMultiplierMap[hole.hindex] = foundMultiplier;
                console.log(`[kickoff] updateHoleMultiplierMapForConfig - 洞号 ${hole.hindex} 倍数:`, foundMultiplier);
            }

            this.setData({ holeMultiplierMap });
            console.log('[kickoff] updateHoleMultiplierMapForConfig - 更新完成:', holeMultiplierMap);
        },

        // 从 runtimeConfigs 的 holePlayListStr 获取 holePlayList
        updateHolePlayListFromConfig() {
            const { runtimeConfigs } = this.data;
            if (runtimeConfigs && runtimeConfigs.length > 0) {
                const config = runtimeConfigs[0];
                if (config.holePlayListStr) {
                    try {
                        console.log('[kickoff] 解析 holePlayListStr:', config.holePlayListStr);

                        // holePlayListStr 是逗号分隔的字符串，如 "3,4,5,6,7,8,9,1,2"
                        const holeIndexes = config.holePlayListStr.split(',').map(index => Number.parseInt(index.trim()));

                        // 从 gameStore 获取完整的洞信息
                        const allHoles = gameStore.gameData?.holeList || [];

                        // 根据索引构建 holePlayList
                        const holePlayList = holeIndexes.map(hindex => {
                            const hole = allHoles.find(h => h.hindex === hindex);
                            return hole || { hindex, holename: `洞${hindex}` };
                        }).filter(hole => hole);

                        this.setData({ holePlayList });
                        console.log('[kickoff] 从 runtimeConfigs 获取的 holePlayList:', holePlayList);
                    } catch (e) {
                        console.error('[kickoff] 解析 holePlayListStr 失败:', e);
                        this.setData({ holePlayList: [] });
                    }
                } else {
                    console.warn('[kickoff] runtimeConfigs 中未找到 holePlayListStr');
                    this.setData({ holePlayList: [] });
                }
            } else {
                console.warn('[kickoff] runtimeConfigs 为空或未定义');
                this.setData({ holePlayList: [] });
            }
        }
    }
});
