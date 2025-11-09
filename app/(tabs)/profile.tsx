import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@data/repository/store';
import { Header } from '../components/Header';
import { logout } from '@data/usecase/UserUseCase';

const { width, height } = Dimensions.get('window');

export default function ProfilePage() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleChangeLearningPlan = () => {
    console.log('[ProfilePage] Change learning plan pressed');
    router.push('/(settings)/change-wordbook');
  };

  const handleChangePhone = () => {
    console.log('[ProfilePage] Change phone pressed');
    router.push('/(settings)/change-phone');
  };

  const handleLogoutPress = () => {
    console.log('[ProfilePage] Logout pressed');
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    console.log('[ProfilePage] Confirm logout pressed');
    setShowLogoutModal(false);
    await dispatch(logout());
    router.replace('/(auth)/login');
  };

  const handleCancelLogout = () => {
    console.log('[ProfilePage] Cancel logout pressed');
    setShowLogoutModal(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FC9833' }]}>
      {/* Header */}
      <Header 
        title="仝文馆"
        showMenuButton={false}
        showNotificationButton={false}
        backgroundColor="#FC9833"
        titleColor="white"
        iconColor="white"
      />

      {/* User Profile Section */}
      <View style={styles.profileSection}>
        {/* Geometric Background Elements */}
        <View style={styles.geometricContainer}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.triangle} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="white" />
          </View>
        </View>

        {/* User ID */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.userIdText}>
            User ID: {user?.id || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Function List Section */}
      <View style={styles.functionSection}>
        {/* Change Learning Plan Row */}
        <TouchableOpacity 
          style={styles.listRow}
          onPress={handleChangeLearningPlan}
        >
          <View style={styles.rowContent}>
            <Ionicons name="calendar" size={24} color="white" />
            <Text style={styles.rowText}>更改学习计划</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
        </TouchableOpacity>

        {/* Change Phone Row */}
        <TouchableOpacity 
          style={styles.listRow}
          onPress={handleChangePhone}
        >
          <View style={styles.rowContent}>
            <Ionicons name="phone-portrait" size={24} color="white" />
            <Text style={styles.rowText}>修改手机号</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
        </TouchableOpacity>

        {/* Logout Row */}
        <TouchableOpacity 
          style={styles.listRow}
          onPress={handleLogoutPress}
        >
          <View style={styles.rowContent}>
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text style={styles.rowText}>退出登录</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
        </TouchableOpacity>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>确认退出登录吗？</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelLogout}
              >
                <Text style={styles.cancelButtonText}>否</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.confirmButtonText}>是</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: height * 0.05,
    paddingBottom: height * 0.03,
    position: 'relative',
  },
  geometricContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  circle1: {
    position: 'absolute',
    top: height * 0.02,
    right: width * 0.1,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle2: {
    position: 'absolute',
    top: height * 0.08,
    left: width * 0.05,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  triangle: {
    position: 'absolute',
    top: height * 0.15,
    right: width * 0.05,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 30,
    borderRightWidth: 30,
    borderBottomWidth: 52,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  avatarContainer: {
    marginBottom: height * 0.02,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userInfoContainer: {
    alignItems: 'center',
  },
  userIdText: {
    color: 'white',
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '600',
  },
  functionSection: {
    flex: 1,
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.02,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.04,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginLeft: width * 0.03,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: width * 0.04,
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
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  modalButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#FC9B33',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});