import { G4P8421Store } from '../../../../stores/gamble/4p/4p-8421/gamble_4P_8421_Store.js'

Component({
  properties: {
  },
  data: {
    // 组件内部状态
    visible: false,
    displayValue: '请配置扣分规则',

    // 扣分开始条件 (badScoreBaseLine)
    Sub8421ConfigString: ['从帕+X开始扣分', '从双帕+Y开始扣分', '不扣分'],
    selectedStart: 0,

    // 可编辑的数字变量
    paScore: 4, // 帕的分数, 默认4
    doubleParScore: 0, // 双帕的分数, 默认0
    maxSubScore: 2, // 封顶分数, 默认2

    // 数字选择器范围
    paScoreRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    doubleParScoreRange: Array.from({ length: 21 }, (_, i) => i), // 0-20
    maxSubScoreRange: Array.from({ length: 21 }, (_, i) => i + 1), // 1-21

    // 扣分封顶 (badScoreMaxLost)
    maxOptions: ['不封顶', '扣X分封顶'],
    selectedMax: 0,

    // 同伴惩罚 (dutyConfig)
    dutyOptions: ['不包负分', '同伴顶头包负分', '包负分'],
    selectedDuty: 0
  },
  // 组件生命周期
  lifetimes: {
    attached() {
      // 从store获取当前配置并初始化组件状态
      this.initializeFromStore();
      // 计算显示值
      this.updateDisplayValue();
    }
  },

  methods: {
    // 空方法，用于处理禁用状态下的点击事件
    noTap() {
      // 什么都不做，阻止事件处理
    },

    // 计算显示值
    updateDisplayValue() {
      const store = G4P8421Store;
      let displayValue = '';

      // 格式化扣分开始值 - 适配新格式:NoSub, Par+X, DoublePar+X
      let startText = '';
      if (store.badScoreBaseLine) {
        if (store.badScoreBaseLine === 'NoSub') {
          startText = '不扣分';
        } else if (store.badScoreBaseLine?.startsWith('Par+')) {
          const score = store.badScoreBaseLine.replace('Par+', '');
          startText = `帕+${score}`;
        } else if (store.badScoreBaseLine?.startsWith('DoublePar+')) {
          const score = store.badScoreBaseLine.replace('DoublePar+', '');
          startText = `双帕+${score}`;
        } else {
          startText = store.badScoreBaseLine;
        }
      }

      // 格式化封顶值 - 适配新格式:数字, 10000000表示不封顶
      let fengdingText = '';
      if (store.badScoreMaxLost === 10000000) {
        fengdingText = '不封顶';
      } else if (typeof store.badScoreMaxLost === 'number' && store.badScoreMaxLost < 10000000) {
        fengdingText = `扣${store.badScoreMaxLost}分封顶`;
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
        displayValue: displayValue
      });

      console.log('扣分规则显示值已更新:', displayValue);
    },

    // 从store初始化配置
    initializeFromStore() {
      // 直接访问store的属性
      const max8421SubValue = G4P8421Store.badScoreMaxLost;
      const koufenStart = G4P8421Store.badScoreBaseLine;
      const partnerPunishment = G4P8421Store.dutyConfig;

      if (max8421SubValue !== 10000000 || koufenStart || partnerPunishment) {
        // 解析已保存的配置
        this.parseStoredConfig({
          max8421SubValue,
          koufenStart,
          partnerPunishment
        });
      }
    },
    // 解析存储的配置
    parseStoredConfig(config) {
      const { max8421SubValue, koufenStart, partnerPunishment } = config;
      console.log('从store加载配置:', config);

      // 解析扣分开始条件 - 新格式:NoSub, Par+X, DoublePar+X
      if (koufenStart) {
        if (koufenStart === 'NoSub') {
          this.setData({ selectedStart: 2 });
        } else if (koufenStart?.startsWith('Par+')) {
          this.setData({ selectedStart: 0 });
          // 提取帕分数
          const scoreStr = koufenStart.replace('Par+', '');
          const score = Number.parseInt(scoreStr);
          if (!Number.isNaN(score)) {
            this.setData({ paScore: score });
          }
        } else if (koufenStart?.startsWith('DoublePar+')) {
          this.setData({ selectedStart: 1 });
          // 提取双帕分数
          const scoreStr = koufenStart.replace('DoublePar+', '');
          const score = Number.parseInt(scoreStr);
          if (!Number.isNaN(score)) {
            this.setData({ doubleParScore: score });
          }
        }
      }

      // 解析封顶配置 - 新格式:数字, 10000000表示不封顶
      if (max8421SubValue === 10000000) {
        this.setData({ selectedMax: 0 });
      } else if (typeof max8421SubValue === 'number' && max8421SubValue < 10000000) {
        this.setData({
          selectedMax: 1,
          maxSubScore: max8421SubValue
        });
      }

      // 解析同伴惩罚配置 - 新格式:NODUTY, DUTY_NEGATIVE, DUTY_DINGTOU
      if (partnerPunishment) {
        let selectedDuty = 0;
        switch (partnerPunishment) {
          case 'NODUTY':
            selectedDuty = 0;
            break;
          case 'DUTY_DINGTOU':
            selectedDuty = 1;
            break;
          case 'DUTY_NEGATIVE':
            selectedDuty = 2;
            break;
          default: {
            // 兼容旧格式
            const index = this.data.dutyOptions.indexOf(partnerPunishment);
            if (index !== -1) {
              selectedDuty = index;
            }
          }
        }
        this.setData({ selectedDuty });
      }
    },
    onSelectStart(e) {
      this.setData({ selectedStart: e.currentTarget.dataset.index });
    },
    onSelectMax(e) {
      this.setData({ selectedMax: e.currentTarget.dataset.index });
    },
    onSelectDuty(e) {
      this.setData({ selectedDuty: e.currentTarget.dataset.index });
    },
    // 帕分数改变
    onPaScoreChange(e) {
      const value = this.data.paScoreRange[e.detail.value];
      this.setData({ paScore: value });
    },
    // 双帕分数改变
    onDoubleParScoreChange(e) {
      const value = this.data.doubleParScoreRange[e.detail.value];
      this.setData({ doubleParScore: value });
    },
    // 封顶分数改变
    onMaxSubScoreChange(e) {
      const value = this.data.maxSubScoreRange[e.detail.value];
      this.setData({ maxSubScore: value });
    },
    onShowConfig() {
      this.setData({ visible: true });
      // 每次显示时重新加载配置
      this.initializeFromStore();
    },

    onCancel() {
      this.setData({ visible: false });
      this.triggerEvent('cancel');
    },
    onConfirm() {
      const { selectedStart, selectedMax, selectedDuty, paScore, doubleParScore, maxSubScore } = this.data;

      // 构建新格式的配置数据
      let sub8421ConfigString = null;
      switch (selectedStart) {
        case 0:
          sub8421ConfigString = `Par+${paScore}`;
          break;
        case 1:
          sub8421ConfigString = `DoublePar+${doubleParScore}`;
          break;
        case 2:
          sub8421ConfigString = 'NoSub';
          break;
      }

      // 封顶配置改为数字格式, 10000000表示不封顶
      const max8421SubValue = selectedMax === 0 ? 10000000 : maxSubScore;

      // 同伴惩罚配置改为枚举格式
      let dutyConfig = null;
      switch (selectedDuty) {
        case 0:
          dutyConfig = 'NODUTY';
          break;
        case 1:
          dutyConfig = 'DUTY_DINGTOU';
          break;
        case 2:
          dutyConfig = 'DUTY_NEGATIVE';
          break;
      }

      // 调用store的action更新数据
      G4P8421Store.updateKoufenRule(max8421SubValue, sub8421ConfigString, dutyConfig);

      console.log('扣分组件已更新store:', {
        max8421SubValue,
        sub8421ConfigString,
        dutyConfig,
        customValues: { paScore, doubleParScore, maxSubScore }
      });

      // 更新显示值
      this.updateDisplayValue();

      // 关闭弹窗
      this.setData({ visible: false });

      // 向父组件传递事件
      this.triggerEvent('confirm', {
        parsedData: { max8421SubValue, sub8421ConfigString, dutyConfig }
      });
    }
  }
});