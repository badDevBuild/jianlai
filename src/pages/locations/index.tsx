import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState, useMemo } from 'react';
import { useLocations } from '../../data/useData';
import './index.scss';

const PAGE_SIZE = 20;

export default function LocationList() {
  const { locationList, loading } = useLocations();
  const [page, setPage] = useState(1);

  useLoad(() => {
    Taro.setNavigationBarTitle({ title: '地理堪舆' });
  });

  const displayList = useMemo(() => {
    if (!locationList) return [];
    return locationList.slice(0, page * PAGE_SIZE);
  }, [locationList, page]);

  const handleScrollToLower = () => {
    if (locationList && displayList.length < locationList.length) {
      setPage(prev => prev + 1);
    }
  };

  const getLocationIcon = (type: string) => {
    if (type === '天下' || type === '洲') return '🌏';
    if (type === '王朝') return '🏳️';
    if (type === '宗门') return '🏔️'; // 山头
    if (type.includes('福地') || type.includes('洞天')) return '✨';
    if (type.includes('城') || type.includes('镇')) return '🏯';
    if (type === '建筑') return '🏛️';
    if (type === '山峰') return '⛰️';
    return '📍';
  };

  return (
    <View className="locations-page">
      <ScrollView
        scrollY
        className="list-content"
        onScrollToLower={handleScrollToLower}
        lowerThreshold={100}
      >
        {loading ? (
          <View className="loading">
            <Text>加载中...</Text>
          </View>
        ) : displayList.length > 0 ? (
          <View className="location-grid">
            {displayList.map((loc) => (
              <View
                key={loc.name}
                className="location-card"
                onClick={() => Taro.navigateTo({ url: `/pages/location-detail/index?name=${encodeURIComponent(loc.name)}` })}
              >
                <View className="card-left">
                  <View className="icon-wrap">
                    <Text>{getLocationIcon(loc.type)}</Text>
                  </View>
                  <View className="info-wrap">
                    <View className="name-row">
                      <Text className="loc-name">{loc.name}</Text>
                      <View className="type-tag">
                        <Text>{loc.type}</Text>
                      </View>
                    </View>

                    {loc.parent && (
                      <Text className="loc-parent">所属：{loc.parent}</Text>
                    )}
                    <Text className="loc-desc">{loc.description || '暂无描述'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="no-results">
            <Text>暂无地点数据</Text>
          </View>
        )}

        {displayList.length > 0 && locationList && displayList.length < locationList.length && (
          <View className="loading-more">
            <Text>加载更多...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
