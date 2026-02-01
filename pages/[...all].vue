<template>
  <ErrorNotFound />
</template>

<script setup lang="ts">
  import { setResponseStatus } from 'h3'

  definePageMeta({
    robots: false,
  })

  const event = useRequestEvent()
  if (import.meta.server && event) {
    setResponseStatus(event, 404)
  }
</script>
