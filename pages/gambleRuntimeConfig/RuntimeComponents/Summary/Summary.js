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
        displayRuleName: '未知规则',
        // 带头像URL的玩家数据
        playersWithAvatar: []
    },

    // 监听属性变化
    observers: {
        'ruleType, userRule': function (ruleType, userRule) {
            console.log('📋 [Summary] 规则属性变化:', {
                ruleType: ruleType,
                userRule: userRule?.gambleUserName || userRule?.user_rulename
            });

            // 更新显示名称
            this.updateDisplayRuleName();
        },
        'players': function (players) {
            console.log('📋 [Summary] 玩家属性变化:', {
                playersCount: players?.length || 0,
                players: players
            });

            // 更新玩家头像
            this.updatePlayersWithAvatar();
        }
    },

    // 组件生命周期 - 组件实例进入页面节点树时执行
    attached() {
        console.log('📋 [Summary] 组件attached，初始化数据');
        this.updateDisplayRuleName();
        this.updatePlayersWithAvatar();
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

        // 更新带头像的玩家数据
        updatePlayersWithAvatar() {
            const players = this.data.players || [];
            const playersWithAvatar = players.map(player => {
                const avatarUrl = this.getPlayerAvatar(player.avatar);
                return Object.assign({}, player, {
                    avatarUrl: avatarUrl
                });
            });

            console.log('📋 [Summary] 更新玩家头像:', {
                原始玩家数: players.length,
                处理后玩家数: playersWithAvatar.length,
                玩家头像信息: playersWithAvatar.map(p => ({
                    name: p.nickname || p.wx_nickname,
                    原始头像: p.avatar,
                    处理后头像: p.avatarUrl
                }))
            });

            this.setData({
                playersWithAvatar: playersWithAvatar
            });
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

        // 头像加载失败处理
        onAvatarError(e) {
            const index = e.currentTarget.dataset.index;
            console.log('📋 [Summary] 头像加载失败，索引:', index);

            // 更新失败的头像为默认头像
            this.setData({
                [`playersWithAvatar[${index}].avatarUrl`]: '/images/default-avatar.png'
            });
        },

        // 获取玩家头像，如果没有则返回默认头像
        getPlayerAvatar(avatar) {
            console.log('📋 [Summary] 处理头像:', avatar);

            // 如果有头像且不为空字符串
            if (avatar && avatar.trim() !== '') {
                // 如果是完整的URL（包含http或https）
                if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
                    console.log('📋 [Summary] 使用网络头像:', avatar);
                    return avatar;
                }
                // 如果是相对路径，直接返回
                if (avatar.startsWith('/')) {
                    console.log('📋 [Summary] 使用相对路径头像:', avatar);
                    return avatar;
                }
                // 其他情况，假设是相对路径，添加前缀
                const fullPath = `/${avatar}`;
                console.log('📋 [Summary] 添加前缀头像:', fullPath);
                return fullPath;
            }

            // 没有头像或头像为空，返回默认头像
            console.log('📋 [Summary] 使用默认头像: /images/default-avatar.png');
            return '/images/default-avatar.png';
        }
    }
}); 