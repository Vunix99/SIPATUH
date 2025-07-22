<template>
  <div class="reset-password-page">
    <!-- Navbar (Optional, can be removed if you want a truly minimal page) -->
    <nav class="navbar navbar-light bg-light px-3 fixed-top">
      <h5 class="m-0 ms-2" style="color: #fdfdfd; font-weight: bold">
        Reset Password
      </h5>
    </nav>

    <div class="content flex-grow-1">
      <div class="content-wrapper">
        <div class="container-fluid pt-4 px-3 form-wrapper-top">
          <div class="row justify-content-center align-items-center h-100">
            <div class="col-lg-6 col-md-8 col-sm-10">
              <div class="card shadow w-100 text-center">
                <div class="card-header text-left">
                  <h4 class="mb-0" style="color: #fdfdfd;">Atur Password Baru Anda</h4>
                </div>
                <div class="card-body">
                  <i class="fa-solid fa-key fa-5x mb-4" style="color: #fc0;"></i>
                  <h5 class="card-title mb-3" style="color: #fdfdfd;">Atur Password Baru Anda</h5>
                  <p class="card-text mb-4">
                    Silakan masukkan password baru Anda.
                  </p>

                  <form @submit.prevent="resetPassword" class="mb-4">
                    <div class="mb-3">
                      <label for="newPassword" class="form-label">Password Baru</label>
                      <input
                        type="password"
                        class="form-control text-center"
                        id="newPassword"
                        v-model="newPassword"
                        required
                        placeholder="Masukkan password baru"
                      />
                    </div>
                    <div class="mb-3">
                      <label for="confirmNewPassword" class="form-label">Konfirmasi Password Baru</label>
                      <input
                        type="password"
                        class="form-control text-center"
                        id="confirmNewPassword"
                        v-model="confirmNewPassword"
                        required
                        placeholder="Konfirmasi password baru"
                      />
                    </div>
                    <button type="submit" class="btn btn-custom w-100 mt-3">
                      Reset Password
                    </button>
                  </form>

                  <button @click="goToLogin" class="btn btn-custom-outline mt-3">
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
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from 'vue-router';
import Swal from "sweetalert2";
import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from 'axios'; // Import axios for API calls

export default {
  name: "ResetPassword",
  setup() {
    const router = useRouter();
    const route = useRoute();

    const newPassword = ref('');
    const confirmNewPassword = ref('');
    const token = ref(''); // To store the token from URL

    const API_DOMAIN = import.meta.env.VITE_DOMAIN_SERVER || "http://localhost:3000";
    axios.defaults.baseURL = API_DOMAIN;
    axios.defaults.withCredentials = true; // Ensure cookies are sent (though not strictly needed for this public endpoint)

    const goToLogin = () => {
      router.push('/login');
    };

    const resetPassword = async () => {
      if (!newPassword.value || !confirmNewPassword.value) {
        Swal.fire({
          icon: 'warning',
          title: 'Input Tidak Lengkap',
          text: 'Harap isi semua kolom password.',
          confirmButtonText: 'OK'
        });
        return;
      }
      if (newPassword.value !== confirmNewPassword.value) {
        Swal.fire({
          icon: 'warning',
          title: 'Password Tidak Cocok',
          text: 'Password baru dan konfirmasi password tidak cocok.',
          confirmButtonText: 'OK'
        });
        return;
      }
      if (newPassword.value.length < 6) {
        Swal.fire({
          icon: 'warning',
          title: 'Password Terlalu Pendek',
          text: 'Password minimal 6 karakter.',
          confirmButtonText: 'OK'
        });
        return;
      }
      if (!token.value) {
        Swal.fire({
          icon: 'error',
          title: 'Token Tidak Ditemukan',
          text: 'Tautan reset password tidak valid atau rusak. Silakan minta tautan baru.',
          confirmButtonText: 'OK'
        }).then(() => {
          router.push('/login'); // Redirect to login or a "forgot password" page
        });
        return;
      }

      Swal.fire({
        title: "Mereset Password...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const response = await axios.post(`${API_DOMAIN}/api/admin/reset-password`, {
          token: token.value,
          newPassword: newPassword.value,
          confirmNewPassword: confirmNewPassword.value,
        });

        if (response.status === 200) {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: response.data.message || 'Password Anda berhasil direset.',
            confirmButtonText: 'OK'
          }).then(() => {
            router.push('/login'); // Redirect to login after successful reset
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Gagal Mereset Password',
            text: response.data.error || 'Terjadi kesalahan saat mereset password.',
            confirmButtonText: 'OK'
          });
        }
      } catch (error) {
        console.error("Error during password reset:", error);
        Swal.fire({
          icon: 'error',
          title: 'Kesalahan Jaringan',
          text: error.response?.data?.error || 'Tidak dapat terhubung ke server. Silakan coba lagi nanti.',
          confirmButtonText: 'OK'
        });
      }
    };

    onMounted(() => {
      // Get token from URL query parameter
      if (route.query.token) {
        token.value = route.query.token;
      } else {
        // If no token, redirect to login or show error
        Swal.fire({
          icon: 'error',
          title: 'Tautan Tidak Valid',
          text: 'Tautan reset password tidak ditemukan. Silakan minta tautan baru dari halaman login.',
          confirmButtonText: 'OK'
        }).then(() => {
          router.push('/login');
        });
      }
    });

    return {
      newPassword,
      confirmNewPassword,
      resetPassword,
      goToLogin,
    };
  },
};
</script>

