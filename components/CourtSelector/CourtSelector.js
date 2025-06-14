const app = getApp()

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        // 球场ID
        courseid: {
            type: String,
            value: ''
        },
        // 球场信息
        courseInfo: {
            type: Object,
            value: null
        },
        // 是否显示球场信息
        showCourseInfo: {
            type: Boolean,
            value: true
        },
        // 标题文本
        title: {
            type: String,
            value: '选择半场'
        },
        // 价格标签文本
        priceLabel: {
            type: String,
            value: '价格'
        },
        // 确认按钮文本
        confirmText: {
            type: String,
            value: '确认选择'
        },
        // 是否显示确认按钮
        showConfirmButton: {
            type: Boolean,
            value: true
        },
        // 选中图标路径
        checkIcon: {
            type: String,
            value: '/assets/icons/check.svg'
        },
        // 自定义半场选项
        customCourtOptions: {
            type: Array,
            value: []
        },
        // 价格倍数（根据球场等级调整）
        priceMultiplier: {
            type: Number,
            value: 1
        },
        // 初始选中的半场
        initialSelection: {
            type: String,
            value: ''
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        loading: true,
        courseDetail: null, // 球场详细信息
        courts: [], // 半场列表
        selectedFrontNine: '', // 选中的前九洞
        selectedBackNine: '', // 选中的后九洞
        frontNineHoles: [], // 前九洞的洞信息
        backNineHoles: [] // 后九洞的洞信息
    },

    /**
 * 组件生命周期
 */
    lifetimes: {
        attached: function () {
            console.log('CourtSelector  ❤️❤️❤️ 组件已挂载')
            this.initComponent()
        },

        detached: function () {
            console.log('CourtSelector组件已卸载')
        }
    },

    /**
     * 监听属性变化
     */
    observers: {
        'courseid': function (courseid) {
            console.log('courseid 变化 ❤️❤️❤️:', courseid)
            if (courseid) {
                this.loadCourseDetail(courseid)
            }
        },
        'courseInfo': function (courseInfo) {
            console.log('courseInfo 变化 ❤️❤️❤️:', courseInfo)
            if (courseInfo?.courseid && !this.properties.courseid) {
                console.log('通过 courseInfo 获取到 courseid ❤️❤️❤️:', courseInfo.courseid)
                this.loadCourseDetail(courseInfo.courseid)
            }
        },
        'courseInfo, priceMultiplier, customCourtOptions': function (courseInfo, priceMultiplier, customCourtOptions) {
            this.updateCourtOptions()
        },
        'initialSelection': function (initialSelection) {
            if (initialSelection) {
                this.setData({
                    selectedFrontNine: initialSelection
                })
            }
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
            console.log('initComponent ❤️❤️❤️❤️', this.properties)
            const { courseid, courseInfo } = this.properties

            if (courseid) {
                console.log('使用 courseid 参数 ❤️❤️❤️:', courseid)
                this.loadCourseDetail(courseid)
            } else if (courseInfo?.courseid) {
                console.log('使用 courseInfo.courseid ❤️❤️❤️:', courseInfo.courseid)
                this.loadCourseDetail(courseInfo.courseid)
            } else {
                console.log('CourtSelector: 等待数据传入 ❤️❤️❤️', {
                    courseid,
                    courseInfo
                })
                // 不报错，等待 observers 监听到数据变化
            }
        },

        /**
         * 加载球场详细信息
         */
        async loadCourseDetail(courseid) {
            this.setData({ loading: true })

            try {
                console.log('开始加载球场详细信息:', courseid)
                const res = await app.api.course.getCourseDetail({ courseid })
                console.log('球场详细信息:', res)

                if (res.code === 200) {
                    this.setData({
                        courseDetail: res.course,
                        courts: res.courts || [],
                        loading: false
                    })

                    // 触发数据加载完成事件
                    this.triggerEvent('dataLoaded', {
                        course: res.course,
                        courts: res.courts
                    })
                } else {
                    throw new Error(res.message || '获取球场信息失败')
                }

            } catch (error) {
                console.error('加载球场详细信息失败:', error)
                this.setData({ loading: false })

                // 触发错误事件
                this.triggerEvent('error', {
                    type: 'loadCourseDetail',
                    error: error,
                    message: '获取球场信息失败'
                })
            }
        },

        /**
         * 选择前九洞
         */
        onSelectFrontNine(e) {
            const court = e.currentTarget.dataset.court
            console.log('选择前九洞:', court)

            this.setData({
                selectedFrontNine: court.courtid,
                frontNineHoles: court.courtholes || []
            })

            // 触发前九洞选择事件
            this.triggerEvent('selectFrontNine', {
                court: court,
                holes: court.courtholes || []
            })

            this.checkSelectionComplete()
        },

        /**
         * 选择后九洞
         */
        onSelectBackNine(e) {
            const court = e.currentTarget.dataset.court
            console.log('选择后九洞:', court)

            this.setData({
                selectedBackNine: court.courtid,
                backNineHoles: court.courtholes || []
            })

            // 触发后九洞选择事件
            this.triggerEvent('selectBackNine', {
                court: court,
                holes: court.courtholes || []
            })

            this.checkSelectionComplete()
        },

        /**
         * 检查选择是否完成
         */
        checkSelectionComplete() {
            const { selectedFrontNine, selectedBackNine } = this.data

            if (selectedFrontNine && selectedBackNine) {
                // 触发选择完成事件
                this.triggerEvent('selectionComplete', {
                    frontNine: this.getCourtById(selectedFrontNine),
                    backNine: this.getCourtById(selectedBackNine),
                    frontNineHoles: this.data.frontNineHoles,
                    backNineHoles: this.data.backNineHoles
                })
            }
        },

        /**
         * 根据ID获取半场信息
         */
        getCourtById(courtid) {
            return this.data.courts.find(court => court.courtid === courtid)
        },

        /**
         * 更新半场选项
         */
        updateCourtOptions() {
            let options = []

            // 使用自定义选项或默认选项
            if (this.properties.customCourtOptions?.length > 0) {
                options = [...this.properties.customCourtOptions]
            } else {
                options = [...this.data.courts]
            }

            // 根据价格倍数调整价格
            const priceMultiplier = this.properties.priceMultiplier || 1
            if (priceMultiplier !== 1) {
                options = options.map(option => ({
                    ...option,
                    price: Math.round(option.price * priceMultiplier)
                }))
            }

            // 根据球场信息动态调整（如果需要）
            const { courseInfo } = this.properties
            if (courseInfo?.level) {
                let levelMultiplier = 1
                if (courseInfo.level === 'premium') {
                    levelMultiplier = 1.5
                } else if (courseInfo.level === 'luxury') {
                    levelMultiplier = 2
                }

                if (levelMultiplier !== 1) {
                    options = options.map(option => ({
                        ...option,
                        price: Math.round(option.price * levelMultiplier)
                    }))
                }
            }

            this.setData({
                courts: options
            })
        },

        /**
         * 确认选择
         */
        onConfirm() {
            const { selectedFrontNine, selectedBackNine, courseDetail } = this.data

            if (!selectedFrontNine || !selectedBackNine) {
                // 触发错误事件
                this.triggerEvent('error', {
                    type: 'incompleteSelection',
                    message: '请选择前九洞和后九洞'
                })
                return
            }

            const frontNineCourt = this.getCourtById(selectedFrontNine)
            const backNineCourt = this.getCourtById(selectedBackNine)

            // 组合完整的选择信息
            const selectionData = {
                course: courseDetail,
                frontNine: frontNineCourt,
                backNine: backNineCourt,
                frontNineHoles: this.data.frontNineHoles,
                backNineHoles: this.data.backNineHoles,
                timestamp: Date.now()
            }

            console.log('CourtSelector确认选择:', selectionData)

            // 触发确认事件
            this.triggerEvent('confirm', {
                selectionData: selectionData
            })
        },

        /**
         * 清空选择
         */
        clearSelection() {
            this.setData({
                selectedFrontNine: '',
                selectedBackNine: '',
                frontNineHoles: [],
                backNineHoles: []
            })

            // 触发清空事件
            this.triggerEvent('clear')
        },

        /**
         * 设置选中的半场（外部调用）
         */
        setSelection(value) {
            this.setData({
                selectedFrontNine: value
            })
        },

        /**
         * 获取当前选择
         */
        getSelection() {
            const { selectedFrontNine, selectedBackNine } = this.data
            if (!selectedFrontNine || !selectedBackNine) return null

            return this.getCourtById(selectedFrontNine)
        },

        /**
         * 更新球场信息（外部调用）
         */
        updateCourseInfo(courseInfo) {
            this.setData({
                courseInfo: courseInfo
            })
            this.updateCourtOptions()
        },

        /**
         * 刷新数据（外部调用）
         */
        refreshData() {
            const { courseid, courseInfo } = this.properties
            const targetCourseid = courseid || courseInfo?.courseid

            if (targetCourseid) {
                this.loadCourseDetail(targetCourseid)
            }
        }
    }
}) 