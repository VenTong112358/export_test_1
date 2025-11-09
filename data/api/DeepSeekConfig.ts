// DeepSeek API 配置
export const DEEPSEEK_CONFIG = {
  // 替换为你的DeepSeek API Key
  API_KEY: 'sk-bb78cf89d1874bd287cc0f282183b4a9',
  BASE_URL: 'https://api.deepseek.com/v1',
  MODEL: 'deepseek-chat',
  TIMEOUT: 60000, // 60 seconds for article generation
};

// Prompt 模板
export const PROMPT_TEMPLATES = {
  // 生成文章标题
  GENERATE_TITLES: (
    genre: 'News Report' | 'Explanation' | 'Argument' | 'Story Narration' | 'Essay' | 'Reflective Argument',
    topic: string,
    factualNews?: string,
    userInterest?: string
  ) => {
    let genreSpecific = '';
    
    switch (genre) {
      case 'News Report':
        genreSpecific = '标题应和真实新闻报道一般，直截了当，指明事件，简洁有力。';
        if (factualNews) {
          genreSpecific += `\n你可以参照下面的新闻事实：${factualNews}`;
        }
        break;
      case 'Explanation':
        genreSpecific = '标题可以反映学术文献等材料里面体现的有趣事实。宜用平实有趣的风格让读者理解标题，提起读者兴趣。';
        break;
      case 'Argument':
        genreSpecific = '标题应反映将要生成的文章的论点。你可以用有力的风格，也可以用感人的方式，或者采用修辞手法吸引读者。';
        break;
      case 'Story Narration':
        genreSpecific = '标题应引发读者好奇。标题也呼应展现故事的情节，抑或呼应故事的某样道具或者场景。提倡使用修辞手法。';
        break;
      case 'Essay':
        genreSpecific = '标题应具有文学性和哲思性，能够引发读者的深度思考。';
        break;
      case 'Reflective Argument':
        genreSpecific = '标题应体现辩证思维，展现话题的复杂性和多面性。';
        break;
    }

    const userInterestText = userInterest ? `\n用户兴趣如是，如能贴合当然更好：${userInterest}` : '';

    return `角色：教育专家、文章作家
任务：生成和${topic}相关的五个${genre}文标题，以供英语学习者选择。选择出来的标题会用来生成英文文章。

要求：
风格要求：标题要激发读者兴趣，简明、有启发性，不设置阅读门槛，同时又要新颖，能让读者有读下去的欲望。
英文要求：同时为这5个中文标题设计英文标题，不需要直接翻译中文标题。
格式要求：直接输出5个中文标题及其对应的英文标题。一行中文标题，再一行英文标题，如此轮替，不输出其它解释。
体裁要求：标题应具备${genre}文特征。

${genreSpecific}${userInterestText}`;
  },

  // 文章生成prompt（基于你的Python版本）
  GENERATE_ARTICLE: (
    genre: 'News Report' | 'Explanation' | 'Argument' | 'Story Narration' | 'Essay' | 'Reflective Argument',
    topic: string,
    title: string,
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
    providedVocab?: string,
    factualNews?: string
  ) => {
    // 角色和目标
    const role = 'Role: AI Language Tutor & Content Engineer';
    const objective = 'Objective: Generate a 500±20-word English article that organically assimilates provided vocabulary through contextual narration.';

    // 根据体裁生成结构
    let structure = '';
    switch (genre) {
      case 'News Report':
        structure = `Structure:
You are going to write a piece of hard news about ${topic} like a professional journalist of China Daily or New York Times, depending on the level of the users. Your article should be structured like this:
Title: ${title}
Lead (80w): Essential factors of the event.
Event Chain (220w): Developments and details of the event.
Impact Analysis (140w): Implications and responses of different parties to the event.`;
        if (factualNews) {
          structure += `\nYou are allowed to reduce the generation of hallucination and misinformation in your article by reading the following news on this topic: ${factualNews}`;
        }
        break;

      case 'Explanation':
        structure = `Structure:
You are going to write an article explaining ${topic} like a professional science and excellent educator. Your article should be structured like this:
Title: ${title}
Hook (80w): Provide key concepts and arrest the reader's interest.
Mechanism (200w): Tell the reader how the things work.
Real-life explanation (120w): Provide examples, metaphors, etc. for explanation.
Debate (80w): Tell the readers controversy about the topic, if any.`;
        break;

      case 'Argument':
        structure = `Structure:
You are going to write a persuasive argumentative essay about ${topic} like a professional debater. Your article should be structured like this:
Title: ${title}
Thesis Statement (80w): Clearly state your position with rhetorical devices
Pro-Con Analysis (200w): Present opposing views and counterarguments
Evidence Synthesis (120w): Integrate statistics, quotes and case studies
Clincher (80w): Powerful conclusion with call-to-action`;
        break;

      case 'Story Narration':
        structure = `Structure:
You are going to write a narrative story about ${topic} like a professional novelist. Your article should be structured like this:
Title: ${title}
Exposition (80w): Establish setting and characters
Rising Action (150w): Develop conflicts and relationships
Climax (120w): Crucial turning point of the story
Falling Action (100w): Consequences of the climax
Denouement (50w): Final resolution with thematic resonance`;
        break;

      case 'Essay':
        structure = `Structure:
You are going to write a literary essay about ${topic} like a Pulitzer-winning author. Your article should be structured like this:
Title: ${title}
Lyrical Opening (100w): Establish atmosphere with sensory details
Memory Fragment (150w): Invoke a personal/universal experience
Contemplative Shift (120w): Transition to philosophical inquiry
Metaphorical Synthesis (100w): Use nature/art metaphors for abstraction
Echoed Closure (30w): End with poetic callback to opening image`;
        break;

      case 'Reflective Argument':
        structure = `Structure:
You are going to write a balanced argument about ${topic} like a New Yorker columnist. Your article should be structured like this:
Title: ${title}
Paradox Statement (60w): Present a thought-provoking contradiction
Dialectical Analysis (200w): Explore multiple perspectives with nuance
Ambivalent Evidence (150w): Cite conflicting data/experiences
Humble Conclusion (90w): Acknowledge complexity without dogma`;
        break;
    }

    // 词汇要求
    const vocabRequire = providedVocab ? 
      `Requirements:
You are required to integrate the following list of vocabulary into your article:
${providedVocab}` : '';

    const vocabRefine = providedVocab ? `
For every occurrence of the provided words, make it bold.
For the first occurrence of the provided words, provide contextual clues for the reader. Example: The **refractory** flames resisted standard extinguishing methods.
For subsequent uses, provide also semantic expansion for the reader. Example: Similar *refractory* behavior was observed in 2020 wildfires.
You are also allowed to change the provided words into other words by changing the derivational morpheme. Example: 'refractory' → 'refractoriness'.
Banned practices include dictionary-style explanations that are demonstrated in brackets or as parenthesis, unnatural clustering (>5 words/100 words) and improper collocations (validated via COCA corpus).` : '';

    const levelRequire = `You are required to make the article easy to read for the user with the level of ${level}. You can make words in the article (except those provided) easier to realize that.`;
    const sentenceLenRequire = 'You are required to make the length of sentences change dynamically so that users will not feel scared by long sentences.';
    const formatRequire = 'You are required to output the article only with the English title, the Chinese title, and the English text, where the format of the provided words is given above. You are not allowed to have subtitles that indicate the structure of the article, like "Event Chain" or "Hook".';

    const requirements = [vocabRequire, vocabRefine, levelRequire, sentenceLenRequire, formatRequire]
      .filter(req => req)
      .join('\n');

    return `${role}
${objective}

${structure}

${requirements}`;
  },

  // 简化版文章生成prompt（保持向后兼容）
  GENERATE_ARTICLE_SIMPLE: (difficulty: string, topic?: string, length: string = 'medium') => {
    const difficultyMap = {
      easy: '适合英语初学者，使用基础词汇，句子结构简单',
      medium: '适合中级学习者，使用中等难度词汇，句子结构适中',
      hard: '适合高级学习者，使用较难词汇，句子结构复杂'
    };

    const lengthMap = {
      short: '150-200个单词',
      medium: '300-400个单词', 
      long: '500-600个单词'
    };

    const topicText = topic ? `主题：${topic}` : '主题：科技、文化、教育或日常生活相关';

    return `请生成一篇英语文章，要求如下：

${topicText}
难度级别：${difficultyMap[difficulty as keyof typeof difficultyMap]}
文章长度：${lengthMap[length as keyof typeof lengthMap]}

要求：
1. 文章内容要有教育意义，适合英语学习
2. 根据难度级别选择合适的词汇和语法结构
3. 文章结构清晰，包含开头、主体和结尾
4. 使用自然的英语表达，避免过于正式或过于口语化
5. 确保文章的可读性和趣味性

请直接返回文章内容，不要包含任何额外的说明或格式。`;
  },

  // 单词翻译prompt
  TRANSLATE_WORD: (word: string, context?: string) => {
    const contextText = context ? `上下文：${context}` : '';
    
    return `请翻译以下英语单词：

单词：${word}
${contextText}

请提供：
1. 中文翻译
2. 词性
3. 简短的中文释义
4. 例句（英文+中文）

格式要求：
翻译：xxx
词性：xxx
释义：xxx
例句：xxx / xxx`;
  },

  // 单词分析prompt
  ANALYZE_WORDS: (text: string) => {
    return `请分析以下英语文章中的单词：

文章内容：
${text}

请为每个单词提供以下信息：
1. 单词本身
2. 难度级别（easy/medium/hard）
3. 词性
4. 中文翻译
5. 英文释义
6. 在文章中的出现频率

请以JSON格式返回，格式如下：
[
  {
    "text": "单词",
    "difficulty": "easy/medium/hard",
    "partOfSpeech": "词性",
    "translation": "中文翻译",
    "definition": "英文释义",
    "frequency": 出现次数
  }
]`;
  },

  // 文章难度评估prompt
  ASSESS_DIFFICULTY: (text: string) => {
    return `请评估以下英语文章的难度级别：

文章内容：
${text}

请从以下三个级别中选择：
- easy: 适合初学者，词汇简单，句子结构基础
- medium: 适合中级学习者，词汇中等，句子结构适中
- hard: 适合高级学习者，词汇较难，句子结构复杂

请只返回难度级别（easy/medium/hard），不要其他内容。`;
  },

  // 句子改写prompt
  PARAPHRASE_SENTENCE: (sentence: string, level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2') => {
    return `You are a language tutor specializing in paraphrase complex texts for English learners.
Rewrite the following sentence to make it easier to understand while keeping its core meaning intact.
Adjust the language to match a ${level} CEFR proficiency level.

Key Constraints:
1. Simplify grammar and vocabulary.
2. Retain the original meaning.
3. Output only the paraphrased sentence.

Input Sentence: ${sentence}`;
  }
};

// DeepSeek API 请求格式
export interface DeepSeekRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// DeepSeek API 响应格式
export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
} 