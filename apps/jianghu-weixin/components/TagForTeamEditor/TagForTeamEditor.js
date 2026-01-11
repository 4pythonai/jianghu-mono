/**
 * 分队编辑器组件
 * 用于队内赛的分队设置
 */
Component({
    properties: {
        // 分队列表
        gameTags: {
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
        addGameTag() {
            const { gameTags, isMatchPlay } = this.properties
            const { colors } = this.data

            // 比洞赛限制2个分队
            if (isMatchPlay && gameTags.length >= 2) {
                wx.showToast({ title: '比洞赛最多2个分队', icon: 'none' })
                return
            }

            // 获取未使用的颜色
            const usedColors = gameTags.map(s => s.color)
            const availableColor = colors.find(c => !usedColors.includes(c.value))?.value || colors[0].value

            // 生成分队名称
            const name = `${String.fromCharCode(65 + gameTags.length)}队`

            const newGameTags = [...gameTags, { name, color: availableColor }]

            this.triggerEvent('change', { gameTags: newGameTags })
        },

        /**
         * 删除分队
         */
        deleteGameTag(e) {
            const index = e.currentTarget.dataset.index
            const { gameTags, required, minCount } = this.properties

            if (required && gameTags.length <= minCount) {
                wx.showToast({ title: `至少需要${minCount}个分队`, icon: 'none' })
                return
            }

            const newGameTags = gameTags.filter((_, i) => i !== index)
            this.triggerEvent('change', { gameTags: newGameTags })
        },

        /**
         * 分队名称输入
         */
        onNameInput(e) {
            const index = e.currentTarget.dataset.index
            const value = e.detail.value
            const newGameTags = [...this.properties.gameTags]
            newGameTags[index] = { ...newGameTags[index], name: value }

            this.triggerEvent('change', { gameTags: newGameTags })
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
            const newGameTags = [...this.properties.gameTags]

            if (currentEditIndex >= 0 && currentEditIndex < newGameTags.length) {
                newGameTags[currentEditIndex] = {
                    ...newGameTags[currentEditIndex],
                    color
                }
                this.triggerEvent('change', { gameTags: newGameTags })
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

