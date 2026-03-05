import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect } from 'react';
import { useLocation } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import UgcEntry from '../../components/UgcEntry';
import './index.scss';

export default function LocationDetail() {
  const router = useRouter();
  const name = decodeURIComponent(router.params.name || '');
  const { location, loading, error } = useLocation(name);
  useAppShare({
    title: `【剑来·地点】${name}`,
    path: `/pages/location-detail/index?name=${encodeURIComponent(name)}`
  });

  useEffect(() => {
    if (location) {
      Taro.setNavigationBarTitle({ title: `${location.name} - 剑来` });
    }
  }, [location]);

  if (loading) return <View className="loading-container"><Text>加载中...</Text></View>;
  if (error || !location) return <View className="error-container"><Text>地点不存在</Text></View>;

  return (
    <ScrollView className="detail-page" scrollY>
      {/* Basic Info */}
      <View className="detail-header location-header">
        <View className="detail-header-info">
          <Text className="detail-name">{location.name}</Text>
          <Text className="detail-category">{location.type || '未知洲（域）'}</Text>
        </View>
      </View>

      {location.parent && (
        <View className="parent-link" onClick={() => Taro.navigateTo({ url: `/pages/location-detail/index?name=${encodeURIComponent(location.parent)}` })}>
          <Text className="label">所属：</Text>
          <Text className="value">{location.parent}</Text>
          <Text className="arrow">›</Text>
        </View>
      )}

      {location.description && (
        <View className="detail-section location-desc">
          <View className="section-header-row">
            <Text className="section-title">地点志</Text>
          </View>
          <View className="section-content paper-texture">
            <Text className="text-content">{location.description}</Text>
          </View>
          <View className="ugc-footer-wrap"><UgcEntry entryName={location.name} entryType="地点" field="description" /></View>
        </View>
      )}

      {/* 移除了全局的 UgcEntry */}

    </ScrollView>
  );
}
