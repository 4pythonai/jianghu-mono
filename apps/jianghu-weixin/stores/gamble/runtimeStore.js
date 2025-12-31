//  runtimeStore

const app = getApp()
import { observable, action } from 'mobx-miniprogram'
import { processOneGamble } from '../../utils/gambleUtils'

/**
 * 运行时配置Store
 * 负责管理游戏运行时配置数据
 */
export const runtimeStore = observable({
    // ---- 运行时配置相关状态 ----
    runtimeConfigs: [],  // 运行时配置列表
    loadingRuntimeConfig: false,  // 加载运行时配置状态
    runtimeConfigError: null,     // 运行时配置错误信息

    // ---- 运行时倍数配置 ----
    kickConfigs: [],  // 从 gameStore 移入

    /**
     * 设置运行时倍数配置（批量）
     * @param {Array} configs - 配置数组
     */
    setKickConfigs: action(function(configs) {
        this.kickConfigs = configs || []
        console.log('[runtimeStore] setKickConfigs:', this.kickConfigs.length)
    }),

    /**
     * 更新单个运行时倍数配置
     * @param {string|number} configId - 配置ID
     * @param {Object} kickConfig - 倍数配置
     */
    updateKickConfig: action(function(configId, kickConfig) {
        console.log('[runtimeStore] 更新运行时倍数配置:', { configId, kickConfig })

        const existingIndex = this.kickConfigs.findIndex(runtime =>
            String(runtime.runtime_id) === String(configId)
        )

        if (existingIndex !== -1) {
            this.kickConfigs[existingIndex].kickConfig = kickConfig
        } else {
            this.kickConfigs.push({
                runtime_id: configId,
                kickConfig: kickConfig
            })
        }
    }),

    /**
     * 清空运行时倍数配置
     */
    clearKickConfigs: action(function() {
        this.kickConfigs = []
    }),

    fetchRuntimeConfigs: action(async function (groupid) {
        if (this.loadingRuntimeConfig) return; // 防止重复加载

        this.loadingRuntimeConfig = true;
        this.runtimeConfigError = null;

        try {
            const params = { groupid: groupid };
            const res = await app.api.gamble.listRuntimeConfig(params, {
                loadingTitle: '加载游戏配置...',
                loadingMask: false // 不显示遮罩, 避免影响用户体验
            });

            if (res?.code === 200) {
                const rawConfigs = res.gambles || [];
                console.log('🎮 [runtimeStore] API 返回原始数据:', rawConfigs);

                // 处理配置数据
                const processedConfigs = [];
                for (const config of rawConfigs) {
                    const tmp = processOneGamble(config);
                    processedConfigs.push(tmp);
                }


                this.runtimeConfigs = processedConfigs;
                console.log('🎮 [runtimeStore] 已更新 runtimeConfigs，长度:', this.runtimeConfigs.length);

                return processedConfigs;
            }

            console.log('🎮 [runtimeStore] API 返回非200状态码:', res?.code);
            return [];
        } catch (err) {
            this.runtimeConfigError = err.message || '获取运行时配置失败';
            this.runtimeConfigs = [];
            throw err; // 直接抛出错误，让调用方处理
        } finally {
            this.loadingRuntimeConfig = false;
        }
    }),

    /**
     * 清空运行时配置数据
     */
    clear: action(function () {
        this.runtimeConfigs = [];
        this.loadingRuntimeConfig = false;
        this.runtimeConfigError = null;
        this.kickConfigs = [];
    }),

});