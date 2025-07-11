import { observable, action } from 'mobx-miniprogram'
import gameApi from '../../../../api/modules/game' // 导入整个默认导出的对象

export const G_4P_8421_Store = observable({
    // 生成规则摘要名称
    generateAbstractName: function () {
        return `规则_${Math.floor(Math.random() * 10000)}`;
    },

    ename: '8421',
    sysruleid: 17,
    user_rulename: '8421',
    creatorId: null,

    // 封顶配置: 不封顶,扣2分后再封顶
    max8421_sub_value: null,

    // 扣分开始的值: 从帕+4开始扣分,从双帕+0开始扣分,不扣分
    koufen_start: null,

    // 同伴惩罚配置: 不包负分,同伴顶头包负分,包负分
    partner_punishment: null,

    // 顶洞规则       '得分打平', '得分1分以内', '无顶洞'
    draw8421Config: null,

    // 吃肉规则：
    eatingRange: null,

    // meat option: '肉算1分', '分值翻倍', '分值连续翻倍'
    meat_value: null,

    // 吃肉封顶：  ['不封顶', '3分封顶'],
    meatMaxValue: null,

    // 更新扣分规则的action
    updateKoufenRule: action(function (meatMaxValue, start, punishment) {
        this.max8421_sub_value = meatMaxValue;
        this.koufen_start = start;
        this.partner_punishment = punishment;
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新顶洞规则的action
    updateDingdongRule: action(function (draw8421Config) {
        this.draw8421Config = draw8421Config;
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新吃肉规则的action
    updateEatmeatRule: action(function (eatingRange, meatValueConfigString, meatMaxValue) {
        this.eatingRange = eatingRange;
        this.meat_value = meatValueConfigString;
        this.meatMaxValue = meatMaxValue;
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新规则名称的action
    updateUserRulename: action(function (name) {
        this.user_rulename = name;
    }),

    // 重置所有规则的action
    resetAllRules: action(function () {
        this.max8421_sub_value = null;
        this.koufen_start = null;
        this.partner_punishment = null;
        this.draw8421Config = null;
        this.eatingRange = null;
        this.meat_value = null;
        this.meatMaxValue = null;
    }),

    // 获取所有规则数据的action
    debugAllRulesData: action(function () {
        console.log('=== 完整Store数据 ===');
        console.log('=== 4P-8421 规则配置数据 ===');
        console.log('规则名称:', this.user_rulename);
        console.log('封顶配置:', this.max8421_sub_value);
        console.log('扣分开始值:', this.koufen_start);
        console.log('同伴惩罚配置:', this.partner_punishment);
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
            koufen_start: this.koufen_start,
            partner_punishment: this.partner_punishment,
            draw8421Config: this.draw8421Config,
            eatingRange: this.eatingRange,
            meat_value: this.meat_value,
            meatMaxValue: this.meatMaxValue
        };
    })

}); 