<style scoped>
/* Main background for body and content */
body,
.reset-password-page { /* Use .reset-password-page instead of .content for the main background */
  background-color: #2b0057; /* Existing dark purple background */
  color: #fdfdfd; /* Changed to FDFDFD for main content text */
  min-height: 100vh; /* Ensure it takes full viewport height */
  display: flex; /* Use flex to center content */
  justify-content: center;
  align-items: center;
}

/* Navbar style (simplified for this standalone page) */
.navbar {
  background-color: #210038 !important; /* Slightly lighter purple for the navbar */
  color: #fdfdfd; /* Changed to FDFDFD */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Add a subtle shadow */
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1030;
  padding-left: 1rem !important; /* Adjust padding for no sidebar */
  padding-right: 1rem !important;
}

/* Content wrapper, adjusted for no sidebar */
.content-wrapper {
  padding-top: 56px; /* Adjust this to the height of your fixed navbar */
  flex-grow: 1; /* Allow it to grow and take available space */
  width: 100%; /* Ensure it takes full width */
  display: flex; /* Use flex to center content */
  justify-content: center;
  align-items: center;
}

/* Form wrapper top - simplified for centering */
.form-wrapper-top {
  min-height: calc(100vh - 56px); /* Full height minus navbar */
  display: flex; /* Use flex to center content vertically */
  justify-content: center;
  align-items: center;
  padding-top: 0; /* Remove top padding as content-wrapper handles it */
  padding-bottom: 0; /* Remove bottom padding */
}

/* Card styles - consistent with PengaturanAdmin.vue */
.card {
  background-color: rgba(0, 0, 0, 0.25);
  color: #fdfdfd;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.card-header {
  background-color: rgba(0, 0, 0, 0.35);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-body {
  padding: 2rem;
}

/* Form input styling - consistent */
.form-control {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fdfdfd;
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

/* Specific style for text-center inputs like in VerifikasiAdmin */
.form-control.text-center {
    text-align: center;
    font-size: 1.25rem; /* Larger font for code input */
    letter-spacing: 0.05em; /* Adjusted spacing for general password input */
}


/* Button styles - consistent */
.btn-custom {
  background-color: #fc0;
  color: #000;
  font-weight: bold;
  border: none;
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.btn-custom:hover {
  background-color: #e6b800;
}

.btn-custom-outline {
  background-color: transparent;
  color: #fc0;
  border: 1px solid #fc0;
  font-weight: bold;
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 1rem;
}
.btn-custom-outline:hover {
  background-color: rgba(252, 204, 0, 0.1);
  color: #fc0;
}

/* SweetAlert2 Custom Styling (copy from previous components) */
.swal-button-custom {
  background-color: #fc0 !important;
  color: #000 !important;
  border: none !important;
  font-weight: bold !important;
}
.swal-button-custom:hover {
  background-color: #e6b800 !important;
}

.swal-button-custom-red {
  background-color: #dc3545 !important;
  color: #fdfdfd !important;
  border: none !important;
  font-weight: bold !important;
}
.swal-button-custom-red:hover {
  background-color: #c82333 !important;
}

/* General dark theme for SweetAlert2 popups */
.swal-dark-theme .swal2-popup {
  background-color: #210038 !important;
  color: #fdfdfd !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.swal-dark-theme .swal2-title {
  color: #fdfdfd !important;
}

.swal-dark-theme .swal2-html-container {
  color: #fdfdfd !important;
}

.swal-dark-theme .swal2-input {
  background-color: #3e006b !important;
  color: #fdfdfd !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.swal-dark-theme .swal2-input::placeholder {
  color: #bbb !important;
}

.swal-dark-theme .swal2-validation-message {
  color: #dc3545 !important;
}

/* Responsive adjustments */
@media (max-width: 767.98px) {
  .form-wrapper-top {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  .navbar {
    padding-left: 1rem !important;
  }
}

/* New responsive style for form-label */
@media (max-width: 767.98px) {
  .form-label {
    font-size: 0.9rem; /* Smaller font size for labels on small screens */
  }
  .card-title {
    font-size: 1.2rem !important; /* Adjust card title size for mobile */
  }
  .card-text {
    font-size: 0.9rem; /* Adjust paragraph text size for mobile */
  }
  .form-control.text-center {
    font-size: 1rem; /* Smaller font for input on mobile */
    letter-spacing: 0.02em; /* Adjust letter spacing */
  }
  .fa-5x { /* Adjust icon size for mobile if needed */
    font-size: 3em !important;
  }
}
</style>
