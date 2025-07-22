<template>
  <div class="d-flex">
    <nav :class="['sidebar', sidebarOpen ? 'open' : '']">
      <div
        class="sidebar-header d-flex justify-content-between align-items-center"
      >
        <img src="/src/assets/img/LogoSipatuhLong_Transparent.svg" alt="" class="sidebar-logo">
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
        <li>
          <router-link to="/log-aktivitas" class="nav-link">
            <i class="fa-solid fa-clipboard-list"></i> Log Aktivitas
          </router-link>
        </li>
        <li>
          <router-link to="/pencadangan-pemulihan" class="nav-link">
            <i class="fa-solid fa-arrows-rotate"></i> Pencadangan dan Pemulihan
          </router-link>
        </li>
        <li>
          <router-link to="/logout" class="nav-link" style="color: red; font-weight: bolder;">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="content flex-grow-1">
      <nav class="navbar navbar-light bg-light px-3 fixed-top">
        <button
          class="btn btn-outline-secondary d-md-none"
          @click="toggleSidebar"
        >
          ☰
        </button>
        <h5 class="m-0 ms-2" style="color: #fdfdfd; font-weight: bold">
          Verifikasi Admin
        </h5>
      </nav>

      <div class="content-wrapper">
        <div class="container-fluid pt-4 px-3 form-wrapper-top">
          <div class="row justify-content-center align-items-center h-100">
            <div class="col-lg-12 col-md-12">
              <div class="card shadow w-100 text-center">
                <div class="card-header text-left">
                  <h4 class="mb-0" style="color: #fdfdfd;">Verifikasi Akun Admin</h4>
                </div>
                <div class="card-body">
                  <i class="fa-solid fa-envelope-circle-check fa-5x mb-4" style="color: #fc0;"></i>
                  <h5 class="card-title mb-3" style="color: #fdfdfd;">Verifikasi Email Anda</h5>
                  <p class="card-text mb-4">
                    Kami telah mengirimkan kode verifikasi ke alamat email Anda:
                    <br><strong>{{ emailToVerify }}</strong>.
                  </p>

                  <form @submit.prevent="verifyCode" class="mb-4">
                    <div class="mb-3">
                      <label for="emailInput" class="form-label">Email Anda</label>
                      <input
                        type="email"
                        class="form-control text-center"
                        id="emailInput"
                        v-model="emailInput"
                        required
                        readonly
                      />
                    </div>
                    <div class="mb-3">
                      <label for="codeInput" class="form-label">Kode Verifikasi (6 digit)</label>
                      <input
                        type="text"
                        class="form-control text-center"
                        id="codeInput"
                        v-model="codeInput"
                        maxlength="6"
                        required
                        placeholder="Masukkan kode 6 digit"
                      />
                    </div>
                    <button type="submit" class="btn btn-custom w-100 mt-3">
                      Verifikasi Akun
                    </button>
                  </form>

                  <p class="card-text mb-2" v-if="!canResend">
                    Anda dapat mengirim ulang kode dalam: <strong>{{ formattedCountdown }}</strong>
                  </p>
                  <button
                    @click="resendVerification"
                    :disabled="!canResend"
                    :class="['btn', 'mt-3', 'ms-2', canResend ? 'btn-outline-warning' : 'btn-outline-secondary']"
                  >
                    Kirim Ulang Kode Verifikasi
                  </button>
                  <button @click="goToLogin" class="btn btn-custom-outline mt-3 ms-2">
                    Kembali ke Halaman Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter, useRoute } from 'vue-router';
import Swal from "sweetalert2"; // Import SweetAlert2 for notifications
import "@fortawesome/fontawesome-free/css/all.min.css";

