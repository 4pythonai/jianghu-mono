// 父页面使用Stroking组件的示例

Page({
    data: {
        // 让杆配置数据
        strokingConfig: [
            {
                userid: "张三",
                holeRanges: [7, 8, 9, 10, 11],
                PAR3: 1,
                PAR4: 0.5,
                PAR5: 0.5
            }
        ]
    },

    onLoad() {
        // 页面加载时初始化数据
        this.initGameData();
    },

    /**
     * 初始化游戏数据
     */
    initGameData() {
        // 这里应该从gameStore获取游戏数据
        // 示例数据
        const gameData = {
            players: [
                {
                    userid: "张三",
                    wx_nickname: "张三",
                    avatar: "/images/avatar1.png"
                },
                {
                    userid: "李四", 
                    wx_nickname: "李四",
                    avatar: "/images/avatar2.png"
                }
            ],
            holeList: [
                { hindex: 1, holename: "第1洞" },
                { hindex: 2, holename: "第2洞" },
                { hindex: 3, holename: "第3洞" },
                { hindex: 4, holename: "第4洞" },
                { hindex: 5, holename: "第5洞" },
                { hindex: 6, holename: "第6洞" },
                { hindex: 7, holename: "第7洞" },
                { hindex: 8, holename: "第8洞" },
                { hindex: 9, holename: "第9洞" },
                { hindex: 10, holename: "第10洞" },
                { hindex: 11, holename: "第11洞" },
                { hindex: 12, holename: "第12洞" },
                { hindex: 13, holename: "第13洞" },
                { hindex: 14, holename: "第14洞" },
                { hindex: 15, holename: "第15洞" },
                { hindex: 16, holename: "第16洞" },
                { hindex: 17, holename: "第17洞" },
                { hindex: 18, holename: "第18洞" }
            ]
        };

        // 更新gameStore数据
        // gameStore._processGameData(gameData);
    },

    /**
     * 保存让杆配置
     */
    onStrokingSave(e) {
        const { config } = e.detail;
        console.log('保存让杆配置:', config);
        
        this.setData({
            strokingConfig: config
        });

        // 显示保存成功提示
        wx.showToast({
            title: '配置已保存',
            icon: 'success',
            duration: 2000
        });

        // 这里可以将配置保存到服务器
        this.saveConfigToServer(config);
    },

    /**
     * 取消让杆配置
     */
    onStrokingCancel() {
        console.log('取消让杆配置');
        
        wx.showModal({
            title: '确认取消',
            content: '确定要取消让杆配置吗？',
            success: (res) => {
                if (res.confirm) {
                    // 返回上一页或执行其他取消操作
                    wx.navigateBack();
                }
            }
        });
    },

    /**
     * 保存配置到服务器
     */
    saveConfigToServer(config) {
        // 这里实现保存到服务器的逻辑
        console.log('保存配置到服务器:', config);
        
        // 示例API调用
        // wx.request({
        //     url: 'https://api.example.com/stroking-config',
        //     method: 'POST',
        //     data: {
        //         gameId: this.data.gameId,
        //         strokingConfig: config
        //     },
        //     success: (res) => {
        //         console.log('配置保存成功:', res.data);
        //     },
        //     fail: (err) => {
        //         console.error('配置保存失败:', err);
        //         wx.showToast({
        //             title: '保存失败',
        //             icon: 'error'
        //         });
        //     }
        // });
    },

    /**
     * 查看当前配置
     */
    viewCurrentConfig() {
        console.log('当前让杆配置:', this.data.strokingConfig);
        
        // 显示配置详情
        let configText = '当前让杆配置：\n\n';
        this.data.strokingConfig.forEach((config, index) => {
            configText += `${index + 1}. 用户: ${config.userid}\n`;
            configText += `   洞范围: 第${config.holeRanges[0]}洞 - 第${config.holeRanges[config.holeRanges.length - 1]}洞\n`;
            configText += `   PAR3: ${config.PAR3}, PAR4: ${config.PAR4}, PAR5: ${config.PAR5}\n\n`;
        });

        wx.showModal({
            title: '让杆配置详情',
            content: configText,
            showCancel: false
        });
    }
}); 