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

                // 处理配置数据
                this.runtimeConfigs = rawConfigs.map(config => {
                    try {
                        const processedConfig = { ...config };

                        // 解析 val8421_config JSON 字符串
                        if (config.val8421_config && typeof config.val8421_config === 'string') {
                            try {
                                processedConfig.val8421_config_parsed = JSON.parse(config.val8421_config);
                                processedConfig.player8421Count = Object.keys(processedConfig.val8421_config_parsed).length;
                            } catch (e) {
                                processedConfig.val8421_config_parsed = {};
                                processedConfig.player8421Count = 0;
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
                });

            }
        } catch (err) {
            this.runtimeConfigError = err.message || '获取运行时配置失败';
            this.runtimeConfigs = [];
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