import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// KONFIGURASI FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDQ8ZLsK7mywN4tgQRHiL7UUitaQoUcazc",
  authDomain: "bendahara-life-541f5.firebaseapp.com",
  projectId: "bendahara-life-541f5",
  storageBucket: "bendahara-life-541f5.firebasestorage.app",
  messagingSenderId: "27175976100",
  appId: "1:27175976100:web:bd09ea38e22125955f7a31",
  measurementId: "G-XWMVDD6CKP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const namaBulan = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                   "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

let dataSiswa = {};
let dataPemasukan = [];
let dataPengeluaran = [];

// SISTEM NOTIFIKASI & ALERT
function showToast(type, title, message) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = '';
  if (type === 'success') icon = '✓';
  else if (type === 'error') icon = '✕';
  else if (type === 'info') icon = 'ℹ';
  
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <span class="toast-close" onclick="this.parentElement.remove()">×</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function showAlert(type, title, message, showCancel = false) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("alertOverlay");
    const header = document.getElementById("alertHeader");
    const icon = document.getElementById("alertIcon");
    const titleEl = document.getElementById("alertTitle");
    const body = document.getElementById("alertBody");
    const okBtn = document.getElementById("alertOkBtn");
    const cancelBtn = document.getElementById("alertCancelBtn");
    
    let iconClass = '';
    if (type === 'success') iconClass = 'fas fa-check-circle';
    else if (type === 'error') iconClass = 'fas fa-times-circle';
    else if (type === 'info') iconClass = 'fas fa-info-circle';
    else if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';
    
    header.className = `alert-header ${type}`;
    icon.className = `alert-header-icon ${iconClass}`;
    titleEl.textContent = title;
    body.textContent = message;
    
    if (showCancel) {
      cancelBtn.style.display = 'block';
    } else {
      cancelBtn.style.display = 'none';
    }
    
    overlay.style.display = 'block';
    
    okBtn.onclick = () => {
      overlay.style.display = 'none';
      resolve(true);
    };
    
    cancelBtn.onclick = () => {
      overlay.style.display = 'none';
      resolve(false);
    };
    
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
        resolve(false);
      }
    };
  });
}

// FUNGSI MODAL
window.bukaModalPemasukan = function() {
  document.getElementById("modalPemasukan").style.display = "block";
  document.getElementById("modalTitle").innerHTML = '<i class="fas fa-plus-circle"></i> Input Pemasukan';
  document.getElementById("btnSimpanPemasukan").innerHTML = '<i class="fas fa-save"></i> Simpan Pemasukan';
  document.getElementById("btnSimpanPemasukan").onclick = window.tambahPemasukan;
  
  // Reset form untuk mode tambah
  delete window.editingPemasukanId;
};

window.tutupModalPemasukan = function() {
  document.getElementById("modalPemasukan").style.display = "none";
};

window.bukaModalPengeluaran = function() {
  document.getElementById("modalPengeluaran").style.display = "block";
};

window.tutupModalPengeluaran = function() {
  document.getElementById("modalPengeluaran").style.display = "none";
};

window.onclick = function(event) {
  const modalPemasukan = document.getElementById("modalPemasukan");
  const modalPengeluaran = document.getElementById("modalPengeluaran");
  
  if (event.target === modalPemasukan) {
    modalPemasukan.style.display = "none";
  }
  if (event.target === modalPengeluaran) {
    modalPengeluaran.style.display = "none";
  }
};

