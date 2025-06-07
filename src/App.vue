<script setup>
import { onMounted } from 'vue';
import ParkingForm from './components/ParkingForm.vue';

onMounted(() => {
  console.log("App.vue is mounted.");
});
</script>

<template>
  <div id="app">
    <ParkingForm />
  </div>
</template>

<style>
/* Style global untuk aplikasi */
</style>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
