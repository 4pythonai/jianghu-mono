// Summary组件 - 显示游戏规则摘要和参与人员
Component({
    properties: {
        // 规则类型
        ruleType: {
            type: String,
            value: ''
        },
        // 参与玩家
        players: {
            type: Array,
            value: []
        },
        // 用户规则数据（如果是从我的规则进入的）
        userRule: {
            type: Object,
            value: null
        }
    },

    data: {
        // 规则类型映射
        ruleTypeMap: {
            // 2人游戏
            '2p-gross': '2人比杆',
            '2p-hole': '2人比洞',
            '2p-8421': '2人8421',
            // 3人游戏
            '3p-doudizhu': '3人斗地主',
            '3p-dizhupo': '3人地主婆',
            '3p-8421': '3人8421',
            // 4人游戏
            '4p-lasi': '4人拉死',
            '4p-8421': '4人8421',
            '4p-dizhupo': '4人地主婆',
            '4p-3da1': '4人3打1',
            '4p-bestak': '4人Bestak',
            // 多人游戏
            'mp-labahua': '多人拉八花',
            'mp-dabudui': '多人打不对'
        }
    },

    computed: {
        // 计算显示的规则名称
        displayRuleName() {
            return this.data.ruleTypeMap[this.data.ruleType] || this.data.ruleType;
        },

        // 计算玩家数量
        playerCount() {
            return this.data.players.length;
        }
    },

    methods: {
        // 点击重新选择规则
        onReSelectRule() {
            console.log('📋 [Summary] 重新选择规则');
            this.triggerEvent('reselect');
        },

        // 获取规则显示名称
        getRuleDisplayName() {
            // 如果有用户规则，优先显示用户规则名称
            if (this.data.userRule) {
                return this.data.userRule.gambleUserName ||
                    this.data.userRule.user_rulename ||
                    this.data.userRule.title ||
                    '用户自定义规则';
            }

            // 否则显示系统规则名称
            return this.data.ruleTypeMap[this.data.ruleType] || this.data.ruleType;
        },

        // 获取玩家头像，如果没有则返回默认头像
        getPlayerAvatar(avatar) {
            return avatar || '/images/default-avatar.png';
        }
    }
}); 