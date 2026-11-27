// SwaglineAI — GEÇİCİ yerel geliştirme sunucusu (Replicate IDM-VTON köprüsü).
//
// Neden var: Replicate token'ı uygulamaya gömülemez. Firebase Functions (Adım 13–15)
// hazır olana kadar token bu Mac'te `dev-server/.env` içinde durur; telefon aynı Wi-Fi'dan bağlanır.
// Sözleşme istemcideki TryOnService ile aynıdır, Firebase'e geçişte istemci tarafı değişmez.
//
// Gizlilik: görseller yalnızca bellekte tutulur, loglanmaz; Replicate'e yüklenen dosyalar iş bitince silinir.
// Bağımlılık yok (Node 20.6+ yerleşik fetch/FormData/Blob). Çalıştırma: `npm run dev-server`

import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8787);
const TOKEN = process.env.REPLICATE_API_TOKEN ?? '';
const DEV_KEY = process.env.DEV_SERVER_KEY ?? '';
const MODEL = 'cuuupid/idm-vton';
// Sürüm bilinçli olarak sabitlenir; güncellemek için .env'de IDM_VTON_VERSION verilir.
const VERSION =
  process.env.IDM_VTON_VERSION || '0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985';
const REPLICATE = 'https://api.replicate.com/v1';
const MAX_BODY_BYTES = 25 * 1024 * 1024;
const PREDICTION_POLL_MS = 1500;
const JOB_TTL_MS = 60 * 60 * 1000;

if (!TOKEN) {
  console.error('\n✖ REPLICATE_API_TOKEN yok. dev-server/.env dosyasına token\'ını ekle (bkz. dev-server/.env.example).\n');
  process.exit(1);
}

// IDM-VTON yalnızca üst/alt/elbise destekler (ARCHITECTURE.md §5.2).
const SLOT_CATEGORY = { top: 'upper_body', outerwear: 'upper_body', bottom: 'lower_body', dress: 'dresses' };
const SLOT_DESCRIPTION = { top: 'a top', outerwear: 'a jacket', bottom: 'a pair of pants', dress: 'a dress' };
const DRESSING_ORDER = ['bottom', 'dress', 'top', 'outerwear', 'shoes', 'eyewear', 'accessory'];

/** Modelin gerçek girdi alanları (açılışta şemadan okunur); bilinmeyen alanlar gönderilmez. */
let inputFields = null;

/** @type {Map<string, any>} */
const jobs = new Map();
/** clientRequestId → jobId (idempotency) */
const requestIndex = new Map();

// ───────────────────────── Replicate yardımcıları ─────────────────────────

class ApiError extends Error {
  constructor(code, message, retryable, httpStatus = 500) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.httpStatus = httpStatus;
  }
}

