<template>
  <div class="layout">
    <header class="layout__header">
      <div class="container layout__bar">
        <NuxtLink to="/" class="layout__logo">Заметки</NuxtLink>
      </div>
    </header>
    <main class="container layout__main">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
@use '../assets/scss/variables' as *;

.layout {
  &__header {
    background: $color-surface;
    border-bottom: 1px solid $color-border;
  }

  &__bar {
    display: flex;
    align-items: center;
    height: 56px;
  }

  &__logo {
    color: $color-text;
    font-size: 20px;
    font-weight: 700;
    text-decoration: none;
  }

  &__main {
    padding-top: 24px;
    padding-bottom: 48px;
  }
}
</style>
