/**
 * 游戏组管理工具函数
 * 提供游戏组中用户的添加、检查、管理等功能
 */

/**
 * 检查用户是否已存在于任何组中
 * @param {string|number} userid - 用户ID
 * @param {Array} gameGroups - 游戏组数据
 * @returns {Object|null} 返回用户所在的组信息, 如果不存在返回null
 */
export const findUserInGroups = (userid, gameGroups) => {
    const userIdStr = userid.toString();

    for (let groupIndex = 0; groupIndex < gameGroups.length; groupIndex++) {
        const group = gameGroups[groupIndex];
        if (group?.players) {
            const foundPlayer = group.players.find(player =>
                player !== null && player.userid.toString() === userIdStr
            );
            if (foundPlayer) {
                return {
                    groupIndex,
                    groupNumber: groupIndex + 1,
                    player: foundPlayer
                };
            }
        }
    }
    return null;
};

/**
 * 获取所有组中的用户映射
 * @param {Array} gameGroups - 游戏组数据
 * @returns {Object} 返回用户ID到组号的映射
 */
export const getUserGroupMap = (gameGroups) => {
    const userGroupMap = {};
    const allUserIds = [];

    for (const [index, group] of gameGroups.entries()) {
        if (group?.players) {
            for (const player of group.players.filter(player => player !== null)) {
                const userId = player.userid.toString();
                allUserIds.push(userId);
                userGroupMap[userId] = index + 1; // 记录用户在第几组(从1开始)
            }
        }
    }

    return { userGroupMap, allUserIds };
};

/**
 * 过滤重复用户
 * @param {Array} players - 待添加的用户列表
 * @param {Array} gameGroups - 游戏组数据
 * @param {number} targetGroupIndex - 目标组索引
 * @returns {Object} 返回过滤结果和统计信息
 */
export const filterDuplicateUsers = (players, gameGroups, targetGroupIndex) => {
    const { userGroupMap } = getUserGroupMap(gameGroups);
    const duplicateInfo = [];

    const newPlayers = players.filter(player => {
        const userId = player.userid.toString();
        const existingGroupIndex = userGroupMap[userId];

        if (existingGroupIndex) {
            const duplicateType = existingGroupIndex === targetGroupIndex + 1 ? 'same-group' : 'cross-group';
            duplicateInfo.push({
                player,
                existingGroupNumber: existingGroupIndex,
                type: duplicateType
            });

            console.log(`⚠️ 用户 ${player.nickname} (ID: ${userId}) 已在第${existingGroupIndex}组中, 跳过`);
            return false;
        }
        return true;
    });

    return {
        newPlayers,
        duplicateCount: duplicateInfo.length,
        duplicateInfo
    };
};

/**
 * 通用的追加玩家到组的方法
 * @param {Array} players - 待添加的玩家列表
 * @param {number} groupIndex - 目标组索引
 * @param {string} sourceType - 来源类型(如:'好友'、'手工添加用户'等)
 * @param {Array} gameGroups - 当前游戏组数据
 * @param {number} maxPlayers - 每组最大玩家数, 默认4
 * @returns {Object} 返回更新结果和统计信息
 */
export const appendPlayersToGroup = (players, groupIndex, sourceType, gameGroups, maxPlayers = 4) => {
    console.log(`📥 准备追加${sourceType}到第${groupIndex + 1}组:`, players);

    // 创建新的游戏组数据副本
    const updatedGameGroups = [...gameGroups];

    // 确保组存在
    if (!updatedGameGroups[groupIndex]) {
        updatedGameGroups[groupIndex] = { players: [] };
    }

    // 过滤掉null值, 获取当前已有的真实玩家
    const currentPlayers = updatedGameGroups[groupIndex].players.filter(player => player !== null);
    console.log(`📊 第${groupIndex + 1}组当前已有 ${currentPlayers.length} 名玩家:`, currentPlayers);

    // 过滤重复用户
    const { newPlayers, duplicateCount, duplicateInfo } = filterDuplicateUsers(players, updatedGameGroups, groupIndex);

    console.log(`🔄 过滤重复用户后, ${newPlayers.length} 名用户待添加, ${duplicateCount} 名重复用户被跳过`);

    // 如果没有新用户需要添加
    if (newPlayers.length === 0) {
        const message = duplicateCount > 0
            ? `所有${sourceType}已在其他组中, 无法重复添加`
            : `没有${sourceType}需要添加`;

        return {
            success: false,
            message,
            gameGroups: gameGroups, // 返回原数据, 无变化
            statistics: {
                added: 0,
                duplicateSkipped: duplicateCount,
                capacitySkipped: 0,
                totalSkipped: duplicateCount
            }
        };
    }

    // 计算可以添加的玩家数量(每组最多指定数量)
    const availableSlots = maxPlayers - currentPlayers.length;
    console.log(`🎯 第${groupIndex + 1}组还可以添加 ${availableSlots} 名玩家`);

    if (availableSlots <= 0) {
        return {
            success: false,
            message: `第${groupIndex + 1}组已满(最多${maxPlayers}人)`,
            gameGroups: gameGroups, // 返回原数据, 无变化
            statistics: {
                added: 0,
                duplicateSkipped: duplicateCount,
                capacitySkipped: newPlayers.length,
                totalSkipped: duplicateCount + newPlayers.length
            }
        };
    }

    // 取要添加的玩家(如果超过可用位置, 只取前面的)
    const playersToAdd = newPlayers.slice(0, availableSlots);
    const capacitySkippedCount = newPlayers.length - playersToAdd.length;

    // 追加玩家到现有玩家后面
    const updatedPlayers = [...currentPlayers, ...playersToAdd];
    updatedGameGroups[groupIndex].players = updatedPlayers;


    // 生成详细的成功提示信息
    let message = `已添加${playersToAdd.length}名玩家到第${groupIndex + 1}组`;

    const totalSkipped = duplicateCount + capacitySkippedCount;
    if (totalSkipped > 0) {
        const skipReasons = [];
        if (duplicateCount > 0) {
            skipReasons.push(`${duplicateCount}人已存在`);
        }
        if (capacitySkippedCount > 0) {
            skipReasons.push(`${capacitySkippedCount}人因组已满`);
        }
        message += `(${skipReasons.join(', ')}被跳过)`;
    }

    console.log(`🎉 第${groupIndex + 1}组更新完成, 当前${updatedPlayers.length}/${maxPlayers}人`);
    console.log(`📈 统计:添加${playersToAdd.length}人, 重复跨组跳过${duplicateCount}人, 容量跳过${capacitySkippedCount}人`);

    return {
        success: true,
        message,
        gameGroups: updatedGameGroups,
        statistics: {
            added: playersToAdd.length,
            duplicateSkipped: duplicateCount,
            capacitySkipped: capacitySkippedCount,
            totalSkipped: totalSkipped
        },
        addedPlayers: playersToAdd
    };
};

