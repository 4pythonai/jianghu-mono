//  runtimeStore

import { observable, action } from 'mobx-miniprogram'
import gambleApi from '../api/modules/gamble'

/**
 * 运行时配置Store
 * 负责管理游戏运行时配置数据
 */
export const runtimeStore = observable({
    // ---- 运行时配置相关状态 ----
    runtimeConfigs: [],  // 运行时配置列表
    loadingRuntimeConfig: false,  // 加载运行时配置状态
    runtimeConfigError: null,     // 运行时配置错误信息

    /**
     * 处理单个赌博配置
     * @param {Object} config 原始配置数据
     * @returns {Object} 处理后的配置数据
     */
    processOneGamble: action((config) => {
        console.log('🎮 [runtimeStore] 处理单个赌博配置:🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸', config);
        try {
            const processedConfig = { ...config };

            // 解析 playerIndicatorConfig JSON 字符串
            if (config.playerIndicatorConfig && typeof config.playerIndicatorConfig === 'string') {
                try {
                    processedConfig.val8421_config_parsed = JSON.parse(config.playerIndicatorConfig);
                    processedConfig.player8421Count = Object.keys(processedConfig.val8421_config_parsed).length;
                    // 添加格式化显示字段
                    processedConfig.val8421_config_display = JSON.stringify(processedConfig.val8421_config_parsed, null, 2);
                } catch (e) {
                    processedConfig.val8421_config_parsed = {};
                    processedConfig.player8421Count = 0;
                    processedConfig.val8421_config_display = config.playerIndicatorConfig; // 显示原始字符串
                }
            }

            // 解析 bootstrap_order JSON 字符串
            if (config.bootstrap_order && typeof config.bootstrap_order === 'string') {
                try {
                    processedConfig.bootstrap_order_parsed = JSON.parse(config.bootstrap_order);
                } catch (e) {
                    processedConfig.bootstrap_order_parsed = [];
                }
            }



            return processedConfig;
        } catch (e) {
            return config;
        }
    }),

    fetchRuntimeConfigs: action(async function (groupId) {
        if (this.loadingRuntimeConfig) return; // 防止重复加载

        this.loadingRuntimeConfig = true;
        this.runtimeConfigError = null;

        try {
            const params = { groupId: groupId };
            const res = await gambleApi.listRuntimeConfig(params, {
                loadingTitle: '加载游戏配置...',
                loadingMask: false // 不显示遮罩, 避免影响用户体验
            });

            if (res?.code === 200) {
                const rawConfigs = res.gambles || [];
                console.log('🎮 [runtimeStore] API 返回原始数据:', rawConfigs);

                // 处理配置数据 - 使用朴素的写法
                const processedConfigs = [];
                for (const config of rawConfigs) {
                    const tmp = this.processOneGamble(config);
                    processedConfigs.push(tmp);
                }

                console.log('🎮 [runtimeStore] 处理后的配置数据:', processedConfigs);
                console.log('🎮 [runtimeStore] 第一个配置项的 bigWind:', processedConfigs[0]?.bigWind);
                console.log('🎮 [runtimeStore] 第一个配置项的 ifShow:', processedConfigs[0]?.ifShow);

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
    }),

});