RewardConfig: "{"rewardPair":[{"scoreName":"Par","rewardValue":0},{"scoreName":"Birdie","rewardValue":1},{"scoreName":"Eagle","rewardValue":3},{"scoreName":"Albatross\/HIO","rewardValue":10}],"rewardPreCondition":"total_ignore","rewardType":"add"}"
badScoreBaseLine: "Par+4"
badScoreMaxLost: "10000000"
drawConfig: "DrawEqual"
dutyConfig: "DUTY_DINGTOU"
eatingRange: "{"BetterThanBirdie":4,"Birdie":3,"Par":2,"WorseThanPar":3}"
meatValueConfig: "MEAT_AS_1"
gambleSysName: "4p-lasi"
gambleUserName: "131"
kpis: "{"kpiValues":{"best":1,"worst":3,"total":1},"indicators":["best","worst","total"],"totalCalculationType":"multiply_total"}"
meatMaxValue: "10000000"
playersNumber: "4"
userRuleId: "1344697"


Stores:
    stores/gamble/4p/4p-lasi/new_gamble_4P_lasi_Store.js
    stores/gamble/4p/4p-lasi/gamble_4P_lasi_Store.js
    stores/gamble/4p/4p-lasi/Gamble4PLasiStore.js


                            pages/rules/rules
                                    |
                                    |
                                    |
          --------------------------------------------------------------
          |                                                            |
          |                                                            |
       MyRules(我的规则)                                       SysRule (添加规则) 
      pages/rules/ruleComponents/MyRules/          pages/rules/ruleComponents/SysRule/
          |                                                            |
          |                                                            |       
          |                                                            |
pages/rules/UserRuleEdit/UserRuleEdit                   pages/UnifiedConfigPage/UnifiedConfigPage