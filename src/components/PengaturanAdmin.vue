<template>
  <div class="d-flex">
    <nav :class="['sidebar', sidebarOpen ? 'open' : '']">
      <div
        class="sidebar-header d-flex justify-content-between align-items-center"
      >
        <img
          src="/src/assets/img/LogoSipatuhLong_Transparent.svg"
          alt=""
          class="sidebar-logo"
        />
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
            <i class="fa-solid fa-arrows-rotate"></i> Pencadangan & Pemulihan
          </router-link>
        </li>
        <li>
          <router-link to="/pengaturan-admin" class="nav-link">
            <i class="fa-solid fa-gear"></i> Pengaturan Admin
          </router-link>
        </li>

        <li class="sidebar-divider my-3"></li>

        <li>
          <router-link
            to="/parking"
            class="nav-link parkir-kendaraan-link"
          >
            <i class="fa-solid fa-car"></i> Parkirkan Kendaraan!
          </router-link>
        </li>
        <li>
          <router-link
            to="/logout"
            class="nav-link"
            style="color: red; font-weight: bolder"
          >
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
          Pengaturan Admin
        </h5>
      </nav>

      <div class="content-wrapper">
        <div class="container-fluid pt-4 px-3 form-wrapper-top">
          <div class="row justify-content-center align-items-center h-100">
            <div class="col-lg-12 col-md-12">
              <div class="card shadow w-100 mb-4">
                <div class="card-header text-left">
                  <strong>🔑 Ubah Password</strong>
                </div>
                <div class="card-body">
                  <form @submit.prevent="changePassword">
                    <div class="mb-3">
                      <label for="currentPassword" class="form-label"
                        >Password Saat Ini</label
                      >
                      <input
                        type="password"
                        class="form-control"
                        id="currentPassword"
                        v-model="changePassForm.currentPassword"
                        required
                        placeholder="Masukkan password saat ini"
                      />
                    </div>
                    <div class="mb-3">
                      <label for="newPassword" class="form-label"
                        >Password Baru</label
                      >
                      <input
                        type="password"
                        class="form-control"
                        id="newPassword"
                        v-model="changePassForm.newPassword"
                        required
                        placeholder="Masukkan password baru"
                      />
                    </div>
                    <div class="mb-3">
                      <label for="confirmNewPassword" class="form-label"
                        >Konfirmasi Password Baru</label
                      >
                      <input
                        type="password"
                        class="form-control"
                        id="confirmNewPassword"
                        v-model="changePassForm.confirmNewPassword"
                        required
                        placeholder="Konfirmasi password baru"
                      />
                    </div>
                    <button type="submit" class="btn btn-custom w-100 mt-3">
                      Ubah Password
                    </button>
                  </form>
                </div>
              </div>

              <div class="card shadow w-100 mb-4">
                <div class="card-header text-left">
                  <strong>🔄 Reset Password</strong>
                </div>
                <div class="card-body">
                  <p class="card-text mb-3">
                    Jika Anda lupa password, Anda bisa meminta tautan reset
                    password ke email Anda.
                  </p>
                  <form @submit.prevent="requestPasswordReset">
                    <div class="mb-3">
                      <label for="resetEmail" class="form-label"
                        >Email Akun Anda</label
                      >
                      <input
                        type="email"
                        class="form-control"
                        id="resetEmail"
                        v-model="resetPassForm.email"
                        required
                        readonly
                        placeholder="Email Anda"
                      />
                    </div>
                    <button
                      type="submit"
                      class="btn btn-outline-warning w-100 mt-3"
                    >
                      Kirim Tautan Reset Password
                    </button>
                  </form>
                </div>
              </div>

              <div class="card shadow w-100 mb-4">
                <div class="card-header text-left">
                  <strong>💾 Backup Otomatis</strong>
                </div>
                <div class="card-body">
                  <div
                    class="form-check form-switch mb-3 d-flex align-items-center"
                  >
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="autoBackupSwitch"
                      v-model="autoBackupEnabled"
                      role="switch"
                    />
                    <label class="form-check-label ms-2" for="autoBackupSwitch">
                      Aktifkan Backup Otomatis
                    </label>
                    <i
                      class="fa-solid fa-circle-info ms-2 text-info"
                      data-bs-toggle="tooltip"
                      data-bs-placement="right"
                      title="Backup otomatis akan dikirim ke email admin utama Anda sebulan sekali."
                    ></i>
                  </div>
                  <p class="card-text text-muted">
                    Fitur ini akan mencadangkan database Anda secara otomatis
                    dan mengirimkannya ke email admin yang terdaftar sebulan
                    sekali.
                  </p>
                  <div v-if="autoBackupEnabled" class="mb-3">
                    <label for="autoBackupEmail" class="form-label"
                      >Email Penerima Backup</label
                    >
                    <input
                      type="email"
                      class="form-control"
                      id="autoBackupEmail"
                      v-model="autoBackupTargetEmail"
                      required
                      placeholder="Masukkan email penerima backup"
                    />
                    <small class="form-text text-muted">
                      Backup akan dikirim ke email ini. Jika kosong, akan
                      menggunakan email akun Anda.
                    </small>
                  </div>

                  <div v-if="autoBackupEnabled" class="mb-3 text-center">
                    <p class="text-warning small mb-2">
                      <i class="fa-solid fa-shield-halved me-1"></i> Harap
                      centang reCAPTCHA untuk mengaktifkan.
                    </p>
                    <div
                      id="recaptcha-checkbox-container"
                      class="d-inline-block"
                      ref="recaptchaContainerRef"
                    ></div>
                    <small class="form-text text-muted d-block mt-2">
                      Verifikasi reCAPTCHA diperlukan untuk mengaktifkan backup
                      otomatis.
                    </small>
                  </div>

                  <button
                    @click="saveAutoBackupSetting"
                    :disabled="autoBackupEnabled && !recaptchaVerified"
                    class="btn btn-custom w-100 mt-3"
                  >
                    Simpan Pengaturan Backup
                  </button>
                </div>
              </div>

              <div class="card shadow w-100 mb-4">
                <div class="card-header text-left bg-danger">
                  <strong>🗑️ Hapus Akun Admin </strong>
                </div>
                <div class="card-body">
                  <p class="card-text mb-3">
                    Menghapus akun admin ini adalah tindakan permanen dan tidak
                    dapat dibatalkan. Semua log aktivitas yang terkait dengan
                    akun ini juga akan dihapus.
                  </p>
                  <button
                    @click="confirmDeleteAccount"
                    class="btn btn-danger w-100 mt-3"
                  >
                    Hapus Akun Saya
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
import { ref, onMounted, watch, nextTick } from "vue";
import Swal from "sweetalert2";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "vue-router";
import axios from "axios";
import * as bootstrap from "bootstrap";

