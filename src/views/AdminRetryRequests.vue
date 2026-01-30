<template>
  <DashboardLayout>
    <header class="mb-6">
      <h2 class="text-2xl font-semibold text-neutral-800">Retry Requests</h2>
      <p class="mt-1 text-neutral-600">Approve or deny extra assessment attempts</p>
    </header>

    <div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <button
            class="rounded-md px-3 py-1 text-sm"
            :class="
              statusFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
            "
            @click="setFilter('pending')"
          >
            Pending
          </button>
          <button
            class="rounded-md px-3 py-1 text-sm"
            :class="
              statusFilter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'
            "
            @click="setFilter('approved')"
          >
            Approved
          </button>
          <button
            class="rounded-md px-3 py-1 text-sm"
            :class="
              statusFilter === 'denied' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-800'
            "
            @click="setFilter('denied')"
          >
            Denied
          </button>
          <button
            class="rounded-md px-3 py-1 text-sm"
            :class="statusFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'"
            @click="setFilter('all')"
          >
            All
          </button>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <input
            v-model="search"
            type="text"
            placeholder="Search learner..."
            class="w-48 rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            @click="refresh"
            :disabled="loading"
            class="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
          >
            {{ loading ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="py-10 text-center text-gray-500">Loading requests…</div>
      <div v-else>
        <div v-if="filteredRequests.length === 0" class="py-10 text-center text-gray-500">
          No requests found.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Learner</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Reason</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Used</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Created</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Approved By</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="req in filteredRequests" :key="req.id">
                <td class="px-4 py-2 text-sm text-gray-900">
                  {{ req.learner_name || req.learner_id }}
                </td>
                <td class="px-4 py-2 text-sm">
                  <span
                    :class="{
                      'rounded-md bg-blue-100 px-2 py-1 text-blue-800': req.status === 'pending',
                      'rounded-md bg-green-100 px-2 py-1 text-green-800': req.status === 'approved',
                      'rounded-md bg-red-100 px-2 py-1 text-red-800': req.status === 'denied',
                    }"
                    >{{ req.status }}</span
                  >
                </td>
                <td class="px-4 py-2 text-sm text-gray-700">{{ req.reason || '—' }}</td>
                <td class="px-4 py-2 text-sm">
                  <span :class="req.used ? 'text-green-700' : 'text-gray-700'">{{
                    req.used ? 'Yes' : 'No'
                  }}</span>
                </td>
                <td class="px-4 py-2 text-sm text-gray-700">{{ formatDate(req.created_at) }}</td>
                <td class="px-4 py-2 text-sm text-gray-700">{{ req.approved_by_name || '—' }}</td>
                <td class="px-4 py-2 text-sm">
                  <div class="flex flex-wrap gap-2">
                    <button
                      class="rounded-md bg-green-600 px-3 py-1 text-white hover:bg-green-700 disabled:opacity-50"
                      :disabled="req.status === 'approved'"
                      @click="approve(req)"
                    >
                      Approve
                    </button>
                    <button
                      class="rounded-md bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50"
                      :disabled="req.status === 'denied'"
                      @click="deny(req)"
                    >
                      Deny
                    </button>
                    <button
                      class="rounded-md bg-gray-600 px-3 py-1 text-white hover:bg-gray-700 disabled:opacity-50"
                      :disabled="req.used"
                      @click="markUsed(req)"
                    >
                      Mark Used
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase-client'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()
const loading = ref(false)
const statusFilter = ref<'all' | 'pending' | 'approved' | 'denied'>('pending')
const search = ref('')

interface RetryRow {
  id: string
  learner_id: string
  learner_name?: string | null
  status: 'pending' | 'approved' | 'denied'
  reason: string | null
  used: boolean
  created_at: string
  approved_by: string | null
  approved_by_name?: string | null
}

const requests = ref<RetryRow[]>([])

const setFilter = (s: 'all' | 'pending' | 'approved' | 'denied') => {
  statusFilter.value = s
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

const filteredRequests = computed(() => {
  const list =
    statusFilter.value === 'all'
      ? requests.value
      : requests.value.filter((r) => r.status === statusFilter.value)
  if (!search.value) return list
  const needle = search.value.toLowerCase()
  return list.filter((r) => (r.learner_name || '').toLowerCase().includes(needle))
})

const refresh = async () => {
  loading.value = true
  try {
    // Fetch requests and join minimal profile names
    const { data, error } = await supabase
      .from('assessment_retry_requests')
      .select(
        `
        id,
        learner_id,
        status,
        reason,
        used,
        created_at,
        approved_by,
        profiles:learner_id (first_name, last_name),
        approver:approved_by (first_name, last_name)
      `,
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching retry requests:', error)
      requests.value = []
      return
    }

    requests.value = (data || []).map((row: any) => {
      const learner_name = row.profiles
        ? `${row.profiles.first_name || ''} ${row.profiles.last_name || ''}`.trim() || null
        : null
      const approved_by_name = row.approver
        ? `${row.approver.first_name || ''} ${row.approver.last_name || ''}`.trim() || null
        : null
      return {
        id: row.id,
        learner_id: row.learner_id,
        learner_name,
        status: row.status,
        reason: row.reason,
        used: !!row.used,
        created_at: row.created_at,
        approved_by: row.approved_by,
        approved_by_name,
      } as RetryRow
    })
  } finally {
    loading.value = false
  }
}

const approve = async (req: RetryRow) => {
  if (!user.value) return
  loading.value = true
  try {
    const { error } = await supabase
      .from('assessment_retry_requests')
      .update({
        status: 'approved',
        approved_by: user.value.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', req.id)
    if (error) {
      console.error('Approve failed:', error)
      return
    }
    await refresh()
  } finally {
    loading.value = false
  }
}

const deny = async (req: RetryRow) => {
  if (!user.value) return
  loading.value = true
  try {
    const { error } = await supabase
      .from('assessment_retry_requests')
      .update({
        status: 'denied',
        approved_by: user.value.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', req.id)
    if (error) {
      console.error('Deny failed:', error)
      return
    }
    await refresh()
  } finally {
    loading.value = false
  }
}

const markUsed = async (req: RetryRow) => {
  loading.value = true
  try {
    const { error } = await supabase
      .from('assessment_retry_requests')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', req.id)
    if (error) {
      console.error('Mark used failed:', error)
      return
    }
    await refresh()
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await refresh()
})
</script>
