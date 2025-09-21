<template>
  <div class="flex min-h-screen">
    <aside class="w-64 shrink-0 bg-blue-800 py-8">
      <div class="flex justify-center">
        <img src="/logo.png" alt="Logo" class="h-16 w-auto" />
      </div>

      <nav class="mt-8">
        <RouterLink
          to="/scoresheet"
          class="inline-flex w-full justify-center bg-blue-600 px-4 py-2 font-bold text-white"
        >
          Scoresheet
        </RouterLink>

        <RouterLink
          to="/scoresheet"
          class="inline-flex w-full justify-center bg-transparent px-4 py-2 font-bold text-white"
        >
          Summary Graph
        </RouterLink>

        <RouterLink
          to="/scoresheet"
          class="inline-flex w-full justify-center bg-transparent px-4 py-2 font-bold text-white"
        >
          Graph
        </RouterLink>
      </nav>
    </aside>

    <main class="flex-1 shrink-0 p-8">
      <slot />
    </main>
  </div>
</template>
