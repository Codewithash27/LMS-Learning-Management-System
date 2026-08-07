export type ParsedQuestion = {
  text: string;
  modelAnswer?: string | null;
};

/**
 * Extract question / answer blocks from plain text (e.g. from a PDF).
 * Supports patterns like:
 *   Q1. ... / Question 1: ... / 1) ... / 1. ...
 * Optional answers:
 *   Answer: ... / Ans: ... / Model Answer: ...
 */
export function parseQuestionsFromText(rawText: string): ParsedQuestion[] {
  const text = (rawText || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  if (!text) return [];

  const startRegex =
    /(?:^|\n)\s*(?:Q(?:uestion)?\s*[-.]?\s*)?(\d+)\s*[.)\]:\-]\s+/gi;

  const matches: { index: number; number: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = startRegex.exec(text)) !== null) {
    matches.push({ index: match.index + (match[0].startsWith("\n") ? 1 : 0), number: match[1] });
  }

  if (matches.length === 0) {
    // Fallback: split on blank lines if numbered markers are missing
    return text
      .split(/\n\s*\n+/)
      .map((block) => block.replace(/\s+/g, " ").trim())
      .filter((block) => block.length >= 12)
      .map((block) => splitQuestionAndAnswer(block))
      .filter((q) => q.text.length > 0);
  }

  const blocks: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const chunk = text.slice(start, end).trim();
    if (chunk) blocks.push(chunk);
  }

  return blocks
    .map((block) => {
      const cleaned = block
        .replace(/^(?:Q(?:uestion)?\s*[-.]?\s*)?\d+\s*[.)\]:\-]\s*/i, "")
        .trim();
      return splitQuestionAndAnswer(cleaned);
    })
    .filter((q) => q.text.length > 0);
}

function splitQuestionAndAnswer(block: string): ParsedQuestion {
  const answerMatch = block.match(
    /\n\s*(?:model\s*)?(?:answer|ans|solution)\s*[:\-]\s*([\s\S]+)$/i
  );

  if (answerMatch) {
    const text = block.slice(0, answerMatch.index).replace(/\s+/g, " ").trim();
    const modelAnswer = answerMatch[1].replace(/\s+/g, " ").trim();
    return {
      text,
      modelAnswer: modelAnswer || null,
    };
  }

  return {
    text: block.replace(/\s+/g, " ").trim(),
    modelAnswer: null,
  };
}

export function pickRandomQuestions<T>(items: T[], count: number): T[] {
  const n = Math.max(0, Math.min(count, items.length));
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
