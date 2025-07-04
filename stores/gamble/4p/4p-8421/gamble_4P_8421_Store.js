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
    meat_fengding: null






}); 