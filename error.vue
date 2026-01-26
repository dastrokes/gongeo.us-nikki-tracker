<template>
  <ErrorNotFound />
</template>

<script setup lang="ts">
  const localePath = useLocalePath()
  const route = useRoute()
  const target = localePath('/error')

  if (route.path !== target) {
    clearError({ redirect: target })
  }
</script>
