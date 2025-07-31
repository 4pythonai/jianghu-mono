import { G4P8421Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'
import { reaction } from 'mobx-miniprogram'
const app = getApp()

Page({
  // 存储reaction清理函数
  _storeReactions: null,
  data: {
    showKoufen: false,
    showDingdong: false,
    showEatmeat: false,
    user_rulename: '',
    draw8421_config: null,
    noKoufen: false,
    koufenDisplayValue: '请配置扣分规则',
    dingdongDisplayValue: '请配置顶洞规则',
    eatmeatDisplayValue: '请配置吃肉规则',

  },

  // 规则名称输入事件
  onRuleNameInput(e) {
    const value = e.detail.value;
    this.setData({ user_rulename: value });
    G4P8421Store.updateUserRulename(value);
    console.log('规则名称已更新:', value);
  },

  onShowKoufen() {
    this.setData({ showKoufen: true });
  },

  onCloseKoufen() {
    this.setData({ showKoufen: false });
  },
  // 保存弹窗
  onKoufenConfirm(e) {
    const detail = e.detail;
    this.setData({
      showKoufen: false
    });

    // 更新显示值
    this.updateKoufenDisplayValue();
    // 更新noKoufen状态
    this.updateNoKoufenStatus();

    // 组件已经更新了store, 这里只需要更新UI显示
    console.log('页面收到扣分规则更新:', detail.parsedData);
  },
  onShowDingdong() {
    this.setData({ showDingdong: true });
  },
  onCloseDingdong() {
    this.setData({ showDingdong: false });
  },
  onDingdongConfirm(e) {
    const detail = e.detail;
    this.setData({
      showDingdong: false
    });

    // 更新显示值
    this.updateDingdongDisplayValue();

    // 组件已经更新了store, 这里只需要更新UI显示
    console.log('页面收到顶洞规则更新:', detail.value);
  },
  onShowEatmeat() {
    this.setData({ showEatmeat: true });
  },
  onCloseEatmeat() {
    this.setData({ showEatmeat: false });
  },
  onEatmeatConfirm(e) {
    const detail = e.detail;
    this.setData({
      showEatmeat: false
    });

    // 更新显示值
    this.updateEatmeatDisplayValue();

    // 组件已经更新了store, 这里只需要更新UI显示
    console.log('页面收到吃肉规则更新:', detail.parsedData);
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

  // 更新扣分规则显示值
  updateKoufenDisplayValue() {
    const store = G4P8421Store;
    let displayValue = '';

    // 格式化扣分开始值 - 适配新格式:NoSub, Par+X, DoublePar+X
    let startText = '';
    if (store.sub8421_config_string) {
      if (store.sub8421_config_string === 'NoSub') {
        startText = '不扣分';
      } else if (store.sub8421_config_string?.startsWith('Par+')) {
        const score = store.sub8421_config_string.replace('Par+', '');
        startText = `帕+${score}`;
      } else if (store.sub8421_config_string?.startsWith('DoublePar+')) {
        const score = store.sub8421_config_string.replace('DoublePar+', '');
        startText = `双帕+${score}`;
      } else {
        startText = store.sub8421_config_string;
      }
    }

    // 格式化封顶值 - 适配新格式:数字, 10000000表示不封顶
    let fengdingText = '';
    if (store.max8421_sub_value === 10000000) {
      fengdingText = '不封顶';
    } else if (typeof store.max8421_sub_value === 'number' && store.max8421_sub_value < 10000000) {
      fengdingText = `扣${store.max8421_sub_value}分封顶`;
    }

    // 组合显示值
    if (startText && fengdingText) {
      displayValue = `${startText}/${fengdingText}`;
    } else if (startText) {
      displayValue = startText;
    } else if (fengdingText) {
      displayValue = fengdingText;
    } else {
      displayValue = '请配置扣分规则';
    }

    this.setData({
      koufenDisplayValue: displayValue
    });

    console.log('扣分规则显示值已更新:', displayValue);
  },

  // 更新顶洞规则显示值
  updateDingdongDisplayValue() {
    const store = G4P8421Store;
    let displayValue = '';

    // 映射英文格式到中文显示
    if (store.draw8421_config) {
      switch (store.draw8421_config) {
        case 'DrawEqual':
          displayValue = '得分打平';
          break;
        case 'Diff_1':
          displayValue = '得分1分以内';
          break;
        case 'NoDraw':
          displayValue = '无顶洞';
          break;
        default:
          // 处理 Diff_X 格式
          if (store.draw8421_config.startsWith('Diff_')) {
            const score = store.draw8421_config.replace('Diff_', '');
            displayValue = `得分${score}分以内`;
          } else {
            displayValue = store.draw8421_config;
          }
          break;
      }
    } else {
      displayValue = '请配置顶洞规则';
    }

    this.setData({
      dingdongDisplayValue: displayValue
    });

    console.log('顶洞规则显示值已更新:', displayValue);
  },

  // 更新吃肉规则显示值
  updateEatmeatDisplayValue() {
    const store = G4P8421Store;
    let displayValue = '';

    // 格式化吃肉规则显示 - 适配新格式
    let meatValueText = '';
    if (store.meat_value_config_string) {
      if (store.meat_value_config_string?.startsWith('MEAT_AS_')) {
        meatValueText = '肉算1分';
      } else if (store.meat_value_config_string === 'SINGLE_DOUBLE') {
        meatValueText = '分值翻倍';
      } else if (store.meat_value_config_string === 'CONTINUE_DOUBLE') {
        meatValueText = '分值连续翻倍';
      } else {
        meatValueText = store.meat_value_config_string;
      }
    }

    // 格式化封顶值 - 适配新格式:数字, 10000000表示不封顶
    let meatMaxText = '';
    if (store.meat_max_value === 10000000) {
      meatMaxText = '不封顶';
    } else if (typeof store.meat_max_value === 'number' && store.meat_max_value < 10000000) {
      meatMaxText = `${store.meat_max_value}分封顶`;
    }

    // 简化显示, 只显示主要的肉分值计算方式
    if (meatValueText && meatMaxText) {
      displayValue = `${meatValueText}/${meatMaxText}`;
    } else if (meatValueText) {
      displayValue = meatValueText;
    } else if (meatMaxText) {
      displayValue = meatMaxText;
    } else {
      displayValue = '请配置吃肉规则';
    }

    this.setData({
      eatmeatDisplayValue: displayValue
    });

    console.log('吃肉规则显示值已更新:', displayValue);
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
      user_rulename: G4P8421Store.user_rulename,
      draw8421_config: G4P8421Store.draw8421_config
    });
    this.updateKoufenDisplayValue();
    this.updateDingdongDisplayValue();
    this.updateEatmeatDisplayValue();
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
        () => G4P8421Store.draw8421_config,
        (value) => {
          this.setData({ draw8421_config: value });
          this.updateDingdongDisplayValue();
          console.log('Store顶洞规则变化:', value);
        }
      ),
      reaction(
        () => [G4P8421Store.max8421_sub_value, G4P8421Store.sub8421_config_string, G4P8421Store.duty_config],
        () => {
          this.updateKoufenDisplayValue();
          this.updateNoKoufenStatus(); // 更新noKoufen状态
          console.log('Store扣分规则变化');
        }
      ),
      reaction(
        () => [G4P8421Store.eating_range, G4P8421Store.meat_value_config_string, G4P8421Store.meat_max_value],
        () => {
          this.updateEatmeatDisplayValue();
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