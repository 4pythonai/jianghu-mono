// Summary组件 - 显示游戏规则摘要和参与人员
const RuntimeComponentsUtils = require('../common-utils.js');
const { GameConstantsUtils } = require('../../../../utils/gameConstants.js');

Component({
    properties: {
        // 规则类型
        gambleSysName: {
            type: String,
            value: ''
        },
        // 参与玩家
        players: {
            type: Array,
            value: []
        },
        // 用户规则数据(如果是从我的规则进入的)
        userRule: {
            type: Object,
            value: null
        }
    },

    data: {
        // 显示的规则名称
        displayRuleName: '未知规则',
        // 带头像URL的玩家数据
        playersWithAvatar: []
    },

    // 监听属性变化
    observers: {
        'gambleSysName, userRule': function (gambleSysName, userRule) {
            RuntimeComponentsUtils.logger.log('SUMMARY', '规则属性变化', {
                gambleSysName: gambleSysName,
                userRule: userRule?.gambleUserName || userRule?.user_rulename
            });

            // 更新显示名称
            this.updateDisplayRuleName();
        },
        'players': function (players) {
            RuntimeComponentsUtils.logger.log('SUMMARY', '玩家属性变化', {
                playersCount: players?.length || 0,
                players: players
            });

            // 更新玩家头像
            this.updatePlayersWithAvatar();
        }
    },

    // 组件生命周期 - 组件实例进入页面节点树时执行
    attached() {
        RuntimeComponentsUtils.logger.log('SUMMARY', '组件attached, 初始化数据');
        this.updateDisplayRuleName();
        this.updatePlayersWithAvatar();
    },

    methods: {
        // 更新显示的规则名称
        updateDisplayRuleName() {
            let displayName = '未知规则';

            RuntimeComponentsUtils.logger.log('SUMMARY', '更新显示名称', {
                gambleSysName: this.data.gambleSysName,
                userRule: this.data.userRule,
                properties: this.properties
            });

            // 如果有用户规则, 优先显示用户规则名称
            if (this.data.userRule) {
                displayName = this.data.userRule.gambleUserName ||
                    this.data.userRule.user_rulename ||
                    this.data.userRule.title ||
                    '用户自定义规则';
                RuntimeComponentsUtils.logger.log('SUMMARY', '使用用户规则名称', displayName);
            } else if (this.data.gambleSysName) {
                // 否则显示系统规则名称
                displayName = GameConstantsUtils.getGameTypeName(this.data.gambleSysName);
                RuntimeComponentsUtils.logger.log('SUMMARY', '使用系统规则名称', displayName);
            }

            // 更新data中的displayRuleName
            this.setData({
                displayRuleName: displayName
            });

            RuntimeComponentsUtils.logger.log('SUMMARY', '最终显示名称', displayName);
        },

        // 更新带头像的玩家数据
        updatePlayersWithAvatar() {
            const players = this.data.players || [];
            const playersWithAvatar = RuntimeComponentsUtils.avatar.batchProcessPlayerAvatars(players);

            RuntimeComponentsUtils.logger.log('SUMMARY', '更新玩家头像', {
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
            RuntimeComponentsUtils.logger.log('SUMMARY', '重新选择规则');
            this.triggerEvent('reselect');
        },

        // 头像加载失败处理
        onAvatarError(e) {
            const index = e.currentTarget.dataset.index;
            RuntimeComponentsUtils.logger.log('SUMMARY', '头像加载失败', { index });

            // 更新失败的头像为默认头像
            this.setData({
                [`playersWithAvatar[${index}].avatarUrl`]: RuntimeComponentsUtils.CONSTANTS.DEFAULT_AVATAR
            });
        }
    }
}); 