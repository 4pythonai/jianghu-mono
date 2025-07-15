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

    // ---- Actions ----

    /**
     * 获取运行时配置
     * @param {string} gameId - 游戏ID
     * @param {string} groupId - 分组ID(可选)
     */
    fetchRuntimeConfigs: action(async function (gameId, groupId = null) {
        if (this.loadingRuntimeConfig) return; // 防止重复加载

        console.log('🎮 [RuntimeStore] 开始获取运行时配置:', { gameId, groupId });
        this.loadingRuntimeConfig = true;
        this.runtimeConfigError = null;

        try {
            // 构建请求参数 - 使用 groupId 而不是 gameId
            const params = groupId ? { groupId: groupId } : { gameid: gameId };

            console.log('🎮 [RuntimeStore] 调用 listRuntimeConfig 参数:', params);

            const res = await gambleApi.listRuntimeConfig(params, {
                loadingTitle: '加载游戏配置...',
                loadingMask: false // 不显示遮罩, 避免影响用户体验
            });

            console.log('�� [RuntimeStore] 运行时配置 API 响应:', res);
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
                                console.warn('🎮 [RuntimeStore] 解析 val8421_config 失败:', e);
                                processedConfig.val8421_config_parsed = {};
                                processedConfig.player8421Count = 0;
                            }
                        }

                        // 解析 bootstrap_order JSON 字符串
                        if (config.bootstrap_order && typeof config.bootstrap_order === 'string') {
                            try {
                                processedConfig.bootstrap_order_parsed = JSON.parse(config.bootstrap_order);
                            } catch (e) {
                                console.warn('🎮 [RuntimeStore] 解析 bootstrap_order 失败:', e);
                                processedConfig.bootstrap_order_parsed = [];
                            }
                        }

                        // 格式化排名规则显示文本
                        if (config.ranking_tie_resolve_config) {
                            const rankingMap = {
                                'score.reverse': '按成绩排序, 冲突时回溯成绩',
                                'score.win_loss.reverse_win': '按成绩排序, 按输赢, 回溯输赢',
                                'score.win_loss.reverse_score': '按成绩排序, 按输赢, 回溯成绩',
                                'indicator.reverse': '按得分排序, 冲突时回溯得分',
                                'indicator.win_loss.reverse_win': '按得分排序, 按输赢, 回溯输赢',
                                'indicator.win_loss.reverse_indicator': '按得分排序, 按输赢, 回溯得分'
                            };
                            processedConfig.ranking_display = rankingMap[config.ranking_tie_resolve_config] || config.ranking_tie_resolve_config || '未知排名规则';
                        }

                        // 格式化洞数范围
                        const firstHole = config.startHoleindex || 1;
                        const lastHole = config.endHoleindex || 18;
                        processedConfig.hole_range_display = firstHole === lastHole ?
                            `第${firstHole}洞` :
                            `第${firstHole}洞 - 第${lastHole}洞`;

                        return processedConfig;
                    } catch (e) {
                        console.error('🎮 [RuntimeStore] 处理运行时配置数据失败:', e, config);
                        return config;
                    }
                });

                console.log('�� [RuntimeStore] 运行时配置加载成功, 共', this.runtimeConfigs.length, '条配置');
                console.log('�� [RuntimeStore] 运行时配置详情:', this.runtimeConfigs);
            } else {
                console.warn('⚠️ [RuntimeStore] 运行时配置加载失败:', res?.message || res?.msg || '未知错误');
                this.runtimeConfigError = res?.message || res?.msg || '获取运行时配置失败';
                this.runtimeConfigs = [];
            }
        } catch (err) {
            console.error('❌ [RuntimeStore] 获取运行时配置失败:', err);
            this.runtimeConfigError = err.message || '获取运行时配置失败';
            this.runtimeConfigs = [];
        } finally {
            this.loadingRuntimeConfig = false;
            console.log('�� [RuntimeStore] 运行时配置获取流程结束');
        }
    }),

    /**
     * 清空运行时配置数据
     */
    clear: action(function () {
        this.runtimeConfigs = [];
        this.loadingRuntimeConfig = false;
        this.runtimeConfigError = null;
        console.log('🧹 [RuntimeStore] 清空运行时配置数据');
    }),

    // ---- Computed Properties ----

    /**
     * 是否有运行时配置
     */
    get hasRuntimeConfigs() {
        return this.runtimeConfigs.length > 0;
    },

    /**
     * 获取运行时配置数量
     */
    get runtimeConfigCount() {
        return this.runtimeConfigs.length;
    }
});