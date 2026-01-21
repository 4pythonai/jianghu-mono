/**
 * 图片URL处理工具
 * 将相对路径转换为完整URL
 */

import { config } from '@/api/config';

/**
 * 将相对路径转换为完整图片URL
 * @param {string} path - 相对路径，如 /avatar/2025/01/file.jpg
 * @returns {string} 完整URL或空字符串
 */
function imageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return config.staticURL + path;
}

module.exports = { imageUrl };
