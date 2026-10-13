<template>
  <div class="app-shell" :class="{ 'app-shell--collapsed': collapsed }">
    <button class="app-shell__scrim" type="button" aria-label="Close menu" @click="collapse" />
    <aside class="app-shell__side">
      <div class="app-shell__brand">
        <p class="app-shell__mark">
          <span class="app-shell__monogram" aria-hidden="true">S</span>
          <span class="app-shell__mark-text">Schedule</span>
        </p>
        <button
          class="app-shell__toggle"
          type="button"
          :aria-expanded="String(!collapsed)"
          :aria-label="collapsed ? 'Expand menu' : 'Collapse menu'"
          @click="toggle"
        >
          <svg class="app-shell__icon app-shell__chevron" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" />
            <path d="M9.5 4.5v15M14.5 9.5 12 12l2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <nav v-if="!guestCalendar" class="app-shell__nav" aria-label="Pages">
        <router-link v-if="isDoctor || !signedIn" class="app-shell__link" :class="{ 'router-link-exact-active': onCalendar }" :to="calendarTo" :title="collapsed ? 'Calendar' : undefined">
          <svg class="app-shell__icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" />
            <path d="M3.5 10h17M8 3.5v3.5M16 3.5v3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          <span class="app-shell__label">Calendar</span>
        </router-link>
        <router-link v-if="isPatient" class="app-shell__link" to="/appointments" :title="collapsed ? 'Appointments' : undefined">
          <svg class="app-shell__icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" />
            <path d="M3.5 10h17M8 3.5v3.5M16 3.5v3.5M8 14h8M8 17h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          <span class="app-shell__label">Appointments</span>
        </router-link>
        <router-link v-if="isDoctor" class="app-shell__link" to="/availability" :title="collapsed ? 'Unavailable' : undefined">
          <svg class="app-shell__icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" />
            <path d="M3.5 10h17M8 3.5v3.5M16 3.5v3.5M9.2 13.6l5.6 5.6M14.8 13.6l-5.6 5.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          <span class="app-shell__label">Unavailable</span>
        </router-link>
        <router-link v-if="signedIn" class="app-shell__link" to="/profile" :title="collapsed ? 'Profile' : undefined">
          <svg class="app-shell__icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6" />
            <path d="M5.5 18.5c.6-3 2.8-4.6 6.5-4.6s5.9 1.6 6.5 4.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          <span class="app-shell__label">Profile</span>
        </router-link>
        <router-link v-if="isAdmin" class="app-shell__link" to="/users" :title="collapsed ? 'Users' : undefined">
          <svg class="app-shell__icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="8" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6" />
            <path d="M3.8 18.5c.5-2.7 2.5-4 5.2-4s4.7 1.3 5.2 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            <circle cx="16.8" cy="9" r="2" fill="none" stroke="currentColor" stroke-width="1.6" />
            <path d="M16 14.6c1.8.3 3.2 1.4 3.8 3.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          <span class="app-shell__label">Users</span>
        </router-link>
      </nav>

      <div class="app-shell__foot">
        <p v-if="signedIn" class="app-shell__user">{{ username }}</p>
        <button v-if="signedIn" class="app-shell__link" type="button" :title="collapsed ? 'Sign out' : undefined" @click="signOut">
          <svg class="app-shell__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 12h10M16 8l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M14 6V4.5H5.5v15H14V18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="app-shell__label">Sign out</span>
        </button>
        <button v-else class="app-shell__link" type="button" :title="collapsed ? 'Sign up' : undefined" @click="signUp">
          <svg class="app-shell__icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10" cy="8" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6" />
            <path d="M4.2 18.5c.5-2.6 2.4-4 5.8-4s5.3 1.4 5.8 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            <path d="M18 8v6M15 11h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
          <span class="app-shell__label">Sign up</span>
        </button>
        <button v-if="!signedIn" class="app-shell__link" type="button" :title="collapsed ? 'Sign in' : undefined" @click="signIn">
          <svg class="app-shell__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 12H4M8 8l-4 4 4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M10 6V4.5h8.5v15H10V18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="app-shell__label">Sign in</span>
        </button>
      </div>
    </aside>
    <div class="app-shell__main">
      <router-view />
    </div>
  </div>
</template>

<script src="./app-shell.js"></script>
<style lang="scss" src="./app-shell.scss"></style>
