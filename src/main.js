// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Tooltip, Toast, Popover } from 'bootstrap';


// Mengimpor file CSS
import './assets/css/bootstrap.min.css';
import './assets/css/style.css';
import './assets/css/vendors.css';
import './assets/css/custom.css';

// Mengimpor file JS
import './assets/js/bootstrap.bundle.min.js';
import './assets/js/jquery-3.7.1.min.js';
import './assets/js/common_scripts.min.js';
import './assets/js/functions.js';

createApp(App).mount('#app');
