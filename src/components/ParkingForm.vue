<template>
  <header>
    <div class="container-fluid">
      <div class="row">
        <div class="col-5">
          <a href="#">
            <img src="/src/assets/img/LogoSipatuhSmall_WH_BG.svg" alt="" width="75" height="75" />
          </a>
        </div>
      </div>
    </div>
  </header>

  <div class="wrapper_centering">
    <div class="container_centering">
      <div class="container">
        <div class="row justify-content-between">
          <div class="col-xl-6 col-lg-6 d-flex-start">
            <div class="main_title_1">
              <img
                src="/src/assets/img/LogoSipatuhLong_Transparent.svg"
                alt="SIPATUH Logo"
                class="img-fluid sipatuh-long-logo"
              />
              <p>
                SIPATUH (Sistem Parkir Tertib untuk Umat HMTB) hadir sebagai
                solusi digital untuk mengoptimalkan manajemen parkir di
                lingkungan Gereja HMTB. Aplikasi ini memberdayakan petugas
                parkir OMK(Orang Muda Katolik Cicurug) dengan kemampuan untuk mencatat setiap kendaraan yang
                masuk dan keluar secara akurat, memantau pendapatan parkir
                secara transparan, serta menjaga efisiensi pengelolaan tiket.
                Dengan SIPATUH, terciptalah sistem parkir yang lebih aman,
                teratur, dan memberikan ketenangan bagi jemaat dan pengelola.
              </p>
            </div>
          </div>

          <div class="col-xl-5 col-lg-5">
            <div id="wizard_container">
              <nav>
                <div class="nav nav-tabs" id="nav-tab" role="tablist">
                  <button
                    class="nav-link active"
                    id="nav-masuk-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#nav-masuk"
                    type="button"
                    role="tab"
                    aria-controls="nav-masuk"
                    aria-selected="true"
                  >
                    Parkir Masuk
                  </button>
                  <button
                    class="nav-link"
                    id="nav-keluar-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#nav-keluar"
                    type="button"
                    role="tab"
                    aria-controls="nav-keluar"
                    aria-selected="false"
                  >
                    Parkir Keluar
                  </button>
                  <router-link
                    to="/dashboard"
                    class="nav-link"
                    id="nav-dashboard-tab"
                    role="tab"
                    aria-controls="nav-dashboard"
                    aria-selected="false"
                  >
                    Kunjungi Dashboard
                  </router-link>
                </div>
              </nav>
              <div class="tab-content" id="nav-tabContent">
                <div
                  class="tab-pane fade show active"
                  id="nav-masuk"
                  role="tabpanel"
                  aria-labelledby="nav-masuk-tab"
                >
                  <form
                    id="form-masuk"
                    @submit.prevent="handleSubmitMasuk"
                    autocomplete="off"
                    style="margin-bottom: 24px; height: 100%; width: 100%"
                  >
                    <input id="website" name="website" type="text" value="" />

                    <div id="middle-wizard">
                      <div class="submit step">
                        <h3 class="main_question">
                          <strong>Masukan Kendaraan</strong>Harap Isi Detail
                          Kendaraan yang Masuk
                        </h3>

                        <div class="form-group">
                          <label for="nomortiket">Nomor Tiket</label>
                          <input
                            type="number"
                            id="nomortiket"
                            v-model="formMasuk.nomor_tiket"
                            class="form-control"
                            @input="
                              handleTicketNumberInput(
                                $event,
                                'formMasuk',
                                'nomor_tiket'
                              )
                            "
                            onkeydown="return event.keyCode !== 69"
                            required
                          />
                        </div>

                        <div class="form-group">
                          <label for="platnomor">Plat Nomor</label>
                          <input
                            type="text"
                            id="platnomor"
                            v-model="formMasuk.plat_nomor"
                            class="form-control"
                            required
                          />
                        </div>

                        <div class="form-group">
                          <label for="pilihfoto">Unggah foto dari galeri</label>
                          <div class="input-group">
                            <input
                              type="file"
                              id="pilihfoto"
                              accept="image/*"
                              class="form-control d-none"
                              @change="handleImageUpload"
                              ref="fileInput"
                            />
                            <div class="input-group-append w-100">
                              <button
                                type="button"
                                class="form-control w-100 d-flex align-items-center justify-content-center"
                                @click="triggerFileInput"
                                style="height: 48px"
                              >
                                <i
                                  class="fas fa-image mr-2"
                                  style="color: aliceblue"
                                ></i>
                                Pilih Foto
                              </button>
                            </div>
                          </div>
                          <small
                            class="form-text text-muted w-100"
                            v-if="selectedFileName"
                          >
                            File terpilih: {{ selectedFileName }}
                          </small>
                        </div>

                        <div class="form-group">
                          <label>Ambil Foto dengan Kamera</label><br />
                          <small
                            >Kamera akan diaktifkan untuk mengambil foto
                            kendaraan.</small
                          ><br />
                          <video
                            id="video"
                            width="100%"
                            height="240"
                            autoplay
                            muted
                            playsinline
                            style="margin-top: 10px"
                            v-show="showCamera"
                          ></video
                          ><br />
                          <div style="text-align: center; margin-top: 10px">
                            <button
                              type="button"
                              class="submit-secondary"
                              @click="capturePhoto"
                              v-if="showCamera"
                              style="height: 48px; width: 100%"
                            >
                              <i
                                class="fas fa-camera"
                                style="color: #ffcc00"
                              ></i>
                              Ambil Foto
                            </button>
                            <button
                              type="button"
                              class="submit-secondary"
                              @click="toggleCamera"
                              v-if="!showCamera"
                              style="height: 48px; width: 100%"
                            >
                              <i
                                class="fas fa-video"
                                style="color: #ffcc00"
                              ></i>
                              Aktifkan Kamera
                            </button>
                          </div>
                          <canvas ref="canvas" style="display: none"></canvas>
                        </div>

                        <div class="form-group" v-if="capturedPhoto">
                          <label>Foto yang Diambil:</label>
                          <img
                            :src="capturedPhoto"
                            style="
                              width: 100%;
                              max-height: 200px;
                              object-fit: cover;
                            "
                          />
                        </div>
                      </div>
                    </div>

                    <div id="bottom-wizard">
                      <button type="submit" class="submit">Submit Masuk</button>
                    </div>
                  </form>
                </div>
                <div
                  class="tab-pane fade"
                  id="nav-keluar"
                  role="tabpanel"
                  aria-labelledby="nav-keluar-tab"
                >
                  <form
                    id="form-keluar"
                    @submit.prevent="handleSubmitKeluar"
                    autocomplete="off"
                    style="margin-bottom: 24px; height: 100%; width: 100%"
                  >
                    <input id="website" name="website" type="text" value="" />
                    <div id="middle-wizard">
                      <div class="exit">
                        <h3 class="main_question">
                          <strong>Keluarkan Kendaraan</strong>Harap Masukkan
                          Nomor Tiket Parkir
                        </h3>

                        <div class="form-group">
                          <label for="nomortiketkeluar">Nomor Tiket</label>
                          <input
                            type="number"
                            id="nomortiketkeluar"
                            v-model="formKeluar.nomor_tiket"
                            class="form-control"
                            @input="
                              handleTicketNumberInput(
                                $event,
                                'formKeluar',
                                'nomor_tiket'
                              )
                            "
                            onkeydown="return event.keyCode !== 69"
                            required
                          />
                          <small
                            class="form-text text-muted-colored"
                            style="color: #f5e141"
                          >
                            Masukkan nomor tiket yang sama dengan saat parkir
                            masuk
                          </small>
                        </div>
                      </div>
                    </div>
                    <div id="bottom-wizard">
                      <button type="submit" class="submit">
                        Submit Keluar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row mt-5" v-if="logParkir.length > 0">
          <div class="col-12">
            <h4>Log Parkir Aktif</h4>
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nomor Tiket</th>
                    <th>Plat Nomor</th>
                    <th>Waktu Masuk</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in activeLogParkir" :key="log.id">
                    <td>{{ log.id }}</td>
                    <td>{{ log.nomor_tiket }}</td>
                    <td>{{ log.plat_nomor }}</td>
                    <td>{{ formatDateTime(log.waktu_masuk) }}</td>
                    <td>
                      <span class="badge bg-success">Masih Parkir</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div>
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
            ©2025 Dari OMK untuk Bersama - Dibangun dengan Vue dan Express JS
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>


