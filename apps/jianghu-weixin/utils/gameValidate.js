/**
     * 表单验证
     */


export const validateForm = (data) => {
    const { formData, selectedCourse, selectedCourt } = data;

    // 验证球场选择
    if (!selectedCourse) {
        wx.showToast({
            title: '请先选择球场',
            icon: 'none'
        });
        return false;
    }

    if (!selectedCourt) {
        wx.showToast({
            title: '请先选择半场',
            icon: 'none'
        });
        return false;
    }

    // 验证比赛名称
    if (!formData.gameName.trim()) {
        wx.showToast({
            title: '请填写比赛名称',
            icon: 'none'
        });
        return false;
    }

    // 验证开球时间
    if (!formData.openTime) {
        wx.showToast({
            title: '请选择开球时间',
            icon: 'none'
        });
        return false;
    }

    // 验证参赛组别和玩家
    const hasValidGroup = formData.gameGroups.some(group =>
        group.players && group.players.length > 0
    );

    if (!hasValidGroup) {
        wx.showToast({
            title: '请至少添加一名参赛玩家',
            icon: 'none'
        });
        return false;
    }

    // 验证私密比赛密码
    if (formData.isPrivate && !formData.password.trim()) {
        wx.showToast({
            title: '私密比赛需要设置密码',
            icon: 'none'
        });
        return false;
    }

    return true;
}