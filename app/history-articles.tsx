import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../data/repository/store';
import { fetchAllArticles } from '../data/usecase/AllArticlesUseCase';
import { useTheme } from '../hooks/useTheme';
import { Header } from './components/Header';

const HistoryArticles: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const allArticlesState = useSelector((state: RootState) => state.allArticles);
  const articles = allArticlesState?.articles || [];
  const loading = allArticlesState?.loading || false;
  const error = allArticlesState?.error || null;
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // 默认降序（最新的在前）

  // 获取所有文章
  const loadArticles = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      await dispatch(fetchAllArticles()).unwrap();
    } catch (error) {
      console.error('[HistoryArticles] Error fetching articles:', error);
      Alert.alert('错误', '加载文章失败，请重试');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [dispatch]);

  const onRefresh = async () => {
    await loadArticles(true);
  };

  // 切换排序顺序
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // 根据排序顺序对文章进行排序
  const sortedArticles = useMemo(() => {
    if (!articles || articles.length === 0) return [];
    
    const sorted = [...articles].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      if (sortOrder === 'asc') {
        return dateA - dateB; // 升序：旧的在前
      } else {
        return dateB - dateA; // 降序：新的在前
      }
    });
    
    return sorted;
  }, [articles, sortOrder]);

  const handleArticlePress = (article: any) => {
    if (!article || !article.log_id) {
      console.error('[HistoryArticles] Invalid article data:', article);
      return;
    }
    // 使用 log_id 作为 sessionId 导航到 PassageMain
    router.push({
      pathname: '/PassageMain',
      params: {
        sessionId: article.log_id.toString()
      }
    });
  };

  const renderArticleItem = ({ item }: { item: any }) => {
    if (!item) return null;
    
    const isCompleted = item.status === 'learned';
    const newWordsCount = item.daily_new_words_count || 0;
    const reviewedWordsCount = item.daily_reviewed_words_count || 0;
    
    return (
      <TouchableOpacity
        style={[styles.articleCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleArticlePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.articleHeader}>
          <Text style={[styles.articleTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
            {item.english_title || item.chinese_title || '无标题'}
          </Text>
          <View style={[styles.statusBadge, { 
            backgroundColor: isCompleted ? '#4CAF50' : '#FF9800' 
          }]}>
            <Text style={styles.statusText}>
              {isCompleted ? '已完成' : '进行中'}
            </Text>
          </View>
        </View>
        
        {item.chinese_title && (
          <Text style={[styles.articleSubtitle, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
            {item.chinese_title}
          </Text>
        )}
        
        <Text style={[styles.articleDate, { color: theme.colors.onSurfaceVariant }]}>
          {item.date ? new Date(item.date).toLocaleDateString('zh-CN') : '未知日期'}
        </Text>
        
        <View style={styles.articleStats}>
          <View style={styles.statItem}>
            <Ionicons name="book-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              新单词: {newWordsCount} 个
            </Text>
          </View>
          {reviewedWordsCount > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="refresh-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                复习: {reviewedWordsCount} 个
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // 排序按钮组件
  const sortButton = (
    <TouchableOpacity
      style={styles.sortButton}
      onPress={toggleSortOrder}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
        size={24} 
        color={theme.colors.onSurface} 
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="历史文章"
        showBackButton={true}
        showMenuButton={false}
        showNotificationButton={false}
        customRightComponent={sortButton}
      />
      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>加载中...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
            <Text style={[styles.errorText, { color: theme.colors.onSurface }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} 
              onPress={() => loadArticles()}
            >
              <Text style={styles.retryButtonText}>重试</Text>
            </TouchableOpacity>
          </View>
        ) : sortedArticles && sortedArticles.length > 0 ? (
          <FlatList
            data={sortedArticles}
            renderItem={renderArticleItem}
            keyExtractor={(item, index) => item?.id?.toString() || item?.log_id?.toString() || `article-${index}`}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
            contentContainerStyle={styles.emptyContainer}
          >
            <Ionicons name="document-text-outline" size={64} color="#CCCCCC" />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>暂无历史文章</Text>
            <Text style={[styles.emptySubText, { color: theme.colors.onSurfaceVariant }]}>开始阅读后，这里会显示您的阅读历史</Text>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  articleCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  articleSubtitle: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  articleDate: {
    fontSize: 14,
    marginBottom: 12,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  articleStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  sortButton: {
    padding: 8,
  },
});

export default HistoryArticles;
