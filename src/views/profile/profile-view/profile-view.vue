<template>
  <div class="profile-page">
    <div class="profile-page__intro">
      <h1>Profile</h1>
      <p>Update the name, contact details, and password on your account.</p>
    </div>

    <p v-if="error" class="profile-page__error" role="alert">{{ error }}</p>

    <section v-else class="profile-page__sheet">
      <p v-if="loading" class="profile-page__status">Loading profile…</p>
      <form v-else class="profile-form" @submit.prevent="save" @input="saved = false">
        <div class="profile-form__roles" aria-label="Account roles">
          <span v-if="isDoctor" class="profile-form__tag">Doctor</span>
          <span v-if="isAdmin" class="profile-form__tag profile-form__tag--admin">Admin</span>
          <span v-if="!isDoctor && !isAdmin" class="profile-form__tag">Account</span>
        </div>
        <p class="profile-form__hint">An admin sets roles. This page changes your own details.</p>

        <app-input
          id="profile-username"
          v-model="form.username"
          label="Username"
          autocomplete="username"
          required
        />
        <div class="profile-form__field">
          <app-input
            id="profile-password"
            v-model="form.password"
            label="Password"
            type="password"
            autocomplete="new-password"
          />
          <p class="profile-form__hint">Leave blank to keep the current password.</p>
        </div>
        <div class="profile-form__names">
          <app-input id="profile-first" v-model="form.firstName" label="First name" autocomplete="given-name" />
          <app-input id="profile-last" v-model="form.lastName" label="Last name" autocomplete="family-name" />
        </div>
        <div class="profile-form__names">
          <app-input id="profile-email" v-model="form.email" label="Email" type="email" autocomplete="email" />
          <app-input id="profile-phone" v-model="form.phoneNumber" label="Phone" type="tel" autocomplete="tel" />
        </div>
        <app-input id="profile-address" v-model="form.address" label="Address" autocomplete="street-address" multiline />

        <p v-if="formError" class="profile-form__error" role="alert">{{ formError }}</p>
        <p v-else-if="saved" class="profile-form__saved" role="status">Saved.</p>
        <div class="profile-form__actions">
          <app-button type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</app-button>
        </div>
      </form>
    </section>
  </div>
</template>

<script src="./profile-view.js"></script>
<style lang="scss" src="./profile-view.scss"></style>