// LOAD DATA SISWA
function loadSiswa() {
  const q = query(collection(db, "siswa"));
  onSnapshot(q, (snapshot) => {
    const siswaSelect = document.getElementById("siswaSelect");
    siswaSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>';
    
    dataSiswa = {};
    const siswaArray = [];
    
    snapshot.forEach((docSnap) => {
      const siswa = docSnap.data();
      dataSiswa[docSnap.id] = siswa.nama;
      siswaArray.push({ id: docSnap.id, nama: siswa.nama });
    });
    
    // Urutkan berdasarkan abjad
    siswaArray.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
    
    siswaArray.forEach(siswa => {
      const option = document.createElement("option");
      option.value = siswa.id;
      option.textContent = siswa.nama;
      siswaSelect.appendChild(option);
    });

    console.log("Data siswa:", dataSiswa);
    renderPemasukan();
  }, (error) => {
    console.error("Error loading siswa:", error);
  });
}

// LOAD PEMASUKAN
function loadPemasukan() {
  const q = query(collection(db, "pemasukan"));
  onSnapshot(q, (snapshot) => {
    dataPemasukan = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      dataPemasukan.push({
        id: docSnap.id,
        ...data
      });
    });
    
    console.log("Total pemasukan dimuat:", dataPemasukan.length);
    renderPemasukan();
    hitungTotal();
  }, (error) => {
    console.error("Error loading pemasukan:", error);
  });
}

// RENDER TABEL PEMASUKAN
function renderPemasukan(filterBulan = "", filterTahun = "", searchNama = "") {
  const tbody = document.getElementById("pemasukanBody");
  
  if (Object.keys(dataSiswa).length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="loading">
          <i class="fas fa-spinner fa-spin"></i> Memuat data siswa...
        </td>
      </tr>`;
    return;
  }
  
  // Tentukan bulan dan tahun yang akan ditampilkan
  const now = new Date();
  const bulanTampil = filterBulan ? parseInt(filterBulan) : now.getMonth() + 1;
  const tahunTampil = filterTahun ? parseInt(filterTahun) : now.getFullYear();
  
  // Group data pemasukan
  const grouped = {};
  dataPemasukan.forEach(item => {
    if (filterBulan && item.bulan != filterBulan) return;
    if (filterTahun && item.tahun != filterTahun) return;
    
    const key = `${item.siswaId}-${item.bulan}-${item.tahun}`;
    if (!grouped[key]) {
      grouped[key] = {
        siswaId: item.siswaId,
        bulan: item.bulan,
        tahun: item.tahun,
        minggu: {}
      };
    }
    grouped[key].minggu[item.minggu] = {
      id: item.id,
      jumlah: item.jumlah,
      keterangan: item.keterangan
    };
  });
  
  // Simpan grouped data untuk diakses nanti
  window.groupedPemasukanData = grouped;

  // Urutkan semua siswa berdasarkan abjad
  const sortedSiswaIds = Object.keys(dataSiswa).sort((a, b) => {
    return dataSiswa[a].localeCompare(dataSiswa[b], 'id');
  });

  let html = "";
  let hasMatchingStudent = false;
  
  // Loop semua siswa dan tampilkan semua (baik ada data maupun tidak)
  sortedSiswaIds.forEach(siswaId => {
    const namaSiswa = dataSiswa[siswaId];
    
    // Filter berdasarkan pencarian nama
    if (searchNama && !namaSiswa.toLowerCase().includes(searchNama.toLowerCase())) {
      return;
    }
    
    hasMatchingStudent = true;
    
    // Cari data pemasukan siswa ini untuk bulan dan tahun yang ditampilkan
    const key = `${siswaId}-${bulanTampil}-${tahunTampil}`;
    const group = grouped[key];
    
    let total = 0;
    
    html += `<tr>`;
    html += `<td>${namaSiswa}</td>`;
    html += `<td>${namaBulan[bulanTampil]}</td>`;
    html += `<td>${tahunTampil}</td>`;
    
    // Loop untuk minggu 1-4
    for (let m = 1; m <= 4; m++) {
      const mingguData = group ? group.minggu[m] : null;
      
      if (mingguData) {
        const keterangan = mingguData.keterangan || "";
        const klass = keterangan === "lunas" ? "lunas" : "belumLunas";
        html += `<td class="${klass}">Rp ${mingguData.jumlah.toLocaleString('id-ID')}</td>`;
        total += mingguData.jumlah;
      } else {
        html += `<td>-</td>`;
      }
    }
    
    html += `<td style="font-weight:bold">Rp ${total.toLocaleString('id-ID')}</td>`;
    html += `</tr>`;
  });
  
  // Jika tidak ada siswa yang cocok dengan pencarian
  if (!hasMatchingStudent) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <i class="fas fa-search"></i>
          <p>Tidak ada siswa yang sesuai dengan pencarian "${searchNama}"</p>
        </td>
      </tr>`;
    return;
  }
  
  tbody.innerHTML = html;
}

