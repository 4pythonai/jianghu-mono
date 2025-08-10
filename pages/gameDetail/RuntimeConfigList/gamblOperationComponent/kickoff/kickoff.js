import { createStoreBindings } from 'mobx-miniprogram-bindings';
import { gameStore } from '../../../../../stores/gameStore';

Component({
    properties: {
        runtimeConfigs: {
            type: Array,
            value: []
        }
    },

    data: {
        holePlayList: [],
        showMultiplierSelector: false,
        selectedHole: null,
        // 简化的数据结构：直接存储每个洞的倍数
        holeMultipliers: {}
    },

    lifetimes: {
        attached() {
            this.storeBindings = createStoreBindings(this, {
                store: gameStore,
                fields: {
                    gameData: 'gameData'
                },
                actions: {
                    updateRuntimeMultipliers: 'updateRuntimeMultipliers'
                }
            });

            // 只有在 runtimeConfigs 有值时才初始化数据
            if (this.data.runtimeConfigs && this.data.runtimeConfigs.length > 0) {
                this.updateKIcoHolesList();
                this.loadExistingMultipliers();
            }
        },
        detached() {
            this.storeBindings.destroyStoreBindings();
        }
    },

    observers: {
        'runtimeConfigs': function (runtimeConfigs) {
            if (runtimeConfigs && runtimeConfigs.length > 0) {
                this.updateKIcoHolesList();
                this.loadExistingMultipliers();
            }
        }
    },

    methods: {
        // 更新洞序列表
        updateKIcoHolesList() {
            // 直接从 gameStore 获取真实的洞数据，参考 holejump.js 的实现
            const holeList = gameStore.gameData?.holeList || [];

            console.log('[kickoff] 从gameStore获取的洞数据:', holeList);

            if (holeList && holeList.length > 0) {
                // 使用真实的洞数据，按照 hindex 排序，确保数据类型正确
                const sortedHoleList = [...holeList]
                    .map(hole => ({
                        ...hole,
                        hindex: Number(hole.hindex),
                        holename: String(hole.holename || `洞${hole.hindex}`)
                    }))
                    .sort((a, b) => a.hindex - b.hindex);

                this.setData({ holePlayList: sortedHoleList });
                console.log('[kickoff] 初始化洞序数据成功（已排序）:', sortedHoleList);
            } else {
                // 如果没有洞数据，使用默认的洞序（1-18洞）
                const defaultHoles = Array.from({ length: 18 }, (_, i) => ({
                    hindex: i + 1,
                    holename: `洞${i + 1}`
                }));

                this.setData({ holePlayList: defaultHoles });
                console.log('[kickoff] 使用默认洞序数据:', defaultHoles);
            }
        },

        // 加载现有的倍数配置
        loadExistingMultipliers() {
            const config = this.data.runtimeConfigs?.[0];
            if (!config?.kickConfig) {
                this.setData({ holeMultipliers: {} });
                return;
            }

            try {
                const multipliers = JSON.parse(config.kickConfig);
                const holeMultipliers = {};

                if (Array.isArray(multipliers)) {
                    for (const item of multipliers) {
                        holeMultipliers[item.hindex] = item.multiplier;
                    }
                }

                this.setData({ holeMultipliers });
            } catch (e) {
                console.error('[kickoff] 解析倍数配置失败:', e);
                this.setData({ holeMultipliers: {} });
            }
        },

        // 选择洞号
        onSelectHole(e) {
            const { index, hindex } = e.currentTarget.dataset;
            const hole = this.data.holePlayList[index];

            if (hole) {
                // 确保数据类型正确
                const selectedHole = {
                    hindex: Number(hole.hindex),
                    holename: String(hole.holename || `洞${hole.hindex}`)
                };

                this.setData({
                    selectedHole: selectedHole,
                    showMultiplierSelector: true
                });

                console.log('[kickoff] 选择洞:', selectedHole);
            } else {
                console.error('[kickoff] 未找到洞数据，index:', index);
            }
        },

        // 倍数选择确认 - 保留连锁逻辑
        onMultiplierConfirm(e) {
            const { hindex, multiplier } = e.detail;

            // 获取当前洞在洞序中的位置
            const currentIndex = this.data.holePlayList.findIndex(hole =>
                String(hole.hindex) === String(hindex)
            );

            if (currentIndex === -1) {
                console.error('[kickoff] 未找到洞号:', hindex);
                return;
            }

            // 连锁逻辑：从当前洞开始到最后一个洞，设置相同的倍数
            const newMultipliers = { ...this.data.holeMultipliers };

            for (let i = currentIndex; i < this.data.holePlayList.length; i++) {
                const targetHole = this.data.holePlayList[i];
                newMultipliers[targetHole.hindex] = multiplier;
            }

            this.setData({
                holeMultipliers: newMultipliers,
                showMultiplierSelector: false
            });
        },

        // 倍数选择取消
        onMultiplierCancel() {
            this.setData({ showMultiplierSelector: false });
        },

        // 确定按钮
        onConfirm() {


            const config = this.data.runtimeConfigs?.[0];
            if (!config) {
                console.error('[kickoff] 无配置信息');
                return;
            }

            // 转换为数组格式用于存储
            const multiplierArray = Object.entries(this.data.holeMultipliers).map(([hindex, multiplier]) => ({
                hindex: Number(hindex),
                multiplier: Number(multiplier)
            }));


            console.log('🌸🌸🌸🌸 当前 multiplierArray:', multiplierArray);

            // 更新 store
            this.updateRuntimeMultipliers(config.id, multiplierArray);
            const triggerData = {
                configId: config.id,
                configName: config.gambleUserName || config.gambleSysName || '未知配置',
                multipliers: multiplierArray
            }

            // 触发确认事件
            console.log('🌸🌸🌸🌸 当前 triggerData:', triggerData);
            this.triggerEvent('confirm', triggerData);
        },

        // 关闭弹窗
        close() {
            this.triggerEvent('close');
        },

        // 空方法，阻止冒泡
        noop() { }
    }
});
