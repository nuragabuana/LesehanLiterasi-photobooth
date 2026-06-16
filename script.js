
const camera = document.getElementById('camera');
const cameraStage = document.getElementById('cameraStage');
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const countdownEl = document.getElementById('countdown');
const startCameraButton = document.getElementById('startCamera');
const takePhotosButton = document.getElementById('takePhotos');
const resetPhotosButton = document.getElementById('resetPhotos');
const cameraModeInput = document.getElementById('cameraMode');
const countdownModeInput = document.getElementById('countdownMode');
const cameraStatus = document.getElementById('cameraStatus');
const statusPill = document.getElementById('statusPill');
const canvas = document.getElementById('resultCanvas');
const ctx = canvas.getContext('2d');
const downloadButton = document.getElementById('downloadResult');
const shareButton = document.getElementById('shareStory');
const openInstagramButton = document.getElementById('openInstagram');
const shotStrip = document.getElementById('shotStrip');

let stream = null;
let shots = [];
let resultBlob = null;
let isCapturing = false;

const assets = {};
const assetList = {
  framePreview: 'assets/frame-preview.png',
  frameOverlay: 'assets/frame-overlay.png'
};

const PHOTO_SLOTS = [
  { x: 137, y: 280, width: 802, height: 442, radius: 28 },
  { x: 137, y: 751, width: 802, height: 434, radius: 28 },
  { x: 137, y: 1214, width: 803, height: 438, radius: 28 }
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function preloadAssets() {
  const entries = Object.entries(assetList);
  await Promise.all(entries.map(async ([key, src]) => {
    assets[key] = await loadImage(src);
  }));
  renderResult();
}

function setStatus(message, type = 'info') {
  const icon = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  cameraStatus.innerHTML = `${icon} ${message}`;
}

function setCameraState(isReady) {
  statusPill.textContent = isReady ? 'Kamera aktif' : 'Kamera belum aktif';
  statusPill.classList.toggle('is-on', isReady);
  takePhotosButton.disabled = !isReady || isCapturing;
  cameraPlaceholder.classList.toggle('is-hidden', isReady);
}

function stopStream() {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
  stream = null;
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('Browser ini belum mendukung kamera.', 'error');
    return;
  }

  stopStream();
  startCameraButton.disabled = true;
  takePhotosButton.disabled = true;
  const facingMode = cameraModeInput.value;
  cameraStage.classList.toggle('is-back', facingMode === 'environment');
  setStatus('Meminta izin kamera...');

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1080 },
        height: { ideal: 1920 }
      },
      audio: false
    });

    camera.srcObject = stream;
    await camera.play();
    setCameraState(true);
    setStatus('Kamera aktif. Klik “Ambil 3 Foto” untuk mulai.', 'success');
  } catch (error) {
    console.error(error);
    setCameraState(false);
    setStatus('Kamera gagal aktif. Pastikan permission kamera diizinkan dan dibuka lewat localhost / HTTPS.', 'error');
  } finally {
    startCameraButton.disabled = false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function showCountdown() {
  const total = Math.max(1, Number(countdownModeInput.value) || 3);
  countdownEl.classList.add('is-active');
  for (let i = total; i >= 1; i--) {
    countdownEl.textContent = i;
    await sleep(800);
  }
  countdownEl.textContent = 'SNAP';
  await sleep(260);
  countdownEl.textContent = '';
  countdownEl.classList.remove('is-active');
}

async function captureFrame() {
  if (!camera.videoWidth || !camera.videoHeight) {
    throw new Error('Video belum siap.');
  }
  const temp = document.createElement('canvas');
  temp.width = camera.videoWidth;
  temp.height = camera.videoHeight;
  const tctx = temp.getContext('2d');

  if (cameraModeInput.value === 'user') {
    tctx.translate(temp.width, 0);
    tctx.scale(-1, 1);
  }

  tctx.drawImage(camera, 0, 0, temp.width, temp.height);
  const img = new Image();
  img.src = temp.toDataURL('image/png');
  await img.decode();
  return img;
}

function roundedRectPath(context, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + w, y, x + w, y + h, radius);
  context.arcTo(x + w, y + h, x, y + h, radius);
  context.arcTo(x, y + h, x, y, radius);
  context.arcTo(x, y, x + w, y, radius);
  context.closePath();
}

