import { observable, action } from 'mobx-miniprogram'
import gameApi from '../../../../api/modules/game' // 导入整个默认导出的对象

export const G_4P_8421_Store = observable({

    // 封顶配置: 不封顶,扣2分后再封顶
    koufen_fengding: null,

    // 扣分开始的值: 从帕+4开始扣分,从双帕+0开始扣分,不扣分
    koufen_start: null,

    // 同伴惩罚配置: 不包负分,同伴顶头包负分,包负分
    partner_punishment: null,

    // 顶洞规则       '得分打平', '得分1分以内', '无顶洞'
    dingdong: null,

    // 吃肉规则：
    eatmeat_score_value_pair: null,

    // meat option: '肉算1分', '分值翻倍', '分值连续翻倍'
    meat_value: null,

    // 吃肉封顶：  ['不封顶', '3分封顶'],
    meat_fengding: null,

    // 更新扣分规则的action
    updateKoufenRule: action(function (fengding, start, punishment) {
        this.koufen_fengding = fengding;
        this.koufen_start = start;
        this.partner_punishment = punishment;
    }),

    // 更新顶洞规则的action
    updateDingdongRule: action(function (dingdong) {
        this.dingdong = dingdong;
    }),

    // 更新吃肉规则的action
    updateEatmeatRule: action(function (scorePair, meatValue, fengding) {
        this.eatmeat_score_value_pair = scorePair;
        this.meat_value = meatValue;
        this.meat_fengding = fengding;
    }),

    // 重置所有规则的action
    resetAllRules: action(function () {
        this.koufen_fengding = null;
        this.koufen_start = null;
        this.partner_punishment = null;
        this.dingdong = null;
        this.eatmeat_score_value_pair = null;
        this.meat_value = null;
        this.meat_fengding = null;
    }),

    // 获取所有规则数据的action
    getAllRulesData: action(function () {
        return {
            koufen_fengding: this.koufen_fengding,
            koufen_start: this.koufen_start,
            partner_punishment: this.partner_punishment,
            dingdong: this.dingdong,
            eatmeat_score_value_pair: this.eatmeat_score_value_pair,
            meat_value: this.meat_value,
            meat_fengding: this.meat_fengding
        };
    })

}); 