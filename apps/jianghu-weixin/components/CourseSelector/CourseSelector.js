const app = getApp()

Component({
    /**
     * 组件的属性列表
     */
    properties: {

        // 是否自动聚焦
        autoFocus: {
            type: Boolean,
            value: false
        },
        // 是否显示收藏球场
        showFavorites: {
            type: Boolean,
            value: true
        },
        // 收藏球场标题
        favoritesTitle: {
            type: String,
            value: '常去的球场'
        },
        // 空状态文本
        emptyText: {
            type: String,
            value: '未找到相关球场'
        },
        // 空状态描述
        emptyDesc: {
            type: String,
            value: '请尝试其他关键词'
        },
        // 默认状态文本
        defaultText: {
            type: String,
            value: '请输入球场名称进行搜索'
        },
        // 加载状态文本
        loadingText: {
            type: String,
            value: '搜索中...'
        },
        // 是否显示调试信息
        debug: {
            type: Boolean,
            value: false
        },
        // 初始搜索值
        initialValue: {
            type: String,
            value: ''
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        searchValue: '',
        favoriteList: [],
        searchList: [],
        loading: false
    },

    /**
     * 组件生命周期
     */
    lifetimes: {
        attached() {
            this.initComponent()
        },

        detached() {
        }
    },

    /**
     * 组件方法
     */
    methods: {
        /**
         * 初始化组件
         */
        initComponent() {
            // 设置初始搜索值
            if (this.properties.initialValue) {
                this.setData({
                    searchValue: this.properties.initialValue
                })
                this.searchCourses(this.properties.initialValue)
            }

            // 获取收藏球场
            if (this.properties.showFavorites) {
                this.getFavoriteCourses()
            }
        },

        /**
         * 获取收藏球场列表
         */
        async getFavoriteCourses() {
            try {
                const res = await app.api.course.getFavorites({}, { loadingTitle: '获取收藏球场...' })
                this.setData({
                    favoriteList: res.courses || []
                })
            } catch (error) {
                console.error('获取收藏球场失败:', error)
                this.triggerEvent('error', {
                    type: 'getFavorites',
                    error: error
                })
            }
        },

        /**
         * 处理输入框输入事件
         */
        onInput(e) {
            const value = e.detail.value
            console.log('CourseSelector输入事件:', value)

            // 更新页面数据
            this.setData({
                searchValue: value
            })

            // 触发输入事件, 通知父组件
            this.triggerEvent('input', {
                value: value
            })

            // 执行搜索逻辑
            if (value?.trim()) {
                this.searchCourses(value.trim())
            } else {
                this.setData({ searchList: [] })
            }
        },

        /**
         * 搜索球场
         */
        async searchCourses(keyword) {
            if (!keyword) return

            this.setData({ loading: true })

            // 触发搜索开始事件
            this.triggerEvent('searchStart', { keyword })

            try {
                const res = await app.api.course.searchCourse({ keyword }, {
                    loadingTitle: '搜索球场中...'
                })

                this.setData({
                    searchList: res.courses || []
                })

                // 触发搜索完成事件
                this.triggerEvent('searchComplete', {
                    keyword,
                    results: res.courses || []
                })

            } catch (error) {
                // 触发搜索错误事件
                this.triggerEvent('error', {
                    type: 'search',
                    keyword,
                    error: error
                })

            } finally {
                this.setData({ loading: false })
            }
        },

        /**
         * 选择球场
         */
        onSelectCourse(e) {
            const course = e.currentTarget.dataset.course
            // 触发选择事件, 通知父组件
            this.triggerEvent('select', {
                course: course
            })
        },

        /**
         * 清空搜索
         */
        clearSearch() {
            this.setData({
                searchValue: '',
                searchList: []
            })
        },

        /**
         * 设置搜索值(外部调用)
         */
        setSearchValue(value) {
            this.setData({
                searchValue: value
            })
            if (value?.trim()) {
                this.searchCourses(value.trim())
            }
        },

        /**
         * 刷新收藏列表(外部调用)
         */
        refreshFavorites() {
            if (this.properties.showFavorites) {
                this.getFavoriteCourses()
            }
        }
    }
}) 