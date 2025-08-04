import { observable, action } from 'mobx-miniprogram'
import { gameStore } from '../../../gameStore' // 导入 gameStore 来获取 gameid

export const G4P8421Store = observable({
    // 生成规则摘要名称
    generateAbstractName: () => {
        return `规则_${Math.floor(Math.random() * 10000)}`;
    },

    gamblesysname: '4p-8421',
    user_rulename: '4p-8421',
    creator_id: null,

    // 封顶配置: 数字类型, 如 2 表示扣2分封顶, 10000000 表示不封顶
    badScoreMaxLost: 10000000,

    // 扣分开始的值: NoSub, Par+X, DoublePar+X (X为数字) - 默认:Par+4
    badScoreBaseLine: 'Par+4',

    // 同伴惩罚配置: NODUTY, DUTY_NEGATIVE, DUTY_DINGTOU - 默认:NODUTY
    dutyConfig: 'NODUTY',

    // 顶洞规则: NoDraw(无顶洞), Diff_X(得分X分以内), DrawEqual(得分打平) - 默认:DrawEqual
    drawConfig: 'DrawEqual',

    // 吃肉规则:默认配置
    eatingRange: {
        "BetterThanBirdie": 1,
        "Birdie": 1,
        "Par": 1,
        "WorseThanPar": 1
    },

    // meat option: MEAT_AS_X, SINGLE_DOUBLE, CONTINUE_DOUBLE - 默认:MEAT_AS_1
    meatValueConfig: 'MEAT_AS_1',

    // 吃肉封顶:  数字类型, 如 3 表示3分封顶, 10000000 表示不封顶
    meatMaxValue: 10000000,

    // 更新扣分规则的action
    updateKoufenRule: action(function (max8421SubValue, sub8421ConfigString, dutyConfig) {
        this.badScoreMaxLost = max8421SubValue;
        this.badScoreBaseLine = sub8421ConfigString;
        this.dutyConfig = dutyConfig;
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新顶洞规则的action
    updateDingdongRule: action(function (drawConfig) {
        this.drawConfig = drawConfig;
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新吃肉规则的action
    updateEatmeatRule: action(function (eatingRange, meatValueConfig, meatMaxValue) {
        this.eatingRange = eatingRange;
        this.meatValueConfig = meatValueConfig;
        this.meatMaxValue = meatMaxValue;
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新规则名称的action
    updateUserRulename: action(function (name) {
        this.user_rulename = name;
    }),

    // 重置所有规则的action
    resetAllRules: action(function () {
        this.badScoreMaxLost = 10000000;
        this.badScoreBaseLine = 'Par+4';
        this.dutyConfig = 'NODUTY';
        this.drawConfig = 'DrawEqual';
        this.eatingRange = {
            "BetterThanBirdie": 1,
            "Birdie": 1,
            "Par": 1,
            "WorseThanPar": 1
        };
        this.meatValueConfig = 'MEAT_AS_1';
        this.meatMaxValue = 10000000;
    }),

    // 获取所有规则数据的action
    debugAllRulesData: action(function () {
        const gambleConfig = {
            gameid: gameStore.gameid,
            user_rulename: this.user_rulename,
            gamblesysname: this.gamblesysname,
            creator_id: this.creator_id,
            badScoreMaxLost: this.badScoreMaxLost,
            badScoreBaseLine: this.badScoreBaseLine,
            dutyConfig: this.dutyConfig,
            drawConfig: this.drawConfig,
            eatingRange: this.eatingRange,
            meatValueConfig: this.meatValueConfig,
            meatMaxValue: this.meatMaxValue
        };
        console.log(JSON.stringify(gambleConfig, null, 2));
        return gambleConfig;
    })

}); 