import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Header } from './components/Header';
import { DigitRating } from './components/DigitRating';

const { width, height } = Dimensions.get('window');

const FEEDBACK_ENDPOINT = 'https://masterwordai.com/api/learning_logs_feedback';
const APPRECIATION_ENDPOINT = 'https://masterwordai.com/api/appreciation';

const ArticleRateNew = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const logId = params.logId as string;

  const [articleQuality, setArticleQuality] = useState(0);
  const [articleDifficulty, setArticleDifficulty] = useState(0);
  const [wordDifficulty, setWordDifficulty] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const canSubmit = articleQuality > 0 && articleDifficulty > 0 && wordDifficulty > 0 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      console.log('[ArticleRate] Submitting feedback:', {
        logId,
        article_quality: articleQuality,
        article_difficulty: articleDifficulty,
        word_difficulty: wordDifficulty,
      });
      
      // Submit article quality feedback
      const appreciationRes = await fetch(`${APPRECIATION_ENDPOINT}/${logId}/${articleQuality}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('[ArticleRate] Appreciation response status:', appreciationRes.status);
      
      if (!appreciationRes.ok) {
        if (appreciationRes.status === 404) {
          console.error('[ArticleRate] Appreciation failed: Log not found');
          Alert.alert('反馈失败', '未找到对应学习记录');
          return;
        } else {
          console.error('[ArticleRate] Appreciation failed with status:', appreciationRes.status);
          Alert.alert('反馈失败', '请稍后重试');
          return;
        }
      }
      
      // Submit difficulty feedback
      const feedbackRes = await fetch(`${FEEDBACK_ENDPOINT}/${logId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_difficulty: articleDifficulty,
          word_difficulty: wordDifficulty,
        }),
      });
      
      console.log('[ArticleRate] Feedback response status:', feedbackRes.status);
      
      if (feedbackRes.ok) {
        const responseData = await feedbackRes.json();
        console.log('[ArticleRate] Feedback submitted successfully:', responseData);
        
        // 显示成功弹窗
        setShowSuccessModal(true);
      } else if (feedbackRes.status === 404) {
        console.error('[ArticleRate] Feedback failed: Log not found');
        Alert.alert('反馈失败', '未找到对应学习记录');
      } else {
        console.error('[ArticleRate] Feedback failed with status:', feedbackRes.status);
        Alert.alert('反馈失败', '请稍后重试');
      }
    } catch (e) {
      console.error('[ArticleRate] Network error:', e);
      Alert.alert('网络错误', '请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFBF8' }}>
      <Header 
        title="文章反馈" 
        showBackButton 
        customRightComponent={
          <TouchableOpacity 
            onPress={() => router.push(`/today-recap?logId=${logId}`)}
          >
            <Text style={{ color: '#FC9B33', fontSize: 16, fontWeight: '600' }}>跳过</Text>
          </TouchableOpacity>
        }
      />
      <View style={{ flex: 1, alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 }}>
        {/* 文章质量评分 */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FC9B33', marginBottom: 12, alignSelf: 'flex-start', alignItems: 'center' }}>您觉得文章质量如何</Text>
        <DigitRating value={articleQuality} onChange={setArticleQuality} />
        {/* 文章难度评分 */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FC9B33', marginBottom: 12, marginTop: 32, alignSelf: 'flex-start', alignItems: 'center' }}>您觉得文章难度如何</Text>
        <DigitRating value={articleDifficulty} onChange={setArticleDifficulty} />
        {/* 单词难度评分 */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FC9B33', marginBottom: 12, marginTop: 32, alignSelf: 'flex-start' }}>您觉得单词难度如何</Text>
        <DigitRating value={wordDifficulty} onChange={setWordDifficulty} />
        {/* 提交按钮 */}
        <TouchableOpacity
          style={{ marginTop: 48, backgroundColor: canSubmit ? '#FC9B33' : '#eee', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 48, alignItems: 'center', alignSelf: 'center', minWidth: 180 }}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>提交反馈</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {/* 成功弹窗 */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>谢谢，鼠鼠们收到啦！</Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#FC9B33',
                borderRadius: 20,
                paddingVertical: 10,
                paddingHorizontal: 24,
                marginTop: 16,
              }}
              onPress={() => {
                setShowSuccessModal(false);
                router.push(`/today-recap?logId=${logId}`);
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// =================== 旧实现全部注释掉 ===================
/*
//   return (
//     <View style={styles.container}>
/*       Header 
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#0C1A30" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrapper}>
            <Text style={styles.headerTitle}>Article Rate</Text>
          </View>
          <View style={{ width: 32 }} /> 
        </View>
        Main Content 
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>你觉得文章难度怎么样</Text>
          </View>
          <View style={styles.buttonsContainer}>
            {feedbackOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.button}
                onPress={() => handleFeedback(option.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
//   );
// }
*/
// =================== 新实现将在下方添加 ===================

export default ArticleRateNew;
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
  headerTitleWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FC9B33',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  content: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 32,
    width: '100%',
  },
  titleContainer: {
    backgroundColor: '#FC9B33',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 8,
    marginBottom: 22,
    alignSelf: 'flex-start',
  },
  titleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'flex-end',
    gap: 12,
    justifyContent: 'flex-end',
  },
  button: {
    borderColor: '#FC9B33',
    borderWidth: 1.2,
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginBottom: 10,
    minWidth: 180,
    alignItems: 'center',
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },
  buttonText: {
    color: '#FC9B33',
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 280,
    minHeight: 120,
  },
  modalText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
});
