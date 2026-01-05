
const siswa = [
  "Aksan Maulana Arafat",
  "Aldyno Rahmat Hidayat",
  "Aliffia Syifa Ramadhania",
  "Alipa Sundari",
  "Amalia Hafiza",
  "Annisa Salsabila",
  "Asep Permadi",
  "Ayu Zahara Hasmah",
  "Canthika Abbye Zetta",
  "Cantika Kurniawan",
  "Chyntia Dwita Nababan",
  "Citra Hidayani",
  "Citra Lestari",
  "Claudya Putri Wardhani",
  "Destania Zia Amalina",
  "Devina Fauziah Febriani",
  "Fatih Fadhilah Rafif",
  "Gerrard Angga Kusuma",
  "Ghaitsa Zahira",
  "Karina Febriyanti",
  "Keyla Nurul Putri",
  "Khafifah Anggini",
  "Laisa Azzahra",
  "Luthfi Nurjanah",
  "Muhammad Noval",
  "Nabilah Rizqullah",
  "Nadia Safinatunnazah",
  "Nanda Aprillia",
  "Nasylia Astin Wijaya",
  "Oby Aprilian Pratama",
  "Puput Puspitha Arum",
  "Putra Yuddha Pratama",
  "Rahmat Muzaki",
  "Raihan Nauval",
  "Recha Alvina Setya",
  "Regina Putria Salsa Bila",
  "Reifa Yais Siti Aisyah",
  "Reshifa",
  "Riska Salsabila",
  "Runica Zeslin Setiadi",
  "Salma Nurfariza",
  "Sheila Aulia Mardiansyah",
  "Silmy Sesi Kania",
  "Sitorus, Maria Keren",
  "Sofwa Unada",
  "Suci Putri Lestari",
  "Thenu, Jonathan Mark",
  "Tiara Ardia Pramesti",
  "Zahra Enda Oktavia",
  "Zahratul Hikmah Sarah Faoziah"
];

const kasPerMinggu = 3000;
let totalKas = 0;

const tbody = document.getElementById("tbody");
const totalEl = document.getElementById("total");
const keluarBody = document.getElementById("keluarBody");

// =======================
// TABEL KAS MASUK
// =======================
siswa.forEach(nama => {
  const tr = document.createElement("tr");

  const tdNama = document.createElement("td");
  tdNama.innerText = nama;
  tr.appendChild(tdNama);

  for (let i = 1; i <= 15; i++) {
    const td = document.createElement("td");

    td.onclick = () => {
      if (td.classList.contains("bayar")) {
        td.classList.remove("bayar");
        td.innerText = "";
        totalKas -= kasPerMinggu;
      } else {
        td.classList.add("bayar");
        td.innerText = "✔";
        totalKas += kasPerMinggu;
      }
      totalEl.innerText = totalKas;
    };

    tr.appendChild(td);
  }

  tbody.appendChild(tr);
});

// =======================
// PENGELUARAN
// =======================
function tambahPengeluaran() {
  const ket = document.getElementById("ket").value;
  const keluar = parseInt(document.getElementById("keluar").value);

  if (!ket || !keluar) {
    alert("ISI KETERANGAN & JUMLAH!");
    return;
  }

  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${ket}</td>
    <td>Rp ${keluar}</td>
    <td><button onclick="hapusPengeluaran(this, ${keluar})">Hapus</button></td>
  `;

  keluarBody.appendChild(tr);

  totalKas -= keluar;
  totalEl.innerText = totalKas;

  document.getElementById("ket").value = "";
  document.getElementById("keluar").value = "";
}

function hapusPengeluaran(btn, keluar) {
  btn.parentElement.parentElement.remove();
  totalKas += keluar;
  totalEl.innerText = totalKas;
}
