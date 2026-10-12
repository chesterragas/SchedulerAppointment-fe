<template>
  <div class="availability-page">
    <div class="availability-page__intro">
      <h1>Unavailable</h1>
      <p>Drag across a time to close it, or click a closed block to open it. The all-day row closes an entire day. Guests and other users cannot book closed times.</p>
    </div>

    <p v-if="error" class="availability-page__error" role="alert">{{ error }}</p>

    <section v-else class="availability-page__sheet">
      <p v-if="saveError" class="availability-page__error" role="alert">{{ saveError }}</p>
      <div class="availability-page__bar">
        <p class="availability-page__count" aria-live="polite">{{ statusLabel }}</p>
        <ul class="availability-legend">
          <li><span class="availability-legend__swatch" /> Open</li>
          <li><span class="availability-legend__swatch availability-legend__swatch--closed" /> Unavailable</li>
        </ul>
      </div>
      <p v-if="loading && !ready" class="availability-page__status">Loading calendar…</p>
      <FullCalendar v-show="ready" ref="calendar" :options="calendarOptions" />
    </section>
  </div>
</template>

<script src="./availability-view.js"></script>
<style lang="scss" src="./availability-view.scss"></style>
