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
            'mp-labahua': '多人喇叭花',
            'mp-dabudui': '多人大部队'
        },
        // 显示的规则名称
        displayRuleName: '未知规则'
    },

    // 监听属性变化
    observers: {
        'ruleType, userRule': function (ruleType, userRule) {
            console.log('📋 [Summary] 属性变化:', {
                ruleType: ruleType,
                userRule: userRule?.gambleUserName || userRule?.user_rulename
            });

            // 更新显示名称
            this.updateDisplayRuleName();
        }
    },

    // 组件生命周期 - 组件实例进入页面节点树时执行
    attached() {
        console.log('📋 [Summary] 组件attached，初始化displayRuleName');
        this.updateDisplayRuleName();
    },

    methods: {
        // 更新显示的规则名称
        updateDisplayRuleName() {
            let displayName = '未知规则';

            console.log('📋 [Summary] 更新显示名称:', {
                ruleType: this.data.ruleType,
                userRule: this.data.userRule,
                properties: this.properties
            });

            // 如果有用户规则，优先显示用户规则名称
            if (this.data.userRule) {
                displayName = this.data.userRule.gambleUserName ||
                    this.data.userRule.user_rulename ||
                    this.data.userRule.title ||
                    '用户自定义规则';
                console.log('📋 [Summary] 使用用户规则名称:', displayName);
            } else if (this.data.ruleType) {
                // 否则显示系统规则名称
                displayName = this.data.ruleTypeMap[this.data.ruleType] || this.data.ruleType;
                console.log('📋 [Summary] 使用系统规则名称:', displayName);
            }

            // 更新data中的displayRuleName
            this.setData({
                displayRuleName: displayName
            });

            console.log('📋 [Summary] 最终显示名称:', displayName);
        },

        // 点击重新选择规则
        onReSelectRule() {
            console.log('📋 [Summary] 重新选择规则');
            this.triggerEvent('reselect');
        },

        // 获取规则显示名称 (保留此方法作为备用)
        getRuleDisplayName() {
            console.log('📋 [Summary] 获取规则显示名称:', {
                ruleType: this.data.ruleType,
                userRule: this.data.userRule,
                ruleTypeMap: this.data.ruleTypeMap
            });

            // 如果有用户规则，优先显示用户规则名称
            if (this.data.userRule) {
                const userRuleName = this.data.userRule.gambleUserName ||
                    this.data.userRule.user_rulename ||
                    this.data.userRule.title ||
                    '用户自定义规则';
                console.log('📋 [Summary] 返回用户规则名称:', userRuleName);
                return userRuleName;
            }

            // 否则显示系统规则名称
            const systemRuleName = this.data.ruleTypeMap[this.data.ruleType] || this.data.ruleType || '未知规则';
            console.log('📋 [Summary] 返回系统规则名称:', systemRuleName);
            return systemRuleName;
        },

        // 获取玩家头像，如果没有则返回默认头像
        getPlayerAvatar(avatar) {
            return avatar || '/images/default-avatar.png';
        }
    }
}); 