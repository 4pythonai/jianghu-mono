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
    dingdong: null,
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
  // 打开弹窗
  onShowKoufen() { this.setData({ showKoufen: true }); },
  onShowDingdong() { this.setData({ showDingdong: true }); },
  onShowEatmeat() { this.setData({ showEatmeat: true }); },
  // 关闭弹窗
  onCloseKoufen() { this.setData({ showKoufen: false }); },
  onCloseDingdong() { this.setData({ showDingdong: false }); },
  onCloseEatmeat() { this.setData({ showEatmeat: false }); },
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
  onDingdongConfirm(e) {
    const detail = e.detail;
    this.setData({
      dingdongValue: detail.value,
      dingdong: detail.value,
      showDingdong: false
    });

    // 更新显示值
    this.updateDingdongDisplayValue();

    // 组件已经更新了store，这里只需要更新UI显示
    console.log('页面收到顶洞规则更新:', detail.value);
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

  // 添加至我的规则按钮点击事件
  onAddToMyRules() {
    // 获取所有规则数据
    G_4P_8421_Store.debugAllRulesData();

    // 显示提示消息
    wx.showToast({
      title: '规则数据已打印到控制台',
      icon: 'success',
      duration: 2000
    });

    // 这里可以后续添加保存到后端的逻辑
    console.log('准备保存规则配置到服务器...');
  },

  // 更新扣分规则显示值
  updateKoufenDisplayValue() {
    const store = G_4P_8421_Store;
    let displayValue = '';

    // 格式化扣分开始值
    let startText = '';
    if (store.koufen_start) {
      switch (store.koufen_start) {
        case '从帕+4开始扣分':
          startText = '帕+4';
          break;
        case '从双帕+0开始扣分':
          startText = '双帕+0';
          break;
        case '不扣分':
          startText = '不扣分';
          break;
        default:
          startText = store.koufen_start;
      }
    }

    // 格式化封顶值
    let fengdingText = '';
    if (store.koufen_fengding) {
      switch (store.koufen_fengding) {
        case '不封顶':
          fengdingText = '不封顶';
          break;
        case '扣2分封顶':
          fengdingText = '扣2分封顶';
          break;
        default:
          fengdingText = store.koufen_fengding;
      }
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
    let displayValue = store.dingdong || '请配置顶洞规则';

    this.setData({
      dingdongDisplayValue: displayValue
    });

    console.log('顶洞规则显示值已更新:', displayValue);
  },

  // 更新吃肉规则显示值
  updateEatmeatDisplayValue() {
    const store = G_4P_8421_Store;
    let displayValue = '';

    // 格式化吃肉规则显示
    let meatValue = store.meat_value || '';
    let fengding = store.meat_fengding || '';

    // 简化显示，只显示主要的肉分值计算方式
    if (meatValue && fengding) {
      displayValue = `${meatValue}/${fengding}`;
    } else if (meatValue) {
      displayValue = meatValue;
    } else if (fengding) {
      displayValue = fengding;
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
      )
    ];
  },

  onUnload() {
    // 清理Store监听
    if (this._storeReactions) {
      this._storeReactions.forEach(dispose => dispose());
      this._storeReactions = null;
    }
  }
});