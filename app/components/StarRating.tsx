import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  value: number;
  max?: number;
  onChange: (value: number) => void;
  size?: number;
  color?: string;
  style?: any;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  max = 5,
  onChange,
  size = 32,
  color = '#FC9B33',
  style,
}) => {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {Array.from({ length: max }).map((_, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onChange(i + 1)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={i < value ? 'star' : 'star-outline'}
            size={size}
            color={color}
            style={{ marginHorizontal: 2 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}; 