import { G_4P_8421_Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'
import { reaction } from 'mobx-miniprogram'

Page({
  // 存储reaction清理函数
  _storeReactions: null,
  data: {
    showKoufen: false,
    showDingdong: false,
    showEatmeat: false,
    koufenValue: '',
    dingdongValue: '',
    eatmeatValue: '',
    user_rulename: '',
    draw8421Config: null,
    noKoufen: false,
    koufenDisplayValue: '请配置扣分规则',
    dingdongDisplayValue: '请配置顶洞规则',
    eatmeatDisplayValue: '请配置吃肉规则'
  },

  // 规则名称输入事件
  onRuleNameInput(e) {
    const value = e.detail.value;
    this.setData({ user_rulename: value });
    G_4P_8421_Store.updateUserRulename(value);
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
      koufenValue: detail.parsedData || detail.value,
      showKoufen: false
    });

    // 更新显示值
    this.updateKoufenDisplayValue();

    // 组件已经更新了store，这里只需要更新UI显示
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
      dingdongValue: detail.value,
      showDingdong: false
    });

    // 更新显示值
    this.updateDingdongDisplayValue();

    // 组件已经更新了store，这里只需要更新UI显示
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
      eatmeatValue: detail.parsedData || detail.value,
      showEatmeat: false
    });

    // 更新显示值
    this.updateEatmeatDisplayValue();

    // 组件已经更新了store，这里只需要更新UI显示
    console.log('页面收到吃肉规则更新:', detail.parsedData);
  },
  onAddToMyRules() {
    // 检查是否已配置规则
    const store = G_4P_8421_Store;
    let missingConfigs = [];

    if (!store.sub8421configstring || !store.dutyconfig) {
      missingConfigs.push('扣分规则');
    }
    if (!store.draw8421Config) {
      missingConfigs.push('顶洞规则');
    }
    if (!store.eatingRange || !store.meat_value) {
      missingConfigs.push('吃肉规则');
    }

    if (missingConfigs.length > 0) {
      wx.showModal({
        title: '配置不完整',
        content: `请先配置：${missingConfigs.join('、')}`,
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#ff6b6b'
      });
      return;
    }

    // 输出完整Store数据用于调试
    const allData = G_4P_8421_Store.debugAllRulesData();

    wx.showToast({
      title: '已添加至我的规则',
      icon: 'success'
    });

    console.log('完整规则配置数据:', allData);
  },

  // 更新扣分规则显示值
  updateKoufenDisplayValue() {
    const store = G_4P_8421_Store;
    let displayValue = '';

    // 格式化扣分开始值 - 适配新格式：NoSub, Par+X, DoublePar+X
    let startText = '';
    if (store.sub8421configstring) {
      if (store.sub8421configstring === 'NoSub') {
        startText = '不扣分';
      } else if (store.sub8421configstring?.startsWith('Par+')) {
        const score = store.sub8421configstring.replace('Par+', '');
        startText = `帕+${score}`;
      } else if (store.sub8421configstring?.startsWith('DoublePar+')) {
        const score = store.sub8421configstring.replace('DoublePar+', '');
        startText = `双帕+${score}`;
      } else {
        startText = store.sub8421configstring;
      }
    }

    // 格式化封顶值 - 适配新格式：数字，10000000表示不封顶
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
    const store = G_4P_8421_Store;
    let displayValue = '';

    // 映射英文格式到中文显示
    if (store.draw8421Config) {
      switch (store.draw8421Config) {
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
          if (store.draw8421Config.startsWith('Diff_')) {
            const score = store.draw8421Config.replace('Diff_', '');
            displayValue = `得分${score}分以内`;
          } else {
            displayValue = store.draw8421Config;
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
    const store = G_4P_8421_Store;
    let displayValue = '';

    // 格式化吃肉规则显示 - 适配新格式
    let meatValueText = '';
    if (store.meat_value) {
      if (store.meat_value?.startsWith('MEAT_AS_')) {
        meatValueText = '肉算1分';
      } else if (store.meat_value === 'SINGLE_DOUBLE') {
        meatValueText = '分值翻倍';
      } else if (store.meat_value === 'CONTINUE_DOUBLE') {
        meatValueText = '分值连续翻倍';
      } else {
        meatValueText = store.meat_value;
      }
    }

    // 格式化封顶值 - 适配新格式：数字，10000000表示不封顶
    let meatMaxText = '';
    if (store.meatMaxValue === 10000000) {
      meatMaxText = '不封顶';
    } else if (typeof store.meatMaxValue === 'number' && store.meatMaxValue < 10000000) {
      meatMaxText = `${store.meatMaxValue}分封顶`;
    }

    // 简化显示，只显示主要的肉分值计算方式
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

  onLoad() {
    // 4人8421规则配置页，后续补充
    console.log('4P-8421 规则配置页面加载完成');

    // 初始化显示值
    this.setData({ user_rulename: G_4P_8421_Store.user_rulename });
    this.updateKoufenDisplayValue();
    this.updateDingdongDisplayValue();
    this.updateEatmeatDisplayValue();

    // 监听Store变化
    this._storeReactions = [
      reaction(
        () => G_4P_8421_Store.user_rulename,
        (value) => {
          this.setData({ user_rulename: value });
          console.log('Store规则名称变化:', value);
        }
      ),
      reaction(
        () => G_4P_8421_Store.draw8421Config,
        (value) => {
          this.setData({ draw8421Config: value });
          this.updateDingdongDisplayValue();
          console.log('Store顶洞规则变化:', value);
        }
      )
    ];
  },

  onUnload() {
    // 清理reactions
    if (this._storeReactions) {
      this._storeReactions.forEach(dispose => dispose?.());
      this._storeReactions = null;
    }
  }
});