<template>
  <div class="d-flex">
    <nav :class="['sidebar', sidebarOpen ? 'open' : '']">
      <div
        class="sidebar-header d-flex justify-content-between align-items-center"
      >
        <h5 class="text-white m-0">SIPATUH</h5>
        <button class="btn btn-sm btn-light d-md-none" @click="toggleSidebar">
          ✕
        </button>
      </div>
      <ul class="list-unstyled ps-3">
        <li>
          <router-link to="/dashboard" class="nav-link">
            <i class="fa-solid fa-chart-line"></i> Dashboard
          </router-link>
        </li>
        <li>
          <router-link to="/tambah-admin" class="nav-link">
            <i class="fa-solid fa-user-plus"></i> Tambah Admin
          </router-link>
        </li>
        <li>
          <router-link to="/data-parkir" class="nav-link">
            <i class="fa-solid fa-square-parking"></i> Data Parkir
          </router-link>
        </li>
        <li>
          <router-link to="/pemasukan" class="nav-link">
            <i class="fa-solid fa-money-bill-wave"></i> Pemasukan Parkir
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="content flex-grow-1">
      <nav class="navbar navbar-light bg-light px-3">
        <button
          class="btn btn-outline-secondary d-md-none"
          @click="toggleSidebar"
        >
          ☰
        </button>
        <h5 class="m-0 ms-2" style="color: #fdfdfd; font-weight: bold">
          Tambah Admin Baru
        </h5>
      </nav>

      <div class="container-fluid pt-4 px-3 form-wrapper-top">
        <div class="row justify-content-center align-items-center h-100">
          <div class="col-lg-12 col-md-12">
            <div class="card shadow w-100">
              <div class="card-header text-left">
                <h4 class="mb-0" style="color: #fdfdfd;">Registrasi Admin Baru</h4>
              </div>
              <div class="card-body">
                <form @submit.prevent="registerAdmin">
                  <div class="mb-3">
                    <label for="adminEmail" class="form-label">Email</label>
                    <input
                      type="email"
                      class="form-control"
                      id="adminEmail"
                      v-model="adminForm.email"
                      required
                      placeholder="Masukkan email admin"
                    />
                  </div>
                  <div class="mb-3">
                    <label for="adminPassword" class="form-label"
                      >Password</label
                    >
                    <input
                      type="password"
                      class="form-control"
                      id="adminPassword"
                      v-model="adminForm.password"
                      required
                      placeholder="Masukkan password"
                    />
                  </div>
                  <div class="mb-3">
                    <label for="confirmPassword" class="form-label"
                      >Konfirmasi Password</label
                    >
                    <input
                      type="password"
                      class="form-control"
                      id="confirmPassword"
                      v-model="adminForm.confirmPassword"
                      required
                      placeholder="Konfirmasi password"
                    />
                  </div>
                  <button
                    type="submit"
                    class="btn btn-custom w-100 mt-3"
                  >
                    Tambah Admin
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import Swal from "sweetalert2"; // Pastikan SweetAlert2 sudah terinstal
import "@fortawesome/fontawesome-free/css/all.min.css"; // Import Font Awesome CSS

