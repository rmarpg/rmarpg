<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useVModel } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-vue-next'

const props = defineProps<{
  modelValue?: string
  name?: string
  id?: string
  placeholder?: string
  inputClass?: string
  disabled?: boolean
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const value = useVModel(props, 'modelValue', emits)
const show = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const toggle = async () => {
  // preserve value + selection across changing `type` (some browsers can reset it)
  const el = inputRef.value
  const prevValue = el?.value ?? ''
  const selStart = el?.selectionStart ?? 0
  const selEnd = el?.selectionEnd ?? selStart

  show.value = !show.value

  // After DOM updates, restore value and selection to avoid any browser quirks
  await nextTick()
  if (!el) return
  el.value = prevValue
  try {
    el.setSelectionRange(selStart, selEnd)
  } catch (err) {
    /* setSelectionRange may fail on some input types/browsers; ignore */
  }
  el.focus()
}
</script>

<template>
  <div class="relative">
    <input
      ref="inputRef"
      :id="id"
      :name="name"
      :placeholder="placeholder"
      :disabled="disabled"
      v-model="value"
      :type="show ? 'text' : 'password'"
      :class="[
        'border-input selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-white px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none sm:bg-transparent md:text-sm',
        props.inputClass,
      ]"
    />

    <Button
      type="button"
      variant="ghost"
      size="icon"
      class="absolute top-1/2 right-1 -translate-y-1/2"
      @mousedown.prevent
      @click.stop="toggle"
      :aria-label="show ? 'Hide password' : 'Show password'"
    >
      <span class="sr-only">{{ show ? 'Hide password' : 'Show password' }}</span>
      <Eye v-if="!show" :size="16" />
      <EyeOff v-else :size="16" />
    </Button>
  </div>
</template>
