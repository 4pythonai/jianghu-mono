/**
 * 数据转换工具类
 * 用于在组件状态和配置数据之间进行转换
 */

/**
 * 将E8421Koufen组件状态转换为配置数据
 * @param {Object} componentState - 组件状态
 * @returns {Object} 配置数据
 */
export const convertE8421KoufenToConfig = (componentState) => {
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
};

/**
 * 将Draw8421组件状态转换为配置数据
 * @param {Object} componentState - 组件状态
 * @returns {Object} 配置数据
 */
export const convertDraw8421ToConfig = (componentState) => {
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
};

/**
 * 将E8421Meat组件状态转换为配置数据
 * @param {Object} componentState - 组件状态
 * @returns {Object} 配置数据
 */
export const convertE8421MeatToConfig = (componentState) => {
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
};

/**
 * 将配置数据转换为E8421Koufen组件状态
 * @param {Object} configData - 配置数据
 * @returns {Object} 组件状态
 */
export const convertConfigToE8421Koufen = (configData) => {
    const { badScoreBaseLine, badScoreMaxLost, dutyConfig } = configData;
    const state = {};

    // 解析扣分基线
    if (badScoreBaseLine === 'NoSub') {
        state.selectedStart = 2;
    } else if (badScoreBaseLine?.startsWith('Par+')) {
        state.selectedStart = 0;
        const score = parseInt(badScoreBaseLine.replace('Par+', ''));
        state.paScore = isNaN(score) ? 4 : score;
    } else if (badScoreBaseLine?.startsWith('DoublePar+')) {
        state.selectedStart = 1;
        const score = parseInt(badScoreBaseLine.replace('DoublePar+', ''));
        state.doubleParScore = isNaN(score) ? 0 : score;
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
};

/**
 * 将配置数据转换为Draw8421组件状态
 * @param {Object} configData - 配置数据
 * @returns {Object} 组件状态
 */
export const convertConfigToDraw8421 = (configData) => {
    const { drawConfig } = configData;
    const state = {};

    if (drawConfig === 'DrawEqual') {
        state.selected = 0;
    } else if (drawConfig === 'NoDraw') {
        state.selected = 2;
    } else if (drawConfig?.startsWith('Diff_')) {
        state.selected = 1;
        const score = parseInt(drawConfig.replace('Diff_', ''));
        state.selectedDiffScore = isNaN(score) ? 1 : score;
    } else {
        state.selected = 0;
        state.selectedDiffScore = 1;
    }

    return state;
};

/**
 * 将配置数据转换为E8421Meat组件状态
 * @param {Object} configData - 配置数据
 * @returns {Object} 组件状态
 */
export const convertConfigToE8421Meat = (configData) => {
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
};

/**
 * 将LasiKoufen组件状态转换为配置数据
 * @param {Object} componentState - 组件状态
 * @returns {Object} 配置数据
 */
export const convertLasiKoufenToConfig = (componentState) => {
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
};

/**
 * 将LasiEatmeat组件状态转换为配置数据
 * @param {Object} componentState - 组件状态
 * @returns {Object} 配置数据
 */
export const convertLasiEatmeatToConfig = (componentState) => {
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
};

/**
 * 将配置数据转换为LasiKoufen组件状态
 * @param {Object} configData - 配置数据
 * @returns {Object} 组件状态
 */
export const convertConfigToLasiKoufen = (configData) => {
    const { badScoreBaseLine, dutyConfig, customValues } = configData;
    const state = {};

    // 解析扣分基线
    if (badScoreBaseLine === 'NoSub') {
        state.dutyConfig = 'NODUTY';
    } else if (badScoreBaseLine?.startsWith('Par+')) {
        state.dutyConfig = 'Par+';
        const score = parseInt(badScoreBaseLine.replace('Par+', ''));
        state.parPlusValue = isNaN(score) ? 4 : score;
    } else if (badScoreBaseLine?.startsWith('DoublePar+')) {
        state.dutyConfig = 'DoublePar+';
        const score = parseInt(badScoreBaseLine.replace('DoublePar+', ''));
        state.doubleParPlusValue = isNaN(score) ? 1 : score;
    } else {
        state.dutyConfig = 'NODUTY';
    }

    // 解析同伴惩罚配置
    if (dutyConfig?.startsWith('Par+')) {
        state.PartnerDutyCondition = 'DUTY_PAR';
        const score = parseInt(dutyConfig.replace('Par+', ''));
        state.parPlusValue = isNaN(score) ? 4 : score;
    } else if (dutyConfig?.startsWith('DoublePar+')) {
        state.PartnerDutyCondition = 'DUTY_DOUBLE_PAR';
        const score = parseInt(dutyConfig.replace('DoublePar+', ''));
        state.doubleParPlusValue = isNaN(score) ? 1 : score;
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
};

/**
 * 将配置数据转换为LasiEatmeat组件状态
 * @param {Object} configData - 配置数据
 * @returns {Object} 组件状态
 */
export const convertConfigToLasiEatmeat = (configData) => {
    const { eatingRange, meatValue, meatMaxValue } = configData;
    const state = {};

    // 解析eatingRange
    if (eatingRange) {
        state.eatingRange = eatingRange;
    }

    // 解析meatValue
    if (meatValue?.startsWith('MEAT_AS_')) {
        state.meatValueOption = 0;
        const score = parseInt(meatValue.replace('MEAT_AS_', ''));
        state.meatScoreValue = isNaN(score) ? 1 : score;
    } else if (meatValue === 'SINGLE_DOUBLE') {
        state.meatValueOption = 1;
    } else if (meatValue === 'CONTINUE_DOUBLE') {
        state.meatValueOption = 2;
    } else if (meatValue === 'DOUBLE_WITH_REWARD') {
        state.meatValueOption = 3;
    } else if (meatValue === 'DOUBLE_WITHOUT_REWARD') {
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
};

/**
 * 将多个组件状态合并为完整的配置数据
 * @param {Object} componentsState - 所有组件的状态
 * @returns {Object} 完整的配置数据
 */
export const mergeComponentsToConfig = (componentsState) => {
    const config = {};

    // 合并E8421Koufen配置
    if (componentsState.E8421Koufen) {
        Object.assign(config, convertE8421KoufenToConfig(componentsState.E8421Koufen));
    }

    // 合并Draw8421配置
    if (componentsState.Draw8421) {
        Object.assign(config, convertDraw8421ToConfig(componentsState.Draw8421));
    }

    // 合并E8421Meat配置
    if (componentsState.E8421Meat) {
        Object.assign(config, convertE8421MeatToConfig(componentsState.E8421Meat));
    }

    return config;
};

/**
 * 将多个组件状态合并为完整的配置数据（扩展版）
 * @param {Object} componentsState - 所有组件的状态
 * @returns {Object} 完整的配置数据
 */
export const mergeAllComponentsToConfig = (componentsState) => {
    const config = {};

    // 合并8421组件配置
    if (componentsState.E8421Koufen) {
        Object.assign(config, convertE8421KoufenToConfig(componentsState.E8421Koufen));
    }
    if (componentsState.Draw8421) {
        Object.assign(config, convertDraw8421ToConfig(componentsState.Draw8421));
    }
    if (componentsState.E8421Meat) {
        Object.assign(config, convertE8421MeatToConfig(componentsState.E8421Meat));
    }

    // 合并lasi组件配置
    if (componentsState.LasiKoufen) {
        Object.assign(config, convertLasiKoufenToConfig(componentsState.LasiKoufen));
    }
    if (componentsState.LasiEatmeat) {
        Object.assign(config, convertLasiEatmeatToConfig(componentsState.LasiEatmeat));
    }

    return config;
};

/**
 * 将配置数据转换为组件状态
 * @param {Object} configData - 配置数据
 * @returns {Object} 组件状态对象
 */
export const convertConfigToComponents = (configData) => {
    return {
        E8421Koufen: convertConfigToE8421Koufen(configData),
        Draw8421: convertConfigToDraw8421(configData),
        E8421Meat: convertConfigToE8421Meat(configData)
    };
};

/**
 * 将配置数据转换为所有组件状态（扩展版）
 * @param {Object} configData - 配置数据
 * @returns {Object} 组件状态对象
 */
export const convertConfigToAllComponents = (configData) => {
    return {
        // 8421组件
        E8421Koufen: convertConfigToE8421Koufen(configData),
        Draw8421: convertConfigToDraw8421(configData),
        E8421Meat: convertConfigToE8421Meat(configData),

        // lasi组件
        LasiKoufen: convertConfigToLasiKoufen(configData),
        LasiEatmeat: convertConfigToLasiEatmeat(configData)
    };
};

// 导出所有转换方法
export const ConfigConverter = {
    // 8421组件状态转配置数据
    convertE8421KoufenToConfig,
    convertDraw8421ToConfig,
    convertE8421MeatToConfig,

    // lasi组件状态转配置数据
    convertLasiKoufenToConfig,
    convertLasiEatmeatToConfig,

    // 合并方法
    mergeComponentsToConfig,
    mergeAllComponentsToConfig,

    // 8421配置数据转组件状态
    convertConfigToE8421Koufen,
    convertConfigToDraw8421,
    convertConfigToE8421Meat,

    // lasi配置数据转组件状态
    convertConfigToLasiKoufen,
    convertConfigToLasiEatmeat,

    // 转换方法
    convertConfigToComponents,
    convertConfigToAllComponents
}; 