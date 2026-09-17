import Taro from '@tarojs/taro';

/**
 * 数据埋点工具
 * 使用微信小程序自带的 wx.reportAnalytics
 * 需要在 MP 管理后台 > 数据分析 > 自定义分析 中配置对应事件
 */

interface EventParams {
  [key: string]: string | number;
}

export function trackEvent(eventName: string, params: EventParams = {}) {
  try {
    Taro.reportAnalytics(eventName, params);
  } catch (e) {
    // 静默失败，不影响业务
  }
}

/** 生成分享卡片 */
export function trackCardGenerate(entityType: string, entityName: string) {
  trackEvent('share_card_generate', { entity_type: entityType, entity_name: entityName });
}

/** 保存卡片到相册 */
export function trackCardSave(entityType: string, entityName: string) {
  trackEvent('share_card_save', { entity_type: entityType, entity_name: entityName });
}

/** 微信分享 */
export function trackShareWechat(page: string, title: string) {
  trackEvent('share_wechat', { page, title });
}

/** 朋友圈分享 */
export function trackShareTimeline(page: string, title: string) {
  trackEvent('share_timeline', { page, title });
}

/** 页面浏览 */
export function trackPageView(page: string, entityName: string, source: string = '') {
  trackEvent('page_view', { page, entity_name: entityName, source });
}

/** 生成人物对比卡片 */
export function trackCompareGenerate(char1: string, char2: string) {
  trackEvent('compare_generate', { char1, char2 });
}
