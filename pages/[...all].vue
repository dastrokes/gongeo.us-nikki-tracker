<template>
  <ErrorNotFound />
</template>

<script setup lang="ts">
  import { setResponseStatus } from 'h3'

  definePageMeta({
    umami: false,
  })

  const event = useRequestEvent()
  if (import.meta.server && event) {
    setResponseStatus(event, 404)
  }
</script>
