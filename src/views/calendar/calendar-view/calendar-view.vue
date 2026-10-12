<template>
  <div class="calendar-page">
    <p v-if="error" class="calendar-page__error" role="alert">{{ error }}</p>
    <p v-if="notice" class="calendar-page__error" role="alert">{{ notice }}</p>
    <div v-else-if="!loading && !calendarId" class="calendar-page__empty">
      <p>Use a doctor's calendar link to open their calendar.</p>
    </div>

    <div v-if="ownsCalendar && calendarId" class="calendar-page__bar">
      <app-button variant="quiet" type="button" @click="openShare">Calendar link</app-button>
    </div>

    <section v-if="calendarId" class="calendar-page__sheet">
      <FullCalendar ref="calendar" :options="calendarOptions" />
    </section>

    <app-dialog :open="editor.open" :title="dialogTitle" hide-close @close="closeEditor">
      <form class="event-form" @submit.prevent="save">
        <p class="event-form__slot" :class="{ 'event-form__slot--lead': confirmingSlot }">{{ slotLabel }}</p>
        <p v-if="selectedCalendar" class="event-form__slot">{{ selectedCalendar.name }}</p>
        <template v-if="!confirmingSlot">
          <app-input id="appointment-first-name" v-model="editor.firstName" label="First name" autocomplete="given-name" required />
          <app-input id="appointment-last-name" v-model="editor.lastName" label="Last name" autocomplete="family-name" required />
          <app-input id="appointment-address" v-model="editor.address" label="Address" autocomplete="street-address" multiline required />
          <app-input id="appointment-email" v-model="editor.email" label="Email" type="email" autocomplete="email" required />
          <app-input id="appointment-phone" v-model="editor.phoneNumber" label="Phone number" type="tel" autocomplete="tel" required />
        </template>
        <p v-else-if="needsProfile" class="event-form__error" role="alert">
          Complete your <router-link to="/profile" @click="closeEditor">profile</router-link> before booking.
        </p>
        <p v-if="editor.error" class="event-form__error" role="alert">{{ editor.error }}</p>
        <div class="event-form__actions">
          <app-button v-if="editor.id && ownsCalendar" variant="danger" type="button" @click="remove">Delete</app-button>
          <app-button variant="quiet" type="button" @click="closeEditor">Cancel</app-button>
          <app-button type="submit" :disabled="editor.saving || editor.loading || needsProfile">{{ submitLabel }}</app-button>
        </div>
      </form>
    </app-dialog>

    <app-dialog :open="confirm.open" title="Update appointment?" title-id="confirm-title" front @close="dismissConfirm">
      <p class="confirm-copy">Save changes to {{ confirm.title }}?</p>
      <div class="event-form__actions">
        <app-button variant="quiet" type="button" @click="dismissConfirm">Cancel</app-button>
        <app-button type="button" :disabled="confirming" @click="confirmUpdate">Update</app-button>
      </div>
    </app-dialog>
    <app-dialog wide :open="share.open" title="Calendar link" title-id="doctor-calendar-link-title" @close="closeShare">
      <p class="confirm-copy">Scan the code or share the link to this calendar.</p>
      <p v-if="share.loading" class="event-form__slot">Creating the code…</p>
      <figure v-else-if="share.qr" class="calendar-qr">
        <img id="doctor-calendar-qr" :src="share.qr" alt="QR code for this calendar" width="280" height="280" tabindex="0" />
        <figcaption>Point a camera at the code.</figcaption>
      </figure>
      <p v-if="share.url" class="calendar-share-link" tabindex="0">{{ share.url }}</p>
      <p v-if="share.error" class="event-form__error" role="alert">{{ share.error }}</p>
      <div class="event-form__actions">
        <app-button variant="quiet" type="button" @click="closeShare">Close</app-button>
        <app-button type="button" :disabled="!share.url || share.loading" @click="copyShare">
          {{ share.copied ? 'Copied' : 'Copy link' }}
        </app-button>
      </div>
    </app-dialog>
  </div>
</template>

<script src="./calendar-view.js"></script>
<style lang="scss" src="./calendar-view.scss"></style>
