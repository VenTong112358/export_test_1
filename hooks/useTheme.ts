import { useTheme as usePaperTheme } from 'react-native-paper';
import { lightTheme, darkTheme } from '../constants/theme';
import { AppTheme } from '../constants/theme';

export default null;
export const useTheme = (): { theme: AppTheme } => {
  const paperTheme = usePaperTheme();
  const theme = paperTheme.dark ? darkTheme : lightTheme;
  return { theme };
};