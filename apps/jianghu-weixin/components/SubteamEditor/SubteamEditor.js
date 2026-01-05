/**
 * 分队编辑器组件
 * 用于队内赛的分队设置
 */
Component({
    properties: {
        // 分队列表
        subteams: {
            type: Array,
            value: []
        },
        // 是否为比洞赛（限制2队）
        isMatchPlay: {
            type: Boolean,
            value: false
        },
        // 是否必须有分队
        required: {
            type: Boolean,
            value: false
        },
        // 最少分队数
        minCount: {
            type: Number,
            value: 2
        }
    },

    data: {
        // 可选颜色列表
        colors: [
            { value: '#1976D2', name: '蓝色' },
            { value: '#D32F2F', name: '红色' },
            { value: '#388E3C', name: '绿色' },
            { value: '#F57C00', name: '橙色' },
            { value: '#7B1FA2', name: '紫色' },
            { value: '#0097A7', name: '青色' }
        ],
        // 显示颜色选择器
        showColorPicker: false,
        currentEditIndex: -1
    },

    methods: {
        /**
         * 添加分队
         */
        addSubteam() {
            const { subteams, isMatchPlay } = this.properties
            const { colors } = this.data

            // 比洞赛限制2个分队
            if (isMatchPlay && subteams.length >= 2) {
                wx.showToast({ title: '比洞赛最多2个分队', icon: 'none' })
                return
            }

            // 获取未使用的颜色
            const usedColors = subteams.map(s => s.color)
            const availableColor = colors.find(c => !usedColors.includes(c.value))?.value || colors[0].value

            // 生成分队名称
            const name = `${String.fromCharCode(65 + subteams.length)}队`

            const newSubteams = [...subteams, { name, color: availableColor }]
            
            this.triggerEvent('change', { subteams: newSubteams })
        },

        /**
         * 删除分队
         */
        deleteSubteam(e) {
            const index = e.currentTarget.dataset.index
            const { subteams, required, minCount } = this.properties

            if (required && subteams.length <= minCount) {
                wx.showToast({ title: `至少需要${minCount}个分队`, icon: 'none' })
                return
            }

            const newSubteams = subteams.filter((_, i) => i !== index)
            this.triggerEvent('change', { subteams: newSubteams })
        },

        /**
         * 分队名称输入
         */
        onNameInput(e) {
            const index = e.currentTarget.dataset.index
            const value = e.detail.value
            const newSubteams = [...this.properties.subteams]
            newSubteams[index] = { ...newSubteams[index], name: value }
            
            this.triggerEvent('change', { subteams: newSubteams })
        },

        /**
         * 打开颜色选择器
         */
        openColorPicker(e) {
            const index = e.currentTarget.dataset.index
            this.setData({
                showColorPicker: true,
                currentEditIndex: index
            })
        },

        /**
         * 选择颜色
         */
        selectColor(e) {
            const color = e.currentTarget.dataset.color
            const { currentEditIndex } = this.data
            const newSubteams = [...this.properties.subteams]
            
            if (currentEditIndex >= 0 && currentEditIndex < newSubteams.length) {
                newSubteams[currentEditIndex] = { 
                    ...newSubteams[currentEditIndex], 
                    color 
                }
                this.triggerEvent('change', { subteams: newSubteams })
            }

            this.setData({
                showColorPicker: false,
                currentEditIndex: -1
            })
        },

        /**
         * 关闭颜色选择器
         */
        closeColorPicker() {
            this.setData({
                showColorPicker: false,
                currentEditIndex: -1
            })
        }
    }
})

