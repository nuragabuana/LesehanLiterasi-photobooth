# Nuragabuana Photo Booth (Clean Frame)

Project photo booth berbasis **HTML, CSS, dan JavaScript** dengan desain frame 3 foto versi clean sesuai frame terbaru Nuragabuana.

## Fitur
- Ambil **3 foto otomatis** dengan countdown.
- Pilihan **kamera depan / belakang**.
- Output **PNG 1080 × 1920** cocok untuk Instagram Story.
- Tombol **Download PNG**.
- Tombol **Upload / Share Story** (menggunakan Web Share API jika browser mendukung).
- Siap di-hosting di **GitHub Pages**.

## Struktur
```text
index.html
style.css
script.js
assets/
  logo.png
  frame-preview.png
  frame-overlay.png
```

## Menjalankan Secara Lokal
Gunakan server lokal, misalnya:

```bash
python3 -m http.server 8000
```

Lalu buka:

```text
http://localhost:8000
```

> Jangan buka dengan `file://` biasa, karena akses kamera browser sering gagal kalau bukan `localhost` atau `https`.

## Deploy ke GitHub Pages
1. Buat repo baru di GitHub.
2. Upload semua isi folder project ini.
3. Masuk ke **Settings > Pages**.
4. Pilih **Deploy from a branch**.
5. Pilih branch `main`, folder `/root`.
6. Simpan, lalu tunggu link GitHub Pages aktif.

## Catatan Instagram
Aplikasi web **tidak bisa auto-post langsung ke akun Instagram tertentu**. Browser hanya bisa membuka share sheet bawaan perangkat. Jadi setelah klik tombol share, user tetap perlu memilih Instagram Story dan menambahkan tag `@nuragabuana` secara manual.
