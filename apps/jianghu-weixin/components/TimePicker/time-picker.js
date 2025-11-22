/**
 * 时间选择器组件
 * 支持日期+时间的二级联选择
 */
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        // 占位符文本
        placeholder: {
            type: String,
            value: '请选择开球时间'
        },
        // 已选择的时间值
        value: {
            type: String,
            value: ''
        },
        // 是否禁用
        disabled: {
            type: Boolean,
            value: false
        },
        // 日期范围天数(从今天开始)
        dayRange: {
            type: Number,
            value: 30
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        timePickerRange: [
            [], // 日期范围
            []  // 时间范围（保留用于兼容）
        ],
        hourRange: [], // 小时范围
        minuteRange: [], // 分钟范围
        timePickerValue: [0, 0], // 选择器当前值（保留用于兼容）
        selectedTime: '', // 显示的选择时间
        selectorVisible: false, // 自定义选择器弹窗显示状态
        currentSelectedDate: '', // 当前选中的日期值
        currentSelectedHour: '', // 当前选中的小时值
        currentSelectedMinute: '' // 当前选中的分钟值
    },

    /**
     * 组件的方法列表
     */
    methods: {
        /**
         * 生成日期选择器数据 - 支持过去1个月到未来1个月
         */
        generateDateRange() {
            const dates = [];
            const today = new Date();

            // 从过去30天开始, 到未来30天结束
            const startOffset = -30; // 过去30天
            const endOffset = 30;    // 未来30天

            for (let i = startOffset; i <= endOffset; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);

                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];

                // 特殊标记今天
                const isToday = i === 0;
                const todayLabel = isToday ? ' 今天' : '';

                dates.push({
                    label: `${year}年${month}月${day}日 ${weekDay}${todayLabel}`,
                    value: `${year}-${month}-${day}`,
                    isToday: isToday,
                    offset: i
                });
            }

            return dates;
        },

        /**
         * 生成时间选择器数据
         */
        generateTimeRange() {
            const times = [];
            // 生成从06:00到18:00的时间选项, 间隔30分钟（保留用于兼容）
            for (let hour = 6; hour <= 18; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                    times.push({
                        label: timeStr,
                        value: timeStr
                    });
                }
            }
            return times;
        },

        /**
         * 生成小时范围数据（0-23）
         */
        generateHourRange() {
            const hours = [];
            for (let hour = 0; hour < 24; hour++) {
                hours.push({
                    label: String(hour).padStart(2, '0'),
                    value: String(hour).padStart(2, '0')
                });
            }
            return hours;
        },

        /**
         * 生成分钟范围数据（0-50，间隔10分钟）
         */
        generateMinuteRange() {
            const minutes = [];
            for (let minute = 0; minute < 60; minute += 10) {
                minutes.push({
                    label: String(minute).padStart(2, '0'),
                    value: String(minute).padStart(2, '0')
                });
            }
            return minutes;
        },

        /**
         * 将分钟值取整到最近的10分钟间隔
         * 规则：个位数 < 5 向下取整，>= 5 向上取整
         * 例如：21 -> 20, 25 -> 30, 26 -> 30
         */
        roundMinuteToInterval(minute) {
            const onesDigit = minute % 10;

            if (onesDigit < 5) {
                // 向下取整到最近的10分钟
                return Math.floor(minute / 10) * 10;
            } else {
                // 向上取整到最近的10分钟
                const roundedUp = Math.ceil(minute / 10) * 10;
                // 如果向上取整超过60，则使用向下取整
                return roundedUp >= 60 ? Math.floor(minute / 10) * 10 : roundedUp;
            }
        },

        /**
         * 时间选择变化事件
         */
        onTimeChange(e) {
            const values = e.detail.value;
            const dateIndex = values[0];
            const timeIndex = values[1];

            const selectedDate = this.data.timePickerRange[0][dateIndex];
            const selectedTime = this.data.timePickerRange[1][timeIndex];

            if (selectedDate && selectedTime) {
                const displayTime = `${selectedDate.label} ${selectedTime.label}`;
                const valueTime = `${selectedDate.value} ${selectedTime.value}`;

                this.setData({
                    timePickerValue: values,
                    selectedTime: displayTime
                });

                console.log('🕐 时间选择器变化:', {
                    display: displayTime,
                    value: valueTime,
                    dateIndex,
                    timeIndex
                });

                // 触发父组件事件
                this.triggerEvent('change', {
                    value: valueTime,
                    display: displayTime,
                    date: selectedDate,
                    time: selectedTime,
                    indexes: values
                });
            }
        },

        /**
         * 初始化时间选择器数据
         */
        initTimePickerData() {
            const dateRange = this.generateDateRange();
            const timeRange = this.generateTimeRange(); // 保留用于兼容
            const hourRange = this.generateHourRange();
            const minuteRange = this.generateMinuteRange();

            // 获取当前时间
            const now = new Date();
            const currentHour = String(now.getHours()).padStart(2, '0');
            const rawMinute = now.getMinutes();
            const roundedMinute = this.roundMinuteToInterval(rawMinute);
            const currentMinute = String(roundedMinute).padStart(2, '0');

            // 找到今天的索引作为默认选择
            const todayIndex = dateRange.findIndex(item => item.isToday);
            const defaultDateIndex = todayIndex !== -1 ? todayIndex : 30; // 如果找不到今天, 默认选择中间位置
            const defaultTimeIndex = 0; // 保留用于兼容

            // 获取今天的日期项
            const todayDateItem = dateRange[defaultDateIndex];

            // 生成默认显示的时间文本
            const defaultTimeLabel = `${currentHour}:${currentMinute}`;
            const defaultDisplayTime = todayDateItem ? `${todayDateItem.label} ${defaultTimeLabel}` : '';

            const updates = {
                'timePickerRange[0]': dateRange,
                'timePickerRange[1]': timeRange, // 保留用于兼容
                hourRange: hourRange,
                minuteRange: minuteRange,
                'timePickerValue[0]': defaultDateIndex,
                'timePickerValue[1]': defaultTimeIndex
            };

            // 设置默认选中的日期和时间值（当天当前时间）
            if (todayDateItem) {
                updates.currentSelectedDate = todayDateItem.value;
            }
            // 设置当前小时和分钟
            updates.currentSelectedHour = currentHour;
            updates.currentSelectedMinute = currentMinute;

            // 如果没有传入 value 属性，设置默认显示时间
            if (!this.properties.value) {
                updates.selectedTime = defaultDisplayTime;
            }

            this.setData(updates);

            console.log('🚀 时间选择器组件初始化完成');
            console.log('📅 日期范围:', dateRange.length, '天 (过去30天 + 今天 + 未来30天)');
            console.log('📍 今天索引:', todayIndex, '默认选择:', defaultDateIndex);
            console.log('⏰ 小时范围:', hourRange.length, '小时');
            console.log('⏰ 分钟范围:', minuteRange.length, '分钟');
            console.log('🕐 默认时间:', currentHour + ':' + currentMinute);
            console.log('📝 默认显示:', defaultDisplayTime);

            // 如果没有传入 value 属性，自动触发 change 事件，将默认值传递给父组件
            // 这样即使用户不调整开球时间，formData.openTime 也会被设置为默认值
            if (!this.properties.value && todayDateItem) {
                const defaultValue = `${todayDateItem.value} ${currentHour}:${currentMinute}`;
                // 使用 setTimeout 确保在 setData 完成后再触发事件
                setTimeout(() => {
                    this.triggerEvent('change', {
                        value: defaultValue,
                        display: defaultDisplayTime,
                        date: todayDateItem,
                        time: { label: defaultTimeLabel, value: `${currentHour}:${currentMinute}` },
                        hour: { value: currentHour },
                        minute: { value: currentMinute },
                        indexes: [defaultDateIndex, defaultTimeIndex]
                    });
                }, 0);
            }
        },

        /**
         * 解析传入的值并设置选择器状态
         */
        parseAndSetValue(value) {
            if (!value) return;

            try {
                // 解析格式如: "2024-12-19 14:30" 或 "12月19日 周四 14:30"
                const parts = value.split(' ');
                if (parts.length >= 2) {
                    const dateStr = parts[0]; // 第一部分作为日期
                    const timeStr = parts[parts.length - 1]; // 最后一部分作为时间

                    // 在日期范围中查找匹配的索引
                    const dateIndex = this.data.timePickerRange[0].findIndex(item =>
                        item.value === dateStr
                    );

                    // 在时间范围中查找匹配的索引
                    const timeIndex = this.data.timePickerRange[1].findIndex(item =>
                        item.value === timeStr || item.label === timeStr
                    );

                    const updates = {};
                    if (dateIndex !== -1) {
                        updates['timePickerValue[0]'] = dateIndex;
                        updates.currentSelectedDate = this.data.timePickerRange[0][dateIndex].value;
                    }
                    if (timeIndex !== -1) {
                        updates['timePickerValue[1]'] = timeIndex;
                    }
                    // 解析时间字符串，提取小时和分钟
                    const timeParts = timeStr.split(':');
                    if (timeParts.length === 2) {
                        updates.currentSelectedHour = timeParts[0];
                        // 将分钟值取整到10分钟间隔
                        const rawMinute = parseInt(timeParts[1], 10);
                        const roundedMinute = this.roundMinuteToInterval(rawMinute);
                        updates.currentSelectedMinute = String(roundedMinute).padStart(2, '0');
                    }
                    updates.selectedTime = value;

                    this.setData(updates);

                    console.log('🔍 解析时间值:', {
                        原始值: value,
                        日期索引: dateIndex,
                        时间索引: timeIndex
                    });
                }
            } catch (error) {
                console.error('解析时间值失败:', error, value);
            }
        },

        /**
         * 打开自定义时间选择器
         */
        onOpenSelector() {
            if (this.properties.disabled) return;

            // 获取当前选中的日期、小时和分钟值
            let selectedDate = this.data.currentSelectedDate;
            let selectedHour = this.data.currentSelectedHour;
            let selectedMinute = this.data.currentSelectedMinute;

            // 如果没有选中值，使用默认值（当天当前时间）
            if (!selectedDate || !selectedHour || !selectedMinute) {
                const now = new Date();
                const currentHour = String(now.getHours()).padStart(2, '0');
                const rawMinute = now.getMinutes();
                const roundedMinute = this.roundMinuteToInterval(rawMinute);
                const currentMinute = String(roundedMinute).padStart(2, '0');

                // 找到今天的日期
                const todayIndex = this.data.timePickerRange[0].findIndex(item => item.isToday);
                const todayItem = todayIndex !== -1 ? this.data.timePickerRange[0][todayIndex] : null;

                if (todayItem) {
                    selectedDate = todayItem.value;
                    selectedHour = currentHour;
                    selectedMinute = currentMinute;

                    // 同时更新内部状态
                    this.setData({
                        currentSelectedDate: selectedDate,
                        currentSelectedHour: selectedHour,
                        currentSelectedMinute: selectedMinute
                    });
                }
            }

            this.setData({
                selectorVisible: true,
                currentSelectedDate: selectedDate,
                currentSelectedHour: selectedHour,
                currentSelectedMinute: selectedMinute
            });
        },

        /**
         * 自定义时间选择器确认事件
         */
        onTimeSelectorConfirm(e) {
            const { value, display, date, hour, minute, time } = e.detail;

            // 更新内部状态
            const dateIndex = this.data.timePickerRange[0].findIndex(item => item.value === date.value);
            // 为了兼容，尝试在旧的时间范围中找到匹配的时间
            const timeValue = time.value;
            const timeIndex = this.data.timePickerRange[1].findIndex(item => item.value === timeValue);

            const updates = {
                selectedTime: display,
                selectorVisible: false,
                currentSelectedDate: date.value,
                currentSelectedHour: hour.value,
                currentSelectedMinute: minute.value
            };

            if (dateIndex !== -1) {
                updates['timePickerValue[0]'] = dateIndex;
            }
            if (timeIndex !== -1) {
                updates['timePickerValue[1]'] = timeIndex;
            }

            this.setData(updates);

            console.log('🕐 自定义时间选择器确认:', {
                display: display,
                value: value,
                dateIndex,
                hour: hour.value,
                minute: minute.value
            });

            // 触发父组件事件（保持与原 picker 组件相同的接口）
            this.triggerEvent('change', {
                value: value,
                display: display,
                date: date,
                time: time,
                hour: hour,
                minute: minute,
                indexes: [dateIndex, timeIndex]
            });
        },

        /**
         * 自定义时间选择器取消事件
         */
        onTimeSelectorCancel() {
            this.setData({
                selectorVisible: false
            });
        }
    },

    /**
     * 组件生命周期
     */
    lifetimes: {
        /**
         * 组件实例刚刚被创建时执行
         */
        created() {
            console.log('⏰ TimePicker 组件创建');
        },

        /**
         * 组件实例进入页面节点树时执行
         */
        attached() {
            console.log('⏰ TimePicker 组件挂载');
            // 初始化时间选择器数据
            this.initTimePickerData();

            // 如果有初始值, 解析并设置
            if (this.properties.value) {
                this.parseAndSetValue(this.properties.value);
            }
        },

        /**
         * 组件实例被从页面节点树移除时执行
         */
        detached() {
            console.log('⏰ TimePicker 组件卸载');
        }
    },

    /**
     * 监听属性变化
     */
    observers: {
        'value': function (newValue) {
            console.log('⏰ TimePicker value 变化:', newValue);
            if (newValue) {
                // 如果有新值，解析并设置
                this.parseAndSetValue(newValue);
            } else {
                // 如果没有值，设置为当前时间
                const now = new Date();
                const currentHour = String(now.getHours()).padStart(2, '0');
                const rawMinute = now.getMinutes();
                const roundedMinute = this.roundMinuteToInterval(rawMinute);
                const currentMinute = String(roundedMinute).padStart(2, '0');
                const todayIndex = this.data.timePickerRange[0].findIndex(item => item.isToday);
                const todayItem = todayIndex !== -1 ? this.data.timePickerRange[0][todayIndex] : null;

                if (todayItem) {
                    const defaultTimeLabel = `${currentHour}:${currentMinute}`;
                    const defaultDisplayTime = `${todayItem.label} ${defaultTimeLabel}`;
                    this.setData({
                        selectedTime: defaultDisplayTime,
                        currentSelectedDate: todayItem.value,
                        currentSelectedHour: currentHour,
                        currentSelectedMinute: currentMinute
                    });
                }
            }
        }
    }
}); 