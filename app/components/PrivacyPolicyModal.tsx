import React from 'react';
import {
    Dimensions,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

interface PrivacyPolicyModalProps {
  visible: boolean;
  onAccept: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  visible,
  onAccept,
}) => {
  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://masterwordai.com/%E5%85%B3%E4%BA%8E%E5%85%AC%E5%8F%B8-2');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>隐私政策</Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
            <Text style={styles.contentText}>
              欢迎使用仝文馆！为了保护您的隐私权和个人信息安全，我们制定了隐私政策。
            </Text>
            <Text style={styles.contentText}>
              使用本应用前，请仔细阅读我们的《隐私政策》，了解我们如何收集、使用和保护您的个人信息。
            </Text>
            <Text style={styles.contentText}>
              点击下方链接可查看完整的隐私政策内容。
            </Text>
          </ScrollView>

          {/* Policy Link Button */}
          <View style={styles.linkContainer}>
            <TouchableOpacity
              onPress={handleOpenPrivacyPolicy}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>阅读隐私政策</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={onAccept}
              style={styles.acceptButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              我同意隐私政策
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.08,
  },
  modalContainer: {
    backgroundColor: '#FFFBF8',
    borderRadius: 16,
    width: '100%',
    maxHeight: height * 0.75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.06,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#FFFBF8',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: 'bold',
    color: '#0C1A30',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.02,
    maxHeight: height * 0.35,
  },
  contentText: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#333333',
    lineHeight: 22,
    marginBottom: height * 0.01,
  },
  linkContainer: {
    paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.01,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  linkButton: {
    paddingVertical: height * 0.015,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#0066CC',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.02,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#FFFBF8',
  },
  acceptButton: {
    backgroundColor: '#FC9B33',
    borderRadius: 12,
    shadowColor: '#FC9B33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContent: {
    paddingVertical: height * 0.015,
  },
  buttonLabel: {
    color: 'white',
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
  },
});

