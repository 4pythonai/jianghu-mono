/**
     * 表单验证
     */


export const validateForm = (data) => {
    const { formData, selectedCourse, selectedCourt } = data;

    // 验证球场选择
    if (!selectedCourse) {
        wx.showModal({
            title: '提示',
            content: '请先选择球场',
            showCancel: false,
        });
        return false;
    }

    if (!selectedCourt) {
        wx.showModal({
            title: '提示',
            content: '请先选择半场',
            showCancel: false,
        });
        return false;
    }

    // 验证比赛名称
    if (!formData.gameName.trim()) {
        wx.showModal({
            title: '提示',
            content: '请填写比赛名称',
            showCancel: false,
        });
        return false;
    }

    // 验证参赛组别和玩家
    const hasValidGroup = formData.gameGroups.some(group =>
        group.players && group.players.length > 0
    );

    if (!hasValidGroup) {
        wx.showModal({
            title: '提示',
            content: '请至少添加一名参赛玩家',
            showCancel: false,
        });
        return false;
    }

    // 验证私密比赛密码
    if (formData.isPrivate && !formData.password.trim()) {
        wx.showModal({
            title: '提示',
            content: '私密比赛需要设置密码',
            showCancel: false,
        });
        return false;
    }

    return true;
}