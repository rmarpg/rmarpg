import { supabase } from '@/lib/supabase-client'
import { ref } from 'vue'
import type { User } from '@supabase/supabase-js'

export interface Assessment {
  id?: string
  learner_id: string
  grade_level: number
  assessment_date: string
  task_a_score: number
  task_b_score: number
  task_c_score: number
  task_d_score: number
  task_e_score: number
  task_f_score: number
  task_g_score: number
  task_h_score: number
  task_i_score: number
  task_j_score: number
  task_k_score: number
  total_score: number
  overall_score: number
  created_at?: string
  updated_at?: string
}

export function useAssessment() {
  const loading = ref(false)
  const currentAssessment = ref<Assessment | null>(null)

  const createAssessment = async (user: User, gradeLevel = 2): Promise<Assessment | null> => {
    if (!user?.id) {
      console.error('User not provided for assessment creation')
      return null
    }

    loading.value = true
    try {
      const assessmentData: Omit<Assessment, 'id' | 'created_at' | 'updated_at'> = {
        learner_id: user.id,
        grade_level: gradeLevel,
        assessment_date: new Date().toISOString().split('T')[0],
        task_a_score: 0,
        task_b_score: 0,
        task_c_score: 0,
        task_d_score: 0,
        task_e_score: 0,
        task_f_score: 0,
        task_g_score: 0,
        task_h_score: 0,
        task_i_score: 0,
        task_j_score: 0,
        task_k_score: 0,
        total_score: 0,
        overall_score: 0,
      }

      const { data, error } = await supabase
        .from('assessments')
        .insert(assessmentData)
        .select()
        .single()

      if (error) {
        console.error('Error creating assessment:', error)
        return null
      }

      currentAssessment.value = data
      return data
    } catch (error) {
      console.error('Error creating assessment:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateTaskScore = async (taskName: string, score: number): Promise<boolean> => {
    if (!currentAssessment.value?.id) {
      console.error('No current assessment found')
      return false
    }

    loading.value = true
    try {
      const updateData: Partial<Assessment> = {
        [`task_${taskName.toLowerCase()}_score`]: score,
        updated_at: new Date().toISOString(),
      }

      // Calculate new total score
      const currentScores = {
        task_a_score: currentAssessment.value.task_a_score,
        task_b_score: currentAssessment.value.task_b_score,
        task_c_score: currentAssessment.value.task_c_score,
        task_d_score: currentAssessment.value.task_d_score,
        task_e_score: currentAssessment.value.task_e_score,
        task_f_score: currentAssessment.value.task_f_score,
        task_g_score: currentAssessment.value.task_g_score,
        task_h_score: currentAssessment.value.task_h_score,
        task_i_score: currentAssessment.value.task_i_score,
        task_j_score: currentAssessment.value.task_j_score,
        task_k_score: currentAssessment.value.task_k_score,
        [`task_${taskName.toLowerCase()}_score`]: score,
      }

      const totalScore = Object.values(currentScores).reduce(
        (sum: number, score: any) => sum + (Number(score) || 0),
        0,
      )
      const overallScore = (totalScore / 1100) * 100 // 11 tasks × 100 points each = 1100 max possible score

      updateData.total_score = totalScore
      updateData.overall_score = parseFloat(overallScore.toFixed(2))

      const { data, error } = await supabase
        .from('assessments')
        .update(updateData)
        .eq('id', currentAssessment.value.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating task score:', error)
        return false
      }

      currentAssessment.value = data
      return true
    } catch (error) {
      console.error('Error updating task score:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  const getCurrentAssessment = async (user: User): Promise<Assessment | null> => {
    if (!user?.id) {
      console.error('User not provided for assessment retrieval')
      return null
    }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('learner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() // Use maybeSingle instead of single to handle no results gracefully

      if (error) {
        console.error('Error fetching current assessment:', error)
        return null
      }

      currentAssessment.value = data || null
      return data || null
    } catch (error) {
      console.error('Error fetching current assessment:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  const getOrCreateAssessment = async (user: User, gradeLevel = 2): Promise<Assessment | null> => {
    // First try to get existing assessment
    let assessment = await getCurrentAssessment(user)

    // If no assessment exists, create a new one
    if (!assessment) {
      console.log('No existing assessment found, creating new one')
      assessment = await createAssessment(user, gradeLevel)
    } else {
      console.log('Using existing assessment:', assessment.id)
    }

    // Ensure currentAssessment is set regardless of which path we took
    if (assessment) {
      currentAssessment.value = assessment
      console.log('currentAssessment.value set to:', currentAssessment.value.id)
    }

    return assessment
  }

  const calculateTaskScore = (
    answers: Record<string, string>,
    questions: any[],
    maxPoints: number,
  ): number => {
    let correctAnswers = 0

    questions.forEach((question) => {
      if (answers[question.id] === question.answer) {
        correctAnswers++
      }
    })

    return Math.round((correctAnswers / questions.length) * maxPoints)
  }

  return {
    loading,
    currentAssessment,
    createAssessment,
    updateTaskScore,
    getCurrentAssessment,
    getOrCreateAssessment,
    calculateTaskScore,
  }
}
