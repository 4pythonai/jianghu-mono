/**
 * 自定义时间选择器组件
 * 5个独立的输入框，每个输入框点击后显示滚轮选择器
 */
Component({
    properties: {
        // 当前选中的年份值
        selectedYear: {
            type: String,
            value: ''
        },
        // 当前选中的月份值
        selectedMonth: {
            type: String,
            value: ''
        },
        // 当前选中的日期值
        selectedDay: {
            type: String,
            value: ''
        },
        // 当前选中的小时值
        selectedHour: {
            type: String,
            value: ''
        },
        // 当前选中的分钟值
        selectedMinute: {
            type: String,
            value: ''
        },
        // 年份范围（可选，默认当前年份前后10年）
        yearRange: {
            type: Array,
            value: []
        },
        // 月份范围（可选，默认1-12月）
        monthRange: {
            type: Array,
            value: []
        },
        // 小时范围数据（可选，默认0-23）
        hourRange: {
            type: Array,
            value: []
        },
        // 分钟范围数据（可选，默认0-50，间隔10分钟）
        minuteRange: {
            type: Array,
            value: []
        }
    },

    data: {
        // 滚轮选择器相关
        pickerVisible: false,
        pickerType: '', // year, month, day, hour, minute
        pickerTitle: '',
        pickerRange: [],
        pickerSelectedValue: '',
        pickerScrollTop: 0,
        pickerScrollTimer: null
    },

    lifetimes: {
        attached() {
            this.initRanges();
            this.initDefaultValues();
        }
    },

    observers: {
        'selectedYear, selectedMonth': function (year, month) {
            // 当年份或月份变化时，重新生成日期范围
            if (year && month && this.data.pickerType === 'day') {
                this.generateDayRange(year, month);
            }
        }
    },

    methods: {
        /**
         * 初始化范围数据
         */
        initRanges() {
            const now = new Date();
            const currentYear = now.getFullYear();

            // 初始化年份范围
            if (!this.data.yearRange || this.data.yearRange.length === 0) {
                const years = [];
                for (let i = currentYear - 10; i <= currentYear + 10; i++) {
                    years.push({
                        label: String(i),
                        value: String(i)
                    });
                }
                this.setData({ yearRange: years });
            }

            // 初始化月份范围
            if (!this.data.monthRange || this.data.monthRange.length === 0) {
                const months = [];
                for (let i = 1; i <= 12; i++) {
                    months.push({
                        label: String(i).padStart(2, '0'),
                        value: String(i).padStart(2, '0')
                    });
                }
                this.setData({ monthRange: months });
            }

            // 初始化小时范围
            if (!this.data.hourRange || this.data.hourRange.length === 0) {
                const hours = [];
                for (let i = 0; i < 24; i++) {
                    hours.push({
                        label: String(i).padStart(2, '0'),
                        value: String(i).padStart(2, '0')
                    });
                }
                this.setData({ hourRange: hours });
            }

            // 初始化分钟范围
            if (!this.data.minuteRange || this.data.minuteRange.length === 0) {
                const minutes = [];
                for (let i = 0; i < 60; i += 10) {
                    minutes.push({
                        label: String(i).padStart(2, '0'),
                        value: String(i).padStart(2, '0')
                    });
                }
                this.setData({ minuteRange: minutes });
            }
        },

        /**
         * 初始化默认值
         */
        initDefaultValues() {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const currentDay = now.getDate();
            const currentHour = now.getHours();
            const rawMinute = now.getMinutes();

            // 分钟取整到10分钟间隔
            const onesDigit = rawMinute % 10;
            const roundedMinute = onesDigit < 5
                ? Math.floor(rawMinute / 10) * 10
                : Math.ceil(rawMinute / 10) * 10 >= 60
                    ? Math.floor(rawMinute / 10) * 10
                    : Math.ceil(rawMinute / 10) * 10;

            let needUpdate = false;
            const updates = {};

            if (!this.data.selectedYear || this.data.selectedYear === '') {
                updates.selectedYear = String(currentYear);
                needUpdate = true;
            }
            if (!this.data.selectedMonth || this.data.selectedMonth === '') {
                updates.selectedMonth = String(currentMonth).padStart(2, '0');
                needUpdate = true;
            }
            if (!this.data.selectedDay || this.data.selectedDay === '') {
                updates.selectedDay = String(currentDay).padStart(2, '0');
                needUpdate = true;
            }
            if (!this.data.selectedHour || this.data.selectedHour === '') {
                updates.selectedHour = String(currentHour).padStart(2, '0');
                needUpdate = true;
            }
            if (!this.data.selectedMinute || this.data.selectedMinute === '') {
                updates.selectedMinute = String(roundedMinute).padStart(2, '0');
                needUpdate = true;
            }

            if (needUpdate) {
                this.setData(updates);
                // 生成日期范围
                this.generateDayRange(updates.selectedYear || this.data.selectedYear, updates.selectedMonth || this.data.selectedMonth);
            }
        },

        /**
         * 根据年月生成日期范围
         */
        generateDayRange(year, month) {
            const yearNum = parseInt(year, 10);
            const monthNum = parseInt(month, 10);
            const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

            const days = [];
            for (let i = 1; i <= daysInMonth; i++) {
                days.push({
                    label: String(i).padStart(2, '0'),
                    value: String(i).padStart(2, '0')
                });
            }

            // 如果当前选中的日期超出范围，调整为该月最后一天
            const currentDay = parseInt(this.data.selectedDay, 10);
            if (currentDay > daysInMonth) {
                this.setData({ selectedDay: String(daysInMonth).padStart(2, '0') });
            }
        },

        /**
         * 输入框点击事件
         */
        onInputTap(e) {
            const { type } = e.currentTarget.dataset;
            let pickerRange = [];
            let pickerTitle = '';
            let pickerSelectedValue = '';

            switch (type) {
                case 'year':
                    pickerRange = this.data.yearRange;
                    pickerTitle = '选择年份';
                    pickerSelectedValue = this.data.selectedYear;
                    break;
                case 'month':
                    pickerRange = this.data.monthRange;
                    pickerTitle = '选择月份';
                    pickerSelectedValue = this.data.selectedMonth;
                    break;
                case 'day':
                    // 生成日期范围
                    pickerRange = this.generateDayRangeData(this.data.selectedYear, this.data.selectedMonth);
                    pickerTitle = '选择日期';
                    pickerSelectedValue = this.data.selectedDay;
                    break;
                case 'hour':
                    pickerRange = this.data.hourRange;
                    pickerTitle = '选择小时';
                    pickerSelectedValue = this.data.selectedHour;
                    break;
                case 'minute':
                    pickerRange = this.data.minuteRange;
                    pickerTitle = '选择分钟';
                    pickerSelectedValue = this.data.selectedMinute;
                    break;
            }

            this.setData({
                pickerVisible: true,
                pickerType: type,
                pickerTitle,
                pickerRange,
                pickerSelectedValue: pickerSelectedValue || pickerRange[0]?.value || ''
            });

            // 滚动到选中位置
            setTimeout(() => {
                this.scrollToSelected(pickerRange, pickerSelectedValue);
            }, 100);
        },

        /**
         * 生成日期范围数据
         */
        generateDayRangeData(year, month) {
            const yearNum = parseInt(year, 10);
            const monthNum = parseInt(month, 10);
            const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

            const days = [];
            for (let i = 1; i <= daysInMonth; i++) {
                days.push({
                    label: String(i).padStart(2, '0'),
                    value: String(i).padStart(2, '0')
                });
            }
            return days;
        },

        /**
         * 滚动到选中位置
         */
        scrollToSelected(range, selectedValue) {
            if (!range || range.length === 0) return;

            const selectedIndex = range.findIndex(item => item.value === selectedValue);
            if (selectedIndex === -1) return;

            try {
                const systemInfo = wx.getSystemInfoSync();
                const rpxToPx = systemInfo.windowWidth / 750;
                const itemHeightPx = 80 * rpxToPx;

                const calculateScrollTop = (selectedIndex, totalItems) => {
                    const firstVisibleIndex = Math.max(0, selectedIndex - 1);
                    const lastVisibleIndex = Math.min(totalItems - 1, firstVisibleIndex + 3);
                    if (lastVisibleIndex === totalItems - 1 && totalItems >= 4) {
                        return (totalItems - 4) * itemHeightPx;
                    }
                    return firstVisibleIndex * itemHeightPx;
                };

                const scrollTop = calculateScrollTop(selectedIndex, range.length);
                this.setData({ pickerScrollTop: scrollTop });
            } catch (error) {
                console.error('滚动定位失败:', error);
            }
        },

        /**
         * 滚轮滚动事件
         */
        onPickerScroll(e) {
            if (this.data.pickerScrollTimer) {
                clearTimeout(this.data.pickerScrollTimer);
            }
            const timer = setTimeout(() => {
                this.alignScrollPosition(e.detail.scrollTop);
            }, 300);
            this.setData({ pickerScrollTimer: timer });
        },

        /**
         * 滚轮滚动结束事件
         */
        onPickerScrollEnd(e) {
            if (this.data.pickerScrollTimer) {
                clearTimeout(this.data.pickerScrollTimer);
                this.setData({ pickerScrollTimer: null });
            }
            this.alignScrollPosition(e.detail.scrollTop);
        },

        /**
         * 对齐滚动位置
         */
        alignScrollPosition(currentScrollTop) {
            try {
                const systemInfo = wx.getSystemInfoSync();
                const rpxToPx = systemInfo.windowWidth / 750;
                const itemHeightPx = 80 * rpxToPx;

                const currentIndex = Math.round(currentScrollTop / itemHeightPx);
                const totalItems = this.data.pickerRange.length;

                const calculateScrollTop = (firstIndex, totalItems) => {
                    const firstVisibleIndex = Math.max(0, Math.min(firstIndex, totalItems - 4));
                    const lastVisibleIndex = Math.min(totalItems - 1, firstVisibleIndex + 3);
                    if (lastVisibleIndex === totalItems - 1 && totalItems >= 4) {
                        return (totalItems - 4) * itemHeightPx;
                    }
                    return firstVisibleIndex * itemHeightPx;
                };

                const alignedScrollTop = calculateScrollTop(currentIndex, totalItems);

                if (Math.abs(currentScrollTop - alignedScrollTop) > 2) {
                    this.setData({ pickerScrollTop: alignedScrollTop });
                }
            } catch (error) {
                console.error('对齐滚动位置失败:', error);
            }
        },

        /**
         * 滚轮选项点击事件
         */
        onPickerItemTap(e) {
            const { value } = e.currentTarget.dataset;
            this.setData({ pickerSelectedValue: value });
        },

        /**
         * 滚轮选择器确认
         */
        onPickerConfirm() {
            const { pickerType, pickerSelectedValue } = this.data;
            const updates = {};

            switch (pickerType) {
                case 'year':
                    updates.selectedYear = pickerSelectedValue;
                    // 如果日期超出范围，需要重新生成日期范围并调整日期
                    if (this.data.selectedMonth) {
                        const yearNum = parseInt(pickerSelectedValue, 10);
                        const monthNum = parseInt(this.data.selectedMonth, 10);
                        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
                        const currentDay = parseInt(this.data.selectedDay, 10);
                        if (currentDay > daysInMonth) {
                            updates.selectedDay = String(daysInMonth).padStart(2, '0');
                        }
                    }
                    break;
                case 'month':
                    updates.selectedMonth = pickerSelectedValue;
                    // 如果日期超出范围，需要重新生成日期范围并调整日期
                    if (this.data.selectedYear) {
                        const yearNum = parseInt(this.data.selectedYear, 10);
                        const monthNum = parseInt(pickerSelectedValue, 10);
                        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
                        const currentDay = parseInt(this.data.selectedDay, 10);
                        if (currentDay > daysInMonth) {
                            updates.selectedDay = String(daysInMonth).padStart(2, '0');
                        }
                    }
                    break;
                case 'day':
                    updates.selectedDay = pickerSelectedValue;
                    break;
                case 'hour':
                    updates.selectedHour = pickerSelectedValue;
                    break;
                case 'minute':
                    updates.selectedMinute = pickerSelectedValue;
                    break;
            }

            this.setData(updates);
            this.closePicker();

            // 触发change事件
            const finalYear = updates.selectedYear || this.data.selectedYear;
            const finalMonth = updates.selectedMonth || this.data.selectedMonth;
            const finalDay = updates.selectedDay || this.data.selectedDay;
            const finalHour = updates.selectedHour || this.data.selectedHour;
            const finalMinute = updates.selectedMinute || this.data.selectedMinute;

            this.triggerEvent('change', {
                year: finalYear,
                month: finalMonth,
                day: finalDay,
                hour: finalHour,
                minute: finalMinute,
                value: `${finalYear}-${finalMonth}-${finalDay} ${finalHour}:${finalMinute}`
            });
        },

        /**
         * 滚轮选择器取消
         */
        onPickerCancel() {
            this.closePicker();
        },

        /**
         * 点击遮罩层
         */
        onMaskTap() {
            this.closePicker();
        },

        /**
         * 关闭滚轮选择器
         */
        closePicker() {
            this.setData({
                pickerVisible: false,
                pickerType: '',
                pickerTitle: '',
                pickerRange: [],
                pickerSelectedValue: '',
                pickerScrollTop: 0
            });
        },

        /**
         * 阻止冒泡
         */
        noop() { }
    }
});
