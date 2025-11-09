/**
 * 自定义时间选择器弹窗组件
 * 替换原生 picker，提供更好的自定义能力
 */
Component({
    properties: {
        // 是否显示
        visible: {
            type: Boolean,
            value: false
        },
        // 标题
        title: {
            type: String,
            value: '选择开球时间'
        },
        // 日期范围数据
        dateRange: {
            type: Array,
            value: []
        },
        // 小时范围数据
        hourRange: {
            type: Array,
            value: []
        },
        // 分钟范围数据
        minuteRange: {
            type: Array,
            value: []
        },
        // 当前选中的日期值
        selectedDate: {
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
        }
    },

    data: {
        dateScrollTop: 0,
        hourScrollTop: 0,
        minuteScrollTop: 0
    },

    observers: {
        'visible, selectedDate, selectedHour, selectedMinute': function (visible, date, hour, minute) {
            if (visible) {
                // 弹窗打开时，延迟滚动到选中位置，确保 DOM 渲染完成
                setTimeout(() => {
                    this.scrollToSelected();
                }, 100);
            }
        }
    },

    methods: {
        // 滚动到选中位置
        scrollToSelected() {
            const { dateRange, hourRange, minuteRange, selectedDate, selectedHour, selectedMinute } = this.data;

            // scroll-view 高度是 300rpx，每个 item 高度是 80rpx
            // 可以显示约 3.75 个选项，为了让选中项居中，需要滚动到中间位置
            // scroll-view 的 scroll-top 单位是 px，需要将 rpx 转换为 px
            try {
                const systemInfo = wx.getSystemInfoSync();
                const rpxToPx = systemInfo.windowWidth / 750; // rpx 转 px 的比例

                const itemHeightRpx = 80; // 每个选项高度（rpx）
                const visibleHeightRpx = 300; // 可视区域高度（rpx）
                const visibleItemCount = visibleHeightRpx / itemHeightRpx; // 约 3.75
                const centerOffset = Math.floor(visibleItemCount / 2); // 约 1-2 个位置

                const itemHeightPx = itemHeightRpx * rpxToPx; // 转换为 px

                // 计算日期索引并滚动
                const dateIndex = dateRange.findIndex(item => item.value === selectedDate);
                if (dateIndex !== -1) {
                    // 让选中项居中显示：滚动到 (index - centerOffset) * itemHeight
                    const scrollTop = Math.max(0, (dateIndex - centerOffset) * itemHeightPx);
                    this.setData({ dateScrollTop: scrollTop });
                    console.log('📅 日期滚动:', { dateIndex, scrollTop, selectedDate, rpxToPx });
                }

                // 计算小时索引并滚动
                const hourIndex = hourRange.findIndex(item => item.value === selectedHour);
                if (hourIndex !== -1) {
                    const scrollTop = Math.max(0, (hourIndex - centerOffset) * itemHeightPx);
                    this.setData({ hourScrollTop: scrollTop });
                    console.log('⏰ 小时滚动:', { hourIndex, scrollTop, selectedHour });
                }

                // 计算分钟索引并滚动
                const minuteIndex = minuteRange.findIndex(item => item.value === selectedMinute);
                if (minuteIndex !== -1) {
                    const scrollTop = Math.max(0, (minuteIndex - centerOffset) * itemHeightPx);
                    this.setData({ minuteScrollTop: scrollTop });
                    console.log('⏰ 分钟滚动:', { minuteIndex, scrollTop, selectedMinute });
                }
            } catch (error) {
                console.error('滚动定位失败:', error);
                // 降级方案：使用固定比例
                const itemHeightPx = 40; // 假设 80rpx = 40px
                const centerOffset = 1;

                const dateIndex = dateRange.findIndex(item => item.value === selectedDate);
                if (dateIndex !== -1) {
                    this.setData({ dateScrollTop: Math.max(0, (dateIndex - centerOffset) * itemHeightPx) });
                }

                const hourIndex = hourRange.findIndex(item => item.value === selectedHour);
                if (hourIndex !== -1) {
                    this.setData({ hourScrollTop: Math.max(0, (hourIndex - centerOffset) * itemHeightPx) });
                }

                const minuteIndex = minuteRange.findIndex(item => item.value === selectedMinute);
                if (minuteIndex !== -1) {
                    this.setData({ minuteScrollTop: Math.max(0, (minuteIndex - centerOffset) * itemHeightPx) });
                }
            }
        },

        // 日期列滚动
        onDateScroll(e) {
            // 可以在这里实现滚动时的联动效果
        },

        // 小时列滚动
        onHourScroll(e) {
            // 可以在这里实现滚动时的联动效果
        },

        // 分钟列滚动
        onMinuteScroll(e) {
            // 可以在这里实现滚动时的联动效果
        },

        // 点击选项
        onItemTap(e) {
            const { type, value } = e.currentTarget.dataset;

            if (type === 'date') {
                this.setData({ selectedDate: value });
            } else if (type === 'hour') {
                this.setData({ selectedHour: value });
            } else if (type === 'minute') {
                this.setData({ selectedMinute: value });
            }
        },

        // 确认选择
        onConfirm() {
            const { selectedDate, selectedHour, selectedMinute, dateRange, hourRange, minuteRange } = this.data;

            const dateItem = dateRange.find(item => item.value === selectedDate);
            const hourItem = hourRange.find(item => item.value === selectedHour);
            const minuteItem = minuteRange.find(item => item.value === selectedMinute);

            if (dateItem && hourItem && minuteItem) {
                const timeLabel = `${hourItem.label}:${minuteItem.label}`;
                const timeValue = `${hourItem.value}:${minuteItem.value}`;
                const displayTime = `${dateItem.label} ${timeLabel}`;
                const valueTime = `${dateItem.value} ${timeValue}`;

                this.triggerEvent('confirm', {
                    value: valueTime,
                    display: displayTime,
                    date: dateItem,
                    hour: hourItem,
                    minute: minuteItem,
                    time: {
                        label: timeLabel,
                        value: timeValue
                    }
                });
            }

            this.close();
        },

        // 取消
        onCancel() {
            this.triggerEvent('cancel');
            this.close();
        },

        // 点击遮罩层
        onMaskTap() {
            this.onCancel();
        },

        // 关闭弹窗
        close() {
            this.setData({ visible: false });
        },

        // 阻止冒泡
        noop() { }
    }
});

