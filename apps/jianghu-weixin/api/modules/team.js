/**
 * 球队管理 API 模块
 */
import request from '../request-simple'

const team = {
    // ========== 球队管理 ==========

    // 创建球队
    createTeam: (data, options) => request('/Team/createTeam', data, options),

    // 更新球队信息
    updateTeam: (data, options) => request('/Team/updateTeam', data, options),

    // 获取球队详情
    getTeamDetail: (data, options) => request('/Team/getTeamDetail', data, options),

    // 获取我的球队列表
    getMyTeams: (data, options) => request('/Team/getMyTeams', data, options),

    // 搜索球队
    searchTeams: (data, options) => request('/Team/searchTeams', data, options),

    // ========== 成员管理 ==========

    // 申请加入球队
    applyToJoin: (data, options) => request('/Team/applyToJoin', data, options),

    // 审批通过入队申请
    approveJoinRequest: (data, options) => request('/Team/approveJoinRequest', data, options),

    // 拒绝入队申请
    rejectJoinRequest: (data, options) => request('/Team/rejectJoinRequest', data, options),

    // 直接拉入队员
    inviteMember: (data, options) => request('/Team/inviteMember', data, options),

    // 搜索可邀请的用户
    searchUsersToInvite: (data, options) => request('/Team/searchUsersToInvite', data, options),

    // 踢出队员
    removeMember: (data, options) => request('/Team/removeMember', data, options),

    // 获取球队成员列表
    getTeamMembers: (data, options) => request('/Team/getTeamMembers', data, options),

    // 获取待审批申请列表
    getPendingRequests: (data, options) => request('/Team/getPendingRequests', data, options),

    // ========== 权限管理 ==========

    // 设置成员角色（添加/移除管理员）
    setMemberRole: (data, options) => request('/Team/setMemberRole', data, options),

    // 转让超级管理员
    transferOwner: (data, options) => request('/Team/transferOwner', data, options),

    // 退出球队
    quitTeam: (data, options) => request('/Team/quitTeam', data, options),

    // 获取球队管理信息
    getTeamManageInfo: (data, options) => request('/Team/getTeamManageInfo', data, options),

    // 设置管理员权限
    setAdminPermissions: (data, options) => request('/Team/setAdminPermissions', data, options),
}

export default team

