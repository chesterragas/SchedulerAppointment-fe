<template>
  <main class="login">
    <section class="login__intro">
      <p class="login__mark">Schedule</p>
      <h1>Create an account for your appointments.</h1>
      <p class="login__lead">Sign up as a patient. You can open a doctor's calendar after you book.</p>
    </section>
    <section class="login__panel">
      <form class="login__form login__form--signup" @submit.prevent="submit">
        <h2>Sign up</h2>
        <app-input
          id="signup-username"
          v-model="form.username"
          label="Username"
          autocomplete="username"
          required
        />
        <div class="login__password">
          <app-input
            id="signup-password"
            v-model="form.password"
            label="Password"
            type="password"
            autocomplete="new-password"
            required
          />
          <p class="login__hint">At least 8 characters.</p>
        </div>
        <app-input
          id="signup-confirm"
          v-model="form.confirm"
          label="Confirm password"
          type="password"
          autocomplete="new-password"
          required
        />
        <div class="login__names">
          <app-input id="signup-first" v-model="form.firstName" label="First name" autocomplete="given-name" required />
          <app-input id="signup-last" v-model="form.lastName" label="Last name" autocomplete="family-name" required />
        </div>
        <div class="login__names">
          <app-input id="signup-email" v-model="form.email" label="Email" type="email" autocomplete="email" required />
          <app-input id="signup-phone" v-model="form.phoneNumber" label="Phone" type="tel" autocomplete="tel" required />
        </div>
        <app-input id="signup-address" v-model="form.address" label="Address" autocomplete="street-address" multiline required />
        <p v-if="error" class="login__error" role="alert">{{ error }}</p>
        <app-button type="submit" :disabled="submitting">
          {{ submitting ? 'Creating account…' : 'Create account' }}
        </app-button>
        <p class="login__switch">
          Already have an account?
          <router-link :to="{ path: '/login', query: $route.query }">Sign in</router-link>
        </p>
      </form>
    </section>
  </main>
</template>

<script src="./signup-view.js"></script>
<style lang="scss" src="../../login/login-view/login-view.scss"></style>
