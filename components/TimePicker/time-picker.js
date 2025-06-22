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
        // 日期范围天数（从今天开始）
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
            []  // 时间范围
        ],
        timePickerValue: [0, 0], // 选择器当前值
        selectedTime: '' // 显示的选择时间
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

            // 从过去30天开始，到未来30天结束
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
                    label: `${month}月${day}日 ${weekDay}${todayLabel}`,
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
            // 生成从06:00到18:00的时间选项，间隔30分钟
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
            const timeRange = this.generateTimeRange();

            // 找到今天的索引作为默认选择
            const todayIndex = dateRange.findIndex(item => item.isToday);
            const defaultDateIndex = todayIndex !== -1 ? todayIndex : 30; // 如果找不到今天，默认选择中间位置

            this.setData({
                'timePickerRange[0]': dateRange,
                'timePickerRange[1]': timeRange,
                'timePickerValue[0]': defaultDateIndex // 默认选中今天
            });

            console.log('🚀 时间选择器组件初始化完成');
            console.log('📅 日期范围:', dateRange.length, '天 (过去30天 + 今天 + 未来30天)');
            console.log('📍 今天索引:', todayIndex, '默认选择:', defaultDateIndex);
            console.log('⏰ 时间范围:', timeRange.length, '个时间点');
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
                    }
                    if (timeIndex !== -1) {
                        updates['timePickerValue[1]'] = timeIndex;
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

            // 如果有初始值，解析并设置
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
            this.setData({
                selectedTime: newValue || ''
            });
        }
    }
}); 