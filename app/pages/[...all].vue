<template>
  <ErrorNotFound />
</template>

<script setup lang="ts">
  const event = useRequestEvent()
  if (import.meta.server && event) {
    setResponseStatus(event, 404)
  }
</script>
