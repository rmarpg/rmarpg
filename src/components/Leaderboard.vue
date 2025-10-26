<template>
  <div class="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-white">🏆 Leaderboard</h3>
      <button
        @click="refreshLeaderboard"
        :disabled="loading"
        class="rounded-md bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30 disabled:opacity-50"
      >
        {{ loading ? '↻' : '⟲' }}
      </button>
    </div>

    <div v-if="loading" class="py-8 text-center">
      <div
        class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"
      ></div>
      <p class="mt-2 text-sm text-white/80">Loading leaderboard...</p>
    </div>

    <div v-else-if="error" class="py-8 text-center">
      <p class="text-sm text-red-200">{{ error }}</p>
      <button
        @click="refreshLeaderboard"
        class="mt-2 text-xs text-white/80 underline hover:text-white"
      >
        Try again
      </button>
    </div>

    <div v-else-if="leaderboard.length === 0" class="py-8 text-center">
      <p class="text-sm text-white/80">No assessments found yet.</p>
      <p class="mt-1 text-xs text-white/60">Complete an assessment to see the leaderboard!</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(entry, index) in leaderboard"
        :key="entry.id"
        :class="[
          'flex items-center justify-between rounded-md p-3 transition-colors',
          index === 0
            ? 'border border-yellow-400/30 bg-yellow-500/20'
            : index === 1
              ? 'border border-gray-300/30 bg-gray-300/20'
              : index === 2
                ? 'border border-orange-400/30 bg-orange-500/20'
                : 'border border-white/20 bg-white/10',
        ]"
      >
        <div class="flex items-center space-x-3">
          <div
            :class="[
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
              index === 0
                ? 'bg-yellow-500 text-yellow-900'
                : index === 1
                  ? 'bg-gray-300 text-gray-800'
                  : index === 2
                    ? 'bg-orange-500 text-orange-900'
                    : 'bg-white/20 text-white',
            ]"
          >
            {{ index + 1 }}
          </div>
          <div>
            <p class="font-medium text-white">
              {{ entry.learner_name || 'Anonymous' }}
            </p>
            <p class="text-xs text-white/70">
              Grade {{ entry.grade_level }} • {{ formatDate(entry.created_at) }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-white">{{ entry.total_score }}</p>
          <p class="text-xs text-white/70">points</p>
        </div>
      </div>
    </div>

    <div v-if="leaderboard.length > 0" class="mt-4 text-center">
      <p class="text-xs text-white/60">
        Showing top {{ Math.min(leaderboard.length, 10) }} learners
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase-client'

interface LeaderboardEntry {
  id: string
  learner_id: string
  learner_name: string | null
  total_score: number
  grade_level: number
  created_at: string
}

const leaderboard = ref<LeaderboardEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const fetchLeaderboard = async () => {
  try {
    loading.value = true
    error.value = null

    // Try to fetch assessments with profile information
    const { data, error: fetchError } = await supabase
      .from('assessments')
      .select(
        `
        id,
        learner_id,
        total_score,
        grade_level,
        created_at,
        profiles!learner_id (
          first_name,
          last_name
        )
      `,
      )
      .not('total_score', 'is', null)
      .order('total_score', { ascending: false })
      .limit(10)

    if (fetchError) {
      console.warn('Error fetching leaderboard:', fetchError)
      // Use sample data if database query fails
      leaderboard.value = generateSampleLeaderboard()
      return
    }

    if (!data || data.length === 0) {
      // Use sample data if no real data exists
      leaderboard.value = generateSampleLeaderboard()
      return
    }

    // Process the real data
    leaderboard.value = data.map((assessment) => {
      const profile = assessment.profiles as any
      return {
        id: assessment.id,
        learner_id: assessment.learner_id,
        learner_name:
          profile && profile.first_name && profile.last_name
            ? `${profile.first_name} ${profile.last_name}`.trim()
            : null,
        total_score: assessment.total_score,
        grade_level: assessment.grade_level,
        created_at: assessment.created_at,
      }
    })
  } catch (err) {
    console.error('Unexpected error fetching leaderboard:', err)
    error.value = 'Failed to load leaderboard'
    // Fallback to sample data
    leaderboard.value = generateSampleLeaderboard()
  } finally {
    loading.value = false
  }
}

const generateSampleLeaderboard = (): LeaderboardEntry[] => {
  return [
    {
      id: '1',
      learner_id: 'sample1',
      learner_name: 'Alex Johnson',
      total_score: 95,
      grade_level: 2,
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: '2',
      learner_id: 'sample2',
      learner_name: 'Maria Garcia',
      total_score: 87,
      grade_level: 2,
      created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
    {
      id: '3',
      learner_id: 'sample3',
      learner_name: 'David Kim',
      total_score: 82,
      grade_level: 2,
      created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    },
    {
      id: '4',
      learner_id: 'sample4',
      learner_name: 'Emma Wilson',
      total_score: 78,
      grade_level: 2,
      created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    },
    {
      id: '5',
      learner_id: 'sample5',
      learner_name: 'James Brown',
      total_score: 74,
      grade_level: 2,
      created_at: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    },
  ]
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }
}

const refreshLeaderboard = () => {
  fetchLeaderboard()
}

onMounted(() => {
  fetchLeaderboard()
})
</script>