/**
 * 处理玩家添加到组的完整流程(通用版本)
 * 包含数据处理和UI操作指令, 适用于任何框架环境
 * @param {Array} players - 待添加的玩家列表
 * @param {number} groupIndex - 目标组索引
 * @param {string} sourceType - 来源类型
 * @param {Array} gameGroups - 当前游戏组数据
 * @param {Object} options - 配置选项
 * @returns {Object} 返回处理结果和UI操作指令
 */
export const handleAppendPlayersToGroup = (players, groupIndex, sourceType, gameGroups, options = {}) => {
    const {
        maxPlayers = 4,
        dataPath = 'formData.gameGroups', // 数据路径, 用于setData
        toastDuration = 2500
    } = options;

    // 调用核心业务逻辑
    const result = appendPlayersToGroup(players, groupIndex, sourceType, gameGroups, maxPlayers);

    // 生成UI操作指令
    const uiActions = {
        // 页面数据更新指令
        setData: result.success ? {
            [dataPath]: result.gameGroups
        } : null,

        // Toast显示指令
        showToast: {
            title: result.message,
            icon: result.success ? 'success' : 'none',
            duration: toastDuration
        },

        // 是否需要页面更新
        shouldUpdatePage: result.success,

        // 操作类型(用于不同框架的适配)
        actionType: result.success ? 'UPDATE_SUCCESS' : 'UPDATE_FAILED'
    };

    return {
        ...result, // 包含原有的业务结果
        uiActions,  // 新增UI操作指令

        // 便捷方法:直接执行微信小程序的UI操作
        executeWxActions: function (pageInstance) {
            if (this.uiActions.setData && pageInstance.setData) {
                pageInstance.setData(this.uiActions.setData);
            }

            if (this.uiActions.showToast && wx.showToast) {
                wx.showToast(this.uiActions.showToast);
            }

            return this;
        }
    };
};

/**
 * 创建适用于微信小程序页面的处理函数
 * @param {string} dataPath - 游戏组数据在页面data中的路径
 * @returns {Function} 返回绑定了特定数据路径的处理函数
 */
export const createWxPageHandler = (dataPath = 'formData.gameGroups') => {
    return function (players, groupIndex, sourceType) {
        // 获取当前页面的游戏组数据
        const gameGroups = this.data.formData.gameGroups;

        // 调用通用处理函数
        const result = handleAppendPlayersToGroup(
            players,
            groupIndex,
            sourceType,
            gameGroups,
            { dataPath }
        );

        // 执行微信小程序的UI操作
        result.executeWxActions(this);

        return result;
    };
};

/**
 * 检查游戏组数据的完整性
 * @param {Array} gameGroups - 游戏组数据
 * @returns {Object} 返回检查结果
 */
export const validateGameGroups = (gameGroups) => {
    const issues = [];
    const allUserIds = [];
    const duplicateUsers = [];

    gameGroups.forEach((group, groupIndex) => {
        if (!group || !group.players) {
            issues.push(`第${groupIndex + 1}组数据结构异常`);
            return;
        }

        const validPlayers = group.players.filter(player => player !== null);

        for (const player of validPlayers) {
            if (!player.userid) {
                issues.push(`第${groupIndex + 1}组中存在无ID用户`);
                continue;
            }

            const userId = player.userid.toString();
            if (allUserIds.includes(userId)) {
                duplicateUsers.push({
                    userId,
                    player,
                    groupNumber: groupIndex + 1
                });
            } else {
                allUserIds.push(userId);
            }
        }
    });

    return {
        isValid: issues.length === 0 && duplicateUsers.length === 0,
        issues,
        duplicateUsers,
        totalUsers: allUserIds.length
    };
}; 