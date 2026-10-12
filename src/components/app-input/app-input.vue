<template>
  <label class="app-input">
    <span class="app-input__label">{{ label }}</span>
    <textarea
      v-if="multiline"
      :id="id"
      :value="modelValue"
      :required="required"
      rows="3"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <input
      v-else
      :id="id"
      :type="type"
      :value="modelValue"
      :autocomplete="autocomplete"
      :required="required"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </label>
</template>

<script>
export default {
  name: 'AppInput',
  props: {
    id: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'text'
    },
    modelValue: {
      type: String,
      default: ''
    },
    autocomplete: {
      type: String,
      default: 'off'
    },
    required: {
      type: Boolean,
      default: false
    },
    multiline: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue']
}
</script>
