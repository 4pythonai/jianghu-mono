// team.js
// 导入 API 模块
const app = getApp()
const api = app.globalData.api
const { ApiUrls, config } = require('../../api/config.js')

Page({
    data: {
        teamList: [],
        loading: false,
        page: 1,
        pageSize: 10,
        hasMore: true,
        location: null,
        locationLoading: false,  // 添加位置加载状态
        courseList: [], // 添加球场列表
        courseLoading: false // 添加球场加载状态
    },

    onLoad() {
        // 页面加载时自动获取位置
        this.getLocation();
    },

    getLocation() {
        // 如果正在获取位置，直接返回
        if (this.data.locationLoading) {
            return;
        }

        this.setData({ locationLoading: true });

        // 先检查位置权限
        wx.getSetting({
            success: (res) => {
                if (!res.authSetting['scope.userLocation']) {
                    // 如果没有权限，请求授权
                    wx.authorize({
                        scope: 'scope.userLocation',
                        success: () => {
                            this.startLocationRequest();
                        },
                        fail: () => {
                            // 用户拒绝授权，显示打开设置页面的对话框
                            wx.showModal({
                                title: '需要位置权限',
                                content: '请授权访问您的位置信息，以便获取当前位置',
                                confirmText: '去设置',
                                success: (modalRes) => {
                                    if (modalRes.confirm) {
                                        wx.openSetting();
                                    }
                                },
                                complete: () => {
                                    this.setData({ locationLoading: false });
                                }
                            });
                        }
                    });
                } else {
                    // 已有权限，直接获取位置
                    this.startLocationRequest();
                }
            },
            fail: () => {
                wx.showToast({
                    title: '获取权限失败',
                    icon: 'none'
                });
                this.setData({ locationLoading: false });
            }
        });
    },

    startLocationRequest() {
        wx.showLoading({
            title: '获取位置中...',
        });

        wx.getLocation({
            type: 'gcj02',
            success: (res) => {
                const { latitude, longitude } = res;

                this.setData({
                    location: {
                        latitude,
                        longitude,
                        updateTime: new Date().toLocaleString('zh-CN')
                    }
                });

                // 成功获取位置后的提示
                wx.showToast({
                    title: '位置更新成功',
                    icon: 'success',
                    duration: 1500
                });
            },
            fail: (err) => {
                console.error('获取位置失败：', err);
                this.handleLocationError('获取位置失败');
            },
            complete: () => {
                wx.hideLoading();
                this.setData({ locationLoading: false });
            }
        });
    },

    handleLocationError(errorMsg, coords = null) {
        wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
        });

        if (coords) {
            this.setData({
                location: {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    updateTime: new Date().toLocaleString('zh-CN')
                }
            });
        }

        // 显示重试按钮
        wx.showModal({
            title: '位置获取失败',
            content: '是否重试？',
            success: (res) => {
                if (res.confirm) {
                    setTimeout(() => {
                        this.getLocation();
                    }, 1000);
                }
            }
        });
    },

    // 获取最近的球场列表
    getNearestCourses() {
        // 检查是否有位置信息
        if (!this.data.location) {
            wx.showToast({
                title: '请先获取位置',
                icon: 'none'
            });
            return;
        }

        // 如果正在加载，直接返回
        if (this.data.courseLoading) {
            return;
        }

        this.setData({ courseLoading: true });

        wx.showLoading({
            title: '获取球场中...',
        });

        const { latitude, longitude } = this.data.location;

        // 调用API获取最近的球场
        wx.request({
            url: config.baseURL + ApiUrls.course.getNearstCourses,
            method: 'GET',
            data: {
                latitude,
                longitude
            },
            header: config.header,
            success: (res) => {
                console.log('获取球场响应：', res.data);
                if (res.statusCode === 200 && res.data) {
                    // 检查是否有标准的API响应格式
                    if (res.data.code === 200 && res.data.data) {
                        this.setData({
                            courseList: res.data.data
                        });
                    } else {
                        // 如果没有标准格式，直接使用返回的数据
                        this.setData({
                            courseList: Array.isArray(res.data) ? res.data : []
                        });
                    }

                    wx.showToast({
                        title: '获取球场成功',
                        icon: 'success'
                    });
                } else {
                    wx.showToast({
                        title: '获取球场失败',
                        icon: 'none'
                    });
                }
            },
            fail: (err) => {
                console.error('获取球场失败：', err);
                wx.showToast({
                    title: '获取球场失败',
                    icon: 'none'
                });
            },
            complete: () => {
                wx.hideLoading();
                this.setData({ courseLoading: false });
            }
        });
    },

    // 查看团队详情
    viewTeamDetail(e) {
        const teamId = e.currentTarget.dataset.id
        wx.navigateTo({
            url: `/pages/teamDetail/teamDetail?id=${teamId}`
        })
    }
})