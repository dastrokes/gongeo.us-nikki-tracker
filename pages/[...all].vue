<template>
  <ErrorNotFound />
</template>

<script setup lang="ts">
  import { setResponseStatus } from 'h3'

  const event = useRequestEvent()

  if (import.meta.server && event) {
    setResponseStatus(event, 404)
  }
</script>
