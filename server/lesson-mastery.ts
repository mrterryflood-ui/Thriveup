export const MASTERY_THRESHOLD = 0.80;
export const MAX_ATTEMPTS_BEFORE_REMEDIATION = 3;

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  pointsEarned: number;
  masteryAchieved: boolean;
  triggerSpark: boolean;
  sparkContext: string;
  remediation: {
    required: boolean;
    missedConcepts: string[];
    suggestedReview: string;
  };
  canAdvance: boolean;
}

export function processQuizSubmission(
  answers: Record<string, string>,
  questions: Array<{ id: string; correctAnswer: string; questionText?: string; topic?: string }>,
  attemptNumber: number
): Omit<QuizResult, "pointsEarned"> & { pointsEarned: number } {
  let correct = 0;
  const missedQuestions: Array<{ id: string; questionText?: string; topic?: string }> = [];

  for (const q of questions) {
    if (answers[q.id] === q.correctAnswer) {
      correct++;
    } else {
      missedQuestions.push(q);
    }
  }

  const percentage = questions.length > 0 ? correct / questions.length : 0;
  const masteryAchieved = percentage >= MASTERY_THRESHOLD;
  const needsRemediation = !masteryAchieved && attemptNumber >= MAX_ATTEMPTS_BEFORE_REMEDIATION;

  const pointsEarned = masteryAchieved ? 100 : percentage >= 0.70 ? 50 : 25;

  const missedConcepts = missedQuestions
    .map((q) => q.topic ?? q.questionText?.substring(0, 60) ?? `Question ${q.id}`)
    .filter(Boolean);

  const sparkContext =
    missedConcepts.length > 0
      ? `The learner just scored ${Math.round(percentage * 100)}% on a quiz and needs 80% to advance. They missed questions about: ${missedConcepts.join("; ")}. Help them understand ONLY these specific concepts — do not re-explain the entire lesson.`
      : "";

  return {
    score: correct,
    total: questions.length,
    percentage,
    passed: percentage >= 0.70,
    attemptNumber,
    pointsEarned,
    masteryAchieved,
    triggerSpark: !masteryAchieved,
    sparkContext,
    remediation: {
      required: needsRemediation,
      missedConcepts,
      suggestedReview: needsRemediation
        ? `Review the lesson content before retrying. Focus on: ${missedConcepts.slice(0, 2).join(" and ")}.`
        : "",
    },
    canAdvance: masteryAchieved,
  };
}
