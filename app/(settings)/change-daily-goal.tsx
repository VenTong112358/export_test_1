import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@data/repository/store';
import { useDailyLearningLogs } from '@hooks/useDailyLearningLogs';
import axios from 'axios';
import { Header } from '../components/Header';
import { HttpClient } from '@data/api/HttpClient';
import { API_CONFIG, API_ENDPOINTS } from '@data/api/ApiConfig';

const { width, height } = Dimensions.get('window');

// 每日目标选项
const dailyGoalOptions = [
  { id: 1, words: 10, articles: 1, description: '10个单词 1篇文章' },
  { id: 2, words: 20, articles: 2, description: '20个单词 2篇文章' },
  { id: 3, words: 30, articles: 3, description: '30个单词 3篇文章' },
];

export default function ChangeDailyGoalPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, selectedWordBookId } = useSelector((state: RootState) => state.auth);
  const { additional_information } = useDailyLearningLogs();
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBackPress = () => {
    router.back();
  };

  const handleGoalSelect = (goalId: number) => {
    setSelectedGoal(goalId);
    const goal = dailyGoalOptions.find(option => option.id === goalId);
    console.log('[ChangeDailyGoalPage] Selected goal:', {
      id: goalId,
      words: goal?.words,
      articles: goal?.articles,
      description: goal?.description
    });
  };

  const handleCompletePress = async () => {
    if (!selectedGoal || !user) return;

    setIsSubmitting(true);
    
    try {
      // 获取单词本ID
      let wordBookId: number;
      
      if (selectedWordBookId) {
        wordBookId = selectedWordBookId;
        console.log('[ChangeDailyGoalPage] Using word book ID from Redux state:', wordBookId);
      } else if (additional_information?.word_book?.id) {
        wordBookId = additional_information.word_book.id;
        console.log('[ChangeDailyGoalPage] Using word book ID from additional_information:', wordBookId);
      } else {
        console.log('[ChangeDailyGoalPage] No word book ID found, using default value');
        wordBookId = 1;
      }

      const dailyGoal = dailyGoalOptions.find(option => option.id === selectedGoal)?.words || 10;
      
      // 使用HttpClient和正确的端点配置
      const httpClient = HttpClient.getInstance();
      const endpoint = API_ENDPOINTS.ACCOUNT_INITIATION(
        wordBookId, 
        dailyGoal
      );
      
      console.log('[ChangeDailyGoalPage] Sending API request:', {
        endpoint,
        userId: user.id,
        wordBookId,
        dailyGoal
      });
  
      const response = await httpClient.post(endpoint, {});
  
      console.log('[ChangeDailyGoalPage] API response:', response);
      
      // 处理成功响应，跳转到主页面
      console.log('[ChangeDailyGoalPage] Account initiation completed successfully');
      router.replace('/(tabs)/MainPage');
      
    } catch (error) {
      console.error('[ChangeDailyGoalPage] API error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGoalOption = (option: typeof dailyGoalOptions[0]) => {
    const isSelected = selectedGoal === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.goalOption,
          isSelected && styles.selectedGoalOption
        ]}
        onPress={() => handleGoalSelect(option.id)}
      >
        <View style={styles.goalIcon}>
          <Ionicons 
            name="flag" 
            size={24} 
            color={isSelected ? '#FC9833' : '#666'} 
          />
        </View>
        <Text style={[
          styles.goalText,
          isSelected && styles.selectedGoalText
        ]}>
          {option.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Header 
        title="更改每日目标"
        showBackButton={true}
        showMenuButton={false}
        showNotificationButton={false}
        onBackPress={handleBackPress}
      />

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.instruction}>请您更改每日目标</Text>
          <Text style={styles.instructionEn}>Please change your daily goal</Text>
        </View>

        {/* Goal Options */}
        <View style={styles.goalsContainer}>
          {dailyGoalOptions.map(renderGoalOption)}
        </View>

        {/* Complete Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            (!selectedGoal || isSubmitting) && styles.completeButtonDisabled
          ]}
          onPress={handleCompletePress}
          disabled={!selectedGoal || isSubmitting}
        >
          <Text style={[
            styles.completeButtonText,
            (!selectedGoal || isSubmitting) && styles.completeButtonTextDisabled
          ]}>
            {isSubmitting ? '提交中...' : '完成'}
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
  placeholder: {
    width: 40, // 保持header布局平衡
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
  goalsContainer: {
    marginBottom: height * 0.03,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedGoalOption: {
    borderColor: '#FC9833',
    backgroundColor: '#FFF8F0',
  },
  goalIcon: {
    marginRight: 16,
  },
  goalText: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '600',
    color: '#0C1A30',
    flex: 1,
  },
  selectedGoalText: {
    color: '#FC9833',
  },
  completeButton: {
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
  completeButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
  },
  completeButtonTextDisabled: {
    color: '#999',
  },
});