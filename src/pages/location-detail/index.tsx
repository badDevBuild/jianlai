import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useEffect } from 'react';
import { useLocation } from '../../data/useData';
import './index.scss';

export default function LocationDetail() {
  const router = useRouter();
  const name = decodeURIComponent(router.params.name || '');
  const { location, loading, error } = useLocation(name);

  useEffect(() => {
    if (location) {
      Taro.setNavigationBarTitle({ title: location.name });
    }
  }, [location]);

  if (loading) return <View className="loading-container"><Text>加载中...</Text></View>;
  if (error || !location) return <View className="error-container"><Text>地点不存在</Text></View>;

  const getLocationIcon = (type: string) => {
    if (type === '天下' || type === '洲') return '🌏';
    if (type === '王朝') return '🏳️';
    if (type === '宗门') return '🏔️';
    if (type.includes('福地') || type.includes('洞天')) return '✨';
    if (type.includes('城') || type.includes('镇')) return '🏯';
    if (type === '建筑') return '🏛️';
    if (type === '山峰') return '⛰️';
    return '📍';
  };

  return (
    <ScrollView className="detail-page" scrollY>
      <View className="detail-header">
        <View className="header-icon">
          <Text>{getLocationIcon(location.type)}</Text>
        </View>
        <Text className="detail-name">{location.name}</Text>
        <View className="type-pill">
          <Text>{location.type}</Text>
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
        <View className="detail-section">
          <Text className="section-title">地点简介</Text>
          <View className="section-content">
            <Text className="text-content">{location.description}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
