import { G4PLasiStore } from '../../../../stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js'
import { reaction } from 'mobx-miniprogram'
const app = getApp()

Page({
    // 存储reaction清理函数
    _storeReactions: null,
    data: {
        user_rulename: ''
    },

    // 规则名称输入事件
    onRuleNameInput(e) {
        const value = e.detail.value;
        this.setData({ user_rulename: value });
        G4PLasiStore.updateUserRulename(value);
        console.log('规则名称已更新:', value);
    },

    onAddLasiToMyRules() {
        // 输出完整Store数据用于调试
        const allData = G4PLasiStore.debugAllRulesData();

        // 验证必要配置
        if (!allData.user_rulename.trim()) {
            wx.showToast({
                title: '请输入规则名称',
                icon: 'none',
                duration: 1500
            });
            return;
        }

        if (allData.lasi_config.indicators.length === 0) {
            wx.showToast({
                title: '请至少选择一个KPI指标',
                icon: 'none',
                duration: 1500
            });
            return;
        }

        console.log('💋💋💋💋💋💋💋💋💋💋allData', allData);

        // app.api.gamble.addGambleRule(allData).then(res => {
        //     console.log('添加规则成功:', res);
        //     wx.showToast({
        //         title: '已添加至我的规则',
        //         icon: 'success',
        //         duration: 1500,
        //         success: () => {
        //             // Toast显示完成后跳转到规则页面
        //             setTimeout(() => {
        //                 wx.navigateTo({
        //                     url: '/pages/rules/rules'
        //                 });
        //             }, 1000);
        //         }
        //     });

        // }).catch(err => {
        //     console.error('添加规则失败:', err);
        //     wx.showToast({
        //         title: '添加规则失败',
        //         icon: 'none',
        //         duration: 1000
        //     });
        // });
    },

    // KPI配置变化事件处理
    onKpiConfigChange(e) {
        // 通知奖励配置组件更新
        const lasiRewardComponent = this.selectComponent('#LasiReward');
        if (lasiRewardComponent) {
            lasiRewardComponent.onKpiConfigChange();
        }
    },

    onLoad() {
        // 4人拉丝规则配置页
        console.log('4P-lasi 规则配置页面加载完成');

        // 初始化显示值
        this.setData({
            user_rulename: G4PLasiStore.user_rulename
        });

        // 监听Store变化
        this._storeReactions = [
            reaction(
                () => G4PLasiStore.user_rulename,
                (value) => {
                    this.setData({ user_rulename: value });
                    // console.log('Store规则名称变化:', value);
                }
            ),
        ];
    },

    onUnload() {
        // 清理reactions
        if (this._storeReactions) {
            for (const dispose of this._storeReactions) {
                dispose?.();
            }
            this._storeReactions = null;
        }
    }
});