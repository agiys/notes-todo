<template>
  <div class="empty">
    <h2 class="empty__title">{{ title }}</h2>
    <p v-if="text" class="empty__text">{{ text }}</p>
    <div class="empty__actions"><slot /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; text?: string }>()
</script>


<style scoped lang="scss">
@use '../../assets/scss/variables' as *;

.empty {
  padding: 48px 16px;
  text-align: center;
  background: $color-surface;
  border: 1px dashed $color-border;
  border-radius: $radius;

  &__title {
    font-size: 20px;
  }

  &__text {
    margin-top: 6px;
    color: $color-muted;
  }

  &__actions {
    margin-top: 20px;
  }
}
</style>
