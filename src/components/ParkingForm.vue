<template>
  <header>
    <div class="container-fluid">
      <div class="row">
        <div class="col-5">
          <a href="#">
            <img
              src="/src/assets/img/LogoSipatuhSmall_WH_BG.svg"
              alt=""
              width="75"
              height="75"
            />
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
                parkir OMK(Orang Muda Katolik Cicurug) dengan kemampuan untuk
                mencatat setiap kendaraan yang masuk dan keluar secara akurat,
                memantau pendapatan parkir secara transparan, serta menjaga
                efisiensi pengelolaan tiket. Dengan SIPATUH, terciptalah sistem
                parkir yang lebih aman, teratur, dan memberikan ketenangan bagi
                jemaat dan pengelola.
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
                    <input
                      id="website"
                      name="website"
                      type="text"
                      value=""
                      style="display: none"
                    />

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
                            @input="handlePlatNomorInput"
                            class="form-control"
                            placeholder="Contoh: B 1234 AAA"
                            required
                          />
                        </div>
                        <div v-if="isSearching" class="search-status">
                          <span>Mencari...</span>
                        </div>
                        <ul
                          v-if="searchResults.length > 0"
                          class="list-group search-results"
                        >
                          <li
                            v-for="plat in searchResults"
                            :key="plat"
                            @click="selectPlatNomor(plat)"
                            class="list-group-item list-group-item-action"
                            style="cursor: pointer"
                          >
                            {{ plat }}
                          </li>
                        </ul>

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
                            height="auto"
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
                              @click="initCamera"
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
                              max-height: auto;
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
                    <input
                      id="website"
                      name="website"
                      type="text"
                      value=""
                      style="display: none"
                    />
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
import "../assets/js/jquery-3.7.1.min.js";
import "../assets/js/bootstrap.bundle.min.js";
import "../assets/js/common_scripts.min.js";
import "../assets/js/functions.js";

import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import Swal from "sweetalert2";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "vue-router";

