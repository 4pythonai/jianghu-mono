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
        minuteScrollTop: 0,
        // 防抖定时器
        hourScrollTimer: null,
        minuteScrollTimer: null
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
        // 基于24/6=4的数学关系，确保小时和分钟列的4个元素永远对齐
        scrollToSelected() {
            const { dateRange, hourRange, minuteRange, selectedDate, selectedHour, selectedMinute } = this.data;

            // scroll-view 高度是 320rpx，每个 item 高度是 80rpx
            // 正好显示4个选项（4 × 80rpx = 320rpx）
            // scroll-view 的 scroll-top 单位是 px，需要将 rpx 转换为 px
            try {
                const systemInfo = wx.getSystemInfoSync();
                const rpxToPx = systemInfo.windowWidth / 750; // rpx 转 px 的比例

                const itemHeightRpx = 80; // 每个选项高度（rpx）
                const visibleHeightRpx = 320; // 可视区域高度（rpx），正好显示4个完整元素
                const itemHeightPx = itemHeightRpx * rpxToPx; // 转换为 px

                // 最简单的方式：让第一个显示的item索引 = max(0, selectedIndex - 1)
                // 这样：如果选中项是索引0，显示0,1,2,3（4个）
                //      如果选中项是索引1，显示0,1,2,3（4个）
                //      如果选中项是索引2，显示1,2,3,4（4个）
                //      选中项始终在第1或第2个位置，总共显示4个完整元素
                const calculateScrollTop = (selectedIndex, totalItems) => {
                    // 让第一个显示的item索引 = max(0, selectedIndex - 1)
                    const firstVisibleIndex = Math.max(0, selectedIndex - 1);
                    // 确保不会超出范围（最后一个显示的item索引不能超过totalItems - 1）
                    const lastVisibleIndex = Math.min(totalItems - 1, firstVisibleIndex + 3);
                    // 如果最后4个item，让最后一个item在底部
                    if (lastVisibleIndex === totalItems - 1 && totalItems >= 4) {
                        return (totalItems - 4) * itemHeightPx;
                    }
                    // 否则让选中项在第2个位置
                    return firstVisibleIndex * itemHeightPx;
                };

                // 计算小时索引并滚动（24个元素）
                const hourIndex = hourRange.findIndex(item => item.value === selectedHour);
                const minuteIndex = minuteRange.findIndex(item => item.value === selectedMinute);

                // 关键：确保两列的第一个显示的item索引相同，保证对齐
                // 计算两列的第一个显示的item索引（选中项在第2个位置）
                const hourFirstIndex = hourIndex !== -1 ? Math.max(0, hourIndex - 1) : 0;
                const minuteFirstIndex = minuteIndex !== -1 ? Math.max(0, minuteIndex - 1) : 0;

                // 统一使用较小的索引，确保两列对齐
                // 但需要确保两列的选中项都在可视区域内
                let unifiedFirstIndex = Math.min(hourFirstIndex, minuteFirstIndex);

                // 检查小时列的选中项是否在可视区域内
                if (hourIndex !== -1) {
                    const hourLastVisible = unifiedFirstIndex + 3;
                    if (hourIndex > hourLastVisible) {
                        // 如果选中项超出可视区域，调整第一个显示的索引
                        unifiedFirstIndex = Math.max(0, hourIndex - 1);
                    }
                }

                // 检查分钟列的选中项是否在可视区域内
                if (minuteIndex !== -1) {
                    const minuteLastVisible = unifiedFirstIndex + 3;
                    if (minuteIndex > minuteLastVisible) {
                        // 如果选中项超出可视区域，调整第一个显示的索引
                        unifiedFirstIndex = Math.max(0, minuteIndex - 1);
                    }
                }

                // 确保不超过范围
                const hourMaxFirst = hourRange.length >= 4 ? hourRange.length - 4 : 0;
                const minuteMaxFirst = minuteRange.length >= 4 ? minuteRange.length - 4 : 0;
                unifiedFirstIndex = Math.min(unifiedFirstIndex, Math.min(hourMaxFirst, minuteMaxFirst));

                // 重新计算滚动位置，确保两列对齐
                const unifiedScrollTop = unifiedFirstIndex * itemHeightPx;

                // 计算日期索引并滚动
                const dateIndex = dateRange.findIndex(item => item.value === selectedDate);
                if (dateIndex !== -1) {
                    const scrollTop = calculateScrollTop(dateIndex, dateRange.length);
                    this.setData({ dateScrollTop: scrollTop });
                    console.log('📅 日期滚动:', { dateIndex, scrollTop, selectedDate });
                }

                // 设置小时和分钟列的滚动位置，确保对齐
                this.setData({
                    hourScrollTop: unifiedScrollTop,
                    minuteScrollTop: unifiedScrollTop
                });
                console.log('⏰ 小时滚动:', { hourIndex, scrollTop: unifiedScrollTop, selectedHour, totalItems: hourRange.length, firstIndex: unifiedFirstIndex });
                console.log('⏰ 分钟滚动:', { minuteIndex, scrollTop: unifiedScrollTop, selectedMinute, totalItems: minuteRange.length, firstIndex: unifiedFirstIndex });
            } catch (error) {
                console.error('滚动定位失败:', error);
                // 降级方案：使用固定比例，保持相同的计算逻辑
                const itemHeightPx = 40; // 假设 80rpx = 40px

                const calculateScrollTop = (selectedIndex, totalItems) => {
                    const firstVisibleIndex = Math.max(0, selectedIndex - 1);
                    const lastVisibleIndex = Math.min(totalItems - 1, firstVisibleIndex + 3);
                    if (lastVisibleIndex === totalItems - 1 && totalItems >= 4) {
                        return (totalItems - 4) * itemHeightPx;
                    }
                    return firstVisibleIndex * itemHeightPx;
                };

                const dateIndex = dateRange.findIndex(item => item.value === selectedDate);
                if (dateIndex !== -1) {
                    this.setData({ dateScrollTop: calculateScrollTop(dateIndex, dateRange.length) });
                }

                const hourIndex = hourRange.findIndex(item => item.value === selectedHour);
                if (hourIndex !== -1) {
                    this.setData({ hourScrollTop: calculateScrollTop(hourIndex, hourRange.length) });
                }

                const minuteIndex = minuteRange.findIndex(item => item.value === selectedMinute);
                if (minuteIndex !== -1) {
                    this.setData({ minuteScrollTop: calculateScrollTop(minuteIndex, minuteRange.length) });
                }
            }
        },

        // 日期列滚动
        onDateScroll(e) {
            // 可以在这里实现滚动时的联动效果
        },

        // 小时列滚动
        onHourScroll(e) {
            // 清除之前的定时器
            if (this.data.hourScrollTimer) {
                clearTimeout(this.data.hourScrollTimer);
            }
            // 设置新的定时器，滚动停止后300ms对齐
            const timer = setTimeout(() => {
                this.alignScrollPosition('hour', e.detail.scrollTop);
            }, 300);
            this.setData({ hourScrollTimer: timer });
        },

        // 小时列滚动结束（备用方案）
        onHourScrollEnd(e) {
            // 清除定时器，立即对齐
            if (this.data.hourScrollTimer) {
                clearTimeout(this.data.hourScrollTimer);
                this.setData({ hourScrollTimer: null });
            }
            this.alignScrollPosition('hour', e.detail.scrollTop);
        },

        // 分钟列滚动
        onMinuteScroll(e) {
            // 清除之前的定时器
            if (this.data.minuteScrollTimer) {
                clearTimeout(this.data.minuteScrollTimer);
            }
            // 设置新的定时器，滚动停止后300ms对齐
            const timer = setTimeout(() => {
                this.alignScrollPosition('minute', e.detail.scrollTop);
            }, 300);
            this.setData({ minuteScrollTimer: timer });
        },

        // 分钟列滚动结束（备用方案）
        onMinuteScrollEnd(e) {
            // 清除定时器，立即对齐
            if (this.data.minuteScrollTimer) {
                clearTimeout(this.data.minuteScrollTimer);
                this.setData({ minuteScrollTimer: null });
            }
            this.alignScrollPosition('minute', e.detail.scrollTop);
        },

        // 对齐滚动位置到item边界
        alignScrollPosition(type, currentScrollTop) {
            try {
                const systemInfo = wx.getSystemInfoSync();
                const rpxToPx = systemInfo.windowWidth / 750;
                const itemHeightPx = 80 * rpxToPx;

                // 计算当前显示的第一个item索引（四舍五入到最近的item）
                const currentIndex = Math.round(currentScrollTop / itemHeightPx);

                // 确保显示4个完整item
                const range = type === 'hour' ? this.data.hourRange : this.data.minuteRange;
                const totalItems = range.length;

                const calculateScrollTop = (firstIndex, totalItems) => {
                    // 确保第一个显示的item索引在有效范围内
                    const firstVisibleIndex = Math.max(0, Math.min(firstIndex, totalItems - 4));
                    // 确保最后一个显示的item索引不超过总数
                    const lastVisibleIndex = Math.min(totalItems - 1, firstVisibleIndex + 3);
                    // 如果最后4个item，让最后一个item固定在底部
                    if (lastVisibleIndex === totalItems - 1 && totalItems >= 4) {
                        return (totalItems - 4) * itemHeightPx;
                    }
                    // 否则让第一个item在顶部
                    return firstVisibleIndex * itemHeightPx;
                };

                const alignedScrollTop = calculateScrollTop(currentIndex, totalItems);

                // 如果位置不对齐，自动对齐（使用动画）
                if (Math.abs(currentScrollTop - alignedScrollTop) > 2) {
                    const scrollTopKey = type === 'hour' ? 'hourScrollTop' : 'minuteScrollTop';
                    this.setData({
                        [scrollTopKey]: alignedScrollTop
                    });
                    console.log(`对齐${type}列:`, { currentScrollTop, alignedScrollTop, currentIndex });
                }
            } catch (error) {
                console.error('对齐滚动位置失败:', error);
            }
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

