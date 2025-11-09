import { useState, useCallback, useMemo } from 'react';
import { stemmer } from 'stemmer';

interface HighlightedSegment {
  text: string;
  isHighlighted: boolean;
}

export const useStreamingHighlighter = (newWordsList: string[]) => {
  const [displayText, setDisplayText] = useState<string>('');
  const [buffer, setBuffer] = useState<string>('');
  
  // Normalize new words using stemmer
  const normalizedNewWords = useMemo(() => {
    return newWordsList.map(word => stemmer(word.toLowerCase()));
  }, [newWordsList]);

  // Process text and highlight all matching words using stemming
  const processTextWithHighlights = useCallback((text: string): HighlightedSegment[] => {
    if (newWordsList.length === 0) {
      // If no new words to highlight, split text into individual words for proper word detection
      const words = text.split(/\b/);
      return words.map(word => ({
        text: word,
        isHighlighted: false
      }));
    }

    // console.log('[useStreamingHighlighter] Processing text with highlights:');
    // console.log('- Text length:', text.length);
    // console.log('- New words to match:', newWordsList);
    // console.log('- Normalized words:', normalizedNewWords);

    const segments: HighlightedSegment[] = [];
    let lastIndex = 0;

    // Find all matches in the text using stemming
    const matches: Array<{ start: number; end: number; word: string; originalWord: string }> = [];
    
    // Split text into words with word boundaries for proper word detection
    const wordBoundaryRegex = /\b/g;
    const words = text.split(wordBoundaryRegex);
    let currentIndex = 0;
    
    words.forEach((word, wordIndex) => {
      // Clean the word (remove punctuation)
      const cleanWord = word.replace(/[^\w]/g, '');
      
      if (cleanWord.length > 0) {
        // Get the stem of the clean word
        const wordStem = stemmer(cleanWord.toLowerCase());
        
        // Check if this word stem matches any of our new words
        if (normalizedNewWords.includes(wordStem)) {
          // Find the original word in the text
          const wordStart = text.indexOf(word, currentIndex);
          if (wordStart !== -1) {
            matches.push({
              start: wordStart,
              end: wordStart + word.length,
              word: word,
              originalWord: cleanWord
            });
          }
        }
      }
      
      // Update current index for next word
      currentIndex += word.length;
    });

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // console.log('[useStreamingHighlighter] Found matches:', matches.length);
    // matches.forEach(match => {
    //   console.log(`  - Match: "${match.word}" (original: "${match.originalWord}") at position ${match.start}-${match.end}`);
    // });

    // Create segments from matches
    matches.forEach(match => {
      // Add text before match
      if (match.start > lastIndex) {
        const beforeText = text.slice(lastIndex, match.start);
        // Split the before text into individual words for proper word detection
        const beforeWords = beforeText.split(/\b/);
        beforeWords.forEach(word => {
          if (word.length > 0) {
            segments.push({
              text: word,
              isHighlighted: false
            });
          }
        });
      }

      // Add highlighted match
      segments.push({
        text: match.word,
        isHighlighted: true
      });

      lastIndex = match.end;
    });

    // Add remaining text after last match
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      // Split the remaining text into individual words for proper word detection
      const remainingWords = remainingText.split(/\b/);
      remainingWords.forEach(word => {
        if (word.length > 0) {
          segments.push({
            text: word,
            isHighlighted: false
          });
        }
      });
    }

    return segments.length > 0 ? segments : [{ text, isHighlighted: false }];
  }, [normalizedNewWords, newWordsList]);

  // Get current highlighted segments
  const highlightedSegments = processTextWithHighlights(displayText);

  // Process new chunk and update buffer
  const onChunk = useCallback((chunk: string) => {
    setBuffer(prevBuffer => {
      const newBuffer = prevBuffer + chunk;
      // Keep only last 40 characters in buffer
      const trimmedBuffer = newBuffer.slice(-40);
      
      // Update display text with new chunk
      setDisplayText(prevText => {
        const newText = prevText + chunk;
        return newText;
      });
      
      return trimmedBuffer;
    });
  }, []);

  // Clear all text and buffer
  const clear = useCallback(() => {
    setDisplayText('');
    setBuffer('');
  }, []);

  // Get text without highlights (plain text)
  const getPlainText = useCallback(() => {
    return displayText;
  }, [displayText]);

  // Debug function to check which words are being searched
  const debugWordMatching = useCallback(() => {
    console.log('[useStreamingHighlighter] Debug info:');
    console.log('- New words list:', newWordsList);
    console.log('- Normalized new words:', normalizedNewWords);
    console.log('- Current text length:', displayText.length);
    
    // Check if any words appear in the text
    newWordsList.forEach((word, index) => {
      const normalizedWord = normalizedNewWords[index];
      const wordBoundaryRegex = /\b/g;
      const words = displayText.split(wordBoundaryRegex);
      
      let matchCount = 0;
      words.forEach(displayWord => {
        const cleanWord = displayWord.replace(/[^\w]/g, '');
        if (cleanWord.length > 0) {
          const wordStem = stemmer(cleanWord.toLowerCase());
          if (wordStem === normalizedWord) {
            matchCount++;
          }
        }
      });
      
      console.log(`- Word "${word}" (stem: "${normalizedWord}"):`);
      console.log(`  * Matches found: ${matchCount}`);
    });
  }, [newWordsList, normalizedNewWords, displayText]);

  return {
    displayText,
    highlightedSegments,
    onChunk,
    clear,
    getPlainText,
    buffer,
    debugWordMatching,
    processTextWithHighlights
  };
}; 
export default useStreamingHighlighter;