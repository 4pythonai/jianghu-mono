/**
 * 基础配置组件类
 * 为所有配置组件提供通用的功能
 */

import configManager from '../../packageGamble/utils/configManager.js';
import ruleFormatter from '@/utils/formatters/ruleFormatter.js';

/**
 * 基础配置组件类
 * 所有配置组件都应该继承这个类
 */
export class BaseConfigComponent {
    constructor() {
        this.mode = 'SysConfig'; // 默认模式：系统配置
        this.componentName = ''; // 子类必须设置组件名称
        this.isInitialized = false; // 是否已初始化
    }

    /**
     * 设置组件模式
     * @param {string} mode - 组件模式：'SysConfig' | 'UserEdit' | 'UserView'
     */
    setMode(mode) {
        this.mode = mode;
        console.log(`🎯 [${this.componentName}] 设置模式: ${mode}`);
    }

    /**
     * 初始化配置数据
     * @param {Object} configData - 配置数据
     */
    initConfigData(configData) {
        if (!configData) {
            console.warn(`⚠️ [${this.componentName}] 配置数据为空`);
            return;
        }


        try {
            // 子类必须实现这个方法
            this.parseConfigData(configData);
            this.isInitialized = true;

        } catch (error) {
            console.error(`❌ [${this.componentName}] 初始化配置数据失败:`, error);
            this.handleInitError(error);
        }
    }

    /**
     * 解析配置数据 - 子类必须实现
     * @param {Object} configData - 配置数据
     */
    parseConfigData(configData) {
        throw new Error(`子类 ${this.componentName} 必须实现 parseConfigData 方法`);
    }

    /**
     * 获取组件状态 - 子类必须实现
     * @returns {Object} 组件状态
     */
    getComponentState() {
        throw new Error(`子类 ${this.componentName} 必须实现 getComponentState 方法`);
    }

    /**
     * 更新显示值 - 子类必须实现
     */
    updateDisplayValue() {
        throw new Error(`子类 ${this.componentName} 必须实现 updateDisplayValue 方法`);
    }

    /**
     * 获取配置数据 - 子类必须实现
     * @returns {Object} 配置数据
     */
    getConfigData() {
        throw new Error(`子类 ${this.componentName} 必须实现 getConfigData 方法`);
    }

    /**
     * 处理初始化错误
     * @param {Error} error - 错误对象
     */
    handleInitError(error) {
        console.error(`❌ [${this.componentName}] 初始化错误处理:`, error);
        // 子类可以重写这个方法来自定义错误处理
    }



    /**
     * 重置组件状态
     */
    reset() {
        this.isInitialized = false;
        console.log(`🔄 [${this.componentName}] 重置组件状态`);
    }

    /**
     * 检查是否已初始化
     * @returns {boolean} 是否已初始化
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * 获取组件信息
     * @returns {Object} 组件信息
     */
    getComponentInfo() {
        return {
            name: this.componentName,
            mode: this.mode,
            isInitialized: this.isInitialized,
            isReady: this.isReady()
        };
    }
}

/**
 * 创建基础配置组件的工厂函数
 * @param {string} componentName - 组件名称
 * @param {Function} parseConfigDataFn - 解析配置数据的函数
 * @param {Function} getComponentStateFn - 获取组件状态的函数
 * @param {Function} updateDisplayValueFn - 更新显示值的函数
 * @param {Function} getConfigDataFn - 获取配置数据的函数
 * @returns {BaseConfigComponent} 基础配置组件实例
 */
export function createBaseConfigComponent(
    componentName,
    parseConfigDataFn,
    getComponentStateFn,
    updateDisplayValueFn,
    getConfigDataFn
) {
    const component = new BaseConfigComponent();
    component.componentName = componentName;
    component.parseConfigData = parseConfigDataFn;
    component.getComponentState = getComponentStateFn;
    component.updateDisplayValue = updateDisplayValueFn;
    component.getConfigData = getConfigDataFn;

    return component;
}

// 导出工具类，方便子类使用
export { configManager as ConfigParser, ruleFormatter as DisplayFormatter, configManager as ConfigConverter }; 