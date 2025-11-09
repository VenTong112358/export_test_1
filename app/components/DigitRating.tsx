import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface DigitRatingProps {
  value: number;
  max?: number;
  onChange: (value: number) => void;
  style?: any;
}

export const DigitRating: React.FC<DigitRatingProps> = ({
  value,
  max = 5,
  onChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: max }).map((_, i) => (
        <TouchableOpacity
          key={i}
          style={[
            styles.digitButton,
            value === i + 1 && styles.selectedButton
          ]}
          onPress={() => onChange(i + 1)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.digitText,
            value === i + 1 && styles.selectedText
          ]}>
            {i + 1}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  digitButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FC9B33',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  selectedButton: {
    backgroundColor: '#FC9B33',
  },
  digitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FC9B33',
  },
  selectedText: {
    color: 'white',
  },
}); 