export default {
  name: "PengaturanAdmin",
  setup() {
    const sidebarOpen = ref(false);
    const router = useRouter();

    const changePassForm = ref({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });

    const resetPassForm = ref({
      email: "",
    });

    const autoBackupEnabled = ref(false);
    const autoBackupTargetEmail = ref("");
    const recaptchaVerified = ref(false); // NEW: State for reCAPTCHA verification status
    const recaptchaToken = ref(null); // NEW: Store the reCAPTCHA token

    const recaptchaWidgetId = ref(null);
    const recaptchaLoaded = ref(false);
    const recaptchaContainerRef = ref(null); // NEW: Reference to the reCAPTCHA container DOM element

    const API_DOMAIN =
      import.meta.env.VITE_DOMAIN_SERVER || "http://localhost:3000";
    const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    axios.defaults.baseURL = API_DOMAIN;
    axios.defaults.withCredentials = true;

    const toggleSidebar = () => {
      sidebarOpen.value = !sidebarOpen.value;
    };

    const changePassword = async () => {
      const { currentPassword, newPassword, confirmNewPassword } =
        changePassForm.value;

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        Swal.fire({
          icon: "warning",
          title: "Input Tidak Lengkap",
          text: "Harap isi semua kolom password.",
          confirmButtonText: "OK",
        });
        return;
      }
      if (newPassword !== confirmNewPassword) {
        Swal.fire({
          icon: "warning",
          title: "Password Tidak Cocok",
          text: "Password baru dan konfirmasi password tidak cocok.",
          confirmButtonText: "OK",
        });
        return;
      }
      if (newPassword.length < 6) {
        Swal.fire({
          icon: "warning",
          title: "Password Terlalu Pendek",
          text: "Password baru minimal 6 karakter.",
          confirmButtonText: "OK",
        });
        return;
      }

      Swal.fire({
        title: "Mengubah Password...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const response = await axios.put(
          `${API_DOMAIN}/api/admin/change-password`,
          {
            currentPassword,
            newPassword,
            confirmNewPassword,
          }
        );

        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: response.data.message,
          confirmButtonText: "OK",
        });
        changePassForm.value.currentPassword = "";
        changePassForm.value.newPassword = "";
        changePassForm.value.confirmNewPassword = "";
      } catch (error) {
        console.error("Error changing password:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal Mengubah Password",
          text:
            error.response?.data?.error ||
            "Terjadi kesalahan saat mengubah password.",
          confirmButtonText: "OK",
        });
      }
    };

    const requestPasswordReset = async () => {
      const { email } = resetPassForm.value;

      if (!email) {
        Swal.fire({
          icon: "warning",
          title: "Email Kosong",
          text: "Email tidak boleh kosong.",
          confirmButtonText: "OK",
        });
        return;
      }

      Swal.fire({
        title: "Mengirim Tautan Reset...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const response = await axios.post(
          `${API_DOMAIN}/api/admin/request-password-reset`,
          { email }
        );

        Swal.fire({
          icon: "success",
          title: "Tautan Terkirim!",
          text: response.data.message,
          confirmButtonText: "OK",
        });
      } catch (error) {
        console.error("Error requesting password reset:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal Mengirim Tautan",
          text:
            error.response?.data?.error ||
            "Terjadi kesalahan saat meminta reset password.",
          confirmButtonText: "OK",
        });
      }
    };

    // Callback function for reCAPTCHA v2 checkbox on success
    window.onRecaptchaSuccessCallback = (token) => {
      console.log("reCAPTCHA checkbox verified successfully! Token:", token);
      recaptchaVerified.value = true;
      recaptchaToken.value = token;
      Swal.close(); // Close any loading SweetAlert if it was showing for reCAPTCHA
    };

    // Callback function for reCAPTCHA v2 checkbox on expiration (after 2 minutes)
    window.onRecaptchaExpiredCallback = () => {
      console.warn("reCAPTCHA checkbox expired.");
      recaptchaVerified.value = false;
      recaptchaToken.value = null;
      Swal.fire({
        icon: "warning",
        title: "Verifikasi Kedaluwarsa",
        text: "Verifikasi reCAPTCHA Anda telah kedaluwarsa. Harap centang kotak lagi.",
        confirmButtonText: "OK",
      });
      grecaptcha.reset(recaptchaWidgetId.value); // Reset the widget
    };

    // Callback function for reCAPTCHA v2 checkbox on error
    window.onRecaptchaErrorCallback = () => {
      console.error("reCAPTCHA checkbox error.");
      recaptchaVerified.value = false;
      recaptchaToken.value = null;
      Swal.fire({
        icon: "error",
        title: "Kesalahan reCAPTCHA",
        text: "Terjadi kesalahan pada verifikasi reCAPTCHA. Silakan coba lagi.",
        confirmButtonText: "OK",
      });
    };

    const saveAutoBackupSetting = async () => {
      // If auto backup is enabled, and reCAPTCHA hasn't been verified yet, prevent saving
      if (autoBackupEnabled.value && !recaptchaVerified.value) {
        Swal.fire({
          icon: "info",
          title: "Verifikasi Diperlukan",
          text: "Harap centang kotak 'Saya bukan robot' terlebih dahulu.",
          confirmButtonText: "OK",
        });

        // NEW: Scroll to reCAPTCHA if it's not visible
        if (recaptchaContainerRef.value) {
          recaptchaContainerRef.value.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
        return;
      }

      Swal.fire({
        title: "Menyimpan Pengaturan...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const targetEmailToSave =
          autoBackupTargetEmail.value || resetPassForm.value.email;

        // Send 'auto_backup_enabled' setting
        await axios.put(`${API_DOMAIN}/api/admin-settings`, {
          setting_name: "auto_backup_enabled",
          setting_value: autoBackupEnabled.value.toString(),
          // Only send recaptchaToken if autoBackupEnabled is true
          recaptchaToken: autoBackupEnabled.value ? recaptchaToken.value : null,
        });

        // Send 'auto_backup_email' setting (always save this if autoBackupEnabled is true)
        if (autoBackupEnabled.value) {
          await axios.put(`${API_DOMAIN}/api/admin-settings`, {
            setting_name: "auto_backup_email",
            setting_value: targetEmailToSave,
          });
        }

        Swal.fire({
          icon: "success",
          title: "Pengaturan Tersimpan!",
          text: "Pengaturan backup otomatis berhasil diperbarui.",
          confirmButtonText: "OK",
        });
      } catch (error) {
        console.error("Error saving auto backup setting:", error);
        Swal.fire({
          icon: "error",
          title: "Gagal Menyimpan",
          text:
            error.response?.data?.error ||
            "Terjadi kesalahan saat menyimpan pengaturan.",
          confirmButtonText: "OK",
        });
      } finally {
        // Reset reCAPTCHA after any save attempt (success or failure)
        // This ensures the user has to re-verify if they want to change settings again
        if (recaptchaLoaded.value && recaptchaWidgetId.value !== null) {
          grecaptcha.reset(recaptchaWidgetId.value);
          recaptchaVerified.value = false; // Reset verification status
          recaptchaToken.value = null;
        }
      }
    };

    // Removed triggerSaveAutoBackupSetting as the button directly calls saveAutoBackupSetting now.

    const confirmDeleteAccount = async () => {
      const { value: confirmationText } = await Swal.fire({
        title: "Konfirmasi Penghapusan Akun",
        html: `
          <div class="swal-icon-warning-custom">
            <i class="fa-solid fa-triangle-exclamation fa-7x" style="color: #dc3545;"></i>
          </div>
          <p style="color: grey; margin-top: 15px;">
            Anda akan menghapus akun admin Anda secara permanen: <strong>${resetPassForm.value.email}</strong>.
          </p>
          <p style="color: #ff0000; font-weight: bold; font-size: 1.1em;">
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <p style="color: grey; margin-top: 20px; font-size: 1em;">
            Untuk melanjutkan, ketik <strong style="color: #fc0;">"HAPUS AKUN"</strong> di kolom di bawah ini:
          </p>
        `,
        input: "text",
        inputPlaceholder: 'Ketik "HAPUS AKUN"',
        showCancelButton: true,
        confirmButtonText: "Ya, Hapus Akun Saya",
        cancelButtonText: "Batal",
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        backdrop: `
          rgba(0,0,0,0.8)
          center center
          no-repeat
        `,
        customClass: {
          container: "swal-dark-theme",
          popup: "swal-dark-popup",
          input: "swal-dark-input",
          confirmButton: "swal-button-custom-red",
          cancelButton: "swal-button-custom",
        },
        preConfirm: (text) => {
          if (text !== "HAPUS AKUN") {
            Swal.showValidationMessage("Teks konfirmasi tidak sesuai.");
            return false;
          }
          return text;
        },
      });

      if (confirmationText === "HAPUS AKUN") {
        deleteAccount();
      } else if (confirmationText === undefined) {
        Swal.fire({
          icon: "info",
          title: "Penghapusan Dibatalkan",
          text: "Penghapusan akun dibatalkan oleh pengguna.",
          confirmButtonText: "OK",
          customClass: {
            confirmButton: "swal-button-custom",
          },
        });
      }
    };

    const deleteAccount = async () => {
      Swal.fire({
        title: "Menghapus Akun...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const response = await axios.delete(
          `${API_DOMAIN}/api/admin/delete-my-account`
        );

        if (response.status === 200) {
          Swal.fire({
            icon: "success",
            title: "Akun Dihapus!",
            text: "Akun Anda telah berhasil dihapus. Anda akan diarahkan ke halaman login.",
            confirmButtonText: "OK",
            customClass: {
              confirmButton: "swal-button-custom",
            },
          }).then(() => {
            router.push("/login");
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Gagal Menghapus Akun",
            text:
              response.data.error || "Terjadi kesalahan saat menghapus akun.",
            confirmButtonText: "OK",
            customClass: {
              confirmButton: "swal-button-custom",
            },
          });
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        Swal.fire({
          icon: "error",
          title: "Kesalahan Jaringan",
          text: "Tidak dapat terhubung ke server. Silakan coba lagi nanti.",
          confirmButtonText: "OK",
          customClass: {
            confirmButton: "swal-button-custom",
          },
        });
      }
    };

    // Function to render the reCAPTCHA widget
    const renderRecaptchaWidget = () => {
      if (recaptchaLoaded.value && recaptchaWidgetId.value === null) {
        nextTick(() => {
          const recaptchaContainer = recaptchaContainerRef.value;
          if (recaptchaContainer && RECAPTCHA_SITE_KEY) {
            recaptchaWidgetId.value = grecaptcha.render(recaptchaContainer, {
              sitekey: RECAPTCHA_SITE_KEY,
              callback: "onRecaptchaSuccessCallback", // Global callback function name
              "expired-callback": "onRecaptchaExpiredCallback", // Global callback for expiration
              "error-callback": "onRecaptchaErrorCallback", // Global callback for error
            });
            console.log(
              "reCAPTCHA v2 Checkbox widget rendered:",
              recaptchaWidgetId.value
            );
          } else {
            console.warn(
              "reCAPTCHA container div not found or SITE_KEY missing. Cannot render widget."
            );
          }
        });
      }
    };

    // Watcher for autoBackupEnabled to show/hide email input and manage reCAPTCHA rendering
    watch(autoBackupEnabled, (newValue, oldValue) => {
      if (newValue && !autoBackupTargetEmail.value) {
        autoBackupTargetEmail.value = resetPassForm.value.email;
      }

      if (newValue) {
        // When enabling auto backup
        renderRecaptchaWidget();
        recaptchaVerified.value = false; // Reset verification status when enabling
        recaptchaToken.value = null;
        // NEW: Scroll to reCAPTCHA when it's enabled and rendered
        nextTick(() => {
          if (recaptchaContainerRef.value) {
            recaptchaContainerRef.value.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        });
      } else {
        // When disabling auto backup
        // Reset reCAPTCHA and its state
        if (recaptchaLoaded.value && recaptchaWidgetId.value !== null) {
          grecaptcha.reset(recaptchaWidgetId.value);
        }
        recaptchaVerified.value = false;
        recaptchaToken.value = null;
        // If it was just disabled, trigger save directly as no recaptcha is needed
        if (oldValue === true && newValue === false) {
          saveAutoBackupSetting();
        }
      }
    });

    onMounted(async () => {
      // 1. Fetch logged-in admin's email to pre-fill reset password form
      try {
        const authResponse = await axios.get(`${API_DOMAIN}/api/check-auth`);
        if (authResponse.status === 200 && authResponse.data.adminEmail) {
          resetPassForm.value.email = authResponse.data.adminEmail;
        } else {
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("Error fetching admin email:", error);
        router.push("/login");
        return;
      }

      // 2. Fetch admin settings (including auto backup settings)
      try {
        const settingsResponse = await axios.get(
          `${API_DOMAIN}/api/admin-settings`
        );
        if (settingsResponse.status === 200) {
          const settings = settingsResponse.data;
          autoBackupEnabled.value = settings.auto_backup_enabled;
          autoBackupTargetEmail.value =
            settings.auto_backup_email || resetPassForm.value.email;
        }
      } catch (error) {
        console.error("Error fetching admin settings:", error);
        autoBackupEnabled.value = false;
        autoBackupTargetEmail.value = resetPassForm.value.email;
      }

      // Initialize Bootstrap tooltips
      const tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });

      // Global callback for reCAPTCHA script load
      // Ini akan dipanggil oleh script reCAPTCHA di index.html setelah dimuat
      window.onRecaptchaLoad = () => {
        recaptchaLoaded.value = true;
        console.log("reCAPTCHA script has loaded and is ready.");
        // Jika autoBackupEnabled sudah true saat mount, render widget sekarang
        if (autoBackupEnabled.value) {
          renderRecaptchaWidget();
        }
      };

      // Fallback if onRecaptchaLoad somehow already fired before onMounted
      // (e.g., if script is very fast or component mounts late)
      if (
        typeof grecaptcha !== "undefined" &&
        typeof grecaptcha.render === "function"
      ) {
        recaptchaLoaded.value = true;
        console.log(
          "reCAPTCHA already loaded before onMounted. Rendering if needed."
        );
        if (autoBackupEnabled.value) {
          renderRecaptchaWidget();
        }
      }
    });

    return {
      sidebarOpen,
      toggleSidebar,
      changePassForm,
      resetPassForm,
      autoBackupEnabled,
      autoBackupTargetEmail,
      recaptchaVerified, // Expose to template
      changePassword,
      requestPasswordReset,
      saveAutoBackupSetting, // Now directly linked to button
      confirmDeleteAccount,
      recaptchaContainerRef, // Make the ref available in the template
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
  max-width: calc(
    100% - 60px
  ); /* Batasi lebar agar ada ruang untuk tombol close, misal 60px untuk tombol dan padding */
  height: auto; /* Maintain aspect ratio */
  display: block; /* Treat it as a block element */
  margin-right: auto; /* Mendorong logo ke kiri dalam flexbox */
  margin-left: -5%; /* Geser logo lebih ke kiri, sesuaikan persentase ini */
  box-sizing: border-box; /* Pastikan padding dihitung dalam total lebar elemen */
}

/* Styles for the sidebar close button */
.sidebar-close-btn {
  margin-right: 0.5rem; /* Memberi sedikit ruang dari tepi kanan sidebar */
  background-color: rgba(
    255,
    255,
    255,
    0.2
  ); /* Sedikit transparan agar terlihat */
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
  background-color: #210038 !important; /* Slightly lighter purple for the navbar */
  color: #fdfdfd; /* Changed to FDFDFD */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Add a subtle shadow */
  /* Make the navbar fixed at the top */
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1030; /* Higher than sidebar's default content, but lower than modals etc. */
  padding-left: 240px !important; /* Default padding-left to push content past the fixed sidebar */
  transition: padding-left 0.3s; /* Smooth transition for padding when sidebar opens/closes */
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

/* Drop Area Specific Styles */
.drop-area {
  position: relative; /* Needed for loading overlay positioning */
  border: 2px dashed rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  padding: 40px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 150px; /* Ensure enough height for content */
  overflow: hidden; /* Hide overflowing content during loading */
}

.drop-area:hover,
.drop-area.drag-active {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: #fc0; /* Accent color on hover/drag */
}

.drop-area i {
  color: #fc0; /* Accent color for the icon */
}

.drop-area p {
  color: #fdfdfd;
}

.drop-area small {
  color: #ccc !important;
}

/* Loading Overlay for Drop Area */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8); /* Dark semi-transparent background */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fdfdfd;
  z-index: 10;
}

/* Spinner colors (Bootstrap 5) */
.spinner-grow.text-warning {
  color: #fc0 !important; /* Ensure spinner uses your accent color */
}

/* NEW: Wrapper for content below fixed navbar */
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
  .card {
    margin-left: 16px;
  }
}

.sidebar-divider {
  border-top: 2px solid #fc0; /* Ubah ke warna kuning (#fc0) */
  margin: 1.5rem 0; /* Jarak atas dan bawah, sesuaikan jika my-3 di HTML sudah cukup */
  padding: 0 1.5rem;
  list-style: none; /* Pastikan tidak ada bullet point */
  padding: 0; /* Hapus padding default li */
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
  color: #fdfdfd;
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
  color: #fdfdfd;
  border: none;
  border-radius: 10px;
}

/* Padding dan jarak nyaman */
.card-body {
  padding: 2rem;
  /* Tambahkan atau pastikan ini ada di sini */
  position: relative; /* Membuat konteks stacking untuk anak-anaknya */
  z-index: 1; /* Pastikan card body berada di atas latar belakang */
}

/* Input styling tetap elegan */
.form-control {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fdfdfd;
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
  /* Pastikan ini ada di sini */
  position: relative; /* Membuat konteks stacking untuk tombol */
  z-index: 10; /* Pastikan tombol berada di atas elemen lain dalam card-body */
}

.btn.btn-custom:hover {
  background-color: #e6b800;
}

/* SweetAlert2 Custom Styling */
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

/* New style for the custom warning icon wrapper */
.swal-icon-warning-custom {
  margin-top: 1em;
  margin-bottom: 1em;
}

.swal-icon-warning-custom .fa-triangle-exclamation {
  color: #fc0; /* Your accent orange color */
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

/* Styles for reCAPTCHA checkbox container */
#recaptcha-checkbox-container {
  /* Center the reCAPTCHA widget */
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 15px; /* Add some space above the widget */
  margin-bottom: 15px; /* Add some space below the widget */
  /* ReCAPTCHA widgets inject iframes, which can be tricky with z-index.
     However, for the standard "I'm not a robot" checkbox, it usually
     behaves as a normal block element. The actual challenge is a modal
     that should always overlay everything by design. */
}
</style>
