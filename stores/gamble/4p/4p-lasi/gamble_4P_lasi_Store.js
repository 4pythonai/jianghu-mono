import { observable, action } from 'mobx-miniprogram'
import { gameStore } from '../../../gameStore' // 导入 gameStore 来获取 gameid
import { REWARD_DEFAULTS } from '../../../../utils/rewardDefaults.js'

export const G4PLasiStore = observable({
    // 生成规则摘要名称
    generateAbstractName: () => {
        return `规则_${Math.floor(Math.random() * 10000)}`;
    },

    badScoreMaxLost: 10000000,
    eatingRange: {
        "BetterThanBirdie": 4,
        "Birdie": 2,
        "Par": 1,
        "WorseThanPar": 0
    },

    // 新增：吃肉相关属性，与 8421 store 保持一致
    meatValueConfig: 'MEAT_AS_1',
    meatMaxValue: 10000000,

    gambleSysName: '4p-lasi',
    gambleUserName: '四人拉丝',
    creator_id: null,

    // 拉丝配置
    lasi_config: {
        // 拉丝指标配置
        indicators: [], // 选择的指标列表
        // 总杆计算方式: 'add_total' | 'plus_total'
        totalCalculationType: 'add_total',
        // KPI分值配置
        kpiValues: {
            best: 1,    // 较好成绩PK分值
            worst: 1,   // 较差成绩PK分值
            total: 1    // 双方总杆PK分值
        }
    },

    // 拉丝奖励规则
    RewardConfig: REWARD_DEFAULTS.DEFAULT_REWARD_CONFIG,

    // 拉丝顶洞规则
    lasi_dingdong_config: 'DrawEqual', // NoDraw, DrawEqual, Diff_X



    // 拉丝包洞规则
    lasi_baodong_config: {
        // 包洞规则类型: 'NODUTY' | 'DoublePar+11' | 'ParP+4' | 'ScoreDiff_3'
        dutyConfig: 'NODUTY',
        // 包洞条件: 'DUTY_DINGTOU' | 'PARTNET_IGNORE'
        PartnerDutyCondition: 'DUTY_DINGTOU'
    },

    // 更新拉丝配置的action
    updateLasiConfig: action(function (config) {
        this.lasi_config = { ...this.lasi_config, ...config };
        this.gambleUserName = this.generateAbstractName();
    }),

    // 更新奖励规则的action
    updateRewardConfig: action(function (config) {
        this.RewardConfig = { ...this.RewardConfig, ...config };
        this.gambleUserName = this.generateAbstractName();
    }),

    // 更新顶洞规则的action
    updateDingdongConfig: action(function (config) {
        this.lasi_dingdong_config = config;
        this.gambleUserName = this.generateAbstractName();
    }),



    // 更新吃肉规则的action
    updateEatmeatRule: action(function (eatingRange, meatValueConfig, meatMaxValue) {
        this.eatingRange = eatingRange;
        this.meatValueConfig = meatValueConfig;
        this.meatMaxValue = meatMaxValue;
        this.gambleUserName = this.generateAbstractName();
    }),

    // 更新包洞规则的action
    updateBaodongConfig: action(function (config) {
        this.lasi_baodong_config = { ...this.lasi_baodong_config, ...config };
        this.gambleUserName = this.generateAbstractName();
    }),

    // 更新规则名称的action
    updateUserRulename: action(function (name) {
        this.gambleUserName = name;
    }),

    // 重置所有规则的action
    resetAllRules: action(function () {
        this.lasi_config = {
            indicators: [],
            totalCalculationType: 'add_total',
            kpiValues: {
                best: 2,
                worst: 1,
                total: 1
            }
        };
        this.RewardConfig = REWARD_DEFAULTS.DEFAULT_REWARD_CONFIG;
        this.lasi_dingdong_config = 'DrawEqual';
        this.lasi_baodong_config = {
            dutyConfig: 'NODUTY',
            PartnerDutyCondition: 'DUTY_DINGTOU'
        };
        // 重置吃肉相关属性
        this.eatingRange = {
            "BetterThanBirdie": 4,
            "Birdie": 2,
            "Par": 1,
            "WorseThanPar": 0
        };
        this.meatValueConfig = 'MEAT_AS_1';
        this.meatMaxValue = 10000000;
    }),

    // 获取所有规则数据的action
    debugAllRulesData: action(function () {
        const gambleConfig = {
            gameid: gameStore.gameid,
            gambleUserName: this.gambleUserName,
            gambleSysName: this.gambleSysName,
            creator_id: this.creator_id,
            lasi_config: this.lasi_config,
            RewardConfig: this.RewardConfig,
            lasi_dingdong_config: this.lasi_dingdong_config,
            // 吃肉相关属性
            eatingRange: this.eatingRange,
            meatValueConfig: this.meatValueConfig,
            meatMaxValue: this.meatMaxValue,
            lasi_baodong_config: this.lasi_baodong_config,
        };
        console.log(JSON.stringify(gambleConfig, null, 2));
        return gambleConfig;
    })
});
