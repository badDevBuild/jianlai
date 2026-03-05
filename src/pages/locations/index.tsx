import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState, useMemo } from 'react';
import { useLocations } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import FilterBar from '../../components/FilterBar';
import './index.scss';

const PAGE_SIZE = 20;

export default function LocationList() {
  const { locationList, loading } = useLocations();
  useAppShare({ title: '剑来光阴 - 地点图鉴', path: '/pages/locations/index' });
  const [page, setPage] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useLoad(() => {
    Taro.setNavigationBarTitle({ title: '剑来地点图鉴' });
  });

  // 1. 提取所有类型 (Memoized)
  const allTypes = useMemo(() => {
    if (!locationList) return [];
    const types = new Set<string>();
    locationList.forEach(l => {
      if (l.type) types.add(l.type);
    });
    // 定义排序优先级：大 -> 小
    const PREFERRED_ORDER = ['天下', '洲', '王朝', '宗门', '福地', '洞天', '城池', '城镇', '街道', '建筑', '山峰', '旧址'];
    return Array.from(types).sort((a, b) => {
      const idxA = PREFERRED_ORDER.indexOf(a);
      const idxB = PREFERRED_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b, 'zh-CN');
    });
  }, [locationList]);

  // 2. 过滤逻辑
  const filteredList = useMemo(() => {
    if (!locationList) return [];
    if (selectedTypes.length === 0) return locationList;
    return locationList.filter(l => l.type && selectedTypes.includes(l.type));
  }, [locationList, selectedTypes]);

  // 3. 分页逻辑
  const displayList = useMemo(() => {
    return filteredList.slice(0, page * PAGE_SIZE);
  }, [filteredList, page]);

  const handleScrollToLower = () => {
    if (displayList.length < filteredList.length) {
      setPage(prev => prev + 1);
    }
  };

  const handleToggleType = (type: string) => {
    setPage(1);
    setSelectedTypes(prev => {
      // 单选模式
      if (prev.includes(type)) return prev.filter(t => t !== type);
      return [type];
    });
  };

  const handleResetFilter = () => {
    setPage(1);
    setSelectedTypes([]);
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
      {/* 顶部筛选栏 */}
      <View className="filter-container">
        <FilterBar
          items={allTypes}
          selectedItems={selectedTypes}
          onToggle={handleToggleType}
          onReset={handleResetFilter}
        />
      </View>

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
            <Text>暂无相关地点</Text>
          </View>
        )}

        {displayList.length > 0 && displayList.length < filteredList.length && (
          <View className="loading-more">
            <Text>加载更多...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
