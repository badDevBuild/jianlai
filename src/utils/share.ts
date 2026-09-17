import { useShareAppMessage, useShareTimeline, useRouter } from '@tarojs/taro';
import { trackShareWechat, trackShareTimeline } from './analytics';

interface ShareOptions {
    title?: string;
    path?: string;
    imageUrl?: string;
}

/**
 * 通用小程序分享 Hook
 * @param options 分享配置
 */
export function useAppShare(options: ShareOptions = {}) {
    const defaultTitle = '剑来光阴 - 这里的江湖很不测';
    const defaultPath = '/pages/index/index';
    const router = useRouter();
    const page = router.path || defaultPath;

    useShareAppMessage(() => {
        const title = options.title || defaultTitle;
        trackShareWechat(page, title);
        return {
            title,
            path: options.path || defaultPath,
            imageUrl: options.imageUrl,
        };
    });

    useShareTimeline(() => {
        const title = options.title || defaultTitle;
        trackShareTimeline(page, title);
        return {
            title,
            query: options.path ? options.path.split('?')[1] : '',
            imageUrl: options.imageUrl,
        };
    });
}
