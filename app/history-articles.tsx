import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { Header } from './components/Header';

// 模拟数据
const mockHistoryData = [
  {
    id: 1,
    title: "The Future of Artificial Intelligence",
    date: "2024-01-15",
    status: "completed",
    wordsLearned: 25,
    readingTime: "15分钟",
    progress: 100
  },
  {
    id: 2,
    title: "Climate Change and Global Warming",
    date: "2024-01-14",
    status: "in_progress",
    wordsLearned: 18,
    readingTime: "12分钟",
    progress: 75
  },
  {
    id: 3,
    title: "The History of Space Exploration",
    date: "2024-01-13",
    status: "completed",
    wordsLearned: 32,
    readingTime: "20分钟",
    progress: 100
  },
  {
    id: 4,
    title: "Understanding Quantum Physics",
    date: "2024-01-12",
    status: "in_progress",
    wordsLearned: 15,
    readingTime: "8分钟",
    progress: 45
  }
];

const HistoryArticles: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [articles] = useState(mockHistoryData);

  const onRefresh = async () => {
    setRefreshing(true);
    // 模拟刷新延迟
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleArticlePress = (article: any) => {
    router.push({
      pathname: '/PassageMain',
      params: {
        articleId: article.id.toString(),
        title: article.title
      }
    });
  };

  const renderArticleItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.articleCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleArticlePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.articleHeader}>
        <Text style={[styles.articleTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={[styles.statusBadge, { 
          backgroundColor: item.status === 'completed' ? '#4CAF50' : '#FF9800' 
        }]}>
          <Text style={styles.statusText}>
            {item.status === 'completed' ? '已完成' : '进行中'}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.articleDate, { color: theme.colors.textSecondary }]}>
        {new Date(item.date).toLocaleDateString('zh-CN')}
      </Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            {
              width: `${item.progress}%`,
              backgroundColor: item.status === 'completed' ? '#4CAF50' : '#FF9800'
            }
          ]} />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
          {item.progress}%
        </Text>
      </View>
      
      <View style={styles.articleStats}>
        <View style={styles.statItem}>
          <Ionicons name="book-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            新单词: {item.wordsLearned} 个
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            阅读时长: {item.readingTime}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="历史文章"
        showBackButton={true}
        showMenuButton={false}
        showNotificationButton={false}
      />
      <View style={styles.content}>
        {articles && articles.length > 0 ? (
          <FlatList
            data={articles}
            renderItem={renderArticleItem}
            keyExtractor={(item) => item.id.toString()}
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
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>暂无历史文章</Text>
            <Text style={[styles.emptySubText, { color: theme.colors.textSecondary }]}>开始阅读后，这里会显示您的阅读历史</Text>
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
    marginBottom: 8,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  articleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
});

export default HistoryArticles;