<template>
  <div class="users-page">
    <div class="users-page__intro">
      <div>
        <h1>Users</h1>
        <p>Add an account, change details, or remove someone who should no longer sign in.</p>
      </div>
      <app-button v-if="isAdmin" @click="openCreate">New user</app-button>
    </div>

    <p v-if="error" class="users-page__error" role="alert">{{ error }}</p>

    <section v-if="!error || users.length" class="users-page__sheet">
      <p v-if="loading" class="users-page__status">Loading users…</p>
      <div v-else-if="!users.length" class="users-page__empty">
        <p>No users yet.</p>
        <app-button v-if="isAdmin" @click="openCreate">New user</app-button>
      </div>
      <template v-else>
        <div class="users-page__toolbar">
          <div class="users-search">
            <label class="users-search__label" for="user-search">Search</label>
            <input
              id="user-search"
              v-model="query"
              type="search"
              placeholder="Name, username, email, phone, or address"
              autocomplete="off"
              @keydown.esc="clearSearch"
            />
            <button v-if="query" class="users-search__clear" type="button" @click="clearSearch">
              Clear
            </button>
          </div>
          <p class="users-page__count" aria-live="polite">{{ resultLabel }}</p>
        </div>
        <div v-if="!sortedUsers.length" class="users-page__empty">
          <p>No users match “{{ query.trim() }}”.</p>
          <app-button variant="quiet" type="button" @click="clearSearch">Clear search</app-button>
        </div>
        <div v-else class="users-page__table">
          <table class="user-grid">
        <caption class="user-grid__caption">Users</caption>
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" :aria-sort="ariaSort(column.key)" scope="col">
              <button type="button" @click="sortBy(column.key)">
                {{ column.label }}
                <span v-if="sortKey === column.key" class="user-grid__sort" aria-hidden="true">
                  {{ sortDir === 'asc' ? '↑' : '↓' }}
                </span>
              </button>
            </th>
            <th class="user-grid__link-head" scope="col">Calendar link</th>
            <th class="user-grid__actions-head" scope="col">
              <span class="user-grid__caption">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in sortedUsers" :key="user.id" @click="openEdit(user)">
            <td class="user-grid__name">{{ displayName(user) }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.email || '—' }}</td>
            <td>{{ user.phoneNumber || '—' }}</td>
            <td>{{ user.address || '—' }}</td>
            <td>
              <span class="user-grid__tags">
                <span v-if="isSelf(user)" class="user-grid__tag">You</span>
                <span v-if="user.isDoctor" class="user-grid__tag user-grid__tag--doctor">Doctor</span>
                <span v-if="!isSelf(user) && !user.isDoctor" class="user-grid__empty">—</span>
              </span>
            </td>
            <td>
              <span v-if="user.isAdmin" class="user-grid__tag user-grid__tag--admin">Admin</span>
              <span v-else class="user-grid__empty">—</span>
            </td>
            <td class="user-grid__link">
              <button
                v-if="user.isDoctor"
                class="user-qr"
                type="button"
                :aria-label="`QR code for ${displayName(user)}'s calendar`"
                @click.stop="openCalendarLink(user)"
              >
                <img v-if="calendarCode(user)" :src="calendarCode(user).qr" alt="" width="144" height="144" />
                <span v-else>QR code</span>
              </button>
              <span v-else class="user-grid__empty">—</span>
            </td>
            <td class="user-grid__actions">
              <div class="user-grid__action-row">
                <button class="user-grid__edit" type="button" @click.stop="openEdit(user)">Edit</button>
              </div>
            </td>
          </tr>
          </tbody>
          </table>
        </div>
      </template>
    </section>

    <app-dialog wide :open="editor.open" :title="editor.id ? 'Edit user' : 'New user'" @close="closeEditor">
      <form class="user-form" @submit.prevent="save">
        <app-input
          id="user-username"
          v-model="editor.username"
          label="Username"
          autocomplete="username"
          required
        />
        <div class="user-form__field">
          <app-input
            id="user-password"
            v-model="editor.password"
            label="Password"
            type="password"
            autocomplete="new-password"
            :required="!editor.id"
          />
          <p v-if="editor.id" class="user-form__hint">Leave blank to keep the current password.</p>
        </div>
        <div class="user-form__names">
          <app-input id="user-first" v-model="editor.firstName" label="First name" autocomplete="given-name" />
          <app-input id="user-last" v-model="editor.lastName" label="Last name" autocomplete="family-name" />
        </div>
        <app-input id="user-email" v-model="editor.email" label="Email" type="email" autocomplete="email" />
        <app-input id="user-phone" v-model="editor.phoneNumber" label="Phone" type="tel" autocomplete="tel" />
        <app-input id="user-address" v-model="editor.address" label="Address" multiline />
        <label class="user-form__check">
          <input v-model="editor.isDoctor" type="checkbox" />
          Doctor
        </label>
        <app-input
          v-if="editor.isDoctor"
          id="user-doctor-title"
          v-model="editor.doctorTitle"
          label="Title"
          autocomplete="honorific-prefix"
        />
        <p class="user-form__hint">A doctor has a calendar. Generate a link so someone else can open it.</p>
        <label class="user-form__check">
          <input v-model="editor.isAdmin" type="checkbox" />
          Admin
        </label>
        <p class="user-form__hint">Only an admin can add, edit, or delete users.</p>
        <p v-if="editingSelf" class="user-form__hint">This is the account you are signed in with.</p>
        <p v-if="editor.error" class="user-form__error" role="alert">{{ editor.error }}</p>
        <div class="user-form__actions">
          <app-button v-if="editor.id && !editingSelf" variant="danger" type="button" @click="askRemove">
            Delete
          </app-button>
          <app-button variant="quiet" type="button" @click="closeEditor">Cancel</app-button>
          <app-button type="submit" :disabled="editor.saving">Save</app-button>
        </div>
      </form>
    </app-dialog>

    <app-dialog wide :open="link.open" title="Calendar link" title-id="calendar-link-title" @close="closeCalendarLink">
      <p class="confirm-copy">Scan the code to open {{ link.name }}'s calendar.</p>
      <p v-if="link.loading" class="user-form__hint">Creating the code…</p>
      <figure v-else-if="link.qr" class="users-qr">
        <img id="calendar-qr" :src="link.qr" :alt="`QR code for ${link.name}'s calendar`" width="280" height="280" tabindex="0" />
        <figcaption>Point a camera at the code.</figcaption>
      </figure>
      <p v-if="link.url" id="calendar-link" class="users-link" tabindex="0">{{ link.url }}</p>
      <p v-if="link.error" class="user-form__error" role="alert">{{ link.error }}</p>
      <div class="user-form__actions">
        <app-button variant="quiet" type="button" @click="closeCalendarLink">Close</app-button>
        <app-button type="button" :disabled="!link.url || link.loading" @click="copyCalendarLink">
          {{ link.copied ? 'Copied' : 'Copy link' }}
        </app-button>
      </div>
    </app-dialog>

    <app-dialog :open="confirm.open" title="Delete user?" title-id="delete-user-title" front @close="dismissConfirm">
      <p class="confirm-copy">Delete {{ confirm.name }}? Their calendar events are removed with the account.</p>
      <div class="user-form__actions">
        <app-button variant="danger" type="button" :disabled="confirming" @click="confirmRemove">Delete</app-button>
        <app-button variant="quiet" type="button" @click="dismissConfirm">Cancel</app-button>
      </div>
    </app-dialog>
  </div>
</template>

<script src="./users-view.js"></script>
<style lang="scss" src="./users-view.scss"></style>
