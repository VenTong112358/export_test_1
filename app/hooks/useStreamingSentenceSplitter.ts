import { useState, useCallback, useRef } from 'react';

interface Sentence {
  id: string;
  text: string;
  isComplete: boolean;
}

interface Paragraph {
  id: string;
  sentences: Sentence[];
  isComplete: boolean;
}

export const useStreamingSentenceSplitter = () => {
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const bufferRef = useRef<string>('');
  const paragraphIdCounter = useRef<number>(0);
  const sentenceIdCounter = useRef<number>(0);

  // 生成唯一ID
  const generateUniqueId = () => `sentence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 改进的句子分割函数
  const splitIntoSentences = useCallback((text: string): string[] => {
    if (!text.trim()) return [];
    
    // 使用更简单的正则表达式分割句子
    // 匹配句号、问号、感叹号后面的空格或行尾
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    // 过滤空字符串并去除首尾空格
    return sentences
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }, []);

  // 处理新的chunk，提取完整段落和句子
  const onChunk = useCallback((chunk: string) => {
    // 将新chunk添加到缓冲区
    bufferRef.current += chunk;
    
    // 按段落分割（\n\n 或 \n\s*\n）
    const paragraphSplits = bufferRef.current.split(/\n\s*\n/);
    
    // 处理完整的段落（除了最后一个可能不完整的段落）
    const newParagraphs: Paragraph[] = [];
    
    for (let i = 0; i < paragraphSplits.length - 1; i++) {
      const paragraphText = paragraphSplits[i].trim();
      
      if (paragraphText.length > 0) {
        // 使用改进的句子分割方法
        const sentenceTexts = splitIntoSentences(paragraphText);
        
        const sentences: Sentence[] = sentenceTexts.map(sentenceText => ({
          id: generateUniqueId(),
          text: sentenceText,
          isComplete: true
        }));
        
        if (sentences.length > 0) {
          newParagraphs.push({
            id: `paragraph-${paragraphIdCounter.current++}`,
            sentences,
            isComplete: true
          });
        }
      }
    }
    
    // 如果有新的完整段落，更新状态
    if (newParagraphs.length > 0) {
      setParagraphs(prevParagraphs => {
        // 去重：检查是否已经存在相同的句子
        const existingTexts = new Set(
          prevParagraphs.flatMap(p => p.sentences.map(s => s.text))
        );
        
        const filteredNewParagraphs = newParagraphs.map(paragraph => {
          const filteredSentences = paragraph.sentences.filter(sentence => {
            const isDuplicate = existingTexts.has(sentence.text);
            return !isDuplicate;
          });
          
          return {
            ...paragraph,
            sentences: filteredSentences
          };
        }).filter(paragraph => paragraph.sentences.length > 0);
        
        return [...prevParagraphs, ...filteredNewParagraphs];
      });
    }
    
    // 保留最后一个可能不完整的段落在缓冲区中
    bufferRef.current = paragraphSplits[paragraphSplits.length - 1] || '';
  }, [splitIntoSentences]);

  // 获取当前缓冲区中的不完整段落（用于显示）
  const getIncompleteParagraph = useCallback(() => {
    const incompleteText = bufferRef.current.trim();
    if (!incompleteText) return null;
    
    // 使用改进的句子分割方法
    const sentenceTexts = splitIntoSentences(incompleteText);
    
    const sentences: Sentence[] = sentenceTexts.map(sentenceText => ({
      id: generateUniqueId(),
      text: sentenceText,
      isComplete: true
    }));
    
    // 检查是否有不完整的句子（没有以句号、问号、感叹号结尾）
    const lastChar = incompleteText.trim().slice(-1);
    const hasIncompleteSentence = !['.', '!', '?'].includes(lastChar);
    
    if (hasIncompleteSentence) {
      // 找到最后一个完整句子的位置
      const lastCompleteIndex = incompleteText.lastIndexOf('.');
      const lastExclamationIndex = incompleteText.lastIndexOf('!');
      const lastQuestionIndex = incompleteText.lastIndexOf('?');
      
      const lastCompletePos = Math.max(lastCompleteIndex, lastExclamationIndex, lastQuestionIndex);
      
      if (lastCompletePos > 0) {
        const incompleteSentenceText = incompleteText.slice(lastCompletePos + 1).trim();
        if (incompleteSentenceText) {
          sentences.push({
            id: generateUniqueId(),
            text: incompleteSentenceText,
            isComplete: false
          });
        }
      } else {
        // 整个文本都是不完整的句子
        sentences.push({
          id: generateUniqueId(),
          text: incompleteText,
          isComplete: false
        });
      }
    }
    
    return sentences.length > 0 ? {
      id: `incomplete-paragraph-${Date.now()}`,
      sentences,
      isComplete: false
    } : null;
  }, [splitIntoSentences]);

  // 清空所有段落和缓冲区
  const clear = useCallback(() => {
    setParagraphs([]);
    bufferRef.current = '';
    paragraphIdCounter.current = 0;
    sentenceIdCounter.current = 0;
  }, []);

  // 获取所有段落（包括完整的和不完整的）
  const getAllParagraphs = useCallback(() => {
    const incompleteParagraph = getIncompleteParagraph();
    const allParagraphs = [...paragraphs];
    
    if (incompleteParagraph) {
      allParagraphs.push(incompleteParagraph);
    }
    
    return allParagraphs;
  }, [paragraphs, getIncompleteParagraph]);

  // 标记流式生成完成
  const markComplete = useCallback(() => {
    
    const incompleteParagraph = getIncompleteParagraph();
    if (incompleteParagraph && incompleteParagraph.sentences.length > 0) {
      // 将不完整的段落标记为完整
      const completedParagraph: Paragraph = {
        ...incompleteParagraph,
        id: `paragraph-${paragraphIdCounter.current++}`,
        isComplete: true
      };
      
      // 将不完整的句子标记为完整
      completedParagraph.sentences = completedParagraph.sentences.map(sentence => ({
        ...sentence,
        isComplete: true
      }));
      
      setParagraphs(prevParagraphs => {
        // 去重：检查是否已经存在相同的句子
        const existingTexts = new Set(
          prevParagraphs.flatMap(p => p.sentences.map(s => s.text))
        );
        
        const filteredSentences = completedParagraph.sentences.filter(sentence => {
          const isDuplicate = existingTexts.has(sentence.text);
          return !isDuplicate;
        });
        
        if (filteredSentences.length === 0) {
          return prevParagraphs;
        }
        
        return [...prevParagraphs, {
          ...completedParagraph,
          sentences: filteredSentences
        }];
      });
      
      bufferRef.current = '';
    }
  }, [getIncompleteParagraph]);

  return {
    paragraphs,
    onChunk,
    clear,
    getIncompleteParagraph,
    getAllParagraphs,
    markComplete,
    buffer: bufferRef.current
  };
}; 
export default useStreamingSentenceSplitter;