export default {
  name: "ParkingForm",
  setup() {
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

    const searchResults = ref([]);
    const isSearching = ref(false);

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

    const handleTicketNumberInput = (event, formName, fieldName) => {
      let value = event.target.value.replace(/\D/g, "");

      if (value.length > 3) {
        value = value.substring(0, 3);
      }
      const paddedValue = value.padStart(3, "0");

      if (formName === "formMasuk") {
        formMasuk.value[fieldName] = paddedValue;
      } else if (formName === "formKeluar") {
        formKeluar.value[fieldName] = paddedValue;
      }
      event.target.value = paddedValue;
    };

let searchTimeout = null;

    const handlePlatNomorInput = (event) => {
      let value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      let formattedValue = "";

      let part1 = "";
      let part2 = "";
      let part3 = "";

      let i = 0;

      // Bagian Huruf Depan (maksimal 2)
      while (i < value.length && /[A-Z]/.test(value[i]) && part1.length < 2) {
        part1 += value[i];
        i++;
      }

      // Bagian Angka (maksimal 4)
      while (i < value.length && /[0-9]/.test(value[i]) && part2.length < 4) {
        part2 += value[i];
        i++;
      }

      // Bagian Huruf Belakang (maksimal 3)
      while (i < value.length && /[A-Z]/.test(value[i]) && part3.length < 3) {
        part3 += value[i];
        i++;
      }

      // Membentuk string dengan spasi
      formattedValue = part1;
      if (part2.length > 0) {
        formattedValue += " " + part2;
      } else if (part1.length > 0) {
        formattedValue += part2;
      }

      if (part3.length > 0) {
        if (part2.length > 0 || part1.length === 2) {
          formattedValue += " " + part3;
        } else {
          formattedValue += part3;
        }
      }

      formMasuk.value.plat_nomor = formattedValue.trim();

      nextTick(() => {
        const input = event.target;
        const caretPos = formMasuk.value.plat_nomor.length;
        input.setSelectionRange(caretPos, caretPos);
      });

      // Clear previous timeout to avoid multiple searches
      clearTimeout(searchTimeout);

      if (formattedValue.trim().length >= 1) {
        isSearching.value = true;
        searchTimeout = setTimeout(async () => {
          try {
            const response = await fetch(
              `${API_DOMAIN}/api/searchPlatNomor?query=${formattedValue.trim()}`,
              {
                method: "GET",
                credentials: "include",
              }
            );

            const data = await response.json();
            if (response.ok) {
              searchResults.value = data; // Assuming the API returns an array of matching plates
            } else {
              console.error("Search API error:", data.error);
              searchResults.value = [];
            }
          } catch (err) {
            console.error("Failed to fetch search results:", err);
            searchResults.value = [];
          } finally {
            isSearching.value = false;
          }
        }, 500); // 500ms debounce
      } else {
        searchResults.value = [];
        isSearching.value = false;
      }
    };

    const selectPlatNomor = (plat) => {
      formMasuk.value.plat_nomor = plat;
      searchResults.value = []; // Hide the results list
    };

    const isPlatNomorValid = computed(() => {
      const platNomor = formMasuk.value.plat_nomor.trim();
      const regex = /^[A-Z]{1,2}\s\d{1,4}\s[A-Z]{1,3}$/;
      return regex.test(platNomor);
    });

    const initCamera = async () => {
      console.log("Initializing camera...");
      const video = document.getElementById("video");

      if (videoStream.value) {
        stopCamera();
      }

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
          showCamera.value = false;
          Swal.fire({
            icon: "error",
            title: "Akses Kamera Gagal",
            text: "Izin kamera ditolak atau tidak tersedia. Anda bisa mencoba lagi.",
            confirmButtonText: "Tutup",
          });
        }
      } else {
        console.error("getUserMedia API not supported in this browser");
        showCamera.value = false;
        Swal.fire({
          icon: "error",
          title: "Browser Tidak Didukung",
          text: "Peramban Anda tidak mendukung akses kamera.",
          confirmButtonText: "Tutup",
        });
      }
    };

    const stopCamera = () => {
      if (videoStream.value) {
        videoStream.value.getTracks().forEach((track) => {
          track.stop();
        });
        videoStream.value = null;
      }
      showCamera.value = false;
      capturedPhoto.value = "";
      selectedImage.value = null;
    };

    const resizeImage = (canvasElement, maxWidth = 900, maxHeight = 1200) => {
      const { width: originalWidth, height: originalHeight } = canvasElement;

      let newWidth = originalWidth;
      let newHeight = originalHeight;

      if (originalWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = (originalHeight * maxWidth) / originalWidth;
      }

      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = (originalWidth * maxHeight) / originalHeight;
      }

      const resizedCanvas = document.createElement("canvas");
      const ctx = resizedCanvas.getContext("2d");
      resizedCanvas.width = newWidth;
      resizedCanvas.height = newHeight;
      ctx.drawImage(
        canvasElement,
        0,
        0,
        originalWidth,
        originalHeight,
        0,
        0,
        newWidth,
        newHeight
      );

      return resizedCanvas;
    };

    const capturePhoto = () => {
      console.log("Capturing photo...");
      const video = document.getElementById("video");
      const canvasElement = canvas.value;

      if (video && canvasElement) {
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;

        const context = canvasElement.getContext("2d");
        context.drawImage(
          video,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );

        const resizedCanvas = resizeImage(canvasElement, 900, 1200);
        const imageData = resizedCanvas.toDataURL("image/jpeg", 0.9);
        capturedPhoto.value = imageData;
        selectedImage.value = imageData;

        console.log("Photo captured and compressed successfully");
        console.log(
          "Original capture size:",
          canvasElement.width,
          "x",
          canvasElement.height
        );
        console.log(
          "Resized image size:",
          resizedCanvas.width,
          "x",
          resizedCanvas.height
        );
        console.log(
          "Image data length:",
          Math.round(imageData.length / 1024),
          "KB"
        );

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
        if (file.size > 5 * 1024 * 1024) {
          Swal.fire({
            icon: "error",
            title: "File Terlalu Besar",
            text: "Ukuran file maksimal 5MB.",
          });
          event.target.value = "";
          selectedFileName.value = "";
          selectedImage.value = null;
          capturedPhoto.value = "";
          return;
        }

        selectedFileName.value = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvasElement = document.createElement("canvas");
            const ctx = canvasElement.getContext("2d");

            const maxWidth = 900;
            const maxHeight = 1200;
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

            canvasElement.width = width;
            canvasElement.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvasElement.toDataURL(
              "image/jpeg",
              0.9
            );

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
      if (!isFormMasukValid.value) {
        Swal.fire({
          icon: "error",
          title: "Form Tidak Valid",
          text: "Harap isi nomor tiket dan plat nomor kendaraan.",
        });
        return;
      }

      if (formMasuk.value.nomor_tiket === "000") {
        Swal.fire({
          icon: "warning",
          title: "Nomor Tiket Tidak Valid",
          text: "Nomor tiket tidak boleh '000'. Harap masukkan nomor tiket yang valid.",
          confirmButtonText: "Tutup",
        });
        return;
      }

      const platNomorRaw = formMasuk.value.plat_nomor.trim();
      
      Swal.fire({
        title: "Memproses...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        let requestData;
        let requestOptions = {
          method: "POST",
          credentials: "include",
        };

        if (selectedImage.value) {
          if (selectedImage.value.startsWith("data:")) {
            if (selectedImage.value.length > 10 * 1024 * 1024) {
              throw new Error(
                "Ukuran gambar terlalu besar. Silakan coba lagi atau gunakan gambar yang lebih kecil."
              );
            }

            requestData = {
              nomor_tiket: formMasuk.value.nomor_tiket.trim().toUpperCase(),
              plat_nomor: platNomorRaw.toUpperCase(),
              foto_base64: selectedImage.value,
            };

            requestOptions.headers = {
              "Content-Type": "application/json",
            };
            requestOptions.body = JSON.stringify(requestData);
          } else {
            const formData = new FormData();
            formData.append("nomor_tiket", formMasuk.value.nomor_tiket);
            formData.append("plat_nomor", platNomorRaw.toUpperCase());
            formData.append("foto_masuk", fileInput.value.files[0]);
            requestOptions.body = formData;
          }
        } else {
          requestData = {
            nomor_tiket: formMasuk.value.nomor_tiket.trim().toUpperCase(),
            plat_nomor: platNomorRaw.toUpperCase(),
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

        const contentType = response.headers.get("content-type");
        let data;

        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
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

        formMasuk.value.nomor_tiket = "";
        formMasuk.value.plat_nomor = "";
        selectedImage.value = null;
        selectedFileName.value = "";
        capturedPhoto.value = "";
        if (fileInput.value) {
          fileInput.value.value = "";
        }
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

      try {
        const nomor_tiket_formatted = formKeluar.value.nomor_tiket
          .trim()
          .toUpperCase();
        const checkResponse = await fetch(
          `${API_DOMAIN}/api/parkirKeluarCheck/${nomor_tiket_formatted}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const parkingData = await checkResponse.json();

        if (!checkResponse.ok) {
          throw new Error(
            parkingData.error ||
              "Nomor tiket tidak ditemukan atau sudah keluar."
          );
        }

        Swal.fire({
          title: "Konfirmasi Pengeluaran Kendaraan",
          html: `
            <p style="margin-top:0px; margin-bottom:4px;"><strong>Nomor Tiket:</strong> ${parkingData.nomor_tiket}</p>
            <p style="margin-top:0px; margin-bottom:4px;"><strong>Plat Nomor:</strong> ${parkingData.plat_nomor}</p>
            <img src="${parkingData.foto_masuk}" alt="Foto Kendaraan" style="max-width: 100%; height: auto; border-radius: 8px; margin-top: 4px; margin-bottom:4px;">
            <p style="margin-top:0px; margin-bottom:4px;">Apakah Anda yakin ingin mengeluarkan kendaraan ini?</p>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#fc0",
          cancelButtonColor: "#d33",
          confirmButtonText: "Ya, Keluarkan!",
          cancelButtonText: "Batal",
          showLoaderOnConfirm: true,
          preConfirm: async () => {
            try {
              const requestData = {
                nomor_tiket: nomor_tiket_formatted,
              };

              const response = await fetch(`${API_DOMAIN}/api/parkirKeluar`, {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || "Gagal memproses data");
              }

              return data;
            } catch (error) {
              Swal.showValidationMessage(`Permintaan gagal: ${error.message}`);
            }
          },
          allowOutsideClick: () => !Swal.isLoading(),
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              icon: "success",
              title: "Berhasil",
              text: "Waktu keluar berhasil dicatat.",
            });
            formKeluar.value.nomor_tiket = "";
          }
        });
      } catch (err) {
        console.error("Error in handleSubmitKeluar:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message,
        });
      }
    };

    onMounted(() => {
      console.log("Component mounted");
      console.log("API Domain:", API_DOMAIN);
      document.body.classList.add("style_2");

      initCamera();

      const tabElms = document.querySelectorAll(
        "#nav-keluar-tab, #nav-dashboard-tab"
      );
      tabElms.forEach((tab) => {
        tab.addEventListener("shown.bs.tab", stopCamera);
      });

      window.addEventListener("load", () => {
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
      searchResults,
      isSearching,
      isFormMasukValid,
      isFormKeluarValid,
      handleImageUpload,
      triggerFileInput,
      initCamera,
      capturePhoto,
      handleSubmitMasuk,
      handleSubmitKeluar,
      handleTicketNumberInput,
      handlePlatNomorInput,
      selectPlatNomor,
    };
  },
};
</script>

<style scoped>
/* Scoped styles ensure these only apply to this component */
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
/* Removed .table-responsive and .badge styles as the table is no longer in the template */

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

/* Hide spin buttons for number input */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}

/* SIPATUH Logo responsiveness */
.sipatuh-long-logo {
  max-width: 100%;
  height: auto;
  display: block;
  position: relative;
  margin-left: auto;
  margin-right: auto;
  left: 0;
}

@media (min-width: 992px) {
  .sipatuh-long-logo {
    margin-left: 0;
    margin-right: auto;
    left: -7%;
  }
}

@media (max-width: 991.98px) {
  .sipatuh-long-logo {
    margin-left: auto;
    margin-right: auto;
    left: 0;
  }
}
</style>
