<script setup>
defineProps({
  text: { type: String, required: true },
})
</script>

<template>
  <div class="empty-state">
    <p class="empty-state__text">{{ text }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  border: 1px solid var(--color-primary-light);
  border-radius: 16px;
  padding: 40px 24px;
  text-align: center;
  background: transparent;
}

.empty-state__text {
  margin: 0;
  font-size: var(--font-size-body);
  color: var(--color-text-light);
}

@media (max-width: 767px) {
  .empty-state {
    padding: 28px 16px;
    border-radius: 12px;
  }

  .empty-state__text {
    font-size: var(--font-size-body-mob);
  }
}
</style>
