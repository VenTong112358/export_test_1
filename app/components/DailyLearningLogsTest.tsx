import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useDailyLearningLogs } from '@hooks/useDailyLearningLogs';
import { useSelector } from 'react-redux';
import { RootState } from '@data/repository/store';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
 

export const DailyLearningLogsTest = () => {
  const router = useRouter();
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const { user } = useSelector((state: RootState) => state.auth);
  const { 
    logs, 
    isLoading, 
    error, 
    hasLogs, 
    totalWords, 
    uniqueTags, 
    uniqueCEFR,
    additional_information,
    hasUserInfo,
    hasWordBook,
    hasLearningPlan,
    hasUserStats,
    fetchLogs,
    clearCache,
    resetState,
    clearErrorState
  } = useDailyLearningLogs();

  const handleFetchLogs = () => {
    if (user) {
      fetchLogs(parseInt(user.id));
    }
  };

  const handleClearCache = () => {
    if (user) {
      clearCache(parseInt(user.id));
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Daily Learning Logs Test</Text>
      </View>
      
      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.statusText}>Loading: {isLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.statusText}>Has Logs: {hasLogs ? 'Yes' : 'No'}</Text>
        <Text style={styles.statusText}>Total Logs: {logs.length}</Text>
        <Text style={styles.statusText}>Total Words: {totalWords}</Text>
        <Text style={styles.statusText}>Unique Tags: {uniqueTags.join(', ')}</Text>
        <Text style={styles.statusText}>Unique CEFR: {uniqueCEFR.join(', ')}</Text>
        <Text style={styles.statusText}>Has User Info: {hasUserInfo ? 'Yes' : 'No'}</Text>
        <Text style={styles.statusText}>Has Word Book: {hasWordBook ? 'Yes' : 'No'}</Text>
        <Text style={styles.statusText}>Has Learning Plan: {hasLearningPlan ? 'Yes' : 'No'}</Text>
        <Text style={styles.statusText}>Has User Stats: {hasUserStats ? 'Yes' : 'No'}</Text>
        {error && <Text style={styles.errorText}>Error: {error}</Text>}
      </View>

      {/* User Additional Information Section */}
      {additional_information && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 User Information</Text>
          
          {/* Word Book Info */}
          {additional_information.word_book && (
            <View style={styles.infoItem}>
              <Text style={styles.infoSubtitle}>📚 Current Word Book:</Text>
              <Text style={styles.infoText}>Name: {additional_information.word_book.name}</Text>
              <Text style={styles.infoText}>ID: {additional_information.word_book.id}</Text>
              <Text style={styles.infoText}>Total Words: {additional_information.word_book.total_words}</Text>
              {additional_information.word_book.description && (
                <Text style={styles.infoText}>Description: {additional_information.word_book.description}</Text>
              )}
              {additional_information.word_book.difficulty_level && (
                <Text style={styles.infoText}>Difficulty: {additional_information.word_book.difficulty_level}</Text>
              )}
            </View>
          )}
          
          {/* Learning Plan Info */}
          {additional_information.learning_plan && (
            <View style={styles.infoItem}>
              <Text style={styles.infoSubtitle}>📋 Learning Plan:</Text>
              <Text style={styles.infoText}>Daily Goal: {additional_information.learning_plan.daily_goal} words</Text>
              <Text style={styles.infoText}>Current Progression: {additional_information.learning_plan.current_progression}</Text>
              <Text style={styles.infoText}>Total Words: {additional_information.learning_plan.total_words}</Text>
              <Text style={styles.infoText}>Learning Proportion: {additional_information.learning_plan.learning_proportion}%</Text>
              <Text style={styles.infoText}>Learned Proportion: {additional_information.learning_plan.learned_proportion}%</Text>
            </View>
          )}
          
          {/* User Learning Stats */}
          {additional_information.user_learning_stats && (
            <View style={styles.infoItem}>
              <Text style={styles.infoSubtitle}>📈 Learning Statistics:</Text>
              <Text style={styles.infoText}>Total Words Learned: {additional_information.user_learning_stats.total_words_learned}</Text>
              <Text style={styles.infoText}>Current Streak: {additional_information.user_learning_stats.current_streak} days</Text>
              <Text style={styles.infoText}>Longest Streak: {additional_information.user_learning_stats.longest_streak} days</Text>
              <Text style={styles.infoText}>Average Daily Words: {additional_information.user_learning_stats.average_daily_words}</Text>
              <Text style={styles.infoText}>Completion Rate: {additional_information.user_learning_stats.completion_rate}%</Text>
            </View>
          )}
        </View>
      )}

      {/* Debug: Show if no user additional_information */}
      {hasLogs && !additional_information && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug: User Information</Text>
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>No additional_information found in API response</Text>
            <Text style={styles.debugText}>This means the backend API needs to be updated to include additional_information</Text>
            <Text style={styles.debugText}>Expected API response structure:</Text>
            <Text style={styles.debugText}>{"{ logs: [...], additional_information: { word_book: {...}, learning_plan: {...}, user_learning_stats: {...} } }"}</Text>
            <Text style={styles.debugText}>Current API response keys: {Object.keys(logs[0] || {}).join(', ')}</Text>
            <Text style={styles.debugText}>First log structure: {JSON.stringify(logs[0], null, 2)}</Text>
          </View>
        </View>
      )}

      {/* Debug: Show API response structure when additional_information exists */}
      {additional_information && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug: API Response Structure</Text>
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>✅ additional_information found!</Text>
            <Text style={styles.debugText}>Additional info keys: {Object.keys(additional_information).join(', ')}</Text>
            <Text style={styles.debugText}>Full additional_information structure:</Text>
            <Text style={styles.debugText}>{JSON.stringify(additional_information, null, 2)}</Text>
          </View>
        </View>
      )}

      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.button} onPress={handleFetchLogs}>
          <Text style={styles.buttonText}>Fetch Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleClearCache}>
          <Text style={styles.buttonText}>Clear Cache</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={resetState}>
          <Text style={styles.buttonText}>Reset State</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={clearErrorState}>
          <Text style={styles.buttonText}>Clear Error</Text>
        </TouchableOpacity>
      </View>

      {/* Logs Section */}
      {hasLogs && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Learning Logs</Text>
          {logs.map((log: any, index: number) => {
            const isExpanded = expandedLogs.has(log.id);
            return (
              <View key={log.id} style={styles.logItem}>
                <TouchableOpacity 
                  style={styles.logHeader}
                  onPress={() => {
                    const newExpanded = new Set(expandedLogs);
                    if (isExpanded) {
                      newExpanded.delete(log.id);
                    } else {
                      newExpanded.add(log.id);
                    }
                    setExpandedLogs(newExpanded);
                  }}
                >
                  <View style={styles.logHeaderContent}>
                    <Text style={styles.logTitle}>{log.english_title}</Text>
                    <Text style={styles.logSubtitle}>{log.chinese_title}</Text>
                    <Text style={styles.logMeta}>Tag: {log.tag} | CEFR: {log.CEFR} | Date: {log.date}</Text>
                    <Text style={styles.logWords}>Words: {log.daily_new_words.length}</Text>
                  </View>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              
                {isExpanded && (
                  <>
                    {/* Outline Section */}
                    <View style={styles.outlineSection}>
                      <Text style={styles.outlineTitle}>📋 Outline:</Text>
                      <Text style={styles.outlineText}>{log.outline}</Text>
                    </View>
                    
                    {/* Daily New Words Section */}
                    <View style={styles.wordsSection}>
                      <Text style={styles.wordsTitle}>📚 Daily New Words ({log.daily_new_words.length}):</Text>
                      {log.daily_new_words.map((word: any, wordIndex: number) => (
                        <View key={word.id} style={styles.wordItem}>
                          <View style={styles.wordHeader}>
                            <Text style={styles.wordText}>{word.word}</Text>
                            <Text style={styles.wordPhonetic}>[{word.phonetic}]</Text>
                            <Text style={styles.wordCEFR}>CEFR: {word.CEFR}</Text>
                          </View>
                          <Text style={styles.wordDefinition}>{word.definition}</Text>
                          
                          {/* Word Tags */}
                          {word.l_tags && word.l_tags.length > 0 && (
                            <View style={styles.wordTags}>
                              <Text style={styles.wordTagsTitle}>Tags:</Text>
                              {word.l_tags.map((tag: any, tagIndex: number) => (
                                <Text key={tagIndex} style={styles.wordTag}>
                                  {tag.name}
                                </Text>
                              ))}
                            </View>
                          )}
                          
                          {/* Word Status */}
                          {word.l_word_statuss && word.l_word_statuss.length > 0 && (
                            <View style={styles.wordStatus}>
                              <Text style={styles.wordStatusTitle}>Learning Status:</Text>
                              {word.l_word_statuss.slice(0, 5).map((status: any, statusIndex: number) => (
                                <Text key={statusIndex} style={styles.wordStatusItem}>
                                  {status.status} (factor: {status.learning_factor})
                                </Text>
                              ))}
                              {word.l_word_statuss.length > 5 && (
                                <Text style={styles.wordStatusMore}>
                                  ... and {word.l_word_statuss.length - 5} more
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFBF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#f44336',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logHeaderContent: {
    flex: 1,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  logSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  logMeta: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  logWords: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  // Outline Styles
  outlineSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  outlineTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  outlineText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  // Words Section Styles
  wordsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  wordsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  wordItem: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  wordText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  wordPhonetic: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginRight: 8,
  },
  wordCEFR: {
    fontSize: 10,
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  wordDefinition: {
    fontSize: 12,
    color: '#555',
    marginBottom: 6,
    lineHeight: 16,
  },
  wordTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  wordTagsTitle: {
    fontSize: 10,
    color: '#666',
    marginRight: 4,
  },
  wordTag: {
    fontSize: 10,
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  wordStatus: {
    marginTop: 4,
  },
  wordStatusTitle: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  wordStatusItem: {
    fontSize: 10,
    color: '#2196F3',
    marginBottom: 1,
  },
  wordStatusMore: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  // User Information Styles
  infoItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#673AB7',
  },
  infoSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 3,
    lineHeight: 16,
  },
  // Debug Styles
  debugInfo: {
    backgroundColor: '#FFF3CD',
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  debugText: {
    fontSize: 10,
    color: '#856404',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
}); 
export default DailyLearningLogsTest;
