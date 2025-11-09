import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import Svg, { G, Path, Defs, ClipPath, Rect } from 'react-native-svg';

interface TranslationToggleProps {
  showTranslation: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

const TranslationIcon = () => (
  <Svg width="18" height="20" viewBox="0 0 18 20" fill="none">
    <G clipPath="url(#clip0_2280_923)">
      <Path 
        d="M16.7234 11.4787H13.7446V10.1627C13.7446 9.86073 13.5095 9.61613 13.2188 9.61613C12.9284 9.61613 12.6941 9.86073 12.6941 10.1627V11.4787H9.71622C9.4248 11.4787 9.19063 11.7233 9.19063 12.0264V15.737C9.19063 16.0379 9.4248 16.2825 9.71622 16.2825H12.6941V18.5574C12.6941 18.8594 12.9285 19.104 13.2188 19.104C13.5095 19.104 13.7446 18.8594 13.7446 18.5574V16.2825H16.7234C17.013 16.2825 17.2481 16.0379 17.2481 15.737V12.0264C17.2481 11.7233 17.013 11.4787 16.7234 11.4787ZM12.6942 15.1883H10.2421V12.573H12.6942V15.1883ZM16.1978 15.1883H13.7447V12.573H16.1978V15.1883ZM6.94927 8.74313C6.94927 8.46203 6.73093 8.23403 6.46111 8.23403H1.89316V5.74783H6.46111C6.73102 5.74783 6.94927 5.51923 6.94927 5.23873C6.94927 4.95713 6.73093 4.72913 6.46111 4.72913H1.89316V2.24333H6.46111C6.73102 2.24333 6.94927 2.01483 6.94927 1.73423C6.94927 1.45263 6.73093 1.22463 6.46111 1.22463H1.40401C1.1341 1.22463 0.914856 1.45263 0.914856 1.73423V8.74323C0.914856 9.02433 1.1341 9.25233 1.40401 9.25233H6.46111C6.73102 9.25223 6.94927 9.02423 6.94927 8.74313ZM9.21502 17.3591C8.57441 17.3247 7.94266 17.1786 7.34293 16.926C5.00221 15.9421 3.5479 13.5194 3.72502 10.8989C3.74095 10.6709 3.60037 10.4616 3.3886 10.396C3.17683 10.3325 2.95192 10.4293 2.84608 10.6314L1.87624 12.4846C1.75249 12.7209 1.83592 13.0176 2.06362 13.1467C2.29042 13.2758 2.57527 13.1884 2.69893 12.951L2.88451 12.5981C3.29302 14.9219 4.81195 16.9136 6.99247 17.8319C7.689 18.1245 8.42254 18.2939 9.16632 18.3338H9.19161C9.43893 18.3338 9.64612 18.1318 9.65917 17.8715C9.67132 17.6017 9.47268 17.3716 9.21502 17.3591ZM9.16632 1.97263C9.80702 2.00642 10.4389 2.15242 11.0386 2.40523C13.3793 3.38903 14.8335 5.81133 14.6574 8.43233C14.6414 8.66083 14.781 8.86963 14.9928 8.93413C15.0368 8.94713 15.08 8.95393 15.124 8.95393C15.2917 8.95393 15.452 8.85923 15.5354 8.69943L16.5052 6.84673C16.6288 6.61033 16.5454 6.31363 16.3177 6.18503C16.0909 6.05493 15.8061 6.14293 15.6824 6.37973L15.4968 6.73273C15.0883 4.40943 13.5703 2.41723 11.3889 1.49993C10.6924 1.20692 9.95879 1.03738 9.21492 0.997529C8.95825 0.971529 8.73612 1.18963 8.72307 1.45983C8.70994 1.72943 8.90865 1.95853 9.16632 1.97263Z" 
        fill="black"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_2280_923">
        <Rect width="18" height="20" fill="white"/>
      </ClipPath>
    </Defs>
  </Svg>
);

export const TranslationToggle: React.FC<TranslationToggleProps> = ({
  showTranslation,
  onToggle,
  isLoading = false,
}) => {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => {
        console.log('[TranslationToggle] Translation button pressed, current state:', showTranslation, 'isLoading:', isLoading);
        if (!isLoading) {
          onToggle();
        } else {
          console.log('[TranslationToggle] Button disabled due to loading state');
        }
      }}
      disabled={isLoading}
    >
      <View style={styles.iconContainer}>
        <TranslationIcon />
      </View>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 32,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 18,
    height: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 10,
    color: '#666666',
  },
});