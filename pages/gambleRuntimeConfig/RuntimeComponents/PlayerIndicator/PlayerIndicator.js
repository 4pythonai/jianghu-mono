// PlayerIndicator组件 - 球员8421指标配置
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
                const userid = String(player.userid || player.user_id);
                const config = val8421Config[userid] || this.getDefaultConfig();
                const configString = this.configToString(config);

                return {
                    ...player,
                    userid: userid,
                    configString: configString,
                    avatarUrl: this.getPlayerAvatarUrl(player)
                };
            });

            this.setData({
                playersWithConfig: playersWithConfig
            });

            console.log('🎯 [PlayerIndicator] 更新球员配置:', playersWithConfig);
        },

        // 获取默认配置 (8421)
        getDefaultConfig() {
            return {
                "Birdie": 8,
                "Par": 4,
                "Par+1": 2,
                "Par+2": 1
            };
        },

        // 配置对象转字符串
        configToString(config) {
            if (!config) return '8421';

            const values = [];
            if (config.Birdie !== undefined) values.push(config.Birdie);
            if (config.Par !== undefined) values.push(config.Par);
            if (config['Par+1'] !== undefined) values.push(config['Par+1']);
            if (config['Par+2'] !== undefined) values.push(config['Par+2']);
            if (config['Par+3'] !== undefined) values.push(config['Par+3']);

            return values.join('') || '8421';
        },

        // 字符串转配置对象
        stringToConfig(str) {
            if (!str || str.length < 4) return this.getDefaultConfig();

            const digits = str.split('').map(d => Number.parseInt(d));

            if (digits.length === 4) {
                return {
                    "Birdie": digits[0],
                    "Par": digits[1],
                    "Par+1": digits[2],
                    "Par+2": digits[3]
                };
            }

            if (digits.length === 5) {
                return {
                    "Birdie": digits[0],
                    "Par": digits[1],
                    "Par+1": digits[2],
                    "Par+2": digits[3],
                    "Par+3": digits[4]
                };
            }

            return this.getDefaultConfig();
        },

        // 获取球员头像URL
        getPlayerAvatarUrl(player) {
            // 优先检查 avatar 字段（这是最常用的字段）
            if (player.avatar && player.avatar.trim() !== '') {
                return player.avatar;
            }
            // 其次检查 avatar_url 字段
            if (player.avatar_url && player.avatar_url.trim() !== '') {
                return player.avatar_url;
            }
            // 最后检查 avatarUrl 字段
            if (player.avatarUrl && player.avatarUrl.trim() !== '') {
                return player.avatarUrl;
            }
            // 如果都没有，返回默认头像
            return '/images/default-avatar.png';
        },

        // 点击球员头像
        onPlayerClick(e) {
            const { player, index } = e.currentTarget.dataset;

            const currentConfig = this.data.val8421Config[player.userid] || this.getDefaultConfig();
            const configString = this.configToString(currentConfig);

            this.setData({
                showModal: true,
                currentPlayer: player,
                currentPlayerIndex: index,
                selectedPreset: configString,
                customInput: ''
            });

            console.log('🎯 [PlayerIndicator] 点击球员:', player.nickname, '当前配置:', configString);
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

            if (!this.validateConfigString(configString)) {
                wx.showToast({
                    title: '配置格式错误',
                    icon: 'none'
                });
                return;
            }

            const newConfig = this.stringToConfig(configString);
            const newVal8421Config = {
                ...val8421Config,
                [currentPlayer.userid]: newConfig
            };

            console.log('🎯 [PlayerIndicator] 确认配置:', {
                player: currentPlayer.nickname,
                configString: configString,
                config: newConfig
            });

            // 触发变更事件
            this.triggerEvent('change', {
                val8421Config: newVal8421Config
            });

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

        // 验证配置字符串
        validateConfigString(str) {
            if (!str) return false;

            // 检查是否为4位或5位数字
            const regex = /^[0-9]{4,5}$/;
            return regex.test(str);
        },



        // 阻止弹框关闭
        preventClose() {
            // 空函数，阻止事件冒泡
        },

        // 头像加载失败处理
        onAvatarError(e) {
            const index = e.currentTarget.dataset.index;
            console.log('🎯 [PlayerIndicator] 头像加载失败，索引:', index);

            // 更新失败的头像为默认头像
            this.setData({
                [`playersWithConfig[${index}].avatarUrl`]: '/images/default-avatar.png'
            });
        }
    }
}); 