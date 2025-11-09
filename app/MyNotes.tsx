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

// 模拟笔记数据
const mockNotesData = [
  {
    id: 1,
    articleTitle: "The Future of Artificial Intelligence",
    noteContent: "AI的发展将会改变我们的生活方式，特别是在自动化和决策支持方面。",
    highlightedText: "artificial intelligence will revolutionize",
    date: "2024-01-15",
    type: "note", // note, highlight, bookmark
    articleId: 1
  },
  {
    id: 2,
    articleTitle: "Climate Change and Global Warming",
    noteContent: "温室效应是导致全球变暖的主要原因之一。",
    highlightedText: "greenhouse effect",
    date: "2024-01-14",
    type: "highlight",
    articleId: 2
  },
  {
    id: 3,
    articleTitle: "The History of Space Exploration",
    noteContent: "人类对太空的探索始于20世纪中期，阿波罗计划是一个重要的里程碑。",
    highlightedText: "Apollo program was a significant milestone",
    date: "2024-01-13",
    type: "note",
    articleId: 3
  },
  {
    id: 4,
    articleTitle: "Understanding Quantum Physics",
    noteContent: "",
    highlightedText: "quantum entanglement phenomenon",
    date: "2024-01-12",
    type: "bookmark",
    articleId: 4
  }
];

const MyNotes: React.FC = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [notes] = useState(mockNotesData);
  const [filter, setFilter] = useState('all'); // all, note, highlight, bookmark

  const onRefresh = async () => {
    setRefreshing(true);
    // 模拟刷新延迟
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleNotePress = (note: any) => {
    router.push({
      pathname: '/PassageMain',
      params: {
        articleId: note.articleId.toString(),
        title: note.articleTitle,
        highlightId: note.id.toString()
      }
    });
  };

  const getFilteredNotes = () => {
    if (filter === 'all') return notes;
    return notes.filter(note => note.type === filter);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note':
        return 'document-text-outline';
      case 'highlight':
        return 'color-wand-outline';
      case 'bookmark':
        return 'bookmark-outline';
      default:
        return 'document-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'note':
        return '#2196F3';
      case 'highlight':
        return '#FF9800';
      case 'bookmark':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'note':
        return '笔记';
      case 'highlight':
        return '高亮';
      case 'bookmark':
        return '书签';
      default:
        return '其他';
    }
  };

  const renderFilterButton = (filterType: string, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: filter === filterType ? theme.colors.primary : 'transparent',
          borderColor: theme.colors.primary
        }
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        {
          color: filter === filterType ? '#FFFFFF' : theme.colors.primary
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderNoteItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.noteCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleNotePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteTypeContainer}>
          <Ionicons 
            name={getTypeIcon(item.type) as any} 
            size={16} 
            color={getTypeColor(item.type)} 
          />
          <Text style={[styles.noteType, { color: getTypeColor(item.type) }]}>
            {getTypeLabel(item.type)}
          </Text>
        </View>
        <Text style={[styles.noteDate, { color: theme.colors.textSecondary }]}>
          {new Date(item.date).toLocaleDateString('zh-CN')}
        </Text>
      </View>
      
      <Text style={[styles.articleTitle, { color: theme.colors.text }]} numberOfLines={1}>
        {item.articleTitle}
      </Text>
      
      {item.highlightedText && (
        <View style={[styles.highlightContainer, { backgroundColor: getTypeColor(item.type) + '20' }]}>
          <Text style={[styles.highlightedText, { color: getTypeColor(item.type) }]}>
            "{item.highlightedText}"
          </Text>
        </View>
      )}
      
      {item.noteContent && (
        <Text style={[styles.noteContent, { color: theme.colors.text }]} numberOfLines={3}>
          {item.noteContent}
        </Text>
      )}
    </TouchableOpacity>
  );

  const filteredNotes = getFilteredNotes();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="我的笔记"
        showBackButton={true}
        showMenuButton={false}
        showNotificationButton={false}
      />
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterButton('all', '全部')}
          {renderFilterButton('note', '笔记')}
          {renderFilterButton('highlight', '高亮')}
          {renderFilterButton('bookmark', '书签')}
        </ScrollView>
      </View>
      
      <View style={styles.content}>
        {filteredNotes && filteredNotes.length > 0 ? (
          <FlatList
            data={filteredNotes}
            renderItem={renderNoteItem}
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
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>暂无笔记</Text>
            <Text style={[styles.emptySubText, { color: theme.colors.textSecondary }]}>在阅读文章时添加笔记和高亮，它们会显示在这里</Text>
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
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
  noteCard: {
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
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteType: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  noteDate: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  highlightContainer: {
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  highlightedText: {
    fontSize: 13,
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
});

export default MyNotes;