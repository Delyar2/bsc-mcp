/**
 * 清理字符串，移除或转义可能导致提示词注入的字符和模式
 * 
 * @param input 需要清理的输入字符串
 * @param options 清理选项
 * @returns 清理后的安全字符串
 */
function sanitizeString(
  input: string, 
  options: {
    maxLength?: number,         // 最大允许长度
    strictMode?: boolean,       // 严格模式（更激进的过滤）
    allowMarkdown?: boolean,    // 是否允许markdown语法
    escapeQuotes?: boolean      // 是否转义引号而非移除
  } = {}
): string {
  // 设置默认值
  const {
    maxLength = 500,
    strictMode = true,
    allowMarkdown = false,
    escapeQuotes = true
  } = options;
  
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input;
  
  // 1. 移除可能的代码块和格式化文本
  if (!allowMarkdown) {
    // 移除代码块
    sanitized = sanitized.replace(/```[\s\S]*?```/g, "[代码块已移除]");
    // 移除内联代码
    sanitized = sanitized.replace(/`[^`]*`/g, "[代码已移除]");
  }
  
  // 2. 处理可能的闭合符号和指令模式
  
  // 处理HTML/XML标签
  sanitized = sanitized.replace(/<[^>]*>/g, "");
  
  // 处理各种括号配对
  sanitized = sanitized.replace(/\{[\s\S]*?\}/g, "[内容已过滤]"); // 花括号
  sanitized = sanitized.replace(/\[[\s\S]*?\]/g, "[内容已过滤]"); // 方括号
  sanitized = sanitized.replace(/\([\s\S]*?\)/g, "[内容已过滤]"); // 圆括号
  
  // 3. 处理潜在的指令关键词
  const aiKeywords = [
    "system", "user", "assistant", "model", "prompt", "instruction", 
    "context", "token", "function", "completion", "response", "davinci", 
    "claude", "gpt", "llm", "api", "openai", "anthropic"
  ];
  
  const keywordPattern = new RegExp(`\\b(${aiKeywords.join('|')})\\b`, 'gi');
  sanitized = sanitized.replace(keywordPattern, (match) => `_${match}_`);
  
  // 4. 处理引号（可选择转义或移除）
  if (escapeQuotes) {
    // 转义引号
    sanitized = sanitized.replace(/"/g, '\\"').replace(/'/g, "\\'");
  } else {
    // 移除引号
    sanitized = sanitized.replace(/["']/g, "");
  }
  
  // 5. 严格模式下的额外处理
  if (strictMode) {
    // 移除所有可能的控制字符和特殊字符
    sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F\u2000-\u200F\u2028-\u202F]/g, "");
    
    // 处理可能被用于注入的分隔符和特殊模式
    sanitized = sanitized.replace(/\.\.\./g, "…"); // 省略号
    sanitized = sanitized.replace(/\-\-\-+/g, "—"); // 破折号
    sanitized = sanitized.replace(/={2,}/g, "==");  // 等号序列
    
    // 处理URL和链接模式
    sanitized = sanitized.replace(/(https?:\/\/[^\s]+)/g, "[链接已移除]");
  }
  
  // 6. 处理可能的JSON结构标记
  sanitized = sanitized
    .replace(/(\s*"\w+"\s*:)/g, "【属性】:")  // JSON属性名
    .replace(/(\[\s*\]|\{\s*\})/g, "【空】"); // 空数组或对象
  
  // 7. 限制长度
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + "...";
  }
  
  return sanitized;
}

/**
 * 递归处理对象，对所有字符串值应用sanitizeString函数
 * 
 * @param data 需要处理的数据对象
 * @param options 传递给sanitizeString的选项
 * @param maxDepth 最大递归深度
 * @param currentDepth 当前递归深度
 * @returns 处理后的安全数据对象
 */
function sanitizeData(
  data: any,
  options = {},
  maxDepth = 5,
  currentDepth = 0
): any {
  // 处理递归深度限制
  if (currentDepth >= maxDepth) {
    return typeof data === 'object' && data !== null 
      ? "[嵌套对象已简化]" 
      : data;
  }
  
  // 基本类型直接返回
  if (data === null || data === undefined) {
    return data;
  }
  
  // 处理字符串
  if (typeof data === 'string') {
    return sanitizeString(data, options);
  }
  
  // 处理数字和布尔值
  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  
  // 处理数组
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, options, maxDepth, currentDepth + 1));
  }
  
  // 处理对象
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // 对属性名也进行简单清理
        const safeKey = key.replace(/[<>{}\[\]]/g, "");
        result[safeKey] = sanitizeData(data[key], options, maxDepth, currentDepth + 1);
      }
    }
    return result;
  }
  
  // 其他类型
  return String(data);
}

// 示例用法：
// 在API返回数据时使用
function safeApiResponse(apiData: any): any {
  const sanitizedData = sanitizeData(apiData, {
    strictMode: true,
    maxLength: 200,
    allowMarkdown: false
  });
  
  return sanitizedData;
}