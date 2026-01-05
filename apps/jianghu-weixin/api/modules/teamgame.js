import request from '../request-simple'

const teamgame = {
    // ==================== Phase 1: 赛事创建与配置 ====================
    // 创建队内赛
    createTeamGame: (data, options) => request('/TeamGame/createTeamGame', data, options),
    // 更新队内赛信息
    updateTeamGame: (data, options) => request('/TeamGame/updateTeamGame', data, options),
    // 添加分队
    addSubteam: (data, options) => request('/TeamGame/addSubteam', data, options),
    // 更新分队
    updateSubteam: (data, options) => request('/TeamGame/updateSubteam', data, options),
    // 删除分队
    deleteSubteam: (data, options) => request('/TeamGame/deleteSubteam', data, options),
    // 获取分队列表
    getSubteams: (data, options) => request('/TeamGame/getSubteams', data, options),

    // ==================== Phase 2: 报名管理 ====================
    // 球员报名
    registerGame: (data, options) => request('/TeamGame/registerGame', data, options),
    // 取消报名
    cancelRegistration: (data, options) => request('/TeamGame/cancelRegistration', data, options),
    // 获取报名列表
    getRegistrations: (data, options) => request('/TeamGame/getRegistrations', data, options),
    // 审批通过
    approveRegistration: (data, options) => request('/TeamGame/approveRegistration', data, options),
    // 审批拒绝
    rejectRegistration: (data, options) => request('/TeamGame/rejectRegistration', data, options),

    // ==================== Phase 3: 分组管理 ====================
    // 管理员分组
    assignGroups: (data, options) => request('/TeamGame/assignGroups', data, options),
    // 球员选择分组
    joinGroup: (data, options) => request('/TeamGame/joinGroup', data, options),
    // 获取分组详情
    getGroups: (data, options) => request('/TeamGame/getGroups', data, options),
    // 创建空分组
    createGroup: (data, options) => request('/TeamGame/createGroup', data, options),

    // ==================== Phase 4: 状态与流程控制 ====================
    // 更新赛事状态
    updateGameStatus: (data, options) => request('/TeamGame/updateGameStatus', data, options),
    // 开启报名
    startRegistration: (data, options) => request('/TeamGame/startRegistration', data, options),
    // 截止报名
    closeRegistration: (data, options) => request('/TeamGame/closeRegistration', data, options),
    // 开始比赛
    startGame: (data, options) => request('/TeamGame/startGame', data, options),
    // 结束比赛
    finishGame: (data, options) => request('/TeamGame/finishGame', data, options),
    // 取消比赛
    cancelGame: (data, options) => request('/TeamGame/cancelGame', data, options),

    // ==================== Phase 5: 查询与结果 ====================
    // 获取队内赛详情
    getTeamGameDetail: (data, options) => request('/TeamGame/getTeamGameDetail', data, options),
    // 获取球队赛事列表
    getTeamGameList: (data, options) => request('/TeamGame/getTeamGameList', data, options),
    // 获取分队成绩
    getSubteamScores: (data, options) => request('/TeamGame/getSubteamScores', data, options),
    // 获取比洞赛结果
    getMatchResults: (data, options) => request('/TeamGame/getMatchResults', data, options),
    // 获取我的报名状态
    getMyRegistration: (data, options) => request('/TeamGame/getMyRegistration', data, options),
    // 修改我的分队
    changeMySubteam: (data, options) => request('/TeamGame/changeMySubteam', data, options),
}

export default teamgame

