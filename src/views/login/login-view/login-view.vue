<template>
  <main class="login">
    <section class="login__intro">
      <p class="login__mark">Schedule</p>
      <h1>Your calendar, ready for appointments.</h1>
      <p class="login__lead">Sign in to open a doctor's calendar, book a time, or manage the appointments on it.</p>
    </section>
    <section class="login__panel">
      <form class="login__form" @submit.prevent="submit">
        <h2>Sign in</h2>
        <app-input
          id="username"
          v-model="username"
          label="Username"
          autocomplete="username"
          required
        />
        <app-input
          id="password"
          v-model="password"
          label="Password"
          type="password"
          autocomplete="current-password"
          required
        />
        <p v-if="error" class="login__error" role="alert">{{ error }}</p>
        <app-button type="submit" :disabled="submitting">
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </app-button>
      </form>
    </section>
  </main>
</template>

<script src="./login-view.js"></script>
<style lang="scss" src="./login-view.scss"></style>