async function replicate(path, init = {}) {
  const res = await fetch(`${REPLICATE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(init.headers ?? {}) },
  });
  if (res.ok) return res.status === 204 ? null : res.json();

  const text = await res.text().catch(() => '');
  if (res.status === 401) throw new ApiError('SERVER', 'Replicate token geçersiz (401).', false);
  if (res.status === 402) throw new ApiError('SERVER', 'Replicate hesabında ödeme/kredi gerekli (402).', false);
  if (res.status === 429) throw new ApiError('RATE_LIMITED', 'Replicate oran sınırı (429).', false, 429);
  throw new ApiError('SERVER', `Replicate ${res.status}: ${text.slice(0, 200)}`, res.status >= 500);
}

async function uploadImage(base64, name) {
  const form = new FormData();
  form.append('content', new Blob([Buffer.from(base64, 'base64')], { type: 'image/jpeg' }), name);
  const file = await replicate('/files', { method: 'POST', body: form });
  return { id: file.id, url: file.urls.get };
}

async function deleteFiles(ids) {
  await Promise.all(ids.map((id) => replicate(`/files/${id}`, { method: 'DELETE' }).catch(() => undefined)));
}

function pickInput(candidate) {
  if (!inputFields) return candidate;
  return Object.fromEntries(Object.entries(candidate).filter(([key]) => inputFields.includes(key)));
}

async function runPrediction(job, input) {
  let prediction = await replicate('/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version: VERSION, input: pickInput(input) }),
  });
  job.predictionId = prediction.id;

  while (!['succeeded', 'failed', 'canceled'].includes(prediction.status)) {
    if (job.cancelled) {
      await replicate(`/predictions/${prediction.id}/cancel`, { method: 'POST' }).catch(() => undefined);
      throw new ApiError('CANCELLED', 'İptal edildi', false);
    }
    await new Promise((r) => setTimeout(r, PREDICTION_POLL_MS));
    prediction = await replicate(`/predictions/${prediction.id}`);
  }
  job.predictionId = null;

  if (prediction.status !== 'succeeded') {
    throw new ApiError('SERVER', `Tahmin başarısız: ${String(prediction.error ?? prediction.status).slice(0, 200)}`, true);
  }
  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (typeof output !== 'string') throw new ApiError('SERVER', 'Beklenmeyen model çıktısı', true);
  return output;
}

/** PNG/JPEG başlığından görsel boyutunu okur (sonuç oranı için). */
function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

// ───────────────────────── İş hattı ─────────────────────────

async function runJob(job, body) {
  const uploaded = [];
  try {
    const ordered = [...body.garments].sort(
      (a, b) => DRESSING_ORDER.indexOf(a.slot) - DRESSING_ORDER.indexOf(b.slot),
    );
    const supported = ordered.filter((g) => SLOT_CATEGORY[g.slot]);
    const failed = ordered.filter((g) => !SLOT_CATEGORY[g.slot]).map((g) => g.id);
    const warnings = failed.map((id) => `UNSUPPORTED_SLOT:${id}`);

    if (supported.length === 0) {
      job.status = { state: 'failed', error: { code: 'UNSUPPORTED_SLOT', retryable: false, garmentId: ordered[0]?.id } };
      return;
    }

    // Not: Otomatik arka plan temizleme modeli Adım 15'te seçilecek; şimdilik ürün görseli aynen gönderilir.
    const bodyFile = await uploadImage(body.bodyImage.base64, 'body.jpg');
    uploaded.push(bodyFile.id);
    let human = bodyFile.url;
    const ratio = body.bodyImage.width / body.bodyImage.height;
    const needsCrop = Math.abs(ratio - 3 / 4) > 0.02;
    const applied = [];

    for (let i = 0; i < supported.length; i++) {
      if (job.cancelled) throw new ApiError('CANCELLED', 'İptal edildi', false);
      const garment = supported[i];
      job.status = {
        state: 'processing',
        phase: 'dressing',
        currentSlot: garment.slot,
        step: i + 1,
        totalSteps: supported.length,
      };
      const t0 = Date.now();
      try {
        const garmentFile = await uploadImage(garment.image.base64, `garment-${i}.jpg`);
        uploaded.push(garmentFile.id);
        human = await runPrediction(job, {
          human_img: human,
          garm_img: garmentFile.url,
          garment_des: SLOT_DESCRIPTION[garment.slot],
          category: SLOT_CATEGORY[garment.slot],
          crop: needsCrop,
          seed: 42,
          steps: 30,
        });
        applied.push(garment.id);
        console.log(`  [${job.id.slice(0, 8)}] ${garment.slot} giydirildi (${((Date.now() - t0) / 1000).toFixed(1)} sn)`);
      } catch (error) {
        if (error instanceof ApiError && (error.code === 'CANCELLED' || !error.retryable)) throw error;
        console.warn(`  [${job.id.slice(0, 8)}] ${garment.slot} başarısız: ${error.message}`);
        failed.push(garment.id);
      }
    }

    if (applied.length === 0) {
      job.status = { state: 'failed', error: { code: 'SERVER', message: 'Hiçbir parça giydirilemedi', retryable: true } };
      return;
    }

    let size = { width: 768, height: 1024 };
    try {
      const res = await fetch(human);
      size = imageSize(Buffer.from(await res.arrayBuffer())) ?? size;
    } catch {
      // Boyut okunamazsa IDM-VTON'un varsayılan çıktı boyutu kullanılır.
    }

    job.status = {
      state: 'succeeded',
      result: { imageUrl: human, ...size, appliedGarmentIds: applied, failedGarmentIds: failed, warnings },
    };
    console.log(`✓ [${job.id.slice(0, 8)}] bitti: ${applied.length} parça (${((Date.now() - job.createdAt) / 1000).toFixed(1)} sn)`);
  } catch (error) {
    if (error instanceof ApiError && error.code === 'CANCELLED') {
      job.status = { state: 'cancelled' };
    } else {
      const e = error instanceof ApiError ? error : new ApiError('SERVER', String(error?.message ?? error), true);
      console.error(`✖ [${job.id.slice(0, 8)}] ${e.message}`);
      job.status = { state: 'failed', error: { code: e.code, message: e.message, retryable: e.retryable } };
    }
  } finally {
    await deleteFiles(uploaded);
  }
}

// ───────────────────────── HTTP ─────────────────────────

function send(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendError(res, error) {
  const e = error instanceof ApiError ? error : new ApiError('SERVER', String(error?.message ?? error), true);
  send(res, e.httpStatus, { error: { code: e.code, message: e.message, retryable: e.retryable } });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new ApiError('INVALID_BODY_IMAGE', 'İstek çok büyük', false, 413));
        req.destroy();
      } else chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new ApiError('SERVER', 'Geçersiz JSON', false, 400));
      }
    });
    req.on('error', reject);
  });
}

function validateSubmit(body) {
  if (!body?.clientRequestId || typeof body.clientRequestId !== 'string') {
    throw new ApiError('SERVER', 'clientRequestId gerekli', false, 400);
  }
  if (!body.bodyImage?.base64) throw new ApiError('INVALID_BODY_IMAGE', 'Fotoğraf eksik', false, 400);
  if (!Array.isArray(body.garments) || body.garments.length < 1 || body.garments.length > 7) {
    throw new ApiError('INVALID_GARMENT_IMAGE', '1–7 ürün gerekli', false, 400);
  }
  for (const g of body.garments) {
    if (!g?.id || !DRESSING_ORDER.includes(g.slot) || !g.image?.base64) {
      throw new ApiError('INVALID_GARMENT_IMAGE', 'Geçersiz ürün', false, 400);
    }
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (req.method === 'GET' && url.pathname === '/health') {
      return send(res, 200, { ok: true, model: MODEL, version: VERSION, inputFields });
    }
    if (DEV_KEY && req.headers['x-dev-key'] !== DEV_KEY) {
      return send(res, 401, { error: { code: 'UNAUTHENTICATED', retryable: false } });
    }

    if (req.method === 'POST' && url.pathname === '/try-on') {
      const body = await readJson(req);
      validateSubmit(body);
      const existing = requestIndex.get(body.clientRequestId);
      if (existing) return send(res, 200, { jobId: existing });

      const job = { id: randomUUID(), createdAt: Date.now(), cancelled: false, predictionId: null, status: { state: 'queued' } };
      jobs.set(job.id, job);
      requestIndex.set(body.clientRequestId, job.id);
      console.log(`→ [${job.id.slice(0, 8)}] yeni iş: ${body.garments.map((g) => g.slot).join(', ')}`);
      runJob(job, body);
      return send(res, 202, { jobId: job.id, estimatedSeconds: 25 * body.garments.length });
    }

    const statusMatch = url.pathname.match(/^\/try-on\/([\w-]+)$/);
    if (req.method === 'GET' && statusMatch) {
      const job = jobs.get(statusMatch[1]);
      if (!job) return send(res, 404, { error: { code: 'SERVER', message: 'İş bulunamadı', retryable: false } });
      return send(res, 200, job.status);
    }

    const cancelMatch = url.pathname.match(/^\/try-on\/([\w-]+)\/cancel$/);
    if (req.method === 'POST' && cancelMatch) {
      const job = jobs.get(cancelMatch[1]);
      if (job) job.cancelled = true;
      return send(res, 200, {});
    }

    send(res, 404, { error: { code: 'SERVER', message: 'Bulunamadı', retryable: false } });
  } catch (error) {
    sendError(res, error);
  }
});

// Eski işleri temizle (sonuç URL'leri zaten ~1 saat geçerli).
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
  for (const [requestId, jobId] of requestIndex) if (!jobs.has(jobId)) requestIndex.delete(requestId);
}, 10 * 60 * 1000).unref();

async function loadSchema() {
  try {
    const version = await replicate(`/models/${MODEL}/versions/${VERSION}`);
    const props = version?.openapi_schema?.components?.schemas?.Input?.properties ?? {};
    inputFields = Object.keys(props);
    const expected = ['human_img', 'garm_img', 'garment_des', 'category'];
    const missing = expected.filter((f) => !inputFields.includes(f));
    console.log(`• Model girdileri: ${inputFields.join(', ')}`);
    if (missing.length) console.warn(`⚠ Beklenen alanlar şemada yok: ${missing.join(', ')} — server.mjs güncellenmeli.`);
  } catch (error) {
    console.warn(`⚠ Model şeması okunamadı (${error.message}). Tüm alanlar gönderilecek.`);
  }
}

await loadSchema();
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nSwaglineAI dev-server hazır → port ${PORT} (model ${MODEL}@${VERSION.slice(0, 8)})`);
  console.log('Telefon ve Mac aynı Wi-Fi\'da olmalı. Durdurmak için Ctrl+C.\n');
});
