
/**
 * Clean the string, remove or escape characters and patterns that may cause prompt injection
 * 
 * @param input The input string to be cleaned
 * @param options Cleaning options
 * @returns Cleaned safe string
 */
export function sanitizeString(
    input: string, 
    options: {
      maxLength?: number,         // Maximum allowed length
      strictMode?: boolean,       // Strict mode (more aggressive filtering)
      allowMarkdown?: boolean,    // Whether to allow markdown syntax
      escapeQuotes?: boolean      // Whether to escape quotes instead of removing
    } = {}
  ): string {
    // Set default values
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
    
    // 1. Remove possible code blocks and formatted text
    if (!allowMarkdown) {
      // Remove code blocks
      sanitized = sanitized.replace(/```[\s\S]*?```/g, "[Code block removed]");
      // Remove inline code
      sanitized = sanitized.replace(/`[^`]*`/g, "[Code removed]");
    }
    
    // 2. Handle possible closing symbols and instruction patterns
    
    // Handle HTML/XML tags
    sanitized = sanitized.replace(/<[^>]*>/g, "");
    
    // Handle various bracket pairs
    sanitized = sanitized.replace(/\{[\s\S]*?\}/g, "[Content filtered]"); // Curly brackets
    sanitized = sanitized.replace(/\[[\s\S]*?\]/g, "[Content filtered]"); // Square brackets
    sanitized = sanitized.replace(/\([\s\S]*?\)/g, "[Content filtered]"); // Parentheses
    
    // 3. Handle potential instruction keywords
    const aiKeywords = [
      "system", "user", "assistant", "model", "prompt", "instruction", 
      "context", "token", "function", "completion", "response", "davinci", 
      "claude", "gpt", "llm", "api", "openai", "anthropic"
    ];
    
    const keywordPattern = new RegExp(`\\b(${aiKeywords.join('|')})\\b`, 'gi');
    sanitized = sanitized.replace(keywordPattern, (match) => `_${match}_`);
    
    // 4. Handle quotes (escape or remove)
    if (escapeQuotes) {
      // Escape quotes
      sanitized = sanitized.replace(/"/g, '\\"').replace(/'/g, "\\'");
    } else {
      // Remove quotes
      sanitized = sanitized.replace(/["']/g, "");
    }
    
    // 5. Additional processing in strict mode
    if (strictMode) {
      // Remove all possible control characters and special characters
      sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F\u2000-\u200F\u2028-\u202F]/g, "");
      
      // Handle possible injection separators and special patterns
      sanitized = sanitized.replace(/\.\.\./g, "…"); // Ellipsis
      sanitized = sanitized.replace(/\-\-\-+/g, "—"); // Em dash
      sanitized = sanitized.replace(/={2,}/g, "==");  // Equal sign sequence
      
      // Handle URL and link patterns
      sanitized = sanitized.replace(/(https?:\/\/[^\s]+)/g, "[Link removed]");
    }
    
    // 6. Handle possible JSON structure markers
    sanitized = sanitized
      .replace(/(\s*"\w+"\s*:)/g, "【Property】:")  // JSON property name
      .replace(/(\[\s*\]|\{\s*\})/g, "【Empty】"); // Empty array or object
    
    // 7. Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength) + "...";
    }
    
    return sanitized;
  }
  
  /**
   * Recursively process the object, applying the sanitizeString function to all string values
   * 
   * @param data The data object to be processed
   * @param options Options to be passed to sanitizeString
   * @param maxDepth Maximum recursion depth
   * @param currentDepth Current recursion depth
   * @returns Processed safe data object
   */
  export function sanitizeData(
    data: any,
    options = {},
    maxDepth = 5,
    currentDepth = 0
  ): any {
    // Handle recursion depth limit
    if (currentDepth >= maxDepth) {
      return typeof data === 'object' && data !== null 
        ? "[Nested object simplified]" 
        : data;
    }
    
    // Basic types return directly
    if (data === null || data === undefined) {
      return data;
    }
    
    // Handle string
    if (typeof data === 'string') {
      return sanitizeString(data, options);
    }
    
    // Handle numbers and booleans
    if (typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }
    
    // Handle array
    if (Array.isArray(data)) {
      return data.map(item => sanitizeData(item, options, maxDepth, currentDepth + 1));
    }
    
    // Handle object
    if (typeof data === 'object') {
      const result: Record<string, any> = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // Also clean the property name
          const safeKey = key.replace(/[<>{}\[\]]/g, "");
          result[safeKey] = sanitizeData(data[key], options, maxDepth, currentDepth + 1);
        }
      }
      return result;
    }
    
    // Other types
    return String(data);
  }