import { gameStore } from '../../stores/gameStore';

const app = getApp();

Page({
    data: {
        // 传递的数据
        ruleType: '',
        gameId: null,
        configId: '',
        players: [],
        gameData: null,
        userRule: null,

        runtimeConfig: {
            gameid: null,           // 游戏ID
            groupid: null,          // 分组ID
            userRuleId: null,       // 用户规则ID(仅用户规则时有值)
            gambleSysName: null,    // 游戏系统名称(如:8421、gross、hole等)
            gambleUserName: null,   // 用户规则名称(如:规则_4721)
            red_blue_config: '4_固拉',
            bootstrap_order: [],
            ranking_tie_resolve_config: 'score.reverse',
            val8421_config: {}      // 球员8421指标配置
        },

        // 页面状态
        loading: false,
        error: null
    },

    onLoad(options) {
        console.log('[GambleRuntimeConfig] 页面加载, 参数:', options);

        try {
            if (options.data) {
                const decodedData = JSON.parse(decodeURIComponent(options.data));
                console.log('[GambleRuntimeConfig] 解析数据:', decodedData.editConfig);

                let players = [];
                let holeList = [];
                let holePlayList = [];
                let rangeHolePlayList = [];
                let gameData = null;
                let userRule = null;

                // 统一从全局数据获取完整信息
                if (!gameStore.players?.length) {
                    console.warn('[GambleRuntimeConfig] gameStore.players 为空, 使用默认值');
                    players = [];
                    holeList = [];
                    holePlayList = [];
                    rangeHolePlayList = [];
                    gameData = null;
                } else {
                    players = gameStore.players || [];
                    holeList = gameStore.holeList;
                    holePlayList = gameStore.holePlayList;
                    rangeHolePlayList = gameStore.rangeHolePlayList;
                    gameData = gameStore.gameData || null;
                }

                // 设置新增字段
                let gambleSysName = null;
                let userRuleId = null;
                let gambleUserName = null;

                if (decodedData.fromUserRule) {
                    // 从用户规则进入
                    // 使用用户规则的原始 gamblesysname，而不是映射后的 ruleType
                    gambleSysName = decodedData.userRule?.gamblesysname || '';

                    // 如果 gamblesysname 为空，尝试从 ruleType 中提取
                    if (!gambleSysName && decodedData.ruleType) {
                        gambleSysName = this.extractSysNameFromRuleType(decodedData.ruleType);
                    }

                    gambleUserName = decodedData.userRuleName || '';
                    userRuleId = decodedData.userRuleId || null;
                    userRule = decodedData.userRule || null;

                    console.log('[GambleRuntimeConfig] 用户规则进入:', {
                        userRule: decodedData.userRule,
                        gamblesysname: decodedData.userRule?.gamblesysname,
                        ruleType: decodedData.ruleType,
                        gambleSysName,
                        gambleUserName
                    });
                } else if (decodedData.isEditMode && decodedData.editConfig) {
                    // 编辑模式，从传递的配置中获取
                    gambleSysName = decodedData.editConfig.gambleSysName;
                    gambleUserName = decodedData.editConfig.gambleUserName;
                    userRuleId = decodedData.editConfig.userRuleId;
                } else {
                    // 从系统规则进入（添加规则）
                    // 将完整的规则类型转换为简单的系统名称
                    const ruleType = decodedData.ruleType || '';
                    gambleSysName = this.extractSysNameFromRuleType(ruleType);
                    gambleUserName = decodedData.ruleType || ''; // 系统规则名称就是规则类型
                    userRuleId = null; // 系统规则没有用户规则ID

                    console.log('[GambleRuntimeConfig] 系统规则进入:', {
                        ruleType,
                        gambleSysName,
                        gambleUserName
                    });
                }

                // 处理holePlayList, 如果从编辑配置中传递过来
                if (decodedData.holePlayList) {
                    console.log(" 🛑 🛑 🛑", decodedData)

                    if (typeof decodedData.holePlayList === 'string') {
                        try {
                            holePlayList = JSON.parse(`[${decodedData.holePlayList}]`);
                        } catch (error) {
                            console.error('[GambleRuntimeConfig] 解析holePlayList失败:', error);
                            holePlayList = gameStore.holePlayList;
                        }
                    } else {
                        holePlayList = decodedData.holePlayList;
                    }
                }

                const setDataObj = {
                    ruleType: decodedData.ruleType || '',
                    gameId: decodedData.gameId || null,
                    configId: decodedData.configId || '',
                    players: players,
                    holePlayList: holePlayList,
                    rangeHolePlayList: gameStore.rangeHolePlayList,
                    gameData: gameData,
                    userRule: userRule,
                    'runtimeConfig.gameid': gameStore.gameid,
                    'runtimeConfig.groupid': gameStore.groupId,
                    'runtimeConfig.userRuleId': userRuleId,
                    'runtimeConfig.gambleSysName': gambleSysName,
                    'runtimeConfig.gambleUserName': gambleUserName
                };

                console.log('[GambleRuntimeConfig] 设置页面数据:', setDataObj);
                this.setData(setDataObj);

                // 如果是编辑模式，加载现有配置
                if (decodedData.isEditMode && decodedData.editConfig) {
                    this.loadEditConfig(decodedData.editConfig);
                } else {
                    // 初始化分组配置
                    this.initializeGroupingConfig();

                    // 初始化8421配置(仅在8421游戏时)
                    this.initialize8421Config();
                }
            }
        } catch (error) {
            console.error('[GambleRuntimeConfig] 数据解析失败:', error);
            this.setData({
                error: `数据解析失败: ${error.message}`
            });
        }

        // 如果没有数据，设置默认值
        if (!this.data.ruleType) {
            console.log('[GambleRuntimeConfig] 设置默认数据');
            this.setData({
                ruleType: '4p-8421',
                players: [],
                error: null
            });
        }
    },

    // 初始化分组配置
    initializeGroupingConfig() {
        const { players, ruleType } = this.data;

        // 检查是否需要分组(3人或4人游戏)
        const playerCount = players.length;
        const needGrouping = (playerCount === 3 || playerCount === 4) &&
            (ruleType.includes('3p-') || ruleType.includes('4p-'));

        // 将玩家对象转换为用户ID数组
        const playerIds = players.map(player => Number.parseInt(player.user_id || player.userid));

        if (needGrouping) {
            this.setData({
                'runtimeConfig.red_blue_config': '4_固拉',
                'runtimeConfig.bootstrap_order': playerIds
            });
        } else {
            this.setData({
                'runtimeConfig.bootstrap_order': playerIds
            });
        }

        console.log('[GambleRuntimeConfig] 分组配置初始化:', {
            needGrouping,
            playerCount,
            ruleType,
            playerIds
        });
    },

    // 初始化8421配置
    initialize8421Config() {
        const { players, ruleType } = this.data;

        // 检查是否是8421游戏
        const is8421Game = ruleType.includes('8421');

        if (is8421Game && players.length > 0) {
            // 为每个球员设置默认8421配置
            const defaultConfig = {
                "Birdie": 8,
                "Par": 4,
                "Par+1": 2,
                "Par+2": 1
            };

            const val8421Config = {};
            for (const player of players) {
                const userid = String(player.userid || player.user_id);
                val8421Config[userid] = { ...defaultConfig };
            }

            this.setData({
                'runtimeConfig.val8421_config': val8421Config
            });

            console.log('[GambleRuntimeConfig] 8421配置初始化:', {
                is8421Game,
                playerCount: players.length,
                val8421Config
            });
        }
    },

    // 加载编辑模式的配置
    loadEditConfig(editConfig) {
        console.log('[GambleRuntimeConfig] 加载编辑配置:', editConfig);

        // 加载分组配置
        if (editConfig.red_blue_config) {
            this.setData({
                'runtimeConfig.red_blue_config': editConfig.red_blue_config
            });
        }

        if (editConfig.bootstrap_order) {
            let bootstrapOrder = editConfig.bootstrap_order;

            // 如果bootstrap_order是字符串，需要解析为数组
            if (typeof bootstrapOrder === 'string') {
                try {
                    bootstrapOrder = JSON.parse(bootstrapOrder);
                } catch (error) {
                    console.error('[GambleRuntimeConfig] 解析bootstrap_order失败:', error);
                    bootstrapOrder = [];
                }
            }

            if (Array.isArray(bootstrapOrder) && bootstrapOrder.length > 0) {
                // 确保bootstrap_order是用户ID数组（用于验证和保存）
                this.setData({
                    'runtimeConfig.bootstrap_order': bootstrapOrder
                });

                console.log('[GambleRuntimeConfig] 玩家顺序配置加载成功:', {
                    bootstrapOrder: bootstrapOrder
                });
            }
        }

        // 加载排名配置
        if (editConfig.ranking_tie_resolve_config) {
            this.setData({
                'runtimeConfig.ranking_tie_resolve_config': editConfig.ranking_tie_resolve_config
            });
        }

        // 加载8421配置
        if (editConfig.val8421_config) {
            let val8421Config = editConfig.val8421_config;

            // 如果配置是字符串，需要解析为对象
            if (typeof val8421Config === 'string') {
                try {
                    val8421Config = JSON.parse(val8421Config);
                } catch (error) {
                    console.error('[GambleRuntimeConfig] 解析8421配置失败:', error);
                    val8421Config = {};
                }
            }

            // 确保配置是对象且有内容
            if (typeof val8421Config === 'object' && val8421Config !== null && Object.keys(val8421Config).length > 0) {
                this.setData({
                    'runtimeConfig.val8421_config': val8421Config
                });
                console.log('[GambleRuntimeConfig] 8421配置加载成功:', val8421Config);
            }
        }

        // 加载洞范围配置
        if (editConfig.holePlayList) {
            let holePlayList = editConfig.holePlayList;

            // 如果holePlayList是字符串，需要解析为数组
            if (typeof holePlayList === 'string') {
                try {
                    // 如果是逗号分隔的字符串，先分割再转换为数字数组
                    if (holePlayList.includes(',')) {
                        const holeNumbers = holePlayList.split(',').map(num => Number.parseInt(num.trim()));
                        // 根据洞号构建洞对象数组
                        holePlayList = holeNumbers.map(holeNumber => {
                            // 从gameStore中找到对应的洞对象
                            const holeObj = gameStore.holeList.find(hole => hole.holeid === holeNumber);
                            return holeObj || {
                                holeid: holeNumber,
                                holename: `B${holeNumber}`,
                                hindex: holeNumber // 使用洞号作为hindex
                            };
                        });
                    } else {
                        // 尝试解析为JSON
                        holePlayList = JSON.parse(holePlayList);
                    }
                } catch (error) {
                    console.error('[GambleRuntimeConfig] 解析holePlayList失败:', error);
                    holePlayList = gameStore.holePlayList;
                }
            }

            // 更新gameStore中的holePlayList
            if (Array.isArray(holePlayList) && holePlayList.length > 0) {
                gameStore.holePlayList = holePlayList;
                this.setData({
                    holePlayList: holePlayList
                });
                console.log('[GambleRuntimeConfig] 洞范围配置加载成功:', holePlayList);
            }
        }

        console.log('[GambleRuntimeConfig] 编辑配置加载完成');
    },

    // 重新选择赌博规则
    onReSelectRule() {
        console.log('[GambleRuntimeConfig] 重新选择规则');

        wx.showModal({
            title: '重新选择规则',
            content: '确定要重新选择赌博规则吗？当前配置将丢失。',
            success: (res) => {
                if (res.confirm) {
                    wx.navigateBack();
                }
            }
        });
    },

    // 分组配置事件
    onGroupingConfigChange(e) {
        const { red_blue_config, bootstrap_order } = e.detail;
        console.log('[GambleRuntimeConfig] 分组配置变更:', { red_blue_config, bootstrap_order });

        // 确保bootstrap_order是数字数组
        const playerIds = bootstrap_order.map(id => Number.parseInt(id));

        this.setData({
            'runtimeConfig.red_blue_config': red_blue_config,
            'runtimeConfig.bootstrap_order': playerIds
        });
    },

    // 排名配置事件
    onRankingConfigChange(e) {
        const { ranking_tie_resolve_config } = e.detail;
        console.log('[GambleRuntimeConfig] 排名配置变更:', ranking_tie_resolve_config);

        this.setData({
            'runtimeConfig.ranking_tie_resolve_config': ranking_tie_resolve_config
        });
    },

    // 8421配置事件
    onVal8421ConfigChange(e) {
        const { val8421Config } = e.detail;
        console.log('[GambleRuntimeConfig] 8421配置变更:', val8421Config);

        this.setData({
            'runtimeConfig.val8421_config': val8421Config
        });
    },

    // 确认配置
    onConfirmConfig() {
        const { runtimeConfig, ruleType, gameId, players } = this.data;

        // 验证配置
        if (!this.validateConfig()) {
            return;
        }

        // 保存配置并返回
        this.saveRuntimeConfig();
    },

    // 验证配置
    validateConfig() {
        const { runtimeConfig, players, ruleType } = this.data;

        // 验证分组配置
        const playersOrderCount = runtimeConfig.bootstrap_order.length;

        if (playersOrderCount !== players.length) {
            wx.showToast({
                title: '玩家顺序数量与总人数不符',
                icon: 'none'
            });
            return false;
        }

        if (!runtimeConfig.red_blue_config) {
            wx.showToast({
                title: '请选择分组方式',
                icon: 'none'
            });
            return false;
        }

        // 验证所有玩家ID都存在
        const playerIds = players.map(p => Number.parseInt(p.user_id || p.userid));
        const allPlayersIncluded = runtimeConfig.bootstrap_order.every(id =>
            playerIds.includes(Number.parseInt(id))
        );

        if (!allPlayersIncluded) {
            wx.showToast({
                title: '玩家顺序配置有误',
                icon: 'none'
            });
            return false;
        }

        // 验证8421配置(仅在8421游戏时)
        if (ruleType.includes('8421')) {
            const val8421Config = runtimeConfig.val8421_config;

            if (!val8421Config || Object.keys(val8421Config).length === 0) {
                wx.showToast({
                    title: '请配置球员指标',
                    icon: 'none'
                });
                return false;
            }

            // 验证所有球员都有配置
            const playerIds = players.map(p => String(p.userid || p.user_id));
            const configPlayerIds = Object.keys(val8421Config);
            const allPlayersConfigured = playerIds.every(id =>
                configPlayerIds.includes(id)
            );

            if (!allPlayersConfigured) {
                wx.showToast({
                    title: '部分球员未配置指标',
                    icon: 'none'
                });
                return false;
            }
        }

        return true;
    },

    saveRuntimeConfig() {
        const { runtimeConfig, gameId, configId } = this.data;

        const holeList = gameStore.holeList;
        const holePlayList = gameStore.holePlayList;
        const rangeHolePlayList = gameStore.rangeHolePlayList;

        const configWithHoleList = {
            ...runtimeConfig,
            holeList: holeList,
            holePlayList: holePlayList,
            rangeHolePlayList: rangeHolePlayList
        }

        this.setData({ loading: true });

        // 判断是新增还是更新
        const isEditMode = configId && configId !== '';
        const apiMethod = isEditMode ? 'updateRuntimeConfig' : 'addRuntimeConfig';

        // 如果是编辑模式，添加配置ID
        if (isEditMode) {
            configWithHoleList.id = configId;
        }

        console.log(`[GambleRuntimeConfig] ${isEditMode ? '更新' : '新增'}配置:`, configWithHoleList);

        app.api.gamble[apiMethod](configWithHoleList).then(res => {
            console.log(`[GambleRuntimeConfig] ${isEditMode ? '更新' : '新增'}配置成功:`, res);

            if (res.code === 200) {
                wx.showToast({
                    title: isEditMode ? '配置更新成功' : '配置保存成功',
                    icon: 'success'
                });

                // 返回到游戏详情页面
                setTimeout(() => {
                    wx.navigateBack({
                        delta: isEditMode ? 1 : 2 // 编辑模式返回一层，新增模式返回两层
                    });
                }, 1500);
            } else {
                wx.showToast({
                    title: res.msg || (isEditMode ? '更新失败' : '保存失败'),
                    icon: 'none'
                });
            }
        }).catch(err => {
            console.error(`[GambleRuntimeConfig] ${isEditMode ? '更新' : '新增'}配置失败:`, err);
            wx.showToast({
                title: '网络错误, 请重试',
                icon: 'none'
            });
        }).finally(() => {
            this.setData({ loading: false });
        });
    },

    onCancelConfig() {
        console.log('[GambleRuntimeConfig] 取消配置');
        wx.navigateBack();
    },

    // 从规则类型中提取系统名称
    extractSysNameFromRuleType(ruleType) {
        console.log('[GambleRuntimeConfig] extractSysNameFromRuleType 输入:', ruleType);

        if (!ruleType) {
            console.log('[GambleRuntimeConfig] extractSysNameFromRuleType 返回空字符串');
            return '';
        }

        // 规则类型格式: '2p-8421', '3p-doudizhu', '4p-3da1' 等
        const parts = ruleType.split('-');
        console.log('[GambleRuntimeConfig] extractSysNameFromRuleType 分割结果:', parts);

        if (parts.length === 2) {
            const result = parts[1]; // 返回系统名称部分
            console.log('[GambleRuntimeConfig] extractSysNameFromRuleType 返回:', result);
            return result;
        }

        console.log('[GambleRuntimeConfig] extractSysNameFromRuleType 格式不正确，返回原值:', ruleType);
        return ruleType; // 如果格式不正确，返回原值
    }
}); 