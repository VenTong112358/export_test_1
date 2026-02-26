import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { recipes } from '../constants/recipes';
import { StarRating } from './components/StarRating';

const FEEDBACK_ENDPOINT = 'https://masterwordai.com/api/learning_logs_feedback';
const APPRECIATION_ENDPOINT = 'https://masterwordai.com/api/appreciation';

const DIMENSIONS = [
  { key: 'lexical', title: '1. 文章质量' },
  { key: 'content', title: '2. 文章难度' },
  { key: 'grammatical', title: '3. 单词难度' },
  { key: 'engagement', title: '4. Overall Engagement' },
] as const;

const ArticleRateNew = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const logId = params.logId as string;

  const [lexical, setLexical] = useState(0);
  const [contentDepth, setContentDepth] = useState(0);
  const [grammatical, setGrammatical] = useState(0);
  const [engagement, setEngagement] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const canSubmit =
    lexical > 0 && contentDepth > 0 && grammatical > 0 && engagement > 0 && !loading;

  const handleSkip = () => {
    router.push(`/today-recap?logId=${logId}`);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const articleQuality = engagement;
      const articleDifficulty = Math.round((contentDepth + grammatical) / 2);
      const wordDifficulty = lexical;

      console.log('[ArticleRate] Submitting feedback:', {
        logId,
        article_quality: articleQuality,
        article_difficulty: articleDifficulty,
        word_difficulty: wordDifficulty,
      });

      const appreciationRes = await fetch(
        `${APPRECIATION_ENDPOINT}/${logId}/${articleQuality}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!appreciationRes.ok) {
        if (appreciationRes.status === 404) {
          Alert.alert('反馈失败', '未找到对应学习记录');
          return;
        }
        Alert.alert('反馈失败', '请稍后重试');
        return;
      }

      const feedbackRes = await fetch(`${FEEDBACK_ENDPOINT}/${logId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_difficulty: articleDifficulty,
          word_difficulty: wordDifficulty,
        }),
      });

      if (feedbackRes.ok) {
        setShowSuccessModal(true);
      } else if (feedbackRes.status === 404) {
        Alert.alert('反馈失败', '未找到对应学习记录');
      } else {
        Alert.alert('反馈失败', '请稍后重试');
      }
    } catch (e) {
      console.error('[ArticleRate] Network error:', e);
      Alert.alert('网络错误', '请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const ev = recipes.articleEvaluation;
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[ev.screenBg, styles.safe]}>
      <View style={[ev.header, { paddingTop: insets.top, height: undefined, minHeight: 56 + insets.top }]}>
        <View style={ev.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
              size={22}
              color={ev.headerBrand.color}
            />
          </TouchableOpacity>
          <Text style={ev.headerBrand}>VENTONG</Text>
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={ev.headerSkip}>Skip / 跳过</Text>
        </TouchableOpacity>
      </View>

      <View style={ev.main}>
        <Text style={ev.pageTitle}>ARTICLE EVALUATION</Text>
        <Text style={ev.subtitle}>
          Please rate the quality of the scholarly text across four dimensions:
        </Text>

        <View style={styles.dimensions}>
          <View style={ev.dimensionBlock}>
            <Text style={ev.dimensionTitle}>{DIMENSIONS[0].title}</Text>
            <StarRating value={lexical} onChange={setLexical} />
          </View>
          <View style={ev.dimensionBlock}>
            <Text style={ev.dimensionTitle}>{DIMENSIONS[1].title}</Text>
            <StarRating value={contentDepth} onChange={setContentDepth} />
          </View>
          <View style={ev.dimensionBlock}>
            <Text style={ev.dimensionTitle}>{DIMENSIONS[2].title}</Text>
            <StarRating value={grammatical} onChange={setGrammatical} />
          </View>
          <View style={ev.dimensionBlock}>
            <Text style={ev.dimensionTitle}>{DIMENSIONS[3].title}</Text>
            <StarRating value={engagement} onChange={setEngagement} />
          </View>
        </View>
      </View>

      <View style={ev.footer}>
        <TouchableOpacity
          style={[
            ev.submitButton,
            !canSubmit && styles.submitDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={ev.submitButtonText}>
                SUBMIT EVALUATION / 提交评价
              </Text>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={ev.modalOverlay}>
          <View style={ev.modalContent}>
            <Text style={ev.modalMessage}>谢谢，鼠鼠们收到啦！</Text>
            <TouchableOpacity
              style={[recipes.button.primaryCta, styles.modalCta]}
              onPress={() => {
                setShowSuccessModal(false);
                router.push(`/today-recap?logId=${logId}`);
              }}
            >
              <Text style={recipes.button.primaryCtaText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    padding: 8,
  },
  dimensions: {
    width: '100%',
    maxWidth: 400,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  modalCta: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
});

export default ArticleRateNew;
