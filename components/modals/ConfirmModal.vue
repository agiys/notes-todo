<template>
  <BaseModal :open="open" :title="title" @close="emit('cancel')">
    <p>{{ message }}</p>
    <template #actions>
      <BaseButton data-autofocus @click="emit('cancel')">{{ cancelText }}</BaseButton>
      <BaseButton :variant="danger ? 'danger' : 'primary'" @click="emit('confirm')">
        {{ confirmText }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
  }>(),
  { confirmText: 'Подтвердить', cancelText: 'Отмена', danger: false }
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>