export default {
  name: "VerifikasiAdmin",
  setup() {
    const sidebarOpen = ref(false);
    const emailToVerify = ref(''); // Email displayed to the user
    const emailInput = ref(''); // Email input for the form
    const codeInput = ref(''); // Code input for the form
    const router = useRouter();
    const route = useRoute();

    const countdown = ref(0); // Initialize countdown to 0
    const canResend = ref(false);
    let countdownInterval = null;

    const API_DOMAIN = import.meta.env.VITE_DOMAIN_SERVER || "http://localhost:3000";
    const VERIFICATION_EXPIRATION_SECONDS = 5 * 60; // 5 minutes in seconds

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const goToLogin = () => {
      router.push('/login'); // Assuming your login route is /login
    };

    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const formattedCountdown = computed(() => formatTime(countdown.value));

    const startCountdown = (initialSeconds) => {
      // Clear any existing interval to prevent multiple timers
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      countdown.value = initialSeconds;
      canResend.value = false;

      countdownInterval = setInterval(() => {
        if (countdown.value > 0) {
          countdown.value--;
        } else {
          clearInterval(countdownInterval);
          canResend.value = true;
        }
      }, 1000);
    };

    // New method for manual code verification via form
    const verifyCode = async () => {
      if (!emailInput.value || !codeInput.value || codeInput.value.length !== 6) {
        Swal.fire({
          icon: 'warning',
          title: 'Input Tidak Valid',
          text: 'Harap masukkan email dan kode verifikasi 6 digit yang valid.',
          confirmButtonText: 'OK'
        });
        return;
      }

      Swal.fire({
        title: "Memverifikasi Kode...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const response = await fetch(`${API_DOMAIN}/api/admin/verify_code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: emailInput.value, code: codeInput.value }),
        });

        const data = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Verifikasi Berhasil!',
            text: data.message || 'Akun Anda berhasil diverifikasi.',
            confirmButtonText: 'OK'
          }).then(() => {
            router.push('/login'); // Redirect to login page
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Verifikasi Gagal!',
            text: data.error || 'Kode verifikasi tidak valid atau telah kedaluwarsa.',
            confirmButtonText: 'OK'
          });
        }
      } catch (error) {
        console.error('Error during code verification:', error);
        Swal.fire({
          icon: 'error',
          title: 'Kesalahan Jaringan',
          text: 'Tidak dapat terhubung ke server. Silakan coba lagi nanti.',
          confirmButtonText: 'OK'
        });
      }
    };

    const resendVerification = async () => {
      if (!canResend.value && countdown.value > 0) { // Added countdown.value > 0 check
        Swal.fire({
          icon: 'info',
          title: 'Tunggu Sebentar',
          text: `Anda dapat mengirim ulang kode dalam ${formattedCountdown.value}.`,
          confirmButtonText: 'OK'
        });
        return;
      }

      if (!emailToVerify.value || emailToVerify.value === 'alamat email Anda') {
        Swal.fire({
          icon: 'warning',
          title: 'Email Tidak Ditemukan',
          text: 'Tidak dapat mengirim ulang. Email tidak terdeteksi. Silakan kembali ke halaman pendaftaran.',
          confirmButtonText: 'OK'
        });
        return;
      }

      Swal.fire({
        title: "Mengirim Ulang Kode...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        // We re-use the /api/admin/register endpoint for resending,
        // as it handles generating a new code and updating pendingAdminRegistrations.
        // We send a dummy password because the backend expects it for this endpoint,
        // but it won't be used to update the password for an existing pending entry.
        // The backend logic now handles deleting expired pending entries and creating new ones.
        const response = await fetch(`${API_DOMAIN}/api/admin/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: emailToVerify.value, password: "dummy_password_for_resend" }),
        });

        const data = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: data.message || 'Kode verifikasi baru telah dikirim ulang.',
            confirmButtonText: 'OK'
          });
          // After resending, fetch the new status to get the correct countdown
          fetchPendingStatus(emailToVerify.value); // Re-fetch status to update countdown
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: data.error || 'Gagal mengirim ulang kode verifikasi. Pastikan email Anda benar.',
            confirmButtonText: 'OK'
          });
        }
      } catch (error) {
        console.error('Error resending verification email:', error);
        Swal.fire({
          icon: 'error',
          title: 'Kesalahan Jaringan',
          text: 'Tidak dapat terhubung ke server. Silakan coba lagi nanti.',
          confirmButtonText: 'OK'
        });
      }
    };

    // New function to fetch pending status from backend
    const fetchPendingStatus = async (email) => {
      if (!email || email === 'alamat email Anda') {
        // No valid email to fetch status for
        return;
      }
      try {
        const response = await fetch(`${API_DOMAIN}/api/admin/pending-status?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (response.ok) {
          // Initialize countdown with remainingSeconds from backend
          startCountdown(data.remainingSeconds);
          if (data.isExpired) {
            canResend.value = true; // Allow resend if already expired
          }
        } else {
          // No pending entry found or other error, allow resend
          console.warn("Failed to fetch pending status for countdown:", data.error);
          canResend.value = true; // Allow resend if no pending status found
          countdown.value = 0; // Set countdown to 0
        }
      } catch (error) {
        console.error("Network error fetching pending status:", error);
        canResend.value = true; // Allow resend on network error
        countdown.value = 0; // Set countdown to 0
      }
    };


    // Handle initial load: check for email and code in URL
    onMounted(async () => {
      // Get the email from route query parameters (from TambahAdmin or direct link)
      if (route.query.email) {
        emailToVerify.value = decodeURIComponent(route.query.email);
        emailInput.value = decodeURIComponent(route.query.email); // Pre-fill email input
        
        // Fetch pending status to get the accurate countdown
        await fetchPendingStatus(emailToVerify.value);

      } else {
        emailToVerify.value = 'alamat email Anda';
        canResend.value = true; // If no email, assume no pending code, allow resend
        countdown.value = 0;
        Swal.fire({
          icon: 'info',
          title: 'Email Tidak Ditemukan',
          text: 'Tidak ada email yang terdeteksi. Silakan kembali ke halaman pendaftaran untuk memulai proses verifikasi.',
          confirmButtonText: 'OK'
        }).then(() => {
          router.push('/tambah-admin'); // Redirect to registration if no email
        });
        return; // Stop further execution if no email
      }

      // If code is also present in URL, attempt auto-verification
      if (route.query.code) { // Only attempt if email is also present (checked above)
        const emailFromUrl = decodeURIComponent(route.query.email);
        const codeFromUrl = route.query.code;

        Swal.fire({
          title: "Memverifikasi Otomatis...",
          text: "Mohon tunggu sebentar",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        try {
          const response = await fetch(`${API_DOMAIN}/api/admin/verify?email=${encodeURIComponent(emailFromUrl)}&code=${codeFromUrl}`, {
            method: 'GET', // This is a GET request for link verification
            headers: {
              'Content-Type': 'application/json', // Note: Backend returns HTML, but we set this for consistency
            },
          });

          // Note: Backend /api/admin/verify (GET) returns HTML, not JSON on success/failure.
          // So, we check response.ok and then show a generic success/failure message.
          // For a more robust frontend, the backend should return JSON for API calls.
          if (response.ok) {
            Swal.fire({
              icon: 'success',
              title: 'Verifikasi Berhasil!',
              text: 'Akun Anda berhasil diverifikasi. Anda dapat login sekarang.',
              confirmButtonText: 'OK'
            }).then(() => {
              router.push('/login');
            });
          } else {
            const errorHtml = await response.text(); // Get the HTML error message
            // You might want to parse the HTML to extract a specific message
            // For now, let's just show a generic error or the raw HTML if needed for debugging
            Swal.fire({
              icon: 'error',
              title: 'Verifikasi Gagal!',
              text: 'Tautan verifikasi tidak valid atau telah kedaluwarsa. Silakan coba masukkan kode secara manual atau minta kirim ulang.',
              confirmButtonText: 'OK'
            });
            // Re-fetch status if auto-verification failed, in case the code expired during the process
            fetchPendingStatus(emailToVerify.value);
          }
        } catch (error) {
          console.error('Error during auto-verification:', error);
          Swal.fire({
            icon: 'error',
            title: 'Kesalahan Jaringan',
            text: 'Tidak dapat terhubung ke server untuk verifikasi otomatis. Silakan coba masukkan kode secara manual.',
            confirmButtonText: 'OK'
          });
          // Re-fetch status if auto-verification failed due to network error
          fetchPendingStatus(emailToVerify.value);
        }
      }
    });

    onUnmounted(() => {
      // Clear interval when component is unmounted to prevent memory leaks
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    });

    return {
      sidebarOpen,
      toggleSidebar,
      emailToVerify,
      emailInput,
      codeInput,
      goToLogin,
      countdown,
      formattedCountdown,
      canResend,
      verifyCode, // Expose the new method
      resendVerification,
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
  width: 260px; /* Lebar sidebar yang diperbesar */
  height: 100vh;
  padding-top: 1rem;
  position: fixed;
  transition: all 0.3s;
  left: 0;
  z-index: 2000;
  overflow-x: hidden; /* Penting untuk mencegah konten melebihi lebar sidebar */
}

/* Style for the logo inside the sidebar header */
.sidebar-logo {
  max-width: calc(100% - 60px); /* Batasi lebar agar ada ruang untuk tombol close, misal 60px untuk tombol dan padding */
  height: auto;    /* Maintain aspect ratio */
  display: block;  /* Treat it as a block element */
  margin-right: auto; /* Mendorong logo ke kiri dalam flexbox */
  margin-left: -5%; /* Geser logo lebih ke kiri, sesuaikan persentase ini */
  box-sizing: border-box; /* Pastikan padding dihitung dalam total lebar elemen */
}

/* Styles for the sidebar close button */
.sidebar-close-btn {
  margin-right: 0.5rem; /* Memberi sedikit ruang dari tepi kanan sidebar */
  background-color: rgba(255, 255, 255, 0.2); /* Sedikit transparan agar terlihat */
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fdfdfd; /* Warna teks putih */
  font-weight: bold;
  font-size: 1rem;
  line-height: 1; /* Pastikan tinggi baris untuk '✕' pas */
  padding: 0.25rem 0.5rem; /* Padding tombol */
  border-radius: 5px;
  flex-shrink: 0; /* Pastikan tombol tidak menyusut */
}

.sidebar-close-btn:hover {
  background-color: rgba(255, 255, 255, 0.4);
  color: #fff;
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
  padding: 0.75rem 1rem; /* Padding kontainer utama */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  /* Sudah ada d-flex justify-content-between align-items-center di HTML,
     jadi flexbox akan menangani positioning anak-anaknya. */
}
/* Sidebar Specific Styles - END */

/* Navbar style */
.navbar {
  background-color: #210038 !important;
  color: #fdfdfd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  /* Make the navbar fixed at the top */
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1030; /* Higher than sidebar's default content, but lower than modals etc. */
  padding-left: 240px !important; /* Default padding-left to push content past the fixed sidebar */
  transition: padding-left 0.3s; /* Smooth transition for padding when sidebar opens/closes */
}

.navbar .btn-outline-secondary {
  border-color: #fc0;
  color: #fc0;
}

.navbar .btn-outline-secondary:hover {
  background-color: #fc0;
  color: #000;
}

/* Card styles - adjusted for better contrast and consistency */
.card {
  background-color: rgba(
    0,
    0,
    0,
    0.25
  ); /* Darker transparent background for cards */
  color: #fdfdfd; /* Changed to FDFDFD for card titles */
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

/* New: Outline button for secondary actions */
.btn-custom-outline {
  background-color: transparent;
  color: #fc0;
  border: 1px solid #fc0;
  font-weight: 600;
}
.btn-custom-outline:hover {
  background-color: rgba(252, 204, 0, 0.1);
  color: #fc0;
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

/* New: Wrapper for content below fixed navbar */
.content-wrapper {
  padding-top: 56px; /* Adjust this to the height of your fixed navbar */
}


/* Styles for screens smaller than 768px (mobile/tablet) */
@media (max-width: 767.98px) {
  .sidebar {
    left: -260px;
  }
  .sidebar.open {
    left: 0;
  }
  .content {
    margin-left: 0 !important;
  }
  .navbar {
    padding-left: 1rem !important;
  }
  .sidebar-close-btn {
    display: block; /* Tombol close terlihat di mobile */
  }
  /* Pada mobile, pastikan logo berada di posisi normal atau sedikit digeser jika diinginkan */
  .sidebar-logo {
    margin-left: 0; /* Reset margin-left yang negatif */
    max-width: calc(100% - 60px); /* Pastikan gambar mengecil */
  }
}

/* Styles for screens larger than or equal to 768px (desktop/larger tablet) */
@media (min-width: 768px) {
  .sidebar {
    left: 0;
  }
  .content {
    margin-left: 260px;
  }
  .navbar {
    padding-left: 275px !important;
    width: auto;
    right: 0;
    left: 0;
  }
  .navbar .btn-outline-secondary.d-md-none {
    display: none !important;
  }
  .sidebar-close-btn {
    display: none !important; /* Sembunyikan tombol close di desktop */
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
.form-control.text-center {
    text-align: center;
    font-size: 1.25rem; /* Larger font for code input */
    letter-spacing: 0.2em; /* Spacing between digits */
}
</style>
