import { supabase } from '@/lib/supabase-client'
import { ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import rma from '@/data/rma.json'

export interface TaskProgress {
  current_question_index: number
  time_left: number
  answers: Record<string, string>
  updated_at: string
}

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
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}

export function useAssessment() {
  const loading = ref(false)
  const currentAssessment = ref<Assessment | null>(null)
  const MAX_ATTEMPTS = 3

  // Internal helper: count assessments for a user
  const getAttemptCount = async (user: User): Promise<number> => {
    if (!user?.id) return 0
    try {
      const { count, error } = await supabase
        .from('assessments')
        .select('id', { count: 'exact', head: true })
        .eq('learner_id', user.id)

      if (error) {
        console.error('Error counting attempts:', error)
        return 0
      }
      return count ?? 0
    } catch (err) {
      console.error('Unexpected error counting attempts:', err)
      return 0
    }
  }

  // Internal helper: fetch an approved, unused retry request if exists
  const getApprovedRetryRequest = async (user: User): Promise<any | null> => {
    if (!user?.id) return null
    try {
      const { data, error } = await supabase
        .from('assessment_retry_requests')
        .select('*')
        .eq('learner_id', user.id)
        .eq('status', 'approved')
        .eq('used', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (error) {
        // Table may not exist yet or permission denied; log and continue
        console.warn('Retry request lookup failed (ensure table exists):', error)
        return null
      }
      return data || null
    } catch (err) {
      console.error('Unexpected error fetching retry request:', err)
      return null
    }
  }

  // Public: can the user start a new assessment now?
  const canStartAssessment = async (user: User): Promise<{
    allowed: boolean
    reason?: string
    approvedRequestId?: string
    attempts?: number
  }> => {
    const attempts = await getAttemptCount(user)
    if (attempts < MAX_ATTEMPTS) {
      return { allowed: true, attempts }
    }
    const req = await getApprovedRetryRequest(user)
    if (req?.id) {
      return { allowed: true, approvedRequestId: req.id, attempts }
    }
    return {
      allowed: false,
      reason: `Attempt limit reached (${MAX_ATTEMPTS}). Request admin approval for another try.`,
      attempts,
    }
  }

  // Public: create a pending retry request
  const requestExtraAttempt = async (
    user: User,
    reason?: string,
  ): Promise<{ success: boolean; status?: string; error?: string }> => {
    if (!user?.id) return { success: false, error: 'User not authenticated' }
    try {
      const { data, error } = await supabase
        .from('assessment_retry_requests')
        .insert({
          learner_id: user.id,
          status: 'pending',
          reason: reason || null,
        })
        .select()
        .single()

      if (error) {
        console.warn('Failed to create retry request (ensure table exists):', error)
        return { success: false, error: error.message }
      }
      return { success: true, status: data.status }
    } catch (err: any) {
      console.error('Unexpected error creating retry request:', err)
      return { success: false, error: err?.message || 'Unknown error' }
    }
  }

  // Internal: mark an approved request as used
  const markRetryUsed = async (requestId: string): Promise<void> => {
    if (!requestId) return
    try {
      const { error } = await supabase
        .from('assessment_retry_requests')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', requestId)
      if (error) console.warn('Failed to mark retry as used:', error)
    } catch (err) {
      console.error('Unexpected error marking retry used:', err)
    }
  }

  const createAssessment = async (user: User, gradeLevel = 2): Promise<Assessment | null> => {
    if (!user?.id) {
      console.error('User not provided for assessment creation')
      return null
    }

    loading.value = true
    try {
      // Enforce attempt limit and approved retries
      const startCheck = await canStartAssessment(user)
      if (!startCheck.allowed) {
        console.warn('Attempt limit enforcement:', startCheck.reason)
        return null
      }

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

      // If this start was allowed due to an approved request, consume it
      if (startCheck.approvedRequestId) {
        await markRetryUsed(startCheck.approvedRequestId)
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

  // Compute maximum possible total from assessment definition
  const MAX_POSSIBLE_TOTAL = (() => {
    try {
      return (rma as any).assessment.tasks.reduce((sum: number, t: any) => sum + (Number(t.points) || 0), 0)
    } catch (err) {
      console.warn('Failed to compute MAX_POSSIBLE_TOTAL from rma.json, falling back to 1100', err)
      return 1100
    }
  })()

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
      const overallScore = (totalScore / MAX_POSSIBLE_TOTAL) * 100

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
        .is('completed_at', null)
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

  // Best assessment (highest total/overall) for a user
  const getBestAssessment = async (user: User): Promise<Assessment | null> => {
    if (!user?.id) {
      console.error('User not provided for best assessment retrieval')
      return null
    }
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('learner_id', user.id)
        .order('total_score', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching best assessment:', error)
        return null
      }
      return data || null
    } catch (err) {
      console.error('Error fetching best assessment:', err)
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
      const userAns = answers[question.id]
      const correctAns = question.answer
      if (
        userAns !== undefined &&
        correctAns !== undefined &&
        userAns.toString().toLowerCase().trim() === correctAns.toString().toLowerCase().trim()
      ) {
        correctAnswers++
      }
    })

    return Math.round((correctAnswers / questions.length) * maxPoints)
  }

  const saveTaskProgress = async (
    assessmentId: string,
    taskId: string,
    progress: TaskProgress,
  ): Promise<boolean> => {
    loading.value = true
    try {
      const columnName = `task_${taskId.toLowerCase()}_progress`

      const { error } = await supabase
        .from('assessments')
        .update({
          [columnName]: progress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessmentId)

      if (error) {
        console.error('Error saving task progress:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error saving task progress:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  const loadTaskProgress = async (
    assessmentId: string,
    taskId: string,
  ): Promise<TaskProgress | null> => {
    loading.value = true
    try {
      const columnName = `task_${taskId.toLowerCase()}_progress`

      const { data, error } = await supabase
        .from('assessments')
        .select(columnName)
        .eq('id', assessmentId)
        .single()

      if (error) {
        console.error('Error loading task progress:', error)
        return null
      }

      const progress = (data as any)?.[columnName] as TaskProgress | null

      // Check if progress exists and is recent (within 24 hours)
      if (progress && progress.updated_at) {
        const progressDate = new Date(progress.updated_at)
        const hoursSinceUpdate = (Date.now() - progressDate.getTime()) / (1000 * 60 * 60)

        if (hoursSinceUpdate < 24) {
          return progress
        } else {
          // Clear old progress
          await clearTaskProgress(assessmentId, taskId)
        }
      }

      return null
    } catch (error) {
      console.error('Error loading task progress:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  const clearTaskProgress = async (assessmentId: string, taskId: string): Promise<boolean> => {
    loading.value = true
    try {
      const columnName = `task_${taskId.toLowerCase()}_progress`

      const { error } = await supabase
        .from('assessments')
        .update({
          [columnName]: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessmentId)

      if (error) {
        console.error('Error clearing task progress:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error clearing task progress:', error)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    currentAssessment,
    MAX_ATTEMPTS,
    getAttemptCount,
    createAssessment,
    updateTaskScore,
    getCurrentAssessment,
    getBestAssessment,
    getOrCreateAssessment,
    calculateTaskScore,
    saveTaskProgress,
    loadTaskProgress,
    clearTaskProgress,
    canStartAssessment,
    requestExtraAttempt,
  }
}