<script>
// --- Impor File JS Kustom Anda ---
// Pastikan urutan impor JS benar jika ada dependensi
import "../assets/js/jquery-3.7.1.min.js"; // JQuery biasanya diimpor sebelum script lain yang mungkin menggunakannya
import "../assets/js/bootstrap.bundle.min.js"; // Bootstrap JS bundle
import "../assets/js/common_scripts.min.js";
import "../assets/js/functions.js";

import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import Swal from "sweetalert2";
// Import FontAwesome icons
import "@fortawesome/fontawesome-free/css/all.min.css";
// Penting: Anda perlu mengimpor `useRouter` dari 'vue-router'
import { useRouter } from "vue-router";

export default {
  name: "ParkingForm",
  setup() {
    // Inisialisasi router
    const router = useRouter(); 

    const formMasuk = ref({
      nomor_tiket: "",
      plat_nomor: "",
    });

    const formKeluar = ref({
      nomor_tiket: "",
    });

    const videoStream = ref(null);
    const canvas = ref(null);
    const selectedImage = ref(null);
    const selectedFileName = ref("");
    const fileInput = ref(null);
    const showCamera = ref(false);
    const capturedPhoto = ref("");
    const logParkir = ref([]);

    // Get API domain from environment variable or use default
    const API_DOMAIN =
      import.meta.env.VITE_DOMAIN_SERVER || "http://localhost:3000";

    const isFormMasukValid = computed(() => {
      return (
        formMasuk.value.nomor_tiket.trim() !== "" &&
        formMasuk.value.plat_nomor.trim() !== ""
      );
    });

    const isFormKeluarValid = computed(() => {
      return formKeluar.value.nomor_tiket.trim() !== "";
    });

    const activeLogParkir = computed(() => {
      return logParkir.value.filter((log) => !log.waktu_keluar);
    });

    const formatDateTime = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleString("id-ID");
    };

    const handleTicketNumberInput = (event, formName, fieldName) => {
      let value = event.target.value.replace(/\D/g, ""); // Remove non-digits

      // If the current input has 3 digits and the user is trying to type more,
      // prevent the input.
      // This is the core logic to stop input when full.
      if (value.length > 3) {
        value = value.substring(0, 3); // Truncate to 3 digits
      }

      // Pad with leading zeros if less than 3 digits
      // Ensure that if the value is empty, it still becomes "000" or similar,
      // or handle that case based on whether empty input is allowed.
      const paddedValue = value.padStart(3, "0");

      // Update the reactive model
      if (formName === "formMasuk") {
        formMasuk.value[fieldName] = paddedValue;
      } else if (formName === "formKeluar") {
        formKeluar.value[fieldName] = paddedValue;
      }

      // Update the input field directly
      // This ensures the displayed value matches the padded value
      event.target.value = paddedValue;
    };

    const initCamera = async () => {
      console.log("Initializing camera...");
      const video = document.getElementById("video");

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });

          console.log("Camera permission granted, stream active");
          videoStream.value = stream;
          video.srcObject = stream;
          showCamera.value = true;
        } catch (err) {
          console.error("Failed to access camera:", err);
          Swal.fire({
            icon: "error",
            title: "Akses Kamera Gagal",
            text: "Izin kamera ditolak atau tidak tersedia.",
            confirmButtonText: "Tutup",
          });
        }
      } else {
        console.error("getUserMedia API not supported in this browser");
        Swal.fire({
          icon: "error",
          title: "Browser Tidak Didukung",
          text: "Peramban Anda tidak mendukung akses kamera.",
          confirmButtonText: "Tutup",
        });
      }
    };

    const toggleCamera = () => {
      if (showCamera.value) {
        // Stop camera
        if (videoStream.value) {
          videoStream.value.getTracks().forEach((track) => {
            track.stop();
          });
          videoStream.value = null;
        }
        showCamera.value = false;
      } else {
        // Start camera
        initCamera();
      }
    };

    const resizeImage = (canvas, maxWidth = 900, maxHeight = 1200) => {
      const { width, height } = canvas;

      // Calculate new dimensions
      let newWidth = width;
      let newHeight = height;

      if (width > height) {
        if (width > maxWidth) {
          newHeight = (height * maxWidth) / width;
          newWidth = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          newWidth = (width * maxHeight) / height;
          newHeight = maxHeight;
        }
      }

      // Create new canvas with resized dimensions
      const resizedCanvas = document.createElement("canvas");
      const ctx = resizedCanvas.getContext("2d");
      resizedCanvas.width = newWidth;
      resizedCanvas.height = newHeight;

      // Draw resized image
      ctx.drawImage(canvas, 0, 0, newWidth, newHeight);

      return resizedCanvas;
    };

    const capturePhoto = () => {
      console.log("Capturing photo...");
      const video = document.getElementById("video");
      const canvasElement = canvas.value;

      if (video && canvasElement) {
        const context = canvasElement.getContext("2d");
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;
        context.drawImage(
          video,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );

        // Resize image to reduce file size
        // Anda sudah menggunakan 600x800, ini baik untuk orientasi potret.
        // Jika Anda ingin resolusi lebih tinggi, bisa diubah di sini juga.
        const resizedCanvas = resizeImage(canvasElement, 900, 1200);

        // Convert to base64 with higher compression quality (e.g., 0.9 atau 0.95)
        // Perbaikan utama ada di baris ini
        const imageData = resizedCanvas.toDataURL("image/jpeg", 0.9); // <-- Ubah angka ini!
        capturedPhoto.value = imageData;
        selectedImage.value = imageData;

        console.log("Photo captured and compressed successfully");
        console.log("Image size:", Math.round(imageData.length / 1024), "KB");

        Swal.fire({
          icon: "success",
          title: "Foto Berhasil Diambil!",
          text: "Foto kendaraan telah disimpan.",
          confirmButtonText: "OK",
        });
      }
    };

    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          Swal.fire({
            icon: "error",
            title: "File Terlalu Besar",
            text: "Ukuran file maksimal 5MB.",
          });
          return;
        }

        selectedFileName.value = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Create canvas to resize image
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // Calculate new dimensions
            // Konsisten dengan ukuran kamera jika ingin resolusi seragam
            const maxWidth = 600;
            const maxHeight = 800;
            let { width, height } = img;

            if (width > height) {
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            // Perbaikan utama ada di baris ini
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.9); // <-- Ubah angka ini!

            selectedImage.value = compressedDataUrl;
            capturedPhoto.value = compressedDataUrl;

            console.log(
              "Image uploaded and compressed, size:",
              Math.round(compressedDataUrl.length / 1024),
              "KB"
            );
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    };

    const triggerFileInput = () => {
      fileInput.value.click();
    };

    const handleSubmitMasuk = async () => {
      // Existing validation for general form validity
      if (!isFormMasukValid.value) {
        Swal.fire({
          icon: "error",
          title: "Form Tidak Valid",
          text: "Harap isi nomor tiket dan plat nomor kendaraan.",
        });
        return;
      }

      // New validation for "000" ticket number
      if (formMasuk.value.nomor_tiket === "000") {
        Swal.fire({
          icon: "warning",
          title: "Nomor Tiket Tidak Valid",
          text: "Nomor tiket tidak boleh '000'. Harap masukkan nomor tiket yang valid.",
          confirmButtonText: "Tutup",
        });
        return; // Stop the submission
      }

      Swal.fire({
        title: "Memproses...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        // waktu_masuk removed from frontend, will be generated on backend.
        let requestData;
        let requestOptions = {
          method: "POST",
          credentials: "include",
        };

        if (selectedImage.value && selectedImage.value.startsWith("data:")) {
          // For base64 data (camera capture), send as JSON
          console.log(
            "Sending base64 image, size:",
            Math.round(selectedImage.value.length / 1024),
            "KB"
          );

          // Check if image is too large
          if (selectedImage.value.length > 10 * 1024 * 1024) {
            // 10MB limit (ini adalah ukuran string base64, bukan ukuran file biner)
            throw new Error(
              "Gambar terlalu besar. Silakan coba lagi atau gunakan gambar yang lebih kecil."
            );
          }

          requestData = {
            nomor_tiket: formMasuk.value.nomor_tiket.trim().toUpperCase(),
            plat_nomor: formMasuk.value.plat_nomor.trim().toUpperCase(),
            // waktu_masuk is now generated in the backend, no need to send it from frontend
            // waktu_masuk: waktu_masuk, 
            foto_base64: selectedImage.value,
          };

          requestOptions.headers = {
            "Content-Type": "application/json",
          };
          requestOptions.body = JSON.stringify(requestData);
        } else if (fileInput.value && fileInput.value.files[0]) {
          // For file upload, use FormData
          const formData = new FormData();
          formData.append("nomor_tiket", formMasuk.value.nomor_tiket);
          formData.append(
            "plat_nomor",
            formMasuk.value.plat_nomor.trim().toUpperCase()
          );
          // waktu_masuk is now generated in the backend, no need to send it from frontend
          // formData.append("waktu_masuk", waktu_masuk); 
          formData.append("foto_masuk", fileInput.value.files[0]);

          requestOptions.body = formData;
        } else {
          requestData = {
            nomor_tiket: formMasuk.value.nomor_tiket,
            plat_nomor: formMasuk.value.plat_nomor.trim().toUpperCase(),
            // waktu_masuk is now generated in the backend, no need to send it from frontend
            // waktu_masuk: waktu_masuk, 
          };

          requestOptions.headers = {
            "Content-Type": "application/json",
          };
          requestOptions.body = JSON.stringify(requestData);
        }

        console.log(`Sending request to ${API_DOMAIN}/api/parkirMasuk`);

        const response = await fetch(
          `${API_DOMAIN}/api/parkirMasuk`,
          requestOptions
        );

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        let data;

        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await response.json();
        } else {
          // If not JSON, get text to see error message
          const text = await response.text();
          console.error("Non-JSON response:", text);
          throw new Error("Server mengembalikan respons yang tidak valid");
        }

        console.log("Response:", data);

        if (!response.ok) {
          throw new Error(data.error || "Gagal memproses data");
        }

        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Data parkir masuk berhasil ditambahkan.",
        });

        // Reset form
        formMasuk.value.nomor_tiket = "";
        formMasuk.value.plat_nomor = "";
        selectedImage.value = null;
        selectedFileName.value = "";
        capturedPhoto.value = "";

        // Reset file input
        if (fileInput.value) {
          fileInput.value.value = "";
        }

        // Refresh log parkir
        await fetchLogParkir();
      } catch (err) {
        console.error("Error in handleSubmitMasuk:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message,
        });
      }
    };

    const handleSubmitKeluar = async () => {
      if (!isFormKeluarValid.value) {
        Swal.fire({
          icon: "error",
          title: "Form Tidak Valid",
          text: "Harap isi nomor tiket parkir.",
        });
        return;
      }

      Swal.fire({
        title: "Memproses...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        // const waktu_keluar = new Date() // Hapus baris ini
        //   .toISOString()
        //   .slice(0, 19)
        //   .replace("T", " ");

        const requestData = {
          nomor_tiket: formKeluar.value.nomor_tiket.trim().toUpperCase(),
          // waktu_keluar: waktu_keluar, // Hapus pengiriman waktu_keluar dari frontend
        };

        console.log(
          `Sending request to ${API_DOMAIN}/api/parkirKeluar:`,
          requestData
        );

        const response = await fetch(`${API_DOMAIN}/api/parkirKeluar`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        const data = await response.json();
        console.log("Response:", data);

        if (!response.ok) {
          throw new Error(data.error || "Gagal memproses data");
        }

        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Waktu keluar berhasil dicatat.",
        });

        // Reset form
        formKeluar.value.nomor_tiket = "";

        // Refresh log parkir
        await fetchLogParkir();
      } catch (err) {
        console.error("Error in handleSubmitKeluar:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message,
        });
      }
    };

    const fetchLogParkir = async () => {
      try {
        console.log(`Fetching log parkir from ${API_DOMAIN}/api/logparkir...`);
        const response = await fetch(`${API_DOMAIN}/api/logparkir`);

        if (response.ok) {
          const data = await response.json();
          logParkir.value = data;
          console.log("Log parkir fetched:", data);
        } else {
          console.error("Failed to fetch log parkir");
        }
      } catch (err) {
        console.error("Error fetching log parkir:", err);
      }
    };

    onMounted(() => {
      console.log("Component mounted");
      console.log("API Domain:", API_DOMAIN);
      document.body.classList.add("style_2");

      fetchLogParkir();

      const tabElms = document.querySelectorAll(
        "#nav-masuk-tab, #nav-keluar-tab"
      ); 
      tabElms.forEach((tab) => {
        tab.addEventListener("click", function (event) {
          event.preventDefault();

          if (videoStream.value) {
            videoStream.value.getTracks().forEach((track) => {
              track.stop();
            });
            videoStream.value = null;
            showCamera.value = false;
          }
        });
      });

      window.addEventListener("load", () => {
        console.log("Window loaded");
        const loader = document.querySelector('[data-loader="circle-side"]');
        if (loader) {
          loader.style.display = "none";
        }

        const loaderForm = document.getElementById("loader_form");
        if (loaderForm) {
          loaderForm.style.display = "none";
        }

        document.body.style.overflow = "visible";
      });
    });

    onBeforeUnmount(() => {
      console.log("Component unmounting");
      document.body.classList.remove("style_2");

      if (videoStream.value) {
        videoStream.value.getTracks().forEach((track) => {
          track.stop();
        });
      }
    });

    return {
      formMasuk,
      formKeluar,
      canvas,
      fileInput,
      selectedFileName,
      showCamera,
      capturedPhoto,
      logParkir,
      activeLogParkir,
      isFormMasukValid,
      isFormKeluarValid,
      handleImageUpload,
      triggerFileInput,
      toggleCamera,
      capturePhoto,
      handleSubmitMasuk,
      handleSubmitKeluar,
      formatDateTime,
      handleTicketNumberInput,
      // Tidak perlu mengekspos `router` jika hanya digunakan di `setup`
      // Anda bisa menambahkannya jika ada logika navigasi lain di template atau metode lain.
    };
  },
};
</script>

