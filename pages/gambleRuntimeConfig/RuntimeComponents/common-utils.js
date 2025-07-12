// 公共工具函数 - 运行时配置组件共用
const RuntimeComponentsUtils = {
    // 常量定义
    CONSTANTS: {
        DEFAULT_AVATAR: '/images/default-avatar.png',
        DEFAULT_8421_CONFIG: {
            "Birdie": 8,
            "Par": 4,
            "Par+1": 2,
            "Par+2": 1
        },
        LOG_PREFIXES: {
            HOLE_RANGE: '🕳️ [HoleRangeSelector]',
            PLAYER_INDICATOR: '🎯 [PlayerIndicator]',
            RANKING_SELECTOR: '🏆 [RankingSelector]',
            RED_BLUE_CONFIG: '🔴🔵 [RedBlueConfig]',
            SUMMARY: '📋 [Summary]'
        }
    },

    // 头像处理工具
    avatar: {
        /**
         * 获取玩家头像URL，统一处理各种头像字段
         * @param {Object} player - 玩家对象
         * @returns {string} 头像URL
         */
        getPlayerAvatarUrl(player) {
            if (!player) return this.CONSTANTS.DEFAULT_AVATAR;

            // 按优先级检查头像字段
            const avatarFields = ['avatar', 'avatar_url', 'avatarUrl'];

            for (const field of avatarFields) {
                if (player[field] && player[field].trim() !== '') {
                    return player[field];
                }
            }

            return this.CONSTANTS.DEFAULT_AVATAR;
        },

        /**
         * 批量处理玩家头像
         * @param {Array} players - 玩家数组
         * @returns {Array} 带头像URL的玩家数组
         */
        batchProcessPlayerAvatars(players) {
            if (!Array.isArray(players)) return [];

            return players.map(player => ({
                ...player,
                avatarUrl: this.getPlayerAvatarUrl(player)
            }));
        }
    },

    // 数据处理工具
    data: {
        /**
         * 统一用户ID处理
         * @param {Object} player - 玩家对象
         * @returns {string} 标准化的用户ID
         */
        normalizeUserId(player) {
            return String(player.userid || player.user_id || '');
        },

        /**
         * 批量转换玩家对象为用户ID数组
         * @param {Array} players - 玩家数组
         * @returns {Array} 用户ID数组
         */
        convertPlayersToUserIds(players) {
            if (!Array.isArray(players)) return [];

            return players.map(player => {
                const userid = this.normalizeUserId(player);
                return parseInt(userid) || 0;
            });
        },

        /**
         * 数据验证 - 检查是否为有效的数字字符串
         * @param {string} str - 待验证的字符串
         * @param {number} minLength - 最小长度
         * @param {number} maxLength - 最大长度
         * @returns {boolean} 是否有效
         */
        validateNumericString(str, minLength = 4, maxLength = 5) {
            if (!str) return false;
            const regex = new RegExp(`^[0-9]{${minLength},${maxLength}}$`);
            return regex.test(str);
        }
    },

    // 8421配置工具
    config8421: {
        /**
         * 获取默认8421配置
         * @returns {Object} 默认配置对象
         */
        getDefaultConfig() {
            return { ...RuntimeComponentsUtils.CONSTANTS.DEFAULT_8421_CONFIG };
        },

        /**
         * 配置对象转字符串
         * @param {Object} config - 配置对象
         * @returns {string} 配置字符串
         */
        configToString(config) {
            if (!config) return '8421';

            const values = [];
            const keys = ['Birdie', 'Par', 'Par+1', 'Par+2', 'Par+3'];

            keys.forEach(key => {
                if (config[key] !== undefined) {
                    values.push(config[key]);
                }
            });

            return values.join('') || '8421';
        },

        /**
         * 字符串转配置对象
         * @param {string} str - 配置字符串
         * @returns {Object} 配置对象
         */
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
        }
    },

    // 日志工具
    logger: {
        /**
         * 统一日志记录
         * @param {string} component - 组件名称
         * @param {string} message - 消息
         * @param {*} data - 数据对象
         */
        log(component, message, data = null) {
            const prefix = RuntimeComponentsUtils.CONSTANTS.LOG_PREFIXES[component] || `[${component}]`;

            if (data !== null) {
                console.log(`${prefix} ${message}:`, data);
            } else {
                console.log(`${prefix} ${message}`);
            }
        },

        /**
         * 错误日志记录
         * @param {string} component - 组件名称
         * @param {string} message - 错误消息
         * @param {*} error - 错误对象
         */
        error(component, message, error = null) {
            const prefix = RuntimeComponentsUtils.CONSTANTS.LOG_PREFIXES[component] || `[${component}]`;

            if (error !== null) {
                console.error(`${prefix} ${message}:`, error);
            } else {
                console.error(`${prefix} ${message}`);
            }
        }
    },

    // 事件工具
    event: {
        /**
         * 标准化事件数据结构
         * @param {string} type - 事件类型
         * @param {Object} data - 事件数据
         * @returns {Object} 标准化的事件数据
         */
        standardizeEventData(type, data) {
            return {
                type,
                timestamp: Date.now(),
                ...data
            };
        }
    },

    // 数组工具
    array: {
        /**
         * 安全的数组随机排序
         * @param {Array} array - 原数组
         * @returns {Array} 打乱后的新数组
         */
        shuffle(array) {
            if (!Array.isArray(array)) return [];
            return [...array].sort(() => Math.random() - 0.5);
        },

        /**
         * 数组移动元素
         * @param {Array} array - 原数组
         * @param {number} fromIndex - 源索引
         * @param {number} toIndex - 目标索引
         * @returns {Array} 移动后的新数组
         */
        moveElement(array, fromIndex, toIndex) {
            if (!Array.isArray(array)) return [];

            const newArray = [...array];
            const element = newArray.splice(fromIndex, 1)[0];
            newArray.splice(toIndex, 0, element);

            return newArray;
        }
    }
};

// 导出工具对象
module.exports = RuntimeComponentsUtils; 