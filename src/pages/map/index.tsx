import { View, Text, Image, MovableArea, MovableView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import Icon from '../../components/Icon';
import { useAppShare } from '../../utils/share';
import './index.scss';

// 使用远程图片资源，减少小程序包体积
const MAP_BASE = 'https://shushu.host/jianlai/data/img/maps';

// 缩略图 (~400KB) 用于列表预览
const fiveWorldsMapThumb = `${MAP_BASE}/five_worlds_map_thumb.png`;
const haoranMapThumb = `${MAP_BASE}/haoran_map_thumb.png`;

// 大图 (~6MB) 仅在点击查看时加载
const fiveWorldsMap = `${MAP_BASE}/five_worlds_map.png`;
const haoranMap = `${MAP_BASE}/haoran_map.png`;
import { useState } from 'react';

export default function MapPage() {
    useAppShare({ title: '剑来光阴 - 万界地图', path: '/pages/map/index' });
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handlePreview = (url: string) => {
        setPreviewUrl(url);
        Taro.hideTabBar();
    };

    const closePreview = () => {
        setPreviewUrl(null);
        Taro.showTabBar();
    };



    return (
        <View className="map-page">
            <View className="header">
                <Text className="title">世界地图</Text>
                <Text className="subtitle">剑来光阴长河</Text>
            </View>

            <View className="map-card" onClick={() => handlePreview(haoranMap)}>
                <View className="card-header">
                    <Text className="card-title">浩然天下全图</Text>
                    <Text className="card-tag">详细</Text>
                </View>
                <Image className="map-image" src={haoranMapThumb} mode="widthFix" />
                <Text className="card-hint">点击查看大图</Text>
            </View>

            <View className="map-card" onClick={() => handlePreview(fiveWorldsMap)}>
                <View className="card-header">
                    <Text className="card-title">五座天下示意图</Text>
                    <Text className="card-tag">概览</Text>
                </View>
                <Image className="map-image" src={fiveWorldsMapThumb} mode="widthFix" />
                <Text className="card-hint">点击查看大图</Text>
            </View>

            {/* Custom Full Screen Preview */}
            {previewUrl && (
                <View className="preview-overlay" onClick={closePreview}>
                    <MovableArea className="preview-movable-area" scaleArea>
                        <MovableView
                            className="preview-movable-view"
                            direction="all"
                            scale
                            scaleMin={1}
                            scaleMax={5} // Allow 5x zoom
                            scaleValue={1}
                            onClick={(e) => e.stopPropagation()} // Prevent close on image click
                        >
                            <Image
                                src={previewUrl}
                                mode="widthFix"
                                className="preview-image"
                            />
                        </MovableView>
                    </MovableArea>
                    <View className="close-btn" onClick={closePreview}>
                        <Icon name="close" size={24} color="#ffffff" />
                    </View>
                </View>
            )}
        </View>
    );
}
