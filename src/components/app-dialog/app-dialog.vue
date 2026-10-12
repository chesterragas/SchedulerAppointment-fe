<template>
  <div v-if="open" class="app-dialog" :class="{ 'app-dialog--front': front }" role="presentation" @keydown.esc="$emit('close')">
    <button class="app-dialog__backdrop" type="button" aria-label="Close" @click="$emit('close')" />
    <div
      class="app-dialog__panel"
      :class="{ 'app-dialog__panel--wide': wide }"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <header class="app-dialog__header">
        <h2 :id="titleId">{{ title }}</h2>
        <button v-if="!hideClose" class="app-dialog__close" type="button" aria-label="Close" @click="$emit('close')">
          Close
        </button>
      </header>
      <div class="app-dialog__body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppDialog',
  props: {
    open: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    titleId: {
      type: String,
      default: 'dialog-title'
    },
    front: {
      type: Boolean,
      default: false
    },
    wide: {
      type: Boolean,
      default: false
    },
    hideClose: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close']
}
</script>