// FILTER PEMASUKAN
window.filterPemasukan = function() {
  const bulan = document.getElementById("filterBulan").value;
  const tahun = document.getElementById("filterTahun").value;
  const searchNama = document.getElementById("searchNama").value.trim();
  renderPemasukan(bulan, tahun, searchNama);
};

// LOAD PENGELUARAN
function loadPengeluaran() {
  const q = query(collection(db, "pengeluaran"));
  onSnapshot(q, (snapshot) => {
    dataPengeluaran = [];
    const tbody = document.getElementById("pengeluaranBody");
    
    if (snapshot.empty) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>Belum ada data pengeluaran</p>
          </td>
        </tr>`;
      hitungTotal();
      return;
    }

    let html = "";
    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      dataPengeluaran.push({ id: docSnap.id, ...item });
      
      const tanggal = item.tanggal?.toDate 
        ? item.tanggal.toDate().toLocaleDateString('id-ID')
        : new Date().toLocaleDateString('id-ID');
      
      html += `
        <tr>
          <td style="text-align:left">${item.keterangan || '-'}</td>
          <td>Rp ${(item.jumlah || 0).toLocaleString('id-ID')}</td>
          <td>${tanggal}</td>
          <td>
            <button class="btn-delete" onclick="hapusPengeluaran('${docSnap.id}')">
              <i class="fas fa-trash"></i> Hapus
            </button>
          </td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
    hitungTotal();
  }, (error) => {
    console.error("Error loading pengeluaran:", error);
  });
}

// TAMBAH/UPDATE PEMASUKAN
window.tambahPemasukan = async function() {
  const siswaId = document.getElementById("siswaSelect").value;
  const bulan = parseInt(document.getElementById("bulanMasuk").value);
  const tahun = parseInt(document.getElementById("tahunMasuk").value);
  const minggu = parseInt(document.getElementById("mingguMasuk").value);
  const jumlah = parseInt(document.getElementById("jumlahMasuk").value);
  
  // LOGIC OTOMATIS: Tentukan keterangan berdasarkan jumlah
  const keterangan = jumlah >= 5000 ? "lunas" : "belumLunas";

  if (!siswaId || !jumlah) {
    showAlert('warning', 'Perhatian!', 'Mohon lengkapi semua field!');
    return;
  }

  try {
    // Cek apakah mode edit atau tambah
    if (window.editingPemasukanId) {
      // Mode EDIT - Update dokumen yang ada
      await updateDoc(doc(db, "pemasukan", window.editingPemasukanId), {
        siswaId: siswaId,
        bulan: bulan,
        tahun: tahun,
        minggu: minggu,
        jumlah: jumlah,
        keterangan: keterangan,
        tanggalUpdate: new Date()
      });

      const namaSiswa = dataSiswa[siswaId] || 'Siswa';
      const statusText = keterangan === "lunas" ? "LUNAS" : "BELUM LUNAS";
      showToast('success', 'Berhasil Diupdate!', `Data pemasukan ${namaSiswa} minggu ${minggu} telah diperbarui (${statusText})`);
      
      delete window.editingPemasukanId;
    } else {
      // Mode TAMBAH - Buat dokumen baru
      await addDoc(collection(db, "pemasukan"), {
        siswaId: siswaId,
        bulan: bulan,
        tahun: tahun,
        minggu: minggu,
        jumlah: jumlah,
        keterangan: keterangan,
        tanggal: new Date()
      });

      const namaSiswa = dataSiswa[siswaId] || 'Siswa';
      const statusText = keterangan === "lunas" ? "LUNAS ✓" : "BELUM LUNAS ✗";
      showToast('success', 'Pemasukan Berhasil!', `Data pemasukan ${namaSiswa} minggu ${minggu} sebesar Rp ${jumlah.toLocaleString('id-ID')} (${statusText})`);
    }
    
    // Reset hanya jumlah, biarkan siswa tetap terpilih
    document.getElementById("jumlahMasuk").value = "5000";
    
    // Tutup modal setelah berhasil
    window.tutupModalPemasukan();
  } catch (error) {
    console.error("Error menyimpan pemasukan:", error);
    showAlert('error', 'Gagal!', 'Gagal menyimpan pemasukan: ' + error.message);
  }
};

