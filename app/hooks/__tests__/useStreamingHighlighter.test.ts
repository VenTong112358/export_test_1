import { renderHook, act } from '@testing-library/react-native';
import { useStreamingHighlighter } from '../useStreamingHighlighter';

describe('useStreamingHighlighter', () => {
  it('should initialize with empty text', () => {
    const { result } = renderHook(() => useStreamingHighlighter(['test', 'word']));
    
    expect(result.current.displayText).toBe('');
    expect(result.current.highlightedSegments).toEqual([{ text: '', isHighlighted: false }]);
  });

  it('should process chunks and highlight matching words', () => {
    const { result } = renderHook(() => useStreamingHighlighter(['test', 'word']));
    
    act(() => {
      result.current.onChunk('This is a test sentence with a word.');
    });
    
    expect(result.current.displayText).toBe('This is a test sentence with a word.');
    
    // Check that highlighted segments are created
    const segments = result.current.highlightedSegments;
    expect(segments.length).toBeGreaterThan(1);
    
    // Find highlighted segments
    const highlightedSegments = segments.filter(segment => segment.isHighlighted);
    expect(highlightedSegments.length).toBeGreaterThan(0);
  });

  it('should clear text when clear is called', () => {
    const { result } = renderHook(() => useStreamingHighlighter(['test']));
    
    act(() => {
      result.current.onChunk('This is a test.');
    });
    
    expect(result.current.displayText).toBe('This is a test.');
    
    act(() => {
      result.current.clear();
    });
    
    expect(result.current.displayText).toBe('');
    expect(result.current.highlightedSegments).toEqual([{ text: '', isHighlighted: false }]);
  });

  it('should handle empty word list', () => {
    const { result } = renderHook(() => useStreamingHighlighter([]));
    
    act(() => {
      result.current.onChunk('This is a test sentence.');
    });
    
    expect(result.current.displayText).toBe('This is a test sentence.');
    expect(result.current.highlightedSegments).toEqual([{ text: 'This is a test sentence.', isHighlighted: false }]);
  });

  it('should maintain buffer for word boundary detection', () => {
    const { result } = renderHook(() => useStreamingHighlighter(['test']));
    
    act(() => {
      result.current.onChunk('This is a ');
    });
    
    act(() => {
      result.current.onChunk('test sentence.');
    });
    
    expect(result.current.displayText).toBe('This is a test sentence.');
    expect(result.current.buffer.length).toBeLessThanOrEqual(40);
  });
}); 