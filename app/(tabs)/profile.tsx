import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@data/repository/store';
import { logout } from '@data/usecase/UserUseCase';
import { recipes } from '../../constants/recipes';
import { designTokensColors as c } from '../../constants/designTokens';

const profile = recipes.scholarProfile;

export default function ProfilePage() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const displayName = (user?.username ?? `Scholar ${user?.id ?? ''}`.trim()) || 'Scholar';
  const phoneMask = user?.phone ? `+86 ${user.phone.slice(0, 3)} •••• ${user.phone.slice(-4)}` : '+86 (•••) •••-••••';

  const handleChangeStudyGoal = () => {
    router.push('/(settings)/change-daily-goal');
  };

  const handleUpdateSecurity = () => {
    router.push('/(settings)/change-phone');
  };

  const handleLogoutPress = () => setShowLogoutModal(true);

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await dispatch(logout());
    router.replace('/(auth)/login');
  };

  const handleCancelLogout = () => setShowLogoutModal(false);

  return (
    <SafeAreaView
      style={[profile.screen, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: VenTong / 仝文馆 + Scholar's Profile */}
        <View style={[profile.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
          <Text style={[profile.headerSubtitle, { color: theme.colors.accent }]}>
            VenTong / 仝文馆
          </Text>
          <Text style={[profile.headerTitle, { color: theme.colors.primary }]}>
            Scholar's Profile
          </Text>
        </View>

        <View style={styles.main}>
          {/* Profile block: avatar + name + badge */}
          <View style={profile.profileBlock}>
            <View style={[profile.avatarOuter, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <View style={[profile.avatarInner, { backgroundColor: theme.colors.background }]}>
                <Ionicons name="person" size={48} color={theme.colors.outline} />
              </View>
            </View>
            <Text style={[profile.displayName, { color: theme.colors.primary }]} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={[profile.roleBadge, { borderColor: theme.colors.accent }]}>
              <Text style={[profile.roleBadgeText, { color: theme.colors.accent }]}>
                Senior Scholar
              </Text>
            </View>
          </View>

          {/* Lexical Achievement card */}
          <View style={[profile.achievementCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[profile.achievementCardTitle, { color: theme.colors.onSurfaceVariant }]}>
              Lexical Achievement
            </Text>
            <View style={profile.achievementRow}>
              <View style={profile.achievementStat}>
                <Text style={[profile.achievementStatValue, { color: theme.colors.primary }]}>
                  4,820
                </Text>
                <Text style={[profile.achievementStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Words Mastered
                </Text>
              </View>
              <View style={[profile.achievementStatRight, { borderLeftColor: theme.colors.border }]}>
                <Text style={[profile.achievementStatValue, { color: theme.colors.primary }]}>
                  128
                </Text>
                <Text style={[profile.achievementStatLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Day Streak
                </Text>
              </View>
            </View>
          </View>

          {/* Academic Settings */}
          <Text style={[profile.settingsSectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            Academic Settings
          </Text>
          <TouchableOpacity
            style={[profile.settingRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={handleChangeStudyGoal}
            activeOpacity={0.7}
          >
            <View style={profile.settingRowLeft}>
              <Text style={[profile.settingRowLabel, { color: theme.colors.onSurfaceVariant }]}>
                Change Study Goal
              </Text>
              <Text style={[profile.settingRowValue, { color: theme.colors.primary }]}>
                5 Scholarly Articles
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.outline} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[profile.settingRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={handleUpdateSecurity}
            activeOpacity={0.7}
          >
            <View style={profile.settingRowLeft}>
              <Text style={[profile.settingRowLabel, { color: theme.colors.onSurfaceVariant }]}>
                Update Security
              </Text>
              <Text style={[profile.settingRowValue, { color: theme.colors.primary }]} numberOfLines={1}>
                {phoneMask}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.outline} />
          </TouchableOpacity>

          {/* Log out + version */}
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={[profile.logoutButton, { borderColor: theme.colors.primary }]}
              onPress={handleLogoutPress}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.primary} />
              <Text style={[profile.logoutButtonText, { color: theme.colors.primary }]}>
                Log Out / 退出登录
              </Text>
            </TouchableOpacity>
            <Text style={[profile.versionText, { color: theme.colors.onSurfaceVariant }]}>
              Version 2.4.1 (Academic Edition)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Logout confirmation modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalText, { color: theme.colors.onSurfaceVariant }]}>
              确认退出登录吗？
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: c.progressBg }]}
                onPress={handleCancelLogout}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.onSurfaceVariant }]}>否</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, recipes.button.primaryCta]}
                onPress={handleConfirmLogout}
              >
                <Text style={recipes.button.primaryCtaText}>是</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  main: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  logoutSection: {
    marginTop: 48,
    paddingHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  modalText: {
    fontSize: 16,
    fontWeight: '500',
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
  cancelButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
