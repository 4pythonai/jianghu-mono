import { observable, action } from 'mobx-miniprogram'
import gameApi from '../../../../api/modules/game' // 导入整个默认导出的对象
import { gameStore } from '../../../gameStore' // 导入 gameStore 来获取 gameid

export const G_4P_8421_Store = observable({
    // 生成规则摘要名称
    generateAbstractName: () => {
        return `规则_${Math.floor(Math.random() * 10000)}`;
    },

    gamblesysname: '8421',
    sysruleid: 17,
    user_rulename: '8421',
    creator_id: null,

    // 封顶配置: 数字类型，如 2 表示扣2分封顶，10000000 表示不封顶
    max8421_sub_value: 10000000,

    // 扣分开始的值: NoSub, Par+X, DoublePar+X (X为数字) - 默认：Par+4
    sub8421_config_string: 'Par+4',

    // 同伴惩罚配置: NODUTY, DUTY_NEGATIVE, DUTY_CODITIONAL - 默认：NODUTY
    duty_config: 'NODUTY',

    // 顶洞规则: NoDraw(无顶洞), Diff_X(得分X分以内), DrawEqual(得分打平) - 默认：DrawEqual
    draw8421_config: 'DrawEqual',

    // 吃肉规则：默认配置
    eating_range: {
        "BetterThanBirdie": 2,
        "Birdie": 2,
        "Par": 1,
        "WorseThanPar": 0
    },

    // meat option: MEAT_AS_X, SINGLE_DOUBLE, CONTINUE_DOUBLE - 默认：MEAT_AS_1
    meat_value_config_string: 'MEAT_AS_1',

    // 吃肉封顶：  数字类型，如 3 表示3分封顶，10000000 表示不封顶
    meat_max_value: 10000000,

    // 更新扣分规则的action
    updateKoufenRule: action(function (max8421SubValue, sub8421ConfigString, duty_config) {
        this.max8421_sub_value = max8421SubValue;
        this.sub8421_config_string = sub8421ConfigString;
        this.duty_config = duty_config;
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新顶洞规则的action
    updateDingdongRule: action(function (draw8421_config) {
        this.draw8421_config = draw8421_config;
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新吃肉规则的action
    updateEatmeatRule: action(function (eating_range, meatValueConfig, meat_max_value) {
        this.eating_range = eating_range;
        this.meat_value_config_string = meatValueConfig;
        this.meat_max_value = meat_max_value;
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新规则名称的action
    updateUserRulename: action(function (name) {
        this.user_rulename = name;
    }),

    // 重置所有规则的action
    resetAllRules: action(function () {
        this.max8421_sub_value = 10000000;
        this.sub8421_config_string = 'Par+4';
        this.duty_config = 'NODUTY';
        this.draw8421_config = 'DrawEqual';
        this.eating_range = {
            "BetterThanBirdie": 2,
            "Birdie": 2,
            "Par": 1,
            "WorseThanPar": 0
        };
        this.meat_value_config_string = 'MEAT_AS_1';
        this.meat_max_value = 10000000;
    }),

    // 获取所有规则数据的action
    debugAllRulesData: action(function () {
        const gambleConfig = {
            gameid: gameStore.gameid,
            user_rulename: this.user_rulename,
            sysruleid: this.sysruleid,
            gamblesysname: this.gamblesysname,
            creator_id: this.creator_id,
            max8421_sub_value: this.max8421_sub_value,
            sub8421_config_string: this.sub8421_config_string,
            duty_config: this.duty_config,
            draw8421_config: this.draw8421_config,
            eating_range: this.eating_range,
            meat_value_config_string: this.meat_value_config_string,
            meat_max_value: this.meat_max_value
        };
        console.log(JSON.stringify(gambleConfig, null, 2));
        return gambleConfig;
    })

}); 