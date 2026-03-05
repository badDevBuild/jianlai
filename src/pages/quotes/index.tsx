import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useMemo, useState } from 'react';
import { useQuotes, getAvatar } from '../../data/useData';
import { useAppShare } from '../../utils/share';
import './index.scss';

const PAGE_SIZE = 10;

export default function QuotesPage() {
  const { quotes: allQuotes, loading } = useQuotes();
  useAppShare({ title: '剑来光阴 - 经典语录', path: '/pages/quotes/index' });
  const [page, setPage] = useState(1);

  useLoad(() => {
    Taro.setNavigationBarTitle({ title: '剑来经典语录' });
  });

  // allQuotes is already shuffled by the hook


  const displayList = useMemo(() => {
    return allQuotes.slice(0, page * PAGE_SIZE);
  }, [allQuotes, page]);

  const handleScrollToLower = () => {
    if (displayList.length < allQuotes.length) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <View className="quotes-page">
      <View className="page-header">
        <Text className="title">经典语录</Text>
        <Text className="subtitle">共 {allQuotes.length} 条心声</Text>
      </View>

      <ScrollView
        scrollY
        className="quotes-list"
        onScrollToLower={handleScrollToLower}
        lowerThreshold={100}
      >
        {loading ? (
          <View className="loading">
            <Text>加载中...</Text>
          </View>
        ) : (
          <View className="list-wrapper">
            {displayList.map((quote, index) => (
              <View key={index} className="quote-card">
                <View className="quote-content">
                  <Text>{quote.content}</Text>
                </View>
                <View className="quote-footer" onClick={() => Taro.navigateTo({ url: `/pages/character-detail/index?name=${encodeURIComponent(quote.author)}` })}>
                  <View className="author-info">
                    <Text className="dash">——</Text>
                    <Text className="author-name">{quote.author}</Text>
                    {quote.context && <Text className="context"> · {quote.context}</Text>}
                  </View>
                  <Image className="author-avatar" src={quote.avatar} mode="aspectFill" />
                </View>
              </View>
            ))}
          </View>
        )}

        {displayList.length > 0 && displayList.length < allQuotes.length && (
          <View className="loading-more">
            <Text>加载更多...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
