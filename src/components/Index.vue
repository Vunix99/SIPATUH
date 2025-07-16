<template>
  <header>
    <div class="container-fluid">
      <div class="row">
        <div class="col-5">
          <a href="#">
            <img src="/src/assets/img/logo.svg" alt="" width="50" height="55" />
          </a>
        </div>
      </div>
    </div>
  </header>

  <div class="wrapper_centering">
    <div class="container_centering">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-xl-5 col-lg-6 col-md-8 col-sm-10">
            <div id="wizard_container">
              <div class="main_title_1 text-center">
                <h3>Login SIPATUH</h3>
                <p>Masuk untuk Mengelola Parkir</p>
              </div>
              <form @submit.prevent="handleLogin" autocomplete="off">
                <input
                  id="website"
                  name="website"
                  type="text"
                  value=""
                  style="display: none"
                />
                <div id="middle-wizard">
                  <div class="form-group">
                    <label for="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      v-model="loginForm.email"
                      class="form-control"
                      placeholder="Masukkan email Anda"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label for="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      v-model="loginForm.password"
                      class="form-control"
                      placeholder="Masukkan password Anda"
                      required
                    />
                  </div>
                </div>

                <div id="bottom-wizard" class="text-center">
                  <button type="submit" class="submit">Login</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer>
    <div class="container-fluid">
      <div class="row">
        <div
          class="col-md-3"
          style="
            display: flex;
            align-items: center;
            text-align: left;
            height: 100%;
            margin-top: 6px;
            margin-bottom: 6px;
          "
        >
          ©2025 Glorian Hilarius - Built with Vue and Node.js
        </div>
      </div>
    </div>
  </footer>
</template>



<script>

// --- Impor File JS Kustom Anda ---
// Pastikan urutan impor JS benar jika ada dependensi
import '../assets/js/jquery-3.7.1.min.js'; // JQuery biasanya diimpor sebelum script lain yang mungkin menggunakannya
import '../assets/js/bootstrap.bundle.min.js'; // Bootstrap JS bundle
import '../assets/js/common_scripts.min.js';
import '../assets/js/functions.js';
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

export default {
  name: "Login",
  setup() {
    const router = useRouter();
    const loginForm = ref({
      email: "",
      password: "",
    });

    onMounted(() => {
      document.body.classList.add("style_2");
    });

    const handleLogin = async () => {
      if (!loginForm.value.email || !loginForm.value.password) {
        Swal.fire({
          icon: "error",
          title: "Input Tidak Lengkap",
          text: "Harap isi email dan password.",
        });
        return;
      }

      Swal.fire({
        title: "Logging in...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const API_DOMAIN =
          import.meta.env.API_DOMAIN || "http://localhost:3000";
        const response = await fetch(`${API_DOMAIN}/api/admin/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: loginForm.value.email,
            password: loginForm.value.password,
          }),
          credentials: 'include'
        });

        // Selalu coba parse response.json() untuk mendapatkan detail error dari server
        const data = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Login Berhasil!",
            text: "Anda akan dialihkan ke halaman parkir.",
            showConfirmButton: false,
            timer: 1500,
          });

          router.push("/parking");
        } else {
          // Jika respons tidak OK (misal: 400, 500), lempar error dengan pesan dari server
          throw new Error(data.error || "Login gagal. Terjadi kesalahan yang tidak diketahui.");
        }
      } catch (error) {
        console.error("Login error:", error);
        // Tampilkan pesan error yang lebih umum sesuai dari server
        Swal.fire({
          icon: "error",
          title: "Login Gagal",
          text: error.message, // Gunakan langsung error.message dari throw new Error
          confirmButtonText: "Coba Lagi",
        });
      }
    };

    return {
      loginForm,
      handleLogin,
    };
  },
};
</script>

<style scoped>
/* Anda bisa menambahkan gaya khusus untuk halaman login di sini */
.main_title_1 {
  margin-bottom: 25px;
}
.main_title_1 h3 {
  color: #fff; /* Atau warna teks yang sesuai dengan desain Anda */
  font-size: 2.2rem;
  margin-bottom: 10px;
}
.main_title_1 p {
  color: #ccc;
  font-size: 1.1rem;
}
#wizard_container {
  background-color: rgba(51, 51, 51, 0.7); /* Latar belakang form dengan transparansi */
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
.form-group label {
  color: #eee; /* Warna label */
  margin-bottom: 5px;
}
.form-control {
  background-color: #444; /* Warna input field */
  border: 1px solid #555;
  color: #fff; /* Warna teks di input */
  padding: 10px 15px;
  border-radius: 4px;
}
.form-control::placeholder {
  color: #bbb;
}
.form-control:focus {
  background-color: #555;
  border-color: rgb(255, 204, 0); /* Warna border saat focus */
  box-shadow: 0 0 0 0.2rem rgba(255, 204, 0, 0.25); /* Shadow saat focus */
}
#bottom-wizard .submit {
  background-color: rgb(255, 204, 0); /* Warna tombol login */
  color: black; /* Ubah warna teks menjadi hitam agar terlihat jelas */
  border: none;
  padding: 12px 25px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1rem;
  width: 100%; /* Agar tombol full width */
}
#bottom-wizard .submit:hover {
  background-color: rgb(220, 170, 0); /* Warna tombol login saat hover (sedikit lebih gelap) */
}
.wrapper_centering {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(
    100vh - 120px
  ); /* Sesuaikan tinggi agar form di tengah layar, dikurangi header dan footer */
  padding: 20px 0; /* Padding vertikal */
}
.container_centering {
  width: 100%;
}
</style>