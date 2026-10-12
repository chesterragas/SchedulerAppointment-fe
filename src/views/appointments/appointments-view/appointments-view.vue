<template>
  <div class="appointments-page">
    <div class="appointments-page__intro">
      <h1>Appointments</h1>
      <p>Open a doctor's calendar while you have an upcoming appointment with them.</p>
    </div>

    <p v-if="error" class="appointments-page__error" role="alert">{{ error }}</p>

    <section v-else class="appointments-page__sheet">
      <p v-if="loading" class="appointments-page__status">Loading appointments…</p>
      <div v-else-if="!appointments.length" class="appointments-page__empty">
        <p>You do not have an upcoming appointment. Book from a doctor's calendar link, then open that calendar from here.</p>
      </div>
      <ul v-else class="appointment-list">
        <li v-for="appointment in appointments" :key="appointment.id" class="appointment-list__item">
          <div>
            <p class="appointment-list__doctor">{{ appointment.doctorName }}</p>
            <p class="appointment-list__when">{{ formatWhen(appointment) }}</p>
          </div>
          <router-link
            class="app-button app-button--primary"
            :to="{ name: 'calendar', params: { calendarId: appointment.calendarId } }"
          >
            Open calendar
          </router-link>
        </li>
      </ul>
    </section>
  </div>
</template>

<script src="./appointments-view.js"></script>
<style lang="scss" src="./appointments-view.scss"></style>
