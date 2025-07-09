// src/main.js
import { createApp } from 'vue';
import App from './App.vue';


// --- Impor Router Anda ---
import router from './router'; // Mengimpor router yang telah dibuat


import './assets/css/bootstrap.min.css'; 
import './assets/css/style.css';
import './assets/css/vendors.css';
import './assets/css/custom.css';


// --- Inisialisasi Aplikasi Vue ---
const app = createApp(App); // Buat instance aplikasi Vue

app.use(router); // <-- Gunakan Vue Router di sini, SEBELUM mounting!

app.mount('#app'); // <-- Baru mount aplikasi ke elemen DOM