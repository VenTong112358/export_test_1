import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Text as SvgText } from 'react-native-svg';

interface LevelBarProps {
  level: number; // 0-100
  label?: string;
  showLabel?: boolean;
}

// From bottom to top: Seed -> Roots -> Branches -> Leaves -> Bloom
const LEVEL_NODES = [
  { name: 'Seed', threshold: 0, label: 'Seed', labelCn: '种子', position: 0 },      // Bottom (0%)
  { name: 'Roots', threshold: 20, label: 'Roots', labelCn: '根', position: 25 },  // 25%
  { name: 'Branches', threshold: 40, label: 'Branches', labelCn: '分支', position: 50 }, // 50%
  { name: 'Leaves', threshold: 60, label: 'Leaves', labelCn: '叶子', position: 75 }, // 75%
  { name: 'Bloom', threshold: 80, label: 'Bloom', labelCn: '开花', position: 100 }, // Top (100%)
];

const LevelBar: React.FC<LevelBarProps> = ({
  level,
  label = '整体水平',
  showLabel = true,
}) => {
  const normalizedLevel = Math.max(0, Math.min(level, 100));
  const svgHeight = 250;
  const svgWidth = 320; // Increased width to accommodate labels
  const axisX = 100; // Vertical axis position (moved right to give space for labels)
  const flowerX = svgWidth / 2 + 30; // Flower position (right side)
  const centerX = flowerX;
  
  // Determine which stages are reached
  const isSeedReached = normalizedLevel >= 0;
  const isRootsReached = normalizedLevel >= 20;
  const isBranchesReached = normalizedLevel >= 40;
  const isLeavesReached = normalizedLevel >= 60;
  const isBloomReached = normalizedLevel >= 80;
  
  // Calculate Y positions based on percentage (0% at bottom, 100% at top)
  const getYPosition = (percentage: number) => {
    // percentage: 0 = bottom, 100 = top
    return svgHeight - 20 - (percentage / 100) * (svgHeight - 40);
  };
  
  const seedY = getYPosition(0);      // Bottom (0%)
  const rootsY = getYPosition(25);    // 25%
  const branchesY = getYPosition(50); // 50%
  const leavesY = getYPosition(75);  // 75%
  const bloomY = getYPosition(100);   // Top (100%)
  
  // Determine current stage
  const getCurrentStage = () => {
    for (let i = LEVEL_NODES.length - 1; i >= 0; i--) {
      if (normalizedLevel >= LEVEL_NODES[i].threshold) {
        return LEVEL_NODES[i].name;
      }
    }
    return LEVEL_NODES[0].name;
  };

  const currentStage = getCurrentStage();
  const activeColor = '#FC9B33';
  const inactiveColor = '#E5E5E5';
  
  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{label}</Text>
          <Text style={styles.levelText}>{Math.round(normalizedLevel)}%</Text>
        </View>
      )}
      
      <View style={styles.flowerContainer}>
        <Svg width={svgWidth} height={svgHeight} viewBox={`-20 0 ${svgWidth + 20} ${svgHeight}`}>
          {/* Vertical Axis */}
          <Line
            x1={axisX}
            y1={20}
            x2={axisX}
            y2={svgHeight - 20}
            stroke="#E5E5E5"
            strokeWidth="2"
          />
          
          {/* Axis markers and labels for each stage */}
          {LEVEL_NODES.map((node) => {
            const yPos = getYPosition(node.position);
            const isReached = normalizedLevel >= node.threshold;
            const isCurrent = node.name === currentStage;
            
            return (
              <React.Fragment key={node.name}>
                {/* Tick mark */}
                <Line
                  x1={axisX - 8}
                  y1={yPos}
                  x2={axisX + 8}
                  y2={yPos}
                  stroke={isReached ? activeColor : inactiveColor}
                  strokeWidth={isCurrent ? 3 : 2}
                />
                {/* English label on left side of axis */}
                <SvgText
                  x={axisX - 12}
                  y={yPos + 5}
                  fontSize="10"
                  fill={isReached ? activeColor : '#999'}
                  textAnchor="end"
                  fontWeight={isCurrent ? '600' : isReached ? '400' : '300'}
                  fontFamily={Platform.select({ ios: 'Inter', android: 'sans-serif' })}
                  opacity={0.7}
                >
                  {node.label}
                </SvgText>
                {/* Chinese label on right side of axis (main label) */}
                <SvgText
                  x={axisX + 12}
                  y={yPos + 5}
                  fontSize="12"
                  fill={isReached ? activeColor : '#999'}
                  textAnchor="start"
                  fontWeight={isCurrent ? '700' : isReached ? '500' : '400'}
                  fontFamily={Platform.select({ ios: 'Inter', android: 'sans-serif' })}
                >
                  {node.labelCn}
                </SvgText>
                {/* Percentage label - show threshold instead */}
                <SvgText
                  x={axisX - 12}
                  y={yPos - 8}
                  fontSize="9"
                  fill="#999"
                  textAnchor="end"
                  fontFamily={Platform.select({ ios: 'Inter', android: 'sans-serif' })}
                >
                  {node.threshold}%
                </SvgText>
                {/* Marker dot on axis */}
                <Circle
                  cx={axisX}
                  cy={yPos}
                  r={isCurrent ? 6 : 4}
                  fill={isReached ? activeColor : inactiveColor}
                />
                {/* Connecting line from axis to flower */}
                <Line
                  x1={axisX + 8}
                  y1={yPos}
                  x2={centerX - 30}
                  y2={yPos}
                  stroke={isReached ? activeColor : inactiveColor}
                  strokeWidth="1"
                  strokeDasharray={isReached ? '0' : '3,3'}
                  opacity={0.3}
                />
              </React.Fragment>
            );
          })}
          
          {/* Roots - Draw from seed downward */}
          {isRootsReached && (
            <>
              <Path
                d={`M ${centerX} ${seedY} Q ${centerX - 15} ${seedY + 10} ${centerX - 25} ${seedY + 20}`}
                stroke={activeColor}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d={`M ${centerX} ${seedY} Q ${centerX + 15} ${seedY + 10} ${centerX + 25} ${seedY + 20}`}
                stroke={activeColor}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d={`M ${centerX} ${seedY} L ${centerX} ${seedY + 25}`}
                stroke={activeColor}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </>
          )}
          
          {/* Stem - Main vertical line from seed to bloom */}
          {(isSeedReached || isBranchesReached) && (
            <Path
              d={`M ${centerX} ${seedY} L ${centerX} ${isBloomReached ? bloomY : (isLeavesReached ? leavesY : (isBranchesReached ? branchesY : seedY))}`}
              stroke={isBranchesReached ? activeColor : inactiveColor}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          )}
          
          {/* Branches - Draw from stem at branchesY */}
          {isBranchesReached && (
            <>
              <Path
                d={`M ${centerX} ${branchesY} Q ${centerX - 20} ${branchesY - 10} ${centerX - 30} ${branchesY - 20}`}
                stroke={activeColor}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d={`M ${centerX} ${branchesY} Q ${centerX + 20} ${branchesY - 10} ${centerX + 30} ${branchesY - 20}`}
                stroke={activeColor}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </>
          )}
          
          {/* Leaves - Draw on branches and stem */}
          {isLeavesReached && (
            <>
              {/* Leaves on branches */}
              <Ellipse
                cx={centerX - 25}
                cy={branchesY - 15}
                rx="8"
                ry="15"
                fill={activeColor}
                opacity={0.6}
                transform={`rotate(-30 ${centerX - 25} ${branchesY - 15})`}
              />
              <Ellipse
                cx={centerX + 25}
                cy={branchesY - 15}
                rx="8"
                ry="15"
                fill={activeColor}
                opacity={0.6}
                transform={`rotate(30 ${centerX + 25} ${branchesY - 15})`}
              />
              {/* Leaves on stem */}
              <Ellipse
                cx={centerX - 15}
                cy={leavesY}
                rx="6"
                ry="12"
                fill={activeColor}
                opacity={0.6}
                transform={`rotate(-45 ${centerX - 15} ${leavesY})`}
              />
              <Ellipse
                cx={centerX + 15}
                cy={leavesY}
                rx="6"
                ry="12"
                fill={activeColor}
                opacity={0.6}
                transform={`rotate(45 ${centerX + 15} ${leavesY})`}
              />
            </>
          )}
          
          {/* Bloom - Flower at top */}
          {isBloomReached && (
            <>
              {/* Outer petals */}
              <Ellipse cx={centerX} cy={bloomY - 20} rx="10" ry="18" fill={activeColor} opacity={0.9} />
              <Ellipse cx={centerX} cy={bloomY + 20} rx="10" ry="18" fill={activeColor} opacity={0.9} />
              <Ellipse cx={centerX - 20} cy={bloomY} rx="18" ry="10" fill={activeColor} opacity={0.9} />
              <Ellipse cx={centerX + 20} cy={bloomY} rx="18" ry="10" fill={activeColor} opacity={0.9} />
              
              {/* Diagonal petals */}
              <Ellipse 
                cx={centerX - 14} 
                cy={bloomY - 14} 
                rx="10" 
                ry="18" 
                fill={activeColor} 
                opacity={0.7}
                transform={`rotate(-45 ${centerX - 14} ${bloomY - 14})`}
              />
              <Ellipse 
                cx={centerX + 14} 
                cy={bloomY - 14} 
                rx="10" 
                ry="18" 
                fill={activeColor} 
                opacity={0.7}
                transform={`rotate(45 ${centerX + 14} ${bloomY - 14})`}
              />
              <Ellipse 
                cx={centerX - 14} 
                cy={bloomY + 14} 
                rx="10" 
                ry="18" 
                fill={activeColor} 
                opacity={0.7}
                transform={`rotate(45 ${centerX - 14} ${bloomY + 14})`}
              />
              <Ellipse 
                cx={centerX + 14} 
                cy={bloomY + 14} 
                rx="10" 
                ry="18" 
                fill={activeColor} 
                opacity={0.7}
                transform={`rotate(-45 ${centerX + 14} ${bloomY + 14})`}
              />
              
              {/* Center of flower */}
              <Circle cx={centerX} cy={bloomY} r="10" fill="#FFD700" />
              <Circle cx={centerX} cy={bloomY} r="6" fill="#FFA500" />
            </>
          )}
          
          {/* Seed - Always visible at bottom */}
          <Circle
            cx={centerX}
            cy={seedY}
            r="12"
            fill={isSeedReached ? activeColor : inactiveColor}
            stroke={isSeedReached ? activeColor : inactiveColor}
            strokeWidth="2"
          />
          <Circle cx={centerX} cy={seedY} r="6" fill="#FFF" />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  labelText: {
    fontSize: 14,
    color: '#333',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '500',
  },
  levelText: {
    fontSize: 14,
    color: '#FC9B33',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
  },
  flowerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'visible',
  },
});

export default LevelBar;
