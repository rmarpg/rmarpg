import rma from '@/data/rma.json'
import { supabase } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'
import { ref } from 'vue'

export interface TaskProgress {
  current_question_index: number
  time_left: number
  answers: Record<string, string>
  updated_at: string
}

/* Typed shapes to avoid `any` and improve safety */
export interface RetryRequest {
  id: string
  learner_id: string
  status: 'pending' | 'approved' | 'rejected'
  used: boolean
  reason?: string | null
  created_at?: string
  used_at?: string | null
}

export interface RmaQuestion {
  id: string
  prompt?: string
  type?: string
  answer?: string | number
  possible_answers?: Array<string | number>
}

export interface RmaTask {
  id: string
  name?: string
  points: number
  time_limit_seconds?: number
  questions?: RmaQuestion[]
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

export interface Rma {
  assessment: {
    title?: string
    grade_level?: number
    version?: string
    instructions?: string
    tasks: RmaTask[]
  }
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
        // Only count completed assessments as attempts. In-progress (completed_at = null)
        // should not consume a try if the user closes the browser.
        .eq('learner_id', user.id)
        .not('completed_at', 'is', null)

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
  const getApprovedRetryRequest = async (user: User): Promise<RetryRequest | null> => {
    if (!user?.id) return null
    try {
      const res = await supabase
        .from('assessment_retry_requests')
        .select('*')
        .eq('learner_id', user.id)
        .eq('status', 'approved')
        .eq('used', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (res.error) {
        // Table may not exist yet or permission denied; log and continue
        console.warn('Retry request lookup failed (ensure table exists):', res.error)
        return null
      }
      return (res.data as RetryRequest) || null
    } catch (err) {
      console.error('Unexpected error fetching retry request:', err)
      return null
    }
  }

  // Public: can the user start a new assessment now?
  const canStartAssessment = async (
    user: User,
  ): Promise<{
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
    } catch (err: unknown) {
      console.error('Unexpected error creating retry request:', err)
      const message = err instanceof Error ? err.message : String(err)
      return { success: false, error: message || 'Unknown error' }
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

  // Scoring constants and maximum total. The DB stores each task score on a 0-40 scale.
  // MAX_POSSIBLE_TOTAL is the number of tasks * TASK_MAX_SCORE so totals align
  // with how scores are stored in the database.
  const TASK_MAX_SCORE = 40
  const MAX_POSSIBLE_TOTAL = (() => {
    try {
      const tasks = (rma as any).assessment.tasks || []
      return tasks.length * TASK_MAX_SCORE
    } catch (err) {
      console.warn('Failed to compute MAX_POSSIBLE_TOTAL from rma.json, falling back to 1100', err)
      return 1100
    }
  })()

  // helper: safely read numeric fields from an Assessment
  const getNumericAssessmentValue = (a: Assessment | null, key: keyof Assessment): number => {
    if (!a) return 0
    const raw = (a as unknown as Record<string, unknown>)[key]
    if (typeof raw === 'number') return raw
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  }

  const updateTaskScore = async (taskName: string, score: number): Promise<boolean> => {
    if (!currentAssessment.value?.id) {
      console.error('No current assessment found')
      return false
    }

    loading.value = true
    try {
      const assessmentId = currentAssessment.value.id
      // Normalize incoming score to DB scale (0..TASK_MAX_SCORE)
      const rawScore = Number(score)
      const storeScore = Number.isFinite(rawScore) ? Math.max(0, Math.min(TASK_MAX_SCORE, Math.round(rawScore))) : 0

      // Upsert into assessment_task_scores
      const taskKey = taskName.toUpperCase()
      const upsertPayload = {
        assessment_id: assessmentId,
        task: taskKey,
        score: storeScore,
        updated_at: new Date().toISOString(),
      }

      const { error: upsertError } = await supabase.from('assessment_task_scores').upsert(upsertPayload, { onConflict: 'assessment_id,task' })
      if (upsertError) {
        console.error('Failed to upsert assessment_task_scores:', upsertError)
        return false
      }

      // Recompute total by fetching all task scores for this assessment
      const { data: scoresData, error: scoresError } = await supabase
        .from('assessment_task_scores')
        .select('score')
        .eq('assessment_id', assessmentId)

      if (scoresError) {
        console.warn('Failed to fetch task scores for total recompute:', scoresError)
      }

      const totalScore = (scoresData || []).reduce((sum: number, row: any) => sum + (Number(row.score) || 0), 0)
      const overallScore = (totalScore / MAX_POSSIBLE_TOTAL) * 100

      // Persist totals back to assessments table
      const { data: updatedAssessment, error: updateError } = await supabase
        .from('assessments')
        .update({ total_score: totalScore, overall_score: overallScore, updated_at: new Date().toISOString() })
        .eq('id', assessmentId)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to update assessment totals:', updateError)
        return false
      }

      currentAssessment.value = updatedAssessment
      return true
    } catch (err) {
      console.error('Error updating task score:', err)
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
      console.log('currentAssessment.value set to:', assessment.id)
    }

    return assessment
  }

  const calculateTaskScore = (
    answers: Record<string, string>,
    questions: RmaQuestion[],
    maxPoints: number,
  ): number => {
    if (!questions || questions.length === 0) return 0

    let correctAnswers = 0

    questions.forEach((question) => {
      const userAns = answers[question.id]
      const correctAns = question.answer
      if (
        userAns !== undefined &&
        correctAns !== undefined &&
        userAns.toString().toLowerCase().trim() ===
          String(correctAns).toString().toLowerCase().trim()
      ) {
        correctAnswers++
      }
    })

    // Never return more than the configured maxPoints (defensive)
    return Math.min(Math.round((correctAnswers / questions.length) * maxPoints), maxPoints)
  }

  const saveTaskProgress = async (
    assessmentId: string,
    taskId: string,
    progress: TaskProgress,
  ): Promise<boolean> => {
    loading.value = true
    try {
      const taskKey = taskId.toUpperCase()
      const upsertPayload = {
        assessment_id: assessmentId,
        task: taskKey,
        progress: progress,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('assessment_task_scores').upsert(upsertPayload, { onConflict: 'assessment_id,task' })
      if (error) {
        console.error('Error upserting task progress:', error)
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
      const taskKey = taskId.toUpperCase()
      const { data, error } = await supabase
        .from('assessment_task_scores')
        .select('progress')
        .eq('assessment_id', assessmentId)
        .eq('task', taskKey)
        .maybeSingle()

      if (error) {
        console.error('Error fetching task progress from assessment_task_scores:', error)
        return null
      }

      const progress = (data as any)?.progress ?? null
      if (progress && progress.updated_at) {
        const updatedAt = new Date(progress.updated_at)
        const ageMs = Date.now() - updatedAt.getTime()
        // Only return recent progress (within 24h)
        if (ageMs <= 24 * 60 * 60 * 1000) return progress as TaskProgress
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
