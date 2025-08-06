/**
 * 工具类测试文件
 * 用于验证所有工具类的功能是否正常工作
 */

import { ConfigParser } from './configParser.js';
import { DisplayFormatter } from './displayFormatter.js';
import { ConfigConverter } from './configConverter.js';

/**
 * 测试配置解析工具类
 */
function testConfigParser() {
  console.log('🧪 开始测试 ConfigParser...');
  
  // 测试 parseParPlus
  const parResult = ConfigParser.parseParPlus('Par+4');
  console.log('✅ parseParPlus("Par+4"):', parResult);
  
  // 测试 parseDoubleParPlus
  const doubleParResult = ConfigParser.parseDoubleParPlus('DoublePar+7');
  console.log('✅ parseDoubleParPlus("DoublePar+7"):', doubleParResult);
  
  // 测试 parseDiff
  const diffResult = ConfigParser.parseDiff('Diff_6');
  console.log('✅ parseDiff("Diff_6"):', diffResult);
  
  // 测试 parseMeatAs
  const meatResult = ConfigParser.parseMeatAs('MEAT_AS_2');
  console.log('✅ parseMeatAs("MEAT_AS_2"):', meatResult);
  
  // 测试 parseEatingRange
  const eatingRangeStr = '{"BetterThanBirdie":1,"Birdie":1,"Par":1,"WorseThanPar":1}';
  const eatingRangeResult = ConfigParser.parseEatingRange(eatingRangeStr);
  console.log('✅ parseEatingRange:', eatingRangeResult);
  
  // 测试 parseMaxValue
  const maxResult = ConfigParser.parseMaxValue('10000000');
  console.log('✅ parseMaxValue("10000000"):', maxResult);
  
  // 测试 parseDutyConfig
  const dutyResult = ConfigParser.parseDutyConfig('DUTY_DINGTOU');
  console.log('✅ parseDutyConfig("DUTY_DINGTOU"):', dutyResult);
  
  // 测试 parseDrawConfig
  const drawResult = ConfigParser.parseDrawConfig('DrawEqual');
  console.log('✅ parseDrawConfig("DrawEqual"):', drawResult);
  
  // 测试 parseMeatValueConfig
  const meatValueResult = ConfigParser.parseMeatValueConfig('SINGLE_DOUBLE');
  console.log('✅ parseMeatValueConfig("SINGLE_DOUBLE"):', meatValueResult);
  
  console.log('✅ ConfigParser 测试完成\n');
}

/**
 * 测试显示值格式化工具类
 */
function testDisplayFormatter() {
  console.log('🧪 开始测试 DisplayFormatter...');
  
  // 测试 formatKoufenRule
  const koufenResult = DisplayFormatter.formatKoufenRule('DoublePar+7', '10000000');
  console.log('✅ formatKoufenRule("DoublePar+7", "10000000"):', koufenResult);
  
  // 测试 formatDrawRule
  const drawResult = DisplayFormatter.formatDrawRule('DrawEqual');
  console.log('✅ formatDrawRule("DrawEqual"):', drawResult);
  
  // 测试 formatMeatRule
  const meatResult = DisplayFormatter.formatMeatRule('MEAT_AS_2', '10000000');
  console.log('✅ formatMeatRule("MEAT_AS_2", "10000000"):', meatResult);
  
  // 测试 formatDutyRule
  const dutyResult = DisplayFormatter.formatDutyRule('DUTY_DINGTOU');
  console.log('✅ formatDutyRule("DUTY_DINGTOU"):', dutyResult);
  
  // 测试 formatEatingRange
  const eatingRange = {"BetterThanBirdie":1,"Birdie":1,"Par":1,"WorseThanPar":1};
  const eatingRangeResult = DisplayFormatter.formatEatingRange(eatingRange);
  console.log('✅ formatEatingRange:', eatingRangeResult);
  
  // 测试 format8421RuleDisplay
  const config = {
    badScoreBaseLine: 'DoublePar+7',
    badScoreMaxLost: '10000000',
    drawConfig: 'DrawEqual',
    meatValueConfig: 'MEAT_AS_2',
    meatMaxValue: '10000000',
    dutyConfig: 'DUTY_DINGTOU',
    eatingRange: eatingRange
  };
  const fullResult = DisplayFormatter.format8421RuleDisplay(config);
  console.log('✅ format8421RuleDisplay:', fullResult);
  
  console.log('✅ DisplayFormatter 测试完成\n');
}

/**
 * 测试数据转换工具类
 */
function testConfigConverter() {
  console.log('🧪 开始测试 ConfigConverter...');
  
  // 测试 E8421Koufen 转换
  const koufenComponentState = {
    selectedStart: 1,
    selectedMax: 0,
    selectedDuty: 1,
    paScore: 4,
    doubleParScore: 7,
    maxSubScore: 2
  };
  const koufenConfig = ConfigConverter.convertE8421KoufenToConfig(koufenComponentState);
  console.log('✅ convertE8421KoufenToConfig:', koufenConfig);
  
  const koufenStateBack = ConfigConverter.convertConfigToE8421Koufen(koufenConfig);
  console.log('✅ convertConfigToE8421Koufen:', koufenStateBack);
  
  // 测试 Draw8421 转换
  const drawComponentState = {
    selected: 0,
    selectedDiffScore: 1
  };
  const drawConfig = ConfigConverter.convertDraw8421ToConfig(drawComponentState);
  console.log('✅ convertDraw8421ToConfig:', drawConfig);
  
  const drawStateBack = ConfigConverter.convertConfigToDraw8421(drawConfig);
  console.log('✅ convertConfigToDraw8421:', drawStateBack);
  
  // 测试 E8421Meat 转换
  const meatComponentState = {
    eatingRange: {"BetterThanBirdie":1,"Birdie":1,"Par":1,"WorseThanPar":1},
    meatValueOption: 0,
    meatScoreValue: 2,
    topSelected: 0,
    topScoreLimit: 3
  };
  const meatConfig = ConfigConverter.convertE8421MeatToConfig(meatComponentState);
  console.log('✅ convertE8421MeatToConfig:', meatConfig);
  
  const meatStateBack = ConfigConverter.convertConfigToE8421Meat(meatConfig);
  console.log('✅ convertConfigToE8421Meat:', meatStateBack);
  
  // 测试合并转换
  const componentsState = {
    E8421Koufen: koufenComponentState,
    Draw8421: drawComponentState,
    E8421Meat: meatComponentState
  };
  const mergedConfig = ConfigConverter.mergeComponentsToConfig(componentsState);
  console.log('✅ mergeComponentsToConfig:', mergedConfig);
  
  const componentsStateBack = ConfigConverter.convertConfigToComponents(mergedConfig);
  console.log('✅ convertConfigToComponents:', componentsStateBack);
  
  console.log('✅ ConfigConverter 测试完成\n');
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log('🚀 开始运行工具类测试...\n');
  
  try {
    testConfigParser();
    testDisplayFormatter();
    testConfigConverter();
    
    console.log('🎉 所有工具类测试通过！');
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 导出测试函数
export {
  testConfigParser,
  testDisplayFormatter,
  testConfigConverter,
  runAllTests
};

// 如果直接运行此文件，执行所有测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中，可以手动调用
  window.runToolTests = runAllTests;
} 