function drawCoverImage(image, x, y, w, h) {
  const imageRatio = image.width / image.height;
  const boxRatio = w / h;
  let sx = 0, sy = 0, sw = image.width, sh = image.height;

  if (imageRatio > boxRatio) {
    sw = image.height * boxRatio;
    sx = (image.width - sw) / 2;
  } else {
    sh = image.width / boxRatio;
    sy = (image.height - sh) / 2;
  }

  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

function drawPlaceholder(slot, index) {
  const grad = ctx.createLinearGradient(slot.x, slot.y, slot.x + slot.width, slot.y + slot.height);
  grad.addColorStop(0, '#f6fbfd');
  grad.addColorStop(1, '#fdfefe');
  ctx.fillStyle = grad;
  ctx.fillRect(slot.x, slot.y, slot.width, slot.height);

  ctx.save();
  ctx.fillStyle = 'rgba(8,55,68,.14)';
  ctx.font = '900 44px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`FOTO ${index + 1}`, slot.x + slot.width / 2, slot.y + slot.height / 2 - 16);
  ctx.font = '700 22px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(8,55,68,.22)';
  ctx.fillText('Area foto', slot.x + slot.width / 2, slot.y + slot.height / 2 + 28);
  ctx.restore();
}

function renderResult() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw light base first.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw photo areas / placeholders beneath overlay.
  PHOTO_SLOTS.forEach((slot, index) => {
    ctx.save();
    roundedRectPath(ctx, slot.x, slot.y, slot.width, slot.height, slot.radius);
    ctx.clip();
    if (shots[index]) {
      drawCoverImage(shots[index], slot.x, slot.y, slot.width, slot.height);
    } else {
      drawPlaceholder(slot, index);
    }
    ctx.restore();
  });

  // Draw complete frame preview on top.
  if (assets.frameOverlay) {
    ctx.drawImage(assets.frameOverlay, 0, 0, canvas.width, canvas.height);
  } else if (assets.framePreview) {
    ctx.drawImage(assets.framePreview, 0, 0, canvas.width, canvas.height);
  }
}

function updateShotStrip() {
  shotStrip.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const item = document.createElement('div');
    item.className = 'shot-thumb' + (shots[i] ? '' : ' is-empty');

    if (shots[i]) {
      const img = document.createElement('img');
      img.src = shots[i].src;
      img.alt = `Foto ${i + 1}`;
      item.appendChild(img);
    }

    const label = document.createElement('span');
    label.textContent = `Foto ${i + 1}`;
    item.appendChild(label);
    shotStrip.appendChild(item);
  }
}

async function updateBlob() {
  return new Promise(resolve => {
    canvas.toBlob(blob => {
      resultBlob = blob;
      resolve(blob);
    }, 'image/png', 0.95);
  });
}

async function takePhotoSequence() {
  if (!stream || isCapturing) return;
  isCapturing = true;
  shots = [];
  resultBlob = null;
  downloadButton.disabled = true;
  shareButton.disabled = true;
  resetPhotosButton.disabled = true;
  takePhotosButton.disabled = true;
  takePhotosButton.textContent = 'Sedang mengambil...';
  updateShotStrip();
  renderResult();

  try {
    for (let i = 0; i < 3; i++) {
      setStatus(`Bersiap untuk foto ${i + 1} dari 3...`);
      await showCountdown();
      const image = await captureFrame();
      shots.push(image);
      updateShotStrip();
      renderResult();
      setStatus(`Foto ${i + 1} berhasil diambil.`, 'success');
      if (i < 2) await sleep(600);
    }

    await updateBlob();
    downloadButton.disabled = false;
    shareButton.disabled = false;
    resetPhotosButton.disabled = false;
    setStatus('Selesai. Hasil siap di-download atau di-share.', 'success');
  } catch (error) {
    console.error(error);
    setStatus('Gagal mengambil foto. Coba aktifkan ulang kamera.', 'error');
  } finally {
    isCapturing = false;
    takePhotosButton.textContent = 'Ambil 3 Foto';
    takePhotosButton.disabled = !stream;
  }
}

function resetPhotos() {
  shots = [];
  resultBlob = null;
  renderResult();
  updateShotStrip();
  downloadButton.disabled = true;
  shareButton.disabled = true;
  resetPhotosButton.disabled = true;
  setStatus('Foto berhasil di-reset. Silakan ambil ulang.', 'success');
}

async function downloadResult() {
  if (!resultBlob) await updateBlob();
  const url = URL.createObjectURL(resultBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nuragabuana-photobooth-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function shareStory() {
  if (!resultBlob) await updateBlob();
  const file = new File([resultBlob], 'nuragabuana-story.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Nuragabuana Photo Booth',
        text: 'Hasil photobooth Nuragabuana - tag @nuragabuana'
      });
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.warn(error);
    }
  }

  await downloadResult();
  window.open('https://www.instagram.com/nuragabuana/', '_blank', 'noopener,noreferrer');
  alert('File sudah di-download. Upload manual ke Instagram Story lalu tag @nuragabuana.');
}

cameraModeInput.addEventListener('change', () => {
  cameraStage.classList.toggle('is-back', cameraModeInput.value === 'environment');
  if (stream) startCamera();
});
startCameraButton.addEventListener('click', startCamera);
takePhotosButton.addEventListener('click', takePhotoSequence);
resetPhotosButton.addEventListener('click', resetPhotos);
downloadButton.addEventListener('click', downloadResult);
shareButton.addEventListener('click', shareStory);
openInstagramButton.addEventListener('click', () => {
  window.open('https://www.instagram.com/nuragabuana/', '_blank', 'noopener,noreferrer');
});
window.addEventListener('beforeunload', stopStream);

preloadAssets()
  .then(updateShotStrip)
  .catch(error => {
    console.error(error);
    setStatus('Asset frame gagal dimuat. Pastikan semua file assets ikut di-upload.', 'error');
  });
