import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState, useMemo } from 'react';
import { useItems, getItemIcon } from '../../data/useData';
import './index.scss';

const PAGE_SIZE = 20;

export default function ArtifactList() {
  const { itemList, loading } = useItems();
  const [page, setPage] = useState(1);

  useLoad(() => {
    Taro.setNavigationBarTitle({ title: '法宝图鉴' });
  });

  const displayList = useMemo(() => {
    if (!itemList) return [];
    return itemList.slice(0, page * PAGE_SIZE);
  }, [itemList, page]);

  const handleScrollToLower = () => {
    if (itemList && displayList.length < itemList.length) {
      setPage(prev => prev + 1);
    }
  };

  const getGradeClass = (grade: string) => {
    if (grade === '神器') return 'grade-shenqi';
    if (grade === '仙兵') return 'grade-xianbing';
    if (grade === '半仙兵') return 'grade-banxianbing';
    if (grade === '法宝') return 'grade-fabao';
    if (grade === '灵器') return 'grade-lingqi';
    return 'grade-normal';
  };

  const getOwner = (item: any) => {
    if (item.ownership_log && item.ownership_log.length > 0) {
      return item.ownership_log[item.ownership_log.length - 1].owner;
    }
    return null;
  };

  return (
    <View className="artifacts-page">
      <ScrollView
        scrollY
        className="list-content"
        onScrollToLower={handleScrollToLower}
        lowerThreshold={200}
      >
        {loading ? (
          <View className="loading">
            <Text>加载中...</Text>
          </View>
        ) : displayList.length > 0 ? (
          <View className="artifact-list">
            {displayList.map((item) => {
              const currentOwner = getOwner(item);
              const isShenqi = item.grade === '神器';
              const iconUrl = getItemIcon(item);

              return (
                <View
                  key={item.name}
                  className={`artifact-card ${isShenqi ? 'card-shenqi' : ''}`}
                  onClick={() => Taro.navigateTo({ url: `/pages/artifact-detail/index?name=${encodeURIComponent(item.name)}` })}
                >
                  <View className="card-content-wrapper">
                    {iconUrl ? (
                      <Image className="artifact-icon" src={iconUrl} mode="aspectFill" />
                    ) : (
                      <View className="artifact-icon-placeholder">
                        <Text>🗡️</Text>
                      </View>
                    )}

                    <View className="card-right-section">
                      <View className="card-main">
                        <View className="card-header">
                          <View className="header-left">
                            {isShenqi && <Text className="shenqi-icon">✨</Text>}
                            <Text className="item-name">{item.name}</Text>
                          </View>
                          <View className={`grade-tag ${getGradeClass(item.grade as string)}`}>
                            <Text>{item.grade || '未知'}</Text>
                          </View>
                        </View>

                        <Text className="item-desc" numberOfLines={3}>{item.description || '暂无描述'}</Text>
                      </View>

                      <View className="card-footer">
                        {currentOwner ? (
                          <View className="info-item">
                            <Text className="label">持有：</Text>
                            <Text className="value">{currentOwner}</Text>
                          </View>
                        ) : <View />}

                        {item.status && item.status !== '未知' && (
                          <View className="info-item status-item">
                            <Text className="label">状态：</Text>
                            <Text className="value">{item.status}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="no-results">
            <Text>暂无法宝数据</Text>
          </View>
        )}

        {displayList.length > 0 && itemList && displayList.length < itemList.length && (
          <View className="loading-more">
            <Text>加载更多...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
