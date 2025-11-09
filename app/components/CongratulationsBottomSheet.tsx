import React from 'react';
import { Modal, View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Circle, Polygon, Rect, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface CongratulationsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const CongratulationsBottomSheet: React.FC<CongratulationsBottomSheetProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Confetti/Geometric Decorations (Top) */}
          <View style={styles.confettiTop}>
            <Svg height="48" width={width}>
              {/* Circles */}
              <Circle cx={40} cy={18} r={8} fill="#FC9B33" />
              <Circle cx={width-40} cy={12} r={6} fill="#F87A2C" />
              {/* Triangles */}
              <Polygon points="80,10 90,30 70,30" fill="#FFD580" />
              <Polygon points={`${width-80},20 ${width-70},40 ${width-90},40`} fill="#FFB300" />
              {/* Star (Path) */}
              <Path d="M120 30 l6 12 13 2 -10 8 3 13 -12-6 -12 6 3-13 -10-8 13-2z" fill="#FF6B6B" />
              <Path d={`M${width-120} 18 l4 8 9 1 -7 6 2 9 -8-4 -8 4 2-9 -7-6 9-1z`} fill="#4FC3F7" />
            </Svg>
          </View>
          <Text style={styles.title}>Congratulations!</Text>
          <Text style={styles.subtitle}>你完成今日全部学习目标啦</Text>
          {/* Confetti/Geometric Decorations (Bottom) */}
          <View style={styles.confettiBottom}>
            <Svg height="40" width={width}>
              <Circle cx={30} cy={20} r={6} fill="#FFD580" />
              <Circle cx={width-30} cy={28} r={5} fill="#FFB300" />
              <Polygon points="60,30 70,38 50,38" fill="#4FC3F7" />
              <Polygon points={`${width-60},10 ${width-50},28 ${width-70},28`} fill="#FC9B33" />
              <Rect x={width/2-8} y={10} width={16} height={6} fill="#F87A2C" rx={3} />
            </Svg>
          </View>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>知道啦</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent', // 彻底透明
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: width,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  confettiTop: {
    width: '100%',
    marginBottom: 12,
  },
  confettiBottom: {
    width: '100%',
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FC9B33',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FC9B33',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CongratulationsBottomSheet; 