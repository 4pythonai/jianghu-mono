/**
 * 统一配置管理器
 * 合并 configConverter、configParser、configDataProcessor 的功能
 * 提供统一的配置解析、转换、处理接口
 */
const { gameStore } = require('../stores/gameStore');
const { holeRangeStore } = require('../stores/holeRangeStore');

class ConfigManager {
    constructor() {
        // 存储键名常量
        this.KEYS = {
            TOKEN: 'token',
            REFRESH_TOKEN: 'refreshToken',
            USER_INFO: 'userInfo',
            USER_AVATAR: 'userAvatarPath',
            APP_CONFIG: 'appConfig',
            LAST_LOGIN_TIME: 'lastLoginTime'
        };
    }

    // ==================== 配置解析方法 ====================

    /**
     * 解析 Par+X 格式的配置
     * @param {string} value - 配置值，如 "Par+4"
     * @returns {Object|null} 解析结果，如 { type: 'Par', score: 4 }
     */
    parseParPlus(value) {
        if (!value || typeof value !== 'string') {
            return null;
        }

        if (value.startsWith('Par+')) {
            const scoreStr = value.replace('Par+', '');
            const score = Number.parseInt(scoreStr);

            if (!Number.isNaN(score)) {
                return {
                    type: 'Par',
                    score: score,
                    original: value
                };
            }
        }

        return null;
    }

    /**
     * 解析 DoublePar+X 格式的配置
     * @param {string} value - 配置值，如 "DoublePar+7"
     * @returns {Object|null} 解析结果，如 { type: 'DoublePar', score: 7 }
     */
    parseDoubleParPlus(value) {
        if (!value || typeof value !== 'string') {
            return null;
        }

        if (value.startsWith('DoublePar+')) {
            const scoreStr = value.replace('DoublePar+', '');
            const score = Number.parseInt(scoreStr);

            if (!Number.isNaN(score)) {
                return {
                    type: 'DoublePar',
                    score: score,
                    original: value
                };
            }
        }

        return null;
    }

    /**
     * 解析 Diff_X 格式的配置
     * @param {string} value - 配置值，如 "Diff_6"
     * @returns {Object|null} 解析结果，如 { type: 'Diff', score: 6 }
     */
    parseDiff(value) {
        if (!value || typeof value !== 'string') {
            return null;
        }

        if (value.startsWith('Diff_')) {
            const scoreStr = value.replace('Diff_', '');
            const score = Number.parseInt(scoreStr);

            if (!Number.isNaN(score)) {
                return {
                    type: 'Diff',
                    score: score,
                    original: value
                };
            }
        }

        return null;
    }

    /**
     * 解析 MEAT_AS_X 格式的配置
     * @param {string} value - 配置值，如 "MEAT_AS_2"
     * @returns {Object|null} 解析结果，如 { type: 'MeatAs', score: 2 }
     */
    parseMeatAs(value) {
        if (!value || typeof value !== 'string') {
            return null;
        }

        if (value.startsWith('MEAT_AS_')) {
            const scoreStr = value.replace('MEAT_AS_', '');
            const score = Number.parseInt(scoreStr);

            if (!Number.isNaN(score)) {
                return {
                    type: 'MeatAs',
                    score: score,
                    original: value
                };
            }
        }

        return null;
    }

    /**
     * 解析 eatingRange JSON字符串
     * @param {string|Object} value - 配置值，如 "{\"BetterThanBirdie\":1,\"Birdie\":1,\"Par\":1,\"WorseThanPar\":1}"
     * @returns {Object|null} 解析结果，如 { BetterThanBirdie: 1, Birdie: 1, Par: 1, WorseThanPar: 1 }
     */
    parseEatingRange(value) {
        if (!value) {
            return null;
        }

        // 如果已经是对象，直接返回
        if (typeof value === 'object' && !Array.isArray(value)) {
            return value;
        }

        // 如果是字符串，尝试解析JSON
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (error) {
                console.error('解析eatingRange失败:', error, '原始值:', value);
            }
        }