<style scoped>
.text-success {
  color: #28a745;
}
.text-danger {
  color: #dc3545;
}
.mr-2 {
  margin-right: 0.5rem;
}
.w-100 {
  width: 100%;
}
.d-none {
  display: none;
}
.d-flex {
  display: flex;
}
.align-items-center {
  align-items: center;
}
.justify-content-center {
  justify-content: center;
}
.table-responsive {
  margin-top: 1rem;
}
.badge {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
}
.bg-success {
  background-color: #28a745 !important;
  color: white;
}
.submit-secondary {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}
.submit-secondary:hover {
  background-color: #5a6268;
}
/* Sembunyikan panah atas/bawah untuk browser WebKit (Chrome, Safari, Edge) */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Sembunyikan panah atas/bawah untuk Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}

/* Base style for the image - applies to all screen sizes initially */
.sipatuh-long-logo {
  max-width: 100%; /* <-- Changed this! */
  height: auto;
  display: block;
  position: relative;
  margin-left: auto;
  margin-right: auto;
  left: 0;
}

/* Styles for screens LARGER than 991px (desktop) */
@media (min-width: 992px) { /* Changed to min-width for desktop-first approach */
  .sipatuh-long-logo {
    margin-left: 0; /* Override auto-centering */
    margin-right: auto;
    left: -7%; /* Shift 30px to the left */
  }
}

/* Optional: If you explicitly want to ensure centering on smaller screens, 
   though the base style handles it. This can be useful for clarity or if 
   other styles might interfere. */
@media (max-width: 991.98px) {
  .sipatuh-long-logo {
    margin-left: auto;
    margin-right: auto;
    left: 0; /* Reset left property when centering */
  }
}
</style>