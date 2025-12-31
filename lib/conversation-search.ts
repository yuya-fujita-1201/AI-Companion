import { Message } from "@/types/chat";

/**
 * Search for relevant past conversations based on the current message
 * 
 * This function implements a simple keyword-based search to find
 * conversations that are related to the current topic.
 */

export interface RelevantConversation {
  message: Message;
  relevanceScore: number;
}

/**
 * Extract keywords from a message
 */
function extractKeywords(text: string): string[] {
  // Remove common Japanese particles and extract meaningful words
  const stopWords = [
    "は", "が", "を", "に", "へ", "と", "から", "まで", "より", "で",
    "の", "や", "か", "も", "ね", "よ", "な", "だ", "です", "ます",
    "した", "して", "ある", "いる", "する", "なる", "れる", "られる",
    "せる", "させる", "ない", "ぬ", "ん", "た", "て", "ば", "たら",
  ];

  // Split into words (simple approach for Japanese)
  const words = text
    .toLowerCase()
    .replace(/[、。！？\s]/g, " ")
    .split(" ")
    .filter((word) => word.length > 0)
    .filter((word) => !stopWords.includes(word));

  return words;
}

/**
 * Calculate relevance score between two messages
 */
function calculateRelevance(
  currentMessage: string,
  pastMessage: string
): number {
  const currentKeywords = extractKeywords(currentMessage);
  const pastKeywords = extractKeywords(pastMessage);

  if (currentKeywords.length === 0 || pastKeywords.length === 0) {
    return 0;
  }

  // Count matching keywords
  let matchCount = 0;
  for (const keyword of currentKeywords) {
    if (pastKeywords.some((pk) => pk.includes(keyword) || keyword.includes(pk))) {
      matchCount++;
    }
  }

  // Calculate score (0-1)
  const score = matchCount / Math.max(currentKeywords.length, pastKeywords.length);
  return score;
}

/**
 * Search for relevant past conversations
 * 
 * @param currentMessage - The current user message
 * @param allMessages - All past messages
 * @param limit - Maximum number of results to return
 * @param minScore - Minimum relevance score (0-1)
 * @returns Array of relevant conversations sorted by relevance
 */
export function searchRelevantConversations(
  currentMessage: string,
  allMessages: Message[],
  limit: number = 10,
  minScore: number = 0.1
): RelevantConversation[] {
  const results: RelevantConversation[] = [];

  // Search through all past messages
  for (const message of allMessages) {
    const score = calculateRelevance(currentMessage, message.content);

    if (score >= minScore) {
      results.push({
        message,
        relevanceScore: score,
      });
    }
  }

  // Sort by relevance score (descending) and recency
  results.sort((a, b) => {
    // First, sort by relevance score
    if (Math.abs(a.relevanceScore - b.relevanceScore) > 0.01) {
      return b.relevanceScore - a.relevanceScore;
    }
    // If scores are similar, prefer more recent messages
    return b.message.timestamp.getTime() - a.message.timestamp.getTime();
  });

  // Return top results
  return results.slice(0, limit);
}

/**
 * Format relevant conversations for LLM context
 * 
 * @param relevantConversations - Array of relevant conversations
 * @returns Formatted string for LLM context
 */
export function formatRelevantConversations(
  relevantConversations: RelevantConversation[]
): string {
  if (relevantConversations.length === 0) {
    return "";
  }

  const formatted = relevantConversations
    .map((rc, index) => {
      const date = rc.message.timestamp.toLocaleDateString("ja-JP");
      const role = rc.message.role === "user" ? "ユーザー" : "AI";
      return `[過去の会話 ${index + 1}] (${date}, 関連度: ${(rc.relevanceScore * 100).toFixed(0)}%)\n${role}: ${rc.message.content}`;
    })
    .join("\n\n");

  return `\n\n【関連する過去の会話】\n${formatted}`;
}
