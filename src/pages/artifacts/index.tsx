import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState, useMemo } from 'react';
import { useItems, getItemIcon } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import FilterBar from '../../components/FilterBar';
import Icon from '../../components/Icon';
import './index.scss';

const PAGE_SIZE = 20;

export default function ArtifactList() {
  const { itemList, loading } = useItems();
  useAppShare({ title: '剑来光阴 - 法宝图鉴', path: '/pages/artifacts/index' });
  const [page, setPage] = useState(1);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  useLoad(() => {
    Taro.setNavigationBarTitle({ title: '剑来法宝图鉴' });
  });

  // 1. 定义固定 Filter 选项
  const FILTER_OPTIONS = ['全部', '神器', '仙兵', '半仙兵', '法宝', '灵器', '其他'];

  // 2. 过滤逻辑
  const filteredList = useMemo(() => {
    if (!itemList) return [];
    if (selectedGrades.length === 0 || selectedGrades.includes('全部')) return itemList;

    return itemList.filter(item => {
      const type = item.grade || '其他';
      if (selectedGrades.includes(type)) return true;
      if (selectedGrades.includes('其他') && !['神器', '仙兵', '半仙兵', '法宝', '灵器'].includes(type)) return true;
      return false;
    });
  }, [itemList, selectedGrades]);

  // 3. 分页逻辑
  const displayList = useMemo(() => {
    return filteredList.slice(0, page * PAGE_SIZE);
  }, [filteredList, page]);

  const handleScrollToLower = () => {
    if (displayList.length < filteredList.length) {
      setPage(prev => prev + 1);
    }
  };

  const handleToggleGrade = (grade: string) => {
    setPage(1);
    if (grade === '全部') {
      setSelectedGrades([]);
      return;
    }

    setSelectedGrades(prev => {
      // 既然 UI 上有 "全部"按钮，这里逻辑可以是：如果选了全部，清空；否则单选/多选
      // 这里采用单选切换逻辑，或者多选。 Design Brief 没详说，但 FilterBar 支持多选。
      // 鉴于 FilterBar UI，我们让 "全部" 只是重置状态。
      if (prev.includes(grade)) return prev.filter(g => g !== grade);
      return [grade]; // 暂定单选，体验更清晰
    });
  };

  const handleResetFilter = () => {
    setPage(1);
    setSelectedGrades([]);
  };

  const getGradeClass = (grade: string) => {
    if (grade === '神器') return 'grade-shenqi';
    if (grade === '仙兵') return 'grade-xianbing';
    if (grade === '半仙兵') return 'grade-banxianbing';
    if (grade === '法宝') return 'grade-fabao';
    if (grade === '灵器') return 'grade-lingqi';
    return 'grade-normal';
  };

  // getOwner helper removed, use item.current_owner directly

  return (
    <View className="artifacts-page">
      {/* 顶部筛选栏 */}
      <View className="filter-container">
        <FilterBar
          items={FILTER_OPTIONS.slice(1)} // 去掉全部，因为 FilterBar 内部有全部按钮
          selectedItems={selectedGrades}
          onToggle={handleToggleGrade}
          onReset={handleResetFilter}
        />
      </View>

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
                        <Icon name="sword" size={24} color="#999999" />
                      </View>
                    )}

                    <View className="card-right-section">
                      <View className="card-main">
                        <View className="card-header">
                          <View className="header-left">
                            {isShenqi && <Icon name="sparkle" size={16} color="#b8860b" />}
                            <Text className="item-name">{item.name}</Text>
                          </View>
                          <View className={`grade-tag ${getGradeClass(item.grade as string)}`}>
                            <Text>{item.grade || '未知'}</Text>
                          </View>
                        </View>

                        <Text className="item-desc" numberOfLines={3}>{item.description || '暂无描述'}</Text>
                      </View>

                      <View className="card-footer">
                        {item.current_owner ? (
                          <View className="info-item">
                            <Text className="label">持有：</Text>
                            <Text className="value">{item.current_owner}</Text>
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
            <Text>暂无相关法宝</Text>
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
