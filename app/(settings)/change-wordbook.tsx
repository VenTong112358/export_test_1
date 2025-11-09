import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@data/repository/store';
import { setSelectedWordBookId } from '@data/usecase/UserUseCase';
import { wordBooks, getWordBooksByCategory, WordBook } from '@data/model/WordBook';

const { width, height } = Dimensions.get('window');

// 分类映射
const categoryLabels = {
  'midschool': '初中',
  'highschool': '高中', 
  'college': '大学',
  'studyabroad': '出国'
};

export default function ChangeWordbookPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const { selectedWordBookId } = useSelector((state: RootState) => state.auth);
  const [selectedWordBook, setSelectedWordBook] = useState<WordBook | null>(
    selectedWordBookId ? wordBooks.find(book => book.id === selectedWordBookId) || null : null
  );

  const handleBackPress = () => {
    router.back();
  };

  const handleSkipPress = () => {
    console.log('[ChangeWordbookPage] Skip pressed');
    // 即使跳过，也保存选择的单词本信息（如果有的话）
    if (selectedWordBook) {
      console.log('[ChangeWordbookPage] Saving selected word book for skip:', selectedWordBook);
      dispatch(setSelectedWordBookId(selectedWordBook.id));
    }
    router.push('/(settings)/change-daily-goal');
  };

  const handleContinuePress = () => {
    if (selectedWordBook) {
      console.log('[ChangeWordbookPage] Continue pressed with selected word book:', selectedWordBook.name);
      // 保存选择的单词本信息
      console.log('[ChangeWordbookPage] Saving selected word book for continue:', selectedWordBook);
      dispatch(setSelectedWordBookId(selectedWordBook.id));
      router.push('/(settings)/change-daily-goal');
    }
  };

  const handleWordBookSelect = (wordBook: WordBook) => {
    setSelectedWordBook(wordBook);
    console.log('[ChangeWordbookPage] Selected word book:', {
      id: wordBook.id,
      name: wordBook.name,
      category: wordBook.category,
      total_words: wordBook.total_words,
      description: wordBook.description
    });
  };

  const renderWordBookItem = (wordBook: WordBook) => {
    const isSelected = selectedWordBook?.id === wordBook.id;
    
    return (
      <TouchableOpacity
        key={wordBook.id}
        style={[
          styles.wordBookItem,
          isSelected && styles.selectedWordBookItem
        ]}
        onPress={() => handleWordBookSelect(wordBook)}
      >
        <View style={styles.bookIcon}>
          <Ionicons 
            name="book" 
            size={20} 
            color={isSelected ? '#FC9833' : '#666'} 
          />
        </View>
        <Text style={[
          styles.wordBookName,
          isSelected && styles.selectedWordBookName
        ]}>
          {wordBook.name}
        </Text>
        <Text style={styles.wordBookWords}>
          {wordBook.total_words} 词
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCategorySection = (category: string) => {
    const categoryWordBooks = getWordBooksByCategory(category);
    const label = categoryLabels[category as keyof typeof categoryLabels];
    
    return (
      <View key={category} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{label}</Text>
        <View style={styles.wordBookGrid}>
          {categoryWordBooks.map(renderWordBookItem)}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#0C1A30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>更改单词本</Text>
        <TouchableOpacity style={styles.notificationButton} onPress={handleSkipPress}>
          <Text style={styles.skipButtonText}>跳过</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.instruction}>请您选择待背单词本</Text>
          <Text style={styles.instructionEn}>Please select your word book</Text>
        </View>

        {/* Word Book Categories */}
        <View style={styles.categoriesContainer}>
          {Object.keys(categoryLabels).map(renderCategorySection)}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedWordBook && styles.continueButtonDisabled
          ]}
          onPress={handleContinuePress}
          disabled={!selectedWordBook}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedWordBook && styles.continueButtonTextDisabled
          ]}>
            继续
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    backgroundColor: '#FFFBF8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    color: '#FC9833',
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
  },
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  skipButtonText: {
    color: '#FC9833',
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.04,
  },
  titleSection: {
    paddingVertical: height * 0.03,
  },
  instruction: {
    fontSize: 20,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    color: '#0C1A30',
    fontWeight: '600',
    marginBottom: height * 0.005,
  },
  instructionEn: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#838589',
    marginBottom: height * 0.01,
  },
  categoriesContainer: {
    marginBottom: height * 0.005,
  },
  categorySection: {
    marginBottom: height * 0.000005,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
    color: '#FC9833',
    marginBottom: height * 0.01,
    paddingHorizontal: width * 0.02,
  },
  wordBookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wordBookItem: {
    width: (width - width * 0.08 - 24) / 3, // 一行3本书，减去padding和间距
    aspectRatio: 2/3, // 竖版3:2比例
    backgroundColor: 'white',
    borderRadius: 8, // 减少圆角
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedWordBookItem: {
    borderColor: '#FC9833',
    backgroundColor: '#FFF8F0',
  },
  bookIcon: {
    marginBottom: 8,
  },
  wordBookName: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '600',
    color: '#0C1A30',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedWordBookName: {
    color: '#FC9833',
  },
  wordBookWords: {
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#838589',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#FC9833',
    borderRadius: 12,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.04,
    alignItems: 'center',
    marginBottom: height * 0.03,
    shadowColor: '#FC9833',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
  },
  continueButtonTextDisabled: {
    color: '#999',
  },
});