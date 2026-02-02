import type { Assessment } from '@/composables/useAssessment'

/**
 * Maximum possible total score across all tasks.
 * This should match the MAX_POSSIBLE_TOTAL constant in useAssessment.ts
 */
export const MAX_POSSIBLE_TOTAL = 44

/**
 * Calculate the total score by summing all task scores from task_a_score to task_l_score.
 * This provides a dynamic calculation instead of relying on the stored total_score column.
 *
 * @param assessment - The assessment object containing individual task scores
 * @returns The calculated total score
 */
export function calculateTotalScore(assessment: Assessment | null | undefined): number {
  if (!assessment) return 0

  const taskScores = [
    assessment.task_a_score,
    assessment.task_b_score,
    assessment.task_c_score,
    assessment.task_d_score,
    assessment.task_e_score,
    assessment.task_f_score,
    assessment.task_g_score,
    assessment.task_h_score,
    assessment.task_i_score,
    assessment.task_j_score,
    assessment.task_k_score,
    assessment.task_l_score,
  ]

  return taskScores.reduce((sum, score) => sum + (Number(score) || 0), 0)
}

/**
 * Calculate the overall score percentage based on task scores.
 * This provides a dynamic calculation instead of relying on the stored overall_score column.
 *
 * @param assessment - The assessment object containing individual task scores
 * @returns The calculated overall score as a percentage (0-100)
 */
export function calculateOverallScore(assessment: Assessment | null | undefined): number {
  if (!assessment) return 0

  const totalScore = calculateTotalScore(assessment)
  const overallScore = (totalScore / MAX_POSSIBLE_TOTAL) * 100

  // Round to 2 decimal places and ensure it's within bounds
  return Math.min(Math.max(Math.round(overallScore * 100) / 100, 0), 100)
}

/**
 * Get the display-ready total score for an assessment.
 * Falls back to stored value if task scores are not available.
 *
 * @param assessment - The assessment object
 * @returns The total score to display
 */
export function getDisplayTotalScore(assessment: Assessment | null | undefined): number {
  if (!assessment) return 0

  const calculated = calculateTotalScore(assessment)

  // If calculated score is 0 and stored score exists, use stored as fallback
  // This handles cases where task score columns might not be populated
  if (calculated === 0 && assessment.total_score) {
    return Number(assessment.total_score) || 0
  }

  return calculated
}

/**
 * Get the display-ready overall score percentage for an assessment.
 * Falls back to stored value if task scores are not available.
 *
 * @param assessment - The assessment object
 * @returns The overall score percentage to display
 */
export function getDisplayOverallScore(assessment: Assessment | null | undefined): number {
  if (!assessment) return 0

  const calculated = calculateOverallScore(assessment)

  // If calculated score is 0 and stored score exists, use stored as fallback
  // This handles cases where task score columns might not be populated
  if (calculated === 0 && assessment.overall_score) {
    return Number(assessment.overall_score) || 0
  }

  return calculated
}
