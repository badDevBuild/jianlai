import { View, Text, Textarea, Button, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useState } from 'react';
import Icon from '../../components/Icon';
import './index.scss';

// 这里填真实的服务器 API 地址（可放入环境变量或 config。假设 shushu.host 是允许的 request 域名）
const API_BASE = 'https://shushu.host/jianlai/api/ugc';

const FIELD_NAME_MAP: Record<string, string> = {
    'avatar': '头像',
    'cultivation': '修为境界',
    'techniques': '功法神通',
    'bio': '生平事迹',
    'appearance': '容貌风采',
    'relations': '主要关系',
    'quotes': '经典语录',
    'tags': '江湖标签',
    'description': '设定/简介',
    'name': '名称',
    'image': '配图',
    'visual': '外观形态',
    'abilities': '神异能力',
    'evolution': '演化路径',
    'provenance': '前世今生',
    'ownership_log': '流转记录',
    'previous_holders': '历史持有',
    'members': '成员列表'
};

// [#4] 生成设备级稳定指纹作为 openid 替代方案
// 个人小程序无法使用 wx.login 获取 openid，改为基于设备信息生成稳定指纹
function getDeviceFingerprint(): string {
    const cached = Taro.getStorageSync('device_fingerprint');
    if (cached) return cached;

    try {
        const info = Taro.getSystemInfoSync();
        // 组合多个设备维度生成相对稳定的标识
        const raw = [
            info.brand || '',
            info.model || '',
            info.system || '',
            info.platform || '',
            info.screenWidth || '',
            info.screenHeight || '',
            info.pixelRatio || '',
        ].join('|');

        // 简易哈希：将字符串转换为一个较稳定的 hex 指纹
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            const char = raw.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        const fingerprint = `dev_${Math.abs(hash).toString(16)}`;
        Taro.setStorageSync('device_fingerprint', fingerprint);
        return fingerprint;
    } catch {
        // 降级：使用持久化的随机ID（至少每台设备同一个）
        const fallback = `fp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        Taro.setStorageSync('device_fingerprint', fallback);
        return fallback;
    }
}

export default function UgcSubmit() {
    const router = useRouter();
    const entryName = decodeURIComponent(router.params.name || '未知');
    const entryType = decodeURIComponent(router.params.type || '通用'); // [#9] 接收 entryType
    const field = decodeURIComponent(router.params.field || '通用');
    const displayField = FIELD_NAME_MAP[field] || field;

    const [content, setContent] = useState('');
    const [imagePath, setImagePath] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // 如果是从点击换头像或图片的地方进来，我们隐藏文字输入并只要求发图
    const isImageOnlyMode = field === 'avatar' || field === 'image';

    // [#4] 使用设备指纹代替伪造的 openid
    const deviceId = getDeviceFingerprint();

    const handleChooseImage = async () => {
        try {
            const res = await Taro.chooseMedia({
                count: 1,
                mediaType: ['image'],
                sourceType: ['album', 'camera'],
                sizeType: ['compressed']
            });
            setImagePath(res.tempFiles[0].tempFilePath);
        } catch (e) {
            console.log('取消选择图片');
        }
    };

    const handleSubmit = async () => {
        if (isImageOnlyMode && !imagePath) {
            Taro.showToast({ title: '请至少选一张极美的配图吧~', icon: 'none' });
            return;
        }
        if (!isImageOnlyMode && !content.trim() && !imagePath) {
            Taro.showToast({ title: '总得写点什么或者补张图吧~', icon: 'none' });
            return;
        }

        setSubmitting(true);
        Taro.showLoading({ title: '飞剑传书中...' });

        try {
            if (imagePath) {
                // 有图片，使用 uploadFile 上传 multipart/form-data
                await Taro.uploadFile({
                    url: `${API_BASE}/upload_image`,
                    filePath: imagePath,
                    name: 'file',
                    formData: {
                        openid: deviceId,
                        entry_name: entryName,
                        entry_type: entryType, // [#9] 传递词条类型
                        suggestion_type: field === '通用' ? '内容补充' : '精准报错',
                        field: field,
                        content: content
                    }
                });
            } else {
                // 纯文本，使用普通 request
                const res = await Taro.request({
                    url: `${API_BASE}/submit_text`,
                    method: 'POST',
                    data: {
                        openid: deviceId,
                        entry_name: entryName,
                        entry_type: entryType, // [#9] 传递词条类型
                        suggestion_type: field === '通用' ? '内容补充' : '精准报错',
                        field: field,
                        content: content
                    }
                });
                if (res.statusCode !== 200) throw new Error(res.data?.detail || '提交失败');
            }

            Taro.hideLoading();
            // [#1] 改用 showModal 展示审核说明
            Taro.showModal({
                title: '飞剑传书成功',
                content: '感谢道友！提交的内容将由管理员审核，确认无误后会进行更新。',
                showCancel: false,
                confirmText: '知道了',
                success: () => {
                    Taro.navigateBack();
                }
            });

        } catch (error) {
            Taro.hideLoading();
            console.error('Submit Error:', error);
            Taro.showToast({
                title: error.message || '网络拥堵，请稍后再试',
                icon: 'none'
            });
            setSubmitting(false);
        }
    };

    return (
        <View className="ugc-submit-page">
            <View className="header-box">
                <Text className="title">正在为</Text>
                <Text className="target-name">【{entryName}】</Text>
                {field !== '通用' && <Text className="target-field"> 的 [{displayField}] </Text>}
                <Text className="title">{isImageOnlyMode ? '重塑金身 (提供新图片)' : '补充天机'}</Text>
            </View>

            {!isImageOnlyMode && (
                <View className="form-group">
                    <Text className="label">您掌握的机密是：</Text>
                    <Textarea
                        className="content-input"
                        placeholder="在此输入你要纠错或补充的内容，如：此人已经在第1000章升至玉璞境..."
                        maxlength={500}
                        value={content}
                        onInput={e => setContent(e.detail.value)}
                    />
                </View>
            )}

            <View className="form-group">
                <Text className="label">{isImageOnlyMode ? '请上传您觉得最合适的图片神韵：' : '附加图片凭证（可选）'}</Text>
                <View className="image-uploader" onClick={!imagePath ? handleChooseImage : undefined}>
                    {imagePath ? (
                        <View className="preview-box">
                            <Image src={imagePath} mode="aspectFill" className="preview-img" />
                            <View className="del-btn" onClick={(e) => { e.stopPropagation(); setImagePath(''); }}><Icon name="close" size={16} color="#ffffff" /></View>
                        </View>
                    ) : (
                        <View className="upload-placeholder">
                            <Icon name="plus" size={32} color="#cccccc" />
                            <Text className="upload-tip">点击替换或补充配图</Text>
                        </View>
                    )}
                </View>
            </View>

            <Button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
            >
                发送飞剑
            </Button>
            <Text className="bottom-hint">道长审核通过后，该词条将福泽整个浩然天下</Text>
        </View>
    );
}
