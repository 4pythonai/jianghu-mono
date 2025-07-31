import { G4P8421Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'
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
    G4P8421Store.updateUserRulename(value);
    console.log('规则名称已更新:', value);
  },


  onAddToMyRules() {
    // 输出完整Store数据用于调试
    const allData = G4P8421Store.debugAllRulesData();

    app.api.gamble.addGambleRule(allData).then(res => {
      console.log('添加规则成功:', res);
      wx.showToast({
        title: '已添加至我的规则',
        icon: 'success',
        duration: 1500,
        success: () => {
          // Toast显示完成后跳转到规则页面
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/rules/rules'
            });
          }, 1000);
        }
      });

    }).catch(err => {
      console.error('添加规则失败:', err);
      wx.showToast({
        title: '添加规则失败',
        icon: 'none',
        duration: 1000
      });
    });
  },



  onLoad() {
    // 4人8421规则配置页, 后续补充
    console.log('4P-8421 规则配置页面加载完成');

    // 初始化显示值
    this.setData({
      user_rulename: G4P8421Store.user_rulename
    });

    // 监听Store变化
    this._storeReactions = [
      reaction(
        () => G4P8421Store.user_rulename,
        (value) => {
          this.setData({ user_rulename: value });
          console.log('Store规则名称变化:', value);
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