// TAMBAH PENGELUARAN
window.tambahPengeluaran = async function() {
  const jumlah = parseInt(document.getElementById("jumlahKeluar").value);
  const keterangan = document.getElementById("keteranganKeluar").value.trim();

  if (!keterangan || !jumlah || jumlah <= 0) {
    showAlert('warning', 'Perhatian!', 'Mohon isi keterangan dan jumlah dengan benar!');
    return;
  }

  try {
    await addDoc(collection(db, "pengeluaran"), {
      keterangan: keterangan,
      jumlah: jumlah,
      tanggal: new Date()
    });

    showToast('success', 'Pengeluaran Berhasil!', `Pengeluaran "${keterangan}" sebesar Rp ${jumlah.toLocaleString('id-ID')} telah ditambahkan`);
    
    document.getElementById("jumlahKeluar").value = "";
    document.getElementById("keteranganKeluar").value = "";
    window.tutupModalPengeluaran();
  } catch (error) {
    console.error("Error menambah pengeluaran:", error);
    showAlert('error', 'Gagal!', 'Gagal menambah pengeluaran: ' + error.message);
  }
};

// HAPUS PENGELUARAN
window.hapusPengeluaran = async function(id) {
  const confirmed = await showAlert('warning', 'Konfirmasi Hapus', 
    'Yakin ingin menghapus pengeluaran ini? Tindakan ini tidak dapat dibatalkan.', true);
  
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, "pengeluaran", id));
    showToast('success', 'Berhasil Dihapus!', 'Data pengeluaran telah dihapus dari sistem');
  } catch (error) {
    console.error("Error menghapus pengeluaran:", error);
    showAlert('error', 'Gagal!', 'Gagal menghapus pengeluaran: ' + error.message);
  }
};

// HITUNG TOTAL
function hitungTotal() {
  let totalMasuk = 0;
  let totalKeluar = 0;

  dataPemasukan.forEach(item => {
    totalMasuk += item.jumlah || 0;
  });

  dataPengeluaran.forEach(item => {
    totalKeluar += item.jumlah || 0;
  });

  const saldo = totalMasuk - totalKeluar;

  document.getElementById("totalMasuk").innerText = `Rp ${totalMasuk.toLocaleString('id-ID')}`;
  document.getElementById("totalKeluar").innerText = `Rp ${totalKeluar.toLocaleString('id-ID')}`;
  document.getElementById("saldoAkhir").innerText = `Rp ${saldo.toLocaleString('id-ID')}`;
}

// INISIALISASI
function init() {
  const now = new Date();
  const bulanSekarang = now.getMonth() + 1;
  const tahunSekarang = now.getFullYear();
  
  document.getElementById("bulanMasuk").value = bulanSekarang;
  document.getElementById("tahunMasuk").value = tahunSekarang;
  
  loadSiswa();
  loadPemasukan();
  loadPengeluaran();
}

init();