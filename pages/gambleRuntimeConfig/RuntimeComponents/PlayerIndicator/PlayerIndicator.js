// PlayerIndicator组件 - 球员8421指标配置
const RuntimeComponentsUtils = require('../common-utils.js');

Component({
    properties: {
        // 球员列表
        players: {
            type: Array,
            value: []
        },
        // 当前配置
        val8421Config: {
            type: Object,
            value: {}
        }
    },

    data: {
        // 预设配置选项
        presetOptions: [
            { label: '6321', value: '6321' },
            { label: '7321', value: '7321' },
            { label: '8421', value: '8421' },
            { label: '8431', value: '8431' },
            { label: '8432', value: '8432' },
            { label: '8532', value: '8532' },
            { label: '95321', value: '95321' }
        ],

        // 弹框状态
        showModal: false,
        currentPlayer: null,
        currentPlayerIndex: -1,

        // 选择的配置
        selectedPreset: '',
        customInput: '',

        // 带头像的球员列表
        playersWithConfig: []
    },

    observers: {
        'players, val8421Config': function (players, val8421Config) {
            this.updatePlayersWithConfig();
        }
    },

    lifetimes: {
        attached() {
            this.updatePlayersWithConfig();
        }
    },

    methods: {
        // 更新球员配置显示
        updatePlayersWithConfig() {
            const { players, val8421Config } = this.data;

            if (!players || players.length === 0) {
                return;
            }

            const playersWithConfig = players.map(player => {
                const userid = String(player.userid);
                const config = val8421Config[userid] || RuntimeComponentsUtils.config8421.getDefaultConfig();
                const configString = RuntimeComponentsUtils.config8421.configToString(config);

                return {
                    ...player,
                    userid: userid,
                    configString: configString,
                    avatarUrl: RuntimeComponentsUtils.avatar.getPlayerAvatarUrl(player)
                };
            });

            this.setData({
                playersWithConfig: playersWithConfig
            });

            RuntimeComponentsUtils.logger.log('PLAYER_INDICATOR', '更新球员配置', playersWithConfig);
        },

        // 点击球员头像
        onPlayerClick(e) {
            const { player, index } = e.currentTarget.dataset;

            const currentConfig = this.data.val8421Config[player.userid] || RuntimeComponentsUtils.config8421.getDefaultConfig();
            const configString = RuntimeComponentsUtils.config8421.configToString(currentConfig);

            this.setData({
                showModal: true,
                currentPlayer: player,
                currentPlayerIndex: index,
                selectedPreset: configString,
                customInput: ''
            });

            RuntimeComponentsUtils.logger.log('PLAYER_INDICATOR', '点击球员', {
                nickname: player.nickname,
                currentConfig: configString
            });
        },

        // 选择预设配置
        onPresetSelect(e) {
            const { value } = e.currentTarget.dataset;
            this.setData({
                selectedPreset: value,
                customInput: ''
            });
        },

        // 输入自定义配置
        onCustomInput(e) {
            const value = e.detail.value;
            this.setData({
                customInput: value,
                selectedPreset: ''
            });
        },

        // 确认配置
        onConfirm() {
            const { selectedPreset, customInput, currentPlayer, val8421Config } = this.data;

            if (!currentPlayer) return;

            const configString = customInput || selectedPreset;

            // 验证配置字符串格式
            if (!configString || !/^[0-9]{4,5}$/.test(configString)) {
                wx.showToast({
                    title: '配置格式错误',
                    icon: 'none'
                });
                return;
            }

            const newConfig = RuntimeComponentsUtils.config8421.stringToConfig(configString);
            const newVal8421Config = {
                ...val8421Config,
                [currentPlayer.userid]: newConfig
            };

            RuntimeComponentsUtils.logger.log('PLAYER_INDICATOR', '确认配置', {
                player: currentPlayer.nickname,
                configString: configString,
                config: newConfig
            });

            // 更新组件内部数据
            this.setData({
                val8421Config: newVal8421Config
            });

            // 更新球员配置显示
            this.updatePlayersWithConfig();

            this.onCancel();
        },

        // 取消配置
        onCancel() {
            this.setData({
                showModal: false,
                currentPlayer: null,
                currentPlayerIndex: -1,
                selectedPreset: '',
                customInput: ''
            });
        },

        // 防止点击弹框内容时关闭弹框
        preventClose() {
            // 空方法，用于阻止事件冒泡
            return;
        },

        // 获取当前配置（用于外部收集配置）
        getConfig() {
            return this.data.val8421Config || {};
        },





        // 头像加载失败处理
        onAvatarError(e) {
            const index = e.currentTarget.dataset.index;
            RuntimeComponentsUtils.logger.log('PLAYER_INDICATOR', '头像加载失败', { index });

            // 更新失败的头像为默认头像
            this.setData({
                [`playersWithConfig[${index}].avatarUrl`]: RuntimeComponentsUtils.CONSTANTS.DEFAULT_AVATAR
            });
        }
    }
}); 