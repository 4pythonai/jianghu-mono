/**
 * 比赛创建公共工具函数
 * 供普通创建、队内赛、队际赛共用
 */

/**
 * 跳转到球场选择页面
 */
export function goToCourseSelect() {
    wx.navigateTo({
        url: '/pages/course-select/course-select'
    })
}

/**
 * 生成半场显示名称
 * @param {Object} selectionData - 半场选择数据
 * @returns {string} 显示名称
 */
export function generateCourtDisplayName(selectionData) {
    if (selectionData.gameType === 'full') {
        return `${selectionData.frontNine?.courtname || '前九洞'} + ${selectionData.backNine?.courtname || '后九洞'}`
    }
    if (selectionData.gameType === 'front_nine') {
        return selectionData.frontNine?.courtname || '前九洞'
    }
    if (selectionData.gameType === 'back_nine') {
        return selectionData.backNine?.courtname || '后九洞'
    }
    return '未知半场'
}

/**
 * 清除选中的球场和半场
 * @param {Page} page - 页面实例
 */
export function clearSelectedCourse(page) {
    page.setData({
        selectedCourse: null,
        selectedCourt: null,
        courtSelection: null
    })
}

/**
 * 返回上一页
 */
export function handleBack() {
    wx.navigateBack({ delta: 1 })
}

/**
 * 基础表单验证（比赛名称+球场+开球时间）
 * @param {Object} data - 页面data对象
 * @param {Object} options - 配置选项
 * @param {boolean} options.requireName - 是否验证名称，默认true
 * @param {string} options.nameField - 名称字段名，默认'name'
 * @returns {boolean} 验证是否通过
 */
export function validateBasicInfo(data, options = {}) {
    const { selectedCourse, formData } = data
    const { requireName = true, nameField = 'name' } = options

    if (requireName && !formData[nameField]?.trim()) {
        wx.showToast({ title: '请输入比赛名称', icon: 'none' })
        return false
    }

    if (!selectedCourse) {
        wx.showToast({ title: '请选择比赛场地', icon: 'none' })
        return false
    }

    if (!formData.openTime) {
        wx.showToast({ title: '请选择比赛时间', icon: 'none' })
        return false
    }

    return true
}

/**
 * 处理球场选择回调（通用版本，不含API同步）
 * @param {Page} page - 页面实例
 * @param {Object} selectionData - 球场选择数据
 */
export function handleCourtSelection(page, selectionData) {
    const displayCourt = {
        name: generateCourtDisplayName(selectionData),
        gameType: selectionData.gameType,
        totalHoles: selectionData.totalHoles
    }

    page.setData({
        selectedCourse: selectionData.course,
        selectedCourt: displayCourt,
        courtSelection: {
            frontNineCourtId: selectionData.frontNine?.courtid || null,
            backNineCourtId: selectionData.backNine?.courtid || null,
            gameType: selectionData.gameType
        }
    })

    wx.showToast({
        title: `已选择 ${selectionData.course?.name || '球场'}`,
        icon: 'success'
    })
}

/**
 * 从缓存读取球场选择数据
 * @param {Page} page - 页面实例
 * @param {Function} setCourtSelectionFn - 设置球场选择的函数
 */
export function loadCachedCourtData(page, setCourtSelectionFn) {
    try {
        const cachedCourtData = wx.getStorageSync('selectedCourtData')
        if (cachedCourtData) {
            setCourtSelectionFn.call(page, cachedCourtData)
            wx.removeStorageSync('selectedCourtData')
        }
    } catch (error) {
        console.error('读取球场缓存失败:', error)
    }
}
