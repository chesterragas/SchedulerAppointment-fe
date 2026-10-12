<template>
  <main class="home">
    <img class="home__photo" :src="photo" alt="" />
    <div class="home__shade" aria-hidden="true"></div>
    <app-button class="home__book" @click="book">Book now</app-button>
  </main>
</template>

<script src="./home-view.js"></script>
<style lang="scss" src="./home-view.scss"></style>
