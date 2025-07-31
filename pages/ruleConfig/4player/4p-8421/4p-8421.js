import { G4P8421Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'
import { reaction } from 'mobx-miniprogram'
const app = getApp()

Page({
  // 存储reaction清理函数
  _storeReactions: null,
  data: {
    user_rulename: '',
    noKoufen: false
  },

  // 规则名称输入事件
  onRuleNameInput(e) {
    const value = e.detail.value;
    this.setData({ user_rulename: value });
    G4P8421Store.updateUserRulename(value);
    console.log('规则名称已更新:', value);
  },

  onKoufenConfirm(e) {
    const detail = e.detail;
    // 更新noKoufen状态
    this.updateNoKoufenStatus();
    console.log('页面收到扣分规则更新:', detail.parsedData);
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
        duration: 1500
      });
    });
  },

  // 更新noKoufen状态
  updateNoKoufenStatus() {
    const store = G4P8421Store;
    const isNoSub = store.sub8421_config_string === 'NoSub';
    this.setData({
      noKoufen: isNoSub
    });
    console.log('noKoufen状态已更新:', isNoSub);
  },

  onLoad() {
    // 4人8421规则配置页, 后续补充
    console.log('4P-8421 规则配置页面加载完成');

    // 初始化显示值
    this.setData({
      user_rulename: G4P8421Store.user_rulename
    });
    this.updateNoKoufenStatus(); // 初始化noKoufen状态

    // 监听Store变化
    this._storeReactions = [
      reaction(
        () => G4P8421Store.user_rulename,
        (value) => {
          this.setData({ user_rulename: value });
          console.log('Store规则名称变化:', value);
        }
      ),

      reaction(
        () => [G4P8421Store.max8421_sub_value, G4P8421Store.sub8421_config_string, G4P8421Store.duty_config],
        () => {
          this.updateNoKoufenStatus(); // 更新noKoufen状态
          console.log('Store扣分规则变化');
        }
      ),
      reaction(
        () => [G4P8421Store.eating_range, G4P8421Store.meat_value_config_string, G4P8421Store.meat_max_value],
        () => {
          console.log('Store吃肉规则变化');
        }
      )
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