        return null;
    }

    /**
     * 解析封顶值配置
     * @param {string|number} value - 配置值，如 "10000000" 或 10000000
     * @returns {Object} 解析结果，如 { isUnlimited: true, value: 10000000 }
     */
    parseMaxValue(value) {
        const numValue = Number(value);

        if (Number.isNaN(numValue)) {
            return {
                isUnlimited: false,
                value: 0,
                original: value
            };
        }

        return {
            isUnlimited: numValue === 10000000,
            value: numValue,
            original: value
        };
    }

    /**
     * 解析 dutyConfig 配置
     * @param {string} value - 配置值，如 "DUTY_DINGTOU"
     * @returns {Object} 解析结果，如 { type: 'DUTY_DINGTOU', index: 1 }
     */
    parseDutyConfig(value) {
        if (!value || typeof value !== 'string') {
            return {
                type: 'NODUTY',
                index: 0
            };
        }

        const dutyMap = {
            'NODUTY': 0,
            'DUTY_DINGTOU': 1,
            'DUTY_NEGATIVE': 2
        };

        return {
            type: value,
            index: dutyMap[value] !== undefined ? dutyMap[value] : 0
        };
    }

    /**
     * 解析 drawConfig 配置
     * @param {string} value - 配置值，如 "DrawEqual"
     * @returns {Object} 解析结果，如 { type: 'DrawEqual', index: 0 }
     */
    parseDrawConfig(value) {
        if (!value || typeof value !== 'string') {
            return {
                type: 'DrawEqual',
                index: 0
            };
        }

        if (value === 'DrawEqual') {
            return { type: value, index: 0 };
        }
        if (value === 'NoDraw') {
            return { type: value, index: 2 };
        }
        if (value.startsWith('Diff_')) {
            const diffResult = this.parseDiff(value);
            return {
                type: 'Diff',
                index: 1,
                score: diffResult ? diffResult.score : 1
            };
        }

        return {
            type: 'DrawEqual',
            index: 0
        };
    }

    /**
     * 解析 meatValueConfig 配置
     * @param {string} value - 配置值，如 "SINGLE_DOUBLE"
     * @returns {Object} 解析结果，如 { type: 'SINGLE_DOUBLE', index: 1 }
     */
    parseMeatValueConfig(value) {
        if (!value || typeof value !== 'string') {
            return {
                type: 'MEAT_AS_1',
                index: 0,
                score: 1
            };
        }

        if (value === 'SINGLE_DOUBLE') {
            return { type: value, index: 1 };
        }
        if (value === 'CONTINUE_DOUBLE') {
            return { type: value, index: 2 };
        }
        if (value.startsWith('MEAT_AS_')) {
            const meatResult = this.parseMeatAs(value);
            return {
                type: 'MEAT_AS',
                index: 0,
                score: meatResult ? meatResult.score : 1
            };
        }

        return {
            type: 'MEAT_AS_1',
            index: 0,
            score: 1
        };
    }

    // ==================== 配置转换方法 ====================

    /**
     * 将E8421Koufen组件状态转换为配置数据
     * @param {Object} componentState - 组件状态
     * @returns {Object} 配置数据
     */
    convertE8421KoufenToConfig(componentState) {
        const { selectedStart, selectedMax, selectedDuty, paScore, doubleParScore, maxSubScore } = componentState;

        // 构建扣分基线
        let badScoreBaseLine = null;
        switch (selectedStart) {
            case 0:
                badScoreBaseLine = `Par+${paScore}`;
                break;
            case 1:
                badScoreBaseLine = `DoublePar+${doubleParScore}`;
                break;
            case 2:
                badScoreBaseLine = 'NoSub';
                break;
        }

        // 构建封顶配置
        const badScoreMaxLost = selectedMax === 0 ? 10000000 : maxSubScore;

        // 构建同伴惩罚配置
        let dutyConfig = null;
        switch (selectedDuty) {
            case 0:
                dutyConfig = 'NODUTY';
                break;
            case 1:
                dutyConfig = 'DUTY_DINGTOU';
                break;
            case 2:
                dutyConfig = 'DUTY_NEGATIVE';
                break;
        }

        return {
            badScoreBaseLine,
            badScoreMaxLost,
            dutyConfig
        };
    }

    /**
     * 将Draw8421组件状态转换为配置数据
     * @param {Object} componentState - 组件状态
     * @returns {Object} 配置数据
     */
    convertDraw8421ToConfig(componentState) {
        const { selected, selectedDiffScore } = componentState;

        // 根据选择的选项生成配置值
        let drawConfig = '';
        if (selected === 0) {
            drawConfig = 'DrawEqual';
        } else if (selected === 1) {
            drawConfig = `Diff_${selectedDiffScore}`;
        } else if (selected === 2) {
            drawConfig = 'NoDraw';
        }

        return { drawConfig };
    }

    /**
     * 将E8421Meat组件状态转换为配置数据
     * @param {Object} componentState - 组件状态
     * @returns {Object} 配置数据
     */
    convertE8421MeatToConfig(componentState) {
        const { eatingRange, meatValueOption, meatScoreValue, topSelected, topScoreLimit } = componentState;

        // 构建肉分值配置
        let meatValueConfig = null;
        switch (meatValueOption) {
            case 0:
                meatValueConfig = `MEAT_AS_${meatScoreValue}`;
                break;
            case 1:
                meatValueConfig = 'SINGLE_DOUBLE';
                break;
            case 2:
                meatValueConfig = 'CONTINUE_DOUBLE';
                break;
        }

        // 构建封顶配置
        const meatMaxValue = topSelected === 0 ? 10000000 : topScoreLimit;

        return {
            eatingRange,
            meatValueConfig,
            meatMaxValue
        };
    }

    /**
     * 将配置数据转换为E8421Koufen组件状态
     * @param {Object} configData - 配置数据
     * @returns {Object} 组件状态
     */
    convertConfigToE8421Koufen(configData) {
        const { badScoreBaseLine, badScoreMaxLost, dutyConfig } = configData;
        const state = {};

        // 解析扣分基线
        if (badScoreBaseLine === 'NoSub') {
            state.selectedStart = 2;
        } else if (badScoreBaseLine?.startsWith('Par+')) {
            state.selectedStart = 0;
            const score = Number.parseInt(badScoreBaseLine.replace('Par+', ''));
            state.paScore = Number.isNaN(score) ? 4 : score;
        } else if (badScoreBaseLine?.startsWith('DoublePar+')) {
            state.selectedStart = 1;
            const score = Number.parseInt(badScoreBaseLine.replace('DoublePar+', ''));
            state.doubleParScore = Number.isNaN(score) ? 0 : score;
        } else {
            state.selectedStart = 0;
            state.paScore = 4;
        }

        // 解析封顶配置
        const maxLostValue = Number(badScoreMaxLost);
        if (maxLostValue === 10000000) {
            state.selectedMax = 0;
        } else {
            state.selectedMax = 1;
            state.maxSubScore = maxLostValue > 0 ? maxLostValue : 2;
        }

        // 解析同伴惩罚配置
        switch (dutyConfig) {
            case 'NODUTY':
                state.selectedDuty = 0;
                break;
            case 'DUTY_DINGTOU':
                state.selectedDuty = 1;
                break;
            case 'DUTY_NEGATIVE':
                state.selectedDuty = 2;
                break;
            default:
                state.selectedDuty = 0;
        }

        return state;
    }

    /**
     * 将配置数据转换为Draw8421组件状态
     * @param {Object} configData - 配置数据
     * @returns {Object} 组件状态
     */
    convertConfigToDraw8421(configData) {
        const { drawConfig } = configData;
        const state = {};

        if (drawConfig === 'DrawEqual') {
            state.selected = 0;
        } else if (drawConfig === 'NoDraw') {
            state.selected = 2;
        } else if (drawConfig?.startsWith('Diff_')) {
            state.selected = 1;
            const score = Number.parseInt(drawConfig.replace('Diff_', ''));
            state.selectedDiffScore = Number.isNaN(score) ? 1 : score;
        } else {
            state.selected = 0;
            state.selectedDiffScore = 1;
        }

        return state;
    }

    /**
     * 将配置数据转换为E8421Meat组件状态
     * @param {Object} configData - 配置数据
     * @returns {Object} 组件状态
     */
    convertConfigToE8421Meat(configData) {
        const { eatingRange, meatValueConfig, meatMaxValue } = configData;
        const state = {};

        // 解析eatingRange
        if (eatingRange) {
            if (typeof eatingRange === 'string') {
                try {
                    state.eatingRange = JSON.parse(eatingRange);
                } catch (error) {
                    state.eatingRange = {
                        "BetterThanBirdie": 1,
                        "Birdie": 1,
                        "Par": 1,
                        "WorseThanPar": 1
                    };
                }
            } else {
                state.eatingRange = eatingRange;
            }
        }

        // 解析meatValueConfig
        if (meatValueConfig?.startsWith('MEAT_AS_')) {
            state.meatValueOption = 0;
            const score = Number.parseInt(meatValueConfig.replace('MEAT_AS_', ''));
            state.meatScoreValue = Number.isNaN(score) ? 1 : score;
        } else if (meatValueConfig === 'SINGLE_DOUBLE') {
            state.meatValueOption = 1;
        } else if (meatValueConfig === 'CONTINUE_DOUBLE') {
            state.meatValueOption = 2;
        } else {
            state.meatValueOption = 0;
            state.meatScoreValue = 1;
        }

        // 解析meatMaxValue
        const maxValue = Number(meatMaxValue);
        if (maxValue === 10000000) {
            state.topSelected = 0;
        } else {
            state.topSelected = 1;
            state.topScoreLimit = maxValue > 0 ? maxValue : 3;
        }

        return state;
    }

    // ==================== 数据处理方法 ====================

    /**
     * 处理传入的页面参数
     * @param {Object} options 页面参数
     * @returns {Object} 处理后的数据
     */
    processIncomingData(options) {
        console.log('[ConfigManager] 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 处理传入数据:', options);

        try {
            if (!options.data) {
                throw new Error('缺少必要的数据参数');
            }

            const decodedData = JSON.parse(decodeURIComponent(options.data));
            console.log('[ConfigManager] 解析数据:', decodedData);

            // 获取基础游戏数据
            const baseData = this.getBaseGameData();

            // 处理游戏类型和规则信息
            const gameTypeData = this.processGameTypeData(decodedData);

            // 处理洞范围数据
            // ...holeData,

            // 合并所有数据
            const processedData = {
                ...baseData,
                ...gameTypeData,
                editConfig: decodedData,  // 整个 decodedData 就是编辑配置
                configId: decodedData.id || ''  // 从配置对象中获取 id
            };

            return processedData;

        } catch (error) {
            console.error('[ConfigManager] 数据处理失败:', error);
            throw error;
        }
    }

    /**
     * 获取基础游戏数据
     * @returns {Object} 基础游戏数据
     */
    getBaseGameData() {
        const players = gameStore.players || [];
        const gameData = gameStore.gameData || null;

        console.log('[ConfigManager] 获取基础游戏数据:', {
            gameid: gameStore.gameid,
            groupid: gameStore.groupid,
            groupIdType: typeof gameStore.groupid,
            hasGroupId: !!gameStore.groupid
        });

        return {
            players,
            gameData,
            gameid: gameStore.gameid,
            groupid: gameStore.groupid
        };
    }

    /**
     * 处理游戏类型和规则信息
     * @param {Object} decodedData 解析后的数据
     * @returns {Object} 游戏类型数据
     */
    processGameTypeData(decodedData) {
        let gambleSysName = '';
        let userRuleId = null;
        let gambleUserName = '';
        let userRule = null;

        if (decodedData.fromUserRule) {
            // 从用户规则进入
            // 优先使用传递的 gambleSysName，保持完整格式
            gambleSysName = decodedData.gambleSysName || decodedData.userRule?.gamblesysname || '';

            gambleUserName = decodedData.userRuleName || '';
            userRuleId = decodedData.userRuleId || null;
            userRule = decodedData.userRule || null;

        } else if (decodedData.id) {
            // 编辑模式 - 直接使用配置对象
            gambleSysName = decodedData.gambleSysName;
            gambleUserName = decodedData.gambleUserName;
            userRuleId = decodedData.userRuleId;

        } else {
            // 从系统规则进入（新增）
            gambleSysName = decodedData.gambleSysName || '';
            gambleUserName = decodedData.gambleSysName || '';
            userRuleId = null;
        }

        return {
            gambleSysName,
            gambleUserName,
            userRuleId,
            userRule
        };
    }



    /**
     * 验证配置数据
     * @param {Object} config 配置数据
     * @param {Array} players 玩家数组
     * @returns {Object} 验证结果 {valid: boolean, errors: Array}
     */
    validateConfig(config, players) {
        const errors = [];

        console.log('[ConfigManager] 验证配置数据:', config);

        // 验证分组配置
        if (config.bootstrap_order) {
            const playersOrderCount = config.bootstrap_order.length;
            if (playersOrderCount !== players.length) {
                errors.push('玩家顺序数量与总人数不符');
            }

            // 验证所有玩家ID都存在 - 使用与 normalizePlayer 一致的字段名处理
            const playerIds = players.map(p => Number.parseInt(p.userid));
            const allPlayersIncluded = config.bootstrap_order.every(id =>
                playerIds.includes(Number.parseInt(id))
            );

            if (!allPlayersIncluded) {
                errors.push('玩家顺序配置有误');
            }
        }

        // 验证分组方式
        if (!config.red_blue_config) {
            errors.push('请选择分组方式');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * 准备保存的配置数据
     * @param {Object} runtimeConfig 运行时配置
     * @param {boolean} isEdit 是否为编辑模式
     * @param {string} configId 配置ID（编辑模式）
     * @returns {Object} 准备保存的数据
     */
    prepareSaveData(runtimeConfig, isEdit, configId = '') {
        // 从 holeRangeStore 获取洞数据
        const { holeList, startHoleindex, roadLength } = holeRangeStore.getState();


        const saveData = {
            ...runtimeConfig,
            holeList,
            startHoleindex,
            roadLength,
        };



        if (isEdit) {
            saveData.id = configId;
        }


        return saveData;
    }


    /**
     * 将多个组件状态合并为完整的配置数据
     * @param {Object} componentsState - 所有组件的状态
     * @returns {Object} 完整的配置数据
     */
    mergeComponentsToConfig(componentsState) {
        const config = {};

        // 合并E8421Koufen配置
        if (componentsState.E8421Koufen) {
            Object.assign(config, this.convertE8421KoufenToConfig(componentsState.E8421Koufen));
        }

        // 合并Draw8421配置
        if (componentsState.Draw8421) {
            Object.assign(config, this.convertDraw8421ToConfig(componentsState.Draw8421));
        }

        // 合并E8421Meat配置
        if (componentsState.E8421Meat) {
            Object.assign(config, this.convertE8421MeatToConfig(componentsState.E8421Meat));
        }

        return config;
    }

    /**
     * 将配置数据转换为组件状态
     * @param {Object} configData - 配置数据
     * @returns {Object} 组件状态对象
     */
    convertConfigToComponents(configData) {
        return {
            E8421Koufen: this.convertConfigToE8421Koufen(configData),
            Draw8421: this.convertConfigToDraw8421(configData),
            E8421Meat: this.convertConfigToE8421Meat(configData)
        };
    }

    // ==================== 拉丝相关方法 ====================

    /**
     * 将LasiKoufen组件状态转换为配置数据
     * @param {Object} componentState - 组件状态
     * @returns {Object} 配置数据
     */
    convertLasiKoufenToConfig(componentState) {
        const { dutyConfig, PartnerDutyCondition, doubleParPlusValue, parPlusValue, strokeDiffValue } = componentState;

        // 构建扣分基线
        let badScoreBaseLine = null;
        switch (dutyConfig) {
            case 'NODUTY':
                badScoreBaseLine = 'NoSub';
                break;
            case 'Par+':
                badScoreBaseLine = `Par+${parPlusValue}`;
                break;
            case 'DoublePar+':
                badScoreBaseLine = `DoublePar+${doubleParPlusValue}`;
                break;
        }

        // 构建同伴惩罚配置
        let dutyConfigValue = null;
        switch (PartnerDutyCondition) {
            case 'DUTY_DINGTOU':
                dutyConfigValue = 'DUTY_DINGTOU';
                break;
            case 'DUTY_PAR':
                dutyConfigValue = `Par+${parPlusValue}`;
                break;
            case 'DUTY_DOUBLE_PAR':
                dutyConfigValue = `DoublePar+${doubleParPlusValue}`;
                break;
            default:
                dutyConfigValue = 'NODUTY';
        }

        return {
            badScoreBaseLine,
            badScoreMaxLost: 10000000, // 添加默认的封顶配置
            dutyConfig: dutyConfigValue,
            PartnerDutyCondition: PartnerDutyCondition,
            customValues: {
                doubleParPlusValue,
                parPlusValue,
                strokeDiffValue
            }
        };
    }

    /**
     * 将LasiEatmeat组件状态转换为配置数据
     * @param {Object} componentState - 组件状态
     * @returns {Object} 配置数据
     */
    convertLasiEatmeatToConfig(componentState) {
        const { eatingRange, meatValueOption, meatScoreValue, topSelected, topScoreLimit } = componentState;

        // 构建肉分值配置
        let meatValue = null;
        switch (meatValueOption) {
            case 0:
                meatValue = `MEAT_AS_${meatScoreValue}`;
                break;
            case 1:
                meatValue = 'SINGLE_DOUBLE';
                break;
            case 2:
                meatValue = 'CONTINUE_DOUBLE';
                break;
            case 3:
                meatValue = 'DOUBLE_WITH_REWARD';
                break;
            case 4:
                meatValue = 'DOUBLE_WITHOUT_REWARD';
                break;
        }

        // 构建封顶配置
        const meatMaxValue = topSelected === 0 ? 10000000 : topScoreLimit;

        return {
            eatingRange,
            meatValueConfig: meatValue, // 修正字段名
            meatMaxValue
        };
    }

    /**
     * 将配置数据转换为LasiKoufen组件状态
     * @param {Object} configData - 配置数据
     * @returns {Object} 组件状态
     */
    convertConfigToLasiKoufen(configData) {
        const { badScoreBaseLine, dutyConfig, customValues } = configData;
        const state = {};

        // 解析扣分基线
        if (badScoreBaseLine === 'NoSub') {
            state.dutyConfig = 'NODUTY';
        } else if (badScoreBaseLine?.startsWith('Par+')) {
            state.dutyConfig = 'Par+';
            const score = Number.parseInt(badScoreBaseLine.replace('Par+', ''));
            state.parPlusValue = Number.isNaN(score) ? 4 : score;
        } else if (badScoreBaseLine?.startsWith('DoublePar+')) {
            state.dutyConfig = 'DoublePar+';
            const score = Number.parseInt(badScoreBaseLine.replace('DoublePar+', ''));
            state.doubleParPlusValue = Number.isNaN(score) ? 1 : score;
        } else {
            state.dutyConfig = 'NODUTY';
        }

        // 解析同伴惩罚配置
        if (dutyConfig?.startsWith('Par+')) {
            state.PartnerDutyCondition = 'DUTY_PAR';
            const score = Number.parseInt(dutyConfig.replace('Par+', ''));
            state.parPlusValue = Number.isNaN(score) ? 4 : score;
        } else if (dutyConfig?.startsWith('DoublePar+')) {
            state.PartnerDutyCondition = 'DUTY_DOUBLE_PAR';
            const score = Number.parseInt(dutyConfig.replace('DoublePar+', ''));
            state.doubleParPlusValue = Number.isNaN(score) ? 1 : score;
        } else {
            state.PartnerDutyCondition = 'DUTY_DINGTOU';
        }

        // 解析自定义值
        if (customValues) {
            state.doubleParPlusValue = customValues.doubleParPlusValue || 1;
            state.parPlusValue = customValues.parPlusValue || 4;
            state.strokeDiffValue = customValues.strokeDiffValue || 3;
        } else {
            state.doubleParPlusValue = 1;
            state.parPlusValue = 4;
            state.strokeDiffValue = 3;
        }

        return state;
    }

    /**
     * 将配置数据转换为LasiEatmeat组件状态
     * @param {Object} configData - 配置数据
     * @returns {Object} 组件状态
     */
    convertConfigToLasiEatmeat(configData) {
        const { eatingRange, meatValueConfig, meatMaxValue } = configData;
        const state = {};

        // 解析eatingRange
        if (eatingRange) {
            state.eatingRange = eatingRange;
        }

        // 解析meatValueConfig
        if (meatValueConfig?.startsWith('MEAT_AS_')) {
            state.meatValueOption = 0;
            const score = Number.parseInt(meatValueConfig.replace('MEAT_AS_', ''));
            state.meatScoreValue = Number.isNaN(score) ? 1 : score;
        } else if (meatValueConfig === 'SINGLE_DOUBLE') {
            state.meatValueOption = 1;
        } else if (meatValueConfig === 'CONTINUE_DOUBLE') {
            state.meatValueOption = 2;
        } else if (meatValueConfig === 'DOUBLE_WITH_REWARD') {
            state.meatValueOption = 3;
        } else if (meatValueConfig === 'DOUBLE_WITHOUT_REWARD') {
            state.meatValueOption = 4;
        } else {
            state.meatValueOption = 0;
            state.meatScoreValue = 1;
        }

        // 解析meatMaxValue
        const maxValue = Number(meatMaxValue);
        if (maxValue === 10000000) {
            state.topSelected = 0;
        } else {
            state.topSelected = 1;
            state.topScoreLimit = maxValue > 0 ? maxValue : 3;
        }

        return state;
    }

    // ==================== 配置保存方法 ====================

    /**
     * 收集所有组件的配置
     * @param {Object} pageContext 页面上下文
     * @param {boolean} needsStroking 是否需要让杆配置
     * @returns {Object} 收集到的配置对象
     */
    collectAllConfigs(pageContext, needsStroking = false) {
        console.log('[ConfigManager] 开始收集所有组件配置');

        const collectedConfig = {};

        // 从洞范围选择器获取配置
        const holeRangeSelector = pageContext.selectComponent('#holeRangeSelector');
        if (holeRangeSelector) {
            const holeConfig = holeRangeSelector.getConfig();
            if (holeConfig) {
                console.log('🕳️ [ConfigManager] 收集洞范围配置:', holeConfig);
                Object.assign(collectedConfig, {
                    startHoleindex: holeConfig.startHoleindex,
                    endHoleindex: holeConfig.endHoleindex,
                    roadLength: holeConfig.roadLength,
                });
            }
        }

        // 从让杆配置组件获取配置（仅在需要时）
        if (needsStroking) {
            const stroking = pageContext.selectComponent('#stroking');
            if (stroking) {
                const strokingConfig = stroking.getConfig();
                if (strokingConfig) {
                    Object.assign(collectedConfig, {
                        stroking_config: strokingConfig
                    });
                }
            }
        }

        // 从8421球员配置组件获取配置
        const playerIndicator = pageContext.selectComponent('#playerIndicator');
        if (playerIndicator) {
            const playerConfig = playerIndicator.getConfig();
            if (playerConfig) {
                Object.assign(collectedConfig, {
                    playerIndicatorConfig: playerConfig
                });
            }
        }

        // 从分组配置组件获取配置
        const redBlueConfig = pageContext.selectComponent('#redBlueConfig');
        if (redBlueConfig) {
            const groupConfig = redBlueConfig.getConfig();
            console.log('[ConfigManager] RedBlueConfig 组件配置:', groupConfig);
            if (groupConfig) {
                Object.assign(collectedConfig, {
                    red_blue_config: groupConfig.red_blue_config,
                    bootstrap_order: groupConfig.bootstrap_order
                });
            }
        } else {
            console.warn('[ConfigManager] 未找到 RedBlueConfig 组件');
        }

        // 从排名配置组件获取配置
        const rankConfig = pageContext.selectComponent('#rankConfig');
        if (rankConfig) {
            const rankingConfig = rankConfig.getConfig();
            if (rankingConfig) {
                Object.assign(collectedConfig, {
                    ranking_tie_resolve_config: rankingConfig
                });
            }
        }

        console.log('[ConfigManager] 收集配置完成，收集到的配置:', collectedConfig);
        return collectedConfig;
    }

    /**
     * 保存配置
     * @param {Object} runtimeConfig 运行时配置
     * @param {string} gameid 游戏ID
     * @param {string} groupid 分组ID
     * @param {string} configId 配置ID
     * @param {Object} pageContext 页面上下文
     * @param {boolean} isEdit 是否为编辑模式
     * @returns {Promise} 保存结果
     */
    async saveGambleConfig(runtimeConfig, gameid, groupid, configId, pageContext, isEdit = false) {
        try {
            const saveData = this.prepareSaveData(runtimeConfig, isEdit, configId);

            pageContext.setData({ loading: true });

            const app = getApp();
            const apiMethod = isEdit ? 'updateRuntimeConfig' : 'addRuntimeConfig';
            const res = await app.api.gamble[apiMethod](saveData);

            if (res.code === 200) {
                wx.showToast({
                    title: isEdit ? '配置更新成功' : '配置保存成功',
                    icon: 'success'
                });

                setTimeout(() => {
                    wx.redirectTo({
                        url: `/pages/gameDetail/gameDetail?gameid=${gameid}&groupid=${groupid}&tab=2`
                    });
                }, 300);

                return { success: true };
            }

            wx.showToast({
                title: isEdit ? '配置更新失败' : '配置保存失败',
                icon: 'none'
            });

            return { success: false, error: res.message || '保存失败' };
        } catch (error) {
            console.error('[ConfigManager] 保存配置失败:', error);
            wx.showToast({
                title: '保存失败，请重试',
                icon: 'none'
            });

            return { success: false, error: error.message };
        } finally {
            // 无论成功还是失败，都要重置loading状态
            pageContext.setData({ loading: false });
        }
    }
}

// 创建单例实例
const configManager = new ConfigManager();

// 导出单例实例
module.exports = configManager;

// 导出兼容接口，保持向后兼容
module.exports.ConfigManager = ConfigManager;
module.exports.ConfigConverter = configManager;
module.exports.ConfigParser = configManager;
module.exports.ConfigDataProcessor = configManager; 