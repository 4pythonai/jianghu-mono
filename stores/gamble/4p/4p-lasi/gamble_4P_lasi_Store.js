import { observable, action } from 'mobx-miniprogram'
import { gameStore } from '../../../gameStore' // 导入 gameStore 来获取 gameid
import { GameConstantsUtils } from '../../../../utils/gameConstants.js'

export const G4PLasiStore = observable({
    // 生成规则摘要名称
    generateAbstractName: () => {
        return `规则_${Math.floor(Math.random() * 10000)}`;
    },

    gamblesysname: 'lasi',
    user_rulename: '四人拉丝',
    creator_id: null,

    // 拉丝配置
    lasi_config: {
        // 拉丝指标配置
        indicators: [], // 选择的指标列表
        // 总杆计算方式: 'sum' | 'product'
        totalCalculation: 'sum'
    },

    // 拉丝奖励规则
    lasi_reward_config: {
        enabled: false,
        conditions: []
    },

    // 拉丝顶洞规则
    lasi_dingdong_config: {
        enabled: true, // 默认启用顶洞
        type: 'DrawEqual' // NoDraw, DrawEqual, Diff_X
    },

    // 拉丝吃肉规则
    lasi_eatmeat_config: {
        enabled: false,
        meat_value: 1,
        max_value: 10000000
    },

    // 拉丝包洞规则
    lasi_baodong_config: {
        enabled: false,
        conditions: []
    },

    // 更新拉丝配置的action
    updateLasiConfig: action(function (config) {
        this.lasi_config = { ...this.lasi_config, ...config };
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新奖励规则的action
    updateRewardConfig: action(function (config) {
        this.lasi_reward_config = { ...this.lasi_reward_config, ...config };
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新顶洞规则的action
    updateDingdongConfig: action(function (config) {
        this.lasi_dingdong_config = { ...this.lasi_dingdong_config, ...config };
        // 如果禁用顶洞，也禁用吃肉规则
        if (!config.enabled) {
            this.lasi_eatmeat_config.enabled = false;
        }
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新吃肉规则的action
    updateEatmeatConfig: action(function (config) {
        this.lasi_eatmeat_config = { ...this.lasi_eatmeat_config, ...config };
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新包洞规则的action
    updateBaodongConfig: action(function (config) {
        this.lasi_baodong_config = { ...this.lasi_baodong_config, ...config };
        this.user_rulename = this.generateAbstractName();
    }),

    // 更新规则名称的action
    updateUserRulename: action(function (name) {
        this.user_rulename = name;
    }),

    // 重置所有规则的action
    resetAllRules: action(function () {
        this.lasi_config = {
            indicators: [],
            totalCalculation: 'sum'
        };
        this.lasi_reward_config = {
            enabled: false,
            conditions: []
        };
        this.lasi_dingdong_config = {
            enabled: true,
            type: 'DrawEqual'
        };
        this.lasi_eatmeat_config = {
            enabled: false,
            meat_value: 1,
            max_value: 10000000
        };
        this.lasi_baodong_config = {
            enabled: false,
            conditions: []
        };
    }),

    // 获取所有规则数据的action
    debugAllRulesData: action(function () {
        const gambleConfig = {
            gameid: gameStore.gameid,
            user_rulename: this.user_rulename,
            gamblesysname: this.gamblesysname,
            creator_id: this.creator_id,
            lasi_config: this.lasi_config,
            lasi_reward_config: this.lasi_reward_config,
            lasi_dingdong_config: this.lasi_dingdong_config,
            lasi_eatmeat_config: this.lasi_eatmeat_config,
            lasi_baodong_config: this.lasi_baodong_config
        };
        console.log(JSON.stringify(gambleConfig, null, 2));
        return gambleConfig;
    })
});
