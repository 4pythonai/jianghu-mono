import { observable, action } from 'mobx-miniprogram'
import gameApi from '../../../../api/modules/game' // 导入整个默认导出的对象

export const G_4P_8421_Store = observable({
    // 生成规则摘要名称
    generateAbstractName: () => {
        return `规则_${Math.floor(Math.random() * 10000)}`;
    },

    ename: '8421',
    sysruleid: 17,
    user_rulename: '8421',
    creatorId: null,

    // 封顶配置: 数字类型，如 2 表示扣2分封顶，10000000 表示不封顶
    max8421_sub_value: 10000000,

    // 扣分开始的值: NoSub, Par+X, DoublePar+X (X为数字)
    sub8421configstring: null,

    // 同伴惩罚配置: NODUTY, DUTY_NEGATIVE, DUTY_CODITIONAL
    dutyconfig: null,

    // 顶洞规则: NoDraw(无顶洞), Diff_X(得分X分以内), DrawEqual(得分打平)
    draw8421Config: null,

    // 吃肉规则：
    eatingRange: null,

    // meat option: MEAT_AS_X, SINGLE_DOUBLE, CONTINUE_DOUBLE
    meat_value: null,

    // 吃肉封顶：  数字类型，如 3 表示3分封顶，10000000 表示不封顶
    meatMaxValue: 10000000,

    // 更新扣分规则的action
    updateKoufenRule: action(function (max8421SubValue, sub8421ConfigString, dutyconfig) {
        this.max8421_sub_value = max8421SubValue;
        this.sub8421configstring = sub8421ConfigString;
        this.dutyconfig = dutyconfig;
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新顶洞规则的action
    updateDingdongRule: action(function (draw8421Config) {
        this.draw8421Config = draw8421Config;
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新吃肉规则的action
    updateEatmeatRule: action(function (eatingRange, meatValueConfig, meatMaxValue) {
        this.eatingRange = eatingRange;
        this.meat_value = meatValueConfig;
        this.meatMaxValue = meatMaxValue;
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新规则名称的action
    updateUserRulename: action(function (name) {
        this.user_rulename = name;
    }),

    // 重置所有规则的action
    resetAllRules: action(function () {
        this.max8421_sub_value = 10000000;
        this.sub8421configstring = null;
        this.dutyconfig = null;
        this.draw8421Config = null;
        this.eatingRange = null;
        this.meat_value = null;
        this.meatMaxValue = 10000000;
    }),

    // 获取所有规则数据的action
    debugAllRulesData: action(function () {
        console.log('=== 完整Store数据 ===');
        console.log('=== 4P-8421 规则配置数据 ===');
        console.log('规则名称:', this.user_rulename);
        console.log('封顶配置:', this.max8421_sub_value);
        console.log('扣分开始值:', this.sub8421configstring);
        console.log('同伴惩罚配置:', this.dutyconfig);
        console.log('顶洞规则:', this.draw8421Config);
        console.log('吃肉得分配对:', this.eatingRange);
        console.log('肉分值计算:', this.meat_value);
        console.log('吃肉封顶:', this.meatMaxValue);
        console.log(JSON.stringify(this, null, 2));

        return {
            user_rulename: this.user_rulename,
            sysruleid: this.sysruleid,
            ename: this.ename,
            creatorId: this.creatorId,
            max8421_sub_value: this.max8421_sub_value,
            sub8421configstring: this.sub8421configstring,
            dutyconfig: this.dutyconfig,
            draw8421Config: this.draw8421Config,
            eatingRange: this.eatingRange,
            meat_value: this.meat_value,
            meatMaxValue: this.meatMaxValue
        };
    })

}); 