export default {
  name: "TambahAdmin",
  setup() {
    const sidebarOpen = ref(false); // Untuk sidebar
    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const adminForm = ref({
      email: "",
      password: "",
      confirmPassword: "",
    });

    // Get API domain from environment variable or use default
    const API_DOMAIN =
      import.meta.env.VITE_DOMAIN_SERVER || "http://localhost:3000";

    const isFormValid = computed(() => {
      const { email, password, confirmPassword } = adminForm.value;
      return (
        email.trim() !== "" &&
        password.trim() !== "" &&
        confirmPassword.trim() !== "" &&
        password === confirmPassword
      ); // Password dan konfirmasi harus sama
    });

    const registerAdmin = async () => {
      // 1. Validasi awal form
      if (!isFormValid.value) {
        Swal.fire({
          icon: "warning",
          title: "Input Tidak Valid",
          text: "Harap isi semua kolom dan pastikan password cocok.",
          confirmButtonText: "OK",
        });
        return;
      }

      if (adminForm.value.password.length < 6) {
        Swal.fire({
          icon: "warning",
          title: "Password Terlalu Pendek",
          text: "Password minimal 6 karakter.",
          confirmButtonText: "OK",
        });
        return;
      }

      // 2. Tampilkan SweetAlert untuk konfirmasi teks "SIPATUH"
      const { value: confirmationText } = await Swal.fire({
        title: 'Konfirmasi Pendaftaran Admin',
        text: 'Untuk melanjutkan, ketik "SIPATUH" di bawah ini:',
        input: 'text',
        inputPlaceholder: 'Ketik "SIPATUH" di sini...',
        showCancelButton: true,
        confirmButtonText: 'Konfirmasi',
        cancelButtonText: 'Batal',
        inputValidator: (value) => {
          if (!value) {
            return 'Anda perlu mengetik "SIPATUH"!';
          }
          if (value !== 'SIPATUH') { // Case-sensitive check
            return 'Teks tidak cocok. Harap ketik "SIPATUH" dengan benar.';
          }
        },
        customClass: {
          container: 'swal-custom-container', // Pastikan class ini ada di CSS jika perlu styling
          popup: 'swal-custom-popup',
          confirmButton: 'swal-custom-confirm-button',
          cancelButton: 'swal-custom-cancel-button',
          input: 'swal-custom-input',
        },
        // Anda bisa menambahkan icon atau styling lainnya ke SweetAlert2 di sini
        icon: 'warning',
      });

      // 3. Cek hasil konfirmasi
      if (confirmationText === 'SIPATUH') {
        // Jika konfirmasi berhasil, lanjutkan proses pendaftaran
        Swal.fire({
          title: "Mendaftarkan Admin...",
          text: "Mohon tunggu sebentar",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        try {
          const response = await fetch(`${API_DOMAIN}/api/admin/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: adminForm.value.email,
              password: adminForm.value.password,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            Swal.fire({
              icon: "success",
              title: "Berhasil!",
              text: data.message,
              confirmButtonText: "OK",
            });
            // Reset form setelah berhasil
            adminForm.value.email = "";
            adminForm.value.password = "";
            adminForm.value.confirmPassword = "";
          } else {
            Swal.fire({
              icon: "error",
              title: "Gagal Mendaftar",
              text: data.error || "Terjadi kesalahan saat mendaftarkan admin.",
              confirmButtonText: "OK",
            });
          }
        } catch (error) {
          console.error("Error during admin registration:", error);
          Swal.fire({
            icon: "error",
            title: "Kesalahan Jaringan",
            text: "Tidak dapat terhubung ke server. Silakan coba lagi nanti.",
            confirmButtonText: "OK",
          });
        }
      } else if (confirmationText === undefined) { // User clicked 'Cancel' or outside
        Swal.fire({
          icon: 'info',
          title: 'Dibatalkan',
          text: 'Pendaftaran admin dibatalkan.',
          confirmButtonText: 'OK'
        });
      }
    };

    return {
      sidebarOpen,
      toggleSidebar,
      adminForm,
      isFormValid,
      registerAdmin,
    };
  },
};
</script>

<style scoped>
/* Main background for body and content */
body,
.content {
  background-color: #2b0057; /* Existing dark purple background */
  color: #fdfdfd; /* Changed to FDFDFD for main content text */
}

.router-link-active,
.router-link-exact-active,
.nav-link {
  margin-right: 20px;
  margin-bottom: 8px;
}
h5.card-title {
  color: #fdfdfd; /* Changed to FDFDFD for card titles */
}

/* Sidebar style */
.sidebar {
  background-color: #5a0099; /* Darker purple for sidebar */
  color: #fdfdfd; /* Changed to FDFDFD */
  width: 240px;
  height: 100vh;
  padding-top: 1rem;
  position: fixed;
  transition: all 0.3s;
  left: 0;
  z-index: 2000;
}

.sidebar .nav-link {
  color: #eee; /* Kept slightly off-white for contrast against FDFDFD main text */
  padding: 10px;
  display: block;
  border-radius: 5px;
}

.sidebar .nav-link.router-link-exact-active,
.sidebar .nav-link:hover {
  background-color: #fc0; /* Consistent secondary accent color */
  color: #000; /* Kept black for contrast on yellow background */
  font-weight: bold;
}

.sidebar-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Navbar style */
.navbar {
  background-color: #210038 !important; /* Slightly lighter purple for the navbar */
  color: #fdfdfd; /* Changed to FDFDFD */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Add a subtle shadow */
}

.navbar .btn-outline-secondary {
  border-color: #fc0; /* Use accent color for button border */
  color: #fc0; /* Use accent color for button text */
}

.navbar .btn-outline-secondary:hover {
  background-color: #fc0; /* Accent color on hover */
  color: #000; /* Black text on accent background */
}

/* Card styles - adjusted for better contrast and consistency */
.card {
  background-color: rgba(
    0,
    0,
    0,
    0.25
  ); /* Darker transparent background for cards */
  color: #fdfdfd; /* Changed to FDFDFD */
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); /* More prominent shadow for cards */
}

.card-header {
  background-color: rgba(0, 0, 0, 0.35); /* Even darker for card headers */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Statistik Cards specific colors - now unified to purple shades */
.card.bg-primary,
.card.bg-success,
.card.bg-warning,
.card.bg-info {
  background-color: #4d0073 !important; /* A uniform dark purple for all statistic cards */
  color: #fdfdfd !important; /* Changed to FDFDFD */
}

/* You can still add subtle variations if desired, e.g., slightly different shades on hover or with borders */
.card.bg-primary {
  border-left: 5px solid #a64dff;
} /* Example: a lighter purple border */
.card.bg-success {
  border-left: 5px solid #00cc66;
} /* Example: green border for success */
.card.bg-warning {
  border-left: 5px solid #fc0;
} /* Example: accent yellow border for warning */
.card.bg-info {
  border-left: 5px solid #008cba;
} /* Example: blue border for info */

/* Custom button style - if you add more custom buttons */
.btn-custom {
  background-color: #fc0; /* Consistent secondary accent color */
  color: #000; /* Kept black for contrast on yellow background */
  font-weight: 600;
  border: none;
}
.btn-custom:hover {
  background-color: #e6b800; /* Slightly darker accent on hover */
}

/* Table style */
.table {
  color: #fdfdfd; /* Ensure table text is FDFDFD */
}

.table-dark {
  background-color: #4d0073; /* Darker purple for table header */
  color: #fdfdfd; /* Ensure header text is FDFDFD */
}

.table-striped > tbody > tr:nth-of-type(odd) {
  background-color: rgba(
    255,
    255,
    255,
    0.08
  ); /* Slightly more visible stripe */
}

/* Crucial: Ensure all TD elements in the table body are FDFDFD */
.table tbody td {
  color: #fdfdfd !important; /* Force FDFDFD color for all table body cells */
}

/* Text for the "Belum ada data hari ini." message */
.table .text-muted {
  color: #ccc !important; /* Keep it slightly muted for informational text */
}

/* Activity Log */
.list-group-item {
  background-color: transparent !important; /* Removed background for list items */
  color: #fdfdfd; /* Ensure list item text is FDFDFD */
  border-color: rgba(255, 255, 255, 0.1); /* Subtle border for separation */
}

.list-group-item:first-child {
  border-top-width: 0; /* Remove top border for first item */
}

.list-group-item:last-child {
  border-bottom-width: 0; /* Remove bottom border for last item (if flush) */
}

.list-group-item .text-muted {
  color: #ccc !important; /* Slightly darker white for muted text to provide subtle distinction */
}

/* Badges for status */
.badge.bg-success {
  background-color: #00cc66 !important; /* Brighter green for active status */
  color: #000 !important; /* Ensure black text for readability on green */
}
.badge.bg-secondary {
  background-color: #777 !important; /* A neutral gray for completed status */
  color: #fdfdfd !important; /* Ensure FDFDFD text on gray */
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .sidebar {
    left: -240px;
  }
  .sidebar.open {
    left: 0;
  }
  .content {
    margin-left: 0 !important;
  }
}

.content {
  margin-left: 240px;
  width: 100%;
  transition: margin-left 0.3s;
}

.card-body canvas {
  width: 100% !important;
  height: 300px !important; /* Keep a consistent height for both canvases */
}

/* Parent container full height */
.wrapper-form {
  height: calc(100vh - 56px); /* 56px untuk navbar tinggi */
  padding-top: 20px;
  padding-bottom: 20px;
}

/* Card styling - already mostly handled, just extra polish */
.card {
  background-color: rgba(0, 0, 0, 0.25);
  color: #FDFDFD;
  border-radius: 12px;
  border: none;
}

.card-header {
  background-color: rgba(0, 0, 0, 0.35);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Form input styling */
.form-control {
  background-color: rgba(255, 255, 255, 0.1);
  color: #FDFDFD;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.form-control::placeholder {
  color: #ccc;
}

.form-control:focus {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: #fc0;
  box-shadow: 0 0 0 0.2rem rgba(255, 204, 0, 0.3);
}

/* Responsive fix for mobile */
@media (max-width: 768px) {
  .wrapper-form {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Wrapper full height, tapi mulai dari atas kiri */
.form-wrapper-top {
  min-height: 100vh;
  display: block; /* pastikan tidak flex-centered */
}

/* Tambahan margin agar tidak mepet kiri/kanan */
.form-wrapper-top .col-12 {
  margin-left: auto;
  margin-right: auto;
}

/* Pastikan card tetap responsif */
.card {
  background-color: rgba(0, 0, 0, 0.25);
  color: #FDFDFD;
  border: none;
  border-radius: 10px;
}

/* Padding dan jarak nyaman */
.card-body {
  padding: 2rem;
}

/* Input styling tetap elegan */
.form-control {
  background-color: rgba(255, 255, 255, 0.1);
  color: #FDFDFD;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.form-control::placeholder {
  color: #bbb;
}

.form-control:focus {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: #fc0;
  box-shadow: 0 0 0 0.2rem rgba(255, 204, 0, 0.25);
}

/* Tombol full width tapi tidak mepet */
.btn.btn-custom {
  width: 100%;
  background-color: #fc0;
  color: #000;
  font-weight: bold;
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.btn.btn-custom:hover {
  background-color: #e6b800;
}

/* Responsive spacing */
@media (max-width: 576px) {
  .card-body {
    padding: 1.5rem;
  }
}


</style>
