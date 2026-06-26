var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_blob = require("@vercel/blob");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
var POSTS_FILE = import_path.default.join(process.cwd(), "posts.json");
var SETTINGS_FILE = import_path.default.join(process.cwd(), "settings.json");
var BOOKINGS_FILE = import_path.default.join(process.cwd(), "bookings.json");
var DEFAULT_SETTINGS = {
  whatsappNumber: "393331234567",
  streamTitle: "Visual Stream",
  streamSubtitle: "Le migliori scoperte e novit\xE0 esclusive selezionate questa settimana in anteprima assoluta.",
  notificationEmail: "castromassimo@gmail.com"
};
async function safeBlobFetch(url) {
  const response = await fetch(url, { headers: { "Cache-Control": "no-cache, no-store" } });
  if (!response.ok) {
    console.error(`[Blob-Fetch] HTTP ${response.status} for ${url}`);
    return null;
  }
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error(`[Blob-Fetch] JSON parse failed for ${url}. Response starts with: ${text.slice(0, 120)}`);
    return null;
  }
}
async function readSettings() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const hasBlob = !!(token && !token.startsWith("vercel_blob_rw_..."));
  if (IS_VERCEL) {
    if (!hasBlob) {
      console.warn("[ReadSettings] BLOB_READ_WRITE_TOKEN non configurato su Vercel. Usando defaults.");
      return DEFAULT_SETTINGS;
    }
    try {
      const { blobs } = await (0, import_blob.list)({ prefix: "db/settings.json", token });
      const dbBlob = blobs.find((b) => b.pathname === "db/settings.json");
      if (!dbBlob) return DEFAULT_SETTINGS;
      const parsed = await safeBlobFetch(dbBlob.url);
      return parsed ? { ...DEFAULT_SETTINGS, ...parsed } : DEFAULT_SETTINGS;
    } catch (err) {
      console.error("[ReadSettings] Errore Blob:", err);
      return DEFAULT_SETTINGS;
    }
  } else {
    try {
      if (!import_fs.default.existsSync(SETTINGS_FILE)) {
        import_fs.default.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf-8");
        return DEFAULT_SETTINGS;
      }
      const parsed = JSON.parse(import_fs.default.readFileSync(SETTINGS_FILE, "utf-8"));
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (error) {
      console.error("[ReadSettings] Errore file locale:", error);
      return DEFAULT_SETTINGS;
    }
  }
}
async function writeSettings(settings) {
  const dataStr = JSON.stringify(settings, null, 2);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const hasBlob = !!(token && !token.startsWith("vercel_blob_rw_..."));
  if (IS_VERCEL) {
    if (!hasBlob) return false;
    try {
      await (0, import_blob.put)("db/settings.json", dataStr, { access: "public", allowOverwrite: true, token });
      console.log("[WriteSettings] Settings salvati su Vercel Blob.");
      return true;
    } catch (err) {
      console.error("[WriteSettings] Errore scrittura Blob:", err);
      return false;
    }
  } else {
    try {
      import_fs.default.writeFileSync(SETTINGS_FILE, dataStr, "utf-8");
    } catch (error) {
      console.warn("[WriteSettings] Errore scrittura file locale:", error);
    }
    if (hasBlob) {
      (0, import_blob.put)("db/settings.json", dataStr, { access: "public", allowOverwrite: true, token }).catch((err) => console.warn("[WriteSettings] Sync Blob fallito (non critico):", err));
    }
    return true;
  }
}
async function readBookings() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const hasBlob = !!(token && !token.startsWith("vercel_blob_rw_..."));
  if (IS_VERCEL) {
    if (!hasBlob) return [];
    try {
      const { blobs } = await (0, import_blob.list)({ prefix: "db/bookings.json", token });
      const dbBlob = blobs.find((b) => b.pathname === "db/bookings.json");
      if (!dbBlob) return [];
      const parsed = await safeBlobFetch(dbBlob.url);
      return parsed ?? [];
    } catch (err) {
      console.error("[ReadBookings] Errore Blob:", err);
      return [];
    }
  } else {
    try {
      if (!import_fs.default.existsSync(BOOKINGS_FILE)) {
        import_fs.default.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2), "utf-8");
        return [];
      }
      return JSON.parse(import_fs.default.readFileSync(BOOKINGS_FILE, "utf-8"));
    } catch (error) {
      console.error("[ReadBookings] Errore file locale:", error);
      return [];
    }
  }
}
async function writeBookings(bookings) {
  const dataStr = JSON.stringify(bookings, null, 2);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const hasBlob = !!(token && !token.startsWith("vercel_blob_rw_..."));
  if (IS_VERCEL) {
    if (!hasBlob) return false;
    try {
      await (0, import_blob.put)("db/bookings.json", dataStr, { access: "public", allowOverwrite: true, token });
      console.log("[WriteBookings] Bookings salvati su Vercel Blob.");
      return true;
    } catch (err) {
      console.error("[WriteBookings] Errore scrittura Blob:", err);
      return false;
    }
  } else {
    try {
      import_fs.default.writeFileSync(BOOKINGS_FILE, dataStr, "utf-8");
    } catch (error) {
      console.warn("[WriteBookings] Errore scrittura file locale:", error);
    }
    if (hasBlob) {
      (0, import_blob.put)("db/bookings.json", dataStr, { access: "public", allowOverwrite: true, token }).catch((err) => console.warn("[WriteBookings] Sync Blob fallito (non critico):", err));
    }
    return true;
  }
}
async function cleanupExpiredBookings() {
  try {
    const bookings = await readBookings();
    const now = /* @__PURE__ */ new Date();
    const activeBookings = bookings.filter((booking) => {
      if (!booking.date) return true;
      const [year, month, day] = booking.date.split("-").map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return true;
      const expirationDate = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
      return now.getTime() < expirationDate.getTime();
    });
    if (activeBookings.length !== bookings.length) {
      console.log(`[Auto-Cleanup] Rimossi ${bookings.length - activeBookings.length} prenotazioni scadute (oltre la mezzanotte del giorno successivo).`);
      await writeBookings(activeBookings);
    }
  } catch (err) {
    console.error("[Auto-Cleanup] Errore durante la pulizia automatica delle prenotazioni:", err);
  }
}
async function cleanupExpiredBlobs() {
  console.log("[Blob-Cleanup] Pulizia automatica dei blob disattivata (cancellazione solo manuale).");
}
var INITIAL_POSTS = [
  {
    id: "seeded-1",
    title: "Caff\xE8 Specialty Etiopia Yirgacheffe",
    price: "\u20AC18.50",
    description: "Note floreali di gelsomino, pesca bianca e un delicato retrogusto di miele agrumato. Raccolto a mano a 2.100 metri d'altezza, tostato fresco artigianalmente ogni marted\xEC. Un'esperienza sensoriale pura per veri appassionati.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop",
    ctaText: "Ordina via WhatsApp",
    whatsappMessage: "Ciao! Vorrei maggiori informazioni sul Caff\xE8 Specialty Etiopia Yirgacheffe (\u20AC18.50). \xC8 ancora disponibile per la spedizione?",
    tags: ["Specialty Coffee", "Edizione Limitata", "Tostatura Fresca"],
    createdAt: "2026-06-24T08:00:00.000Z",
    expiresAt: "2026-06-26T18:00:00.000Z",
    // Expires in ~2 days
    clickCount: 14
  },
  {
    id: "seeded-2",
    title: "Borsa Messenger in Pelle Artigianale",
    price: "\u20AC145.00",
    description: "Realizzata in pregiata pelle bovina conciata al vegetale in Toscana. Cuciture rinforzate in filo cerato, interni organizzati con scomparto imbottito per laptop fino a 14 pollici. Progettata per invecchiare con carattere.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop",
    ctaText: "Richiedi Disponibilit\xE0",
    whatsappMessage: "Ciao! Ho visto sul Visual Stream la Borsa Messenger in Pelle Artigianale (\u20AC145.00). Quali sono i tempi di consegna?",
    tags: ["Artigianato", "Vera Pelle", "Bestseller"],
    createdAt: "2026-06-23T10:00:00.000Z",
    expiresAt: null,
    // Persistent
    clickCount: 29
  },
  {
    id: "seeded-3",
    title: "Poltrona Lounge Minimale 'Nordic Slate'",
    price: "\u20AC320.00",
    description: "Linee pulite, struttura in legno massello di rovere cerato e rivestimento in tessuto boucl\xE9 color avorio ad alta resistenza. Progettata per offrire il massimo comfort ergonomico senza ingombrare visivamente il tuo spazio.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=800&auto=format&fit=crop",
    ctaText: "Prenota con Acconto",
    whatsappMessage: "Ciao! Vorrei pre-ordinare la Poltrona Lounge Minimale Nordic Slate (\u20AC320.00) vista nella vetrina. Mi spieghi come procedere?",
    tags: ["Design Interni", "Pre-Ordine", "Home Decor"],
    createdAt: "2026-06-22T15:30:00.000Z",
    expiresAt: "2026-06-29T20:00:00.000Z",
    // Expires in ~5 days
    clickCount: 8
  },
  {
    id: "seeded-4",
    title: "Tastiera Meccanica Custom 'Sunset Glow'",
    price: "\u20AC189.00",
    description: "Switch tattili personalizzati e lubrificati a mano per un suono profondo e ovattato. Keycaps PBT a sublimazione con gradiente tramonto, case in alluminio CNC anodizzato grigio siderale e retroilluminazione calda.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1618384887929-16ec33faf9c1?q=80&w=800&auto=format&fit=crop",
    ctaText: "Acquista Ora",
    whatsappMessage: "Ciao! \xC8 ancora disponibile la Tastiera Meccanica Custom Sunset Glow (\u20AC189.00)? Ne vorrei ordinare una subito.",
    tags: ["Desk Setup", "Custom Tech", "Pochi Pezzi"],
    createdAt: "2026-06-24T11:00:00.000Z",
    expiresAt: "2026-06-25T23:59:59.000Z",
    // Expires in ~1.5 days
    clickCount: 42
  }
];
var IS_VERCEL = !!process.env.VERCEL;
async function readPosts() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const hasBlob = !!(token && !token.startsWith("vercel_blob_rw_..."));
  if (IS_VERCEL) {
    if (!hasBlob) {
      console.error("[ReadPosts] BLOB_READ_WRITE_TOKEN non configurato su Vercel!");
      return [];
    }
    try {
      const { blobs } = await (0, import_blob.list)({ prefix: "db/posts.json", token });
      const dbBlob = blobs.find((b) => b.pathname === "db/posts.json");
      if (!dbBlob) {
        console.log("[ReadPosts] db/posts.json non trovato nel Blob. DB vuoto.");
        return [];
      }
      const response = await fetch(dbBlob.url, { headers: { "Cache-Control": "no-cache, no-store" } });
      if (!response.ok) throw new Error(`Blob fetch failed: ${response.status}`);
      const data = await response.json();
      console.log(`[ReadPosts] ${data.length} post letti da Vercel Blob.`);
      return data;
    } catch (err) {
      console.error("[ReadPosts] Errore lettura Blob:", err);
      return [];
    }
  } else {
    try {
      if (!import_fs.default.existsSync(POSTS_FILE)) {
        import_fs.default.writeFileSync(POSTS_FILE, JSON.stringify(INITIAL_POSTS, null, 2), "utf-8");
        console.log("[ReadPosts] posts.json creato con post demo iniziali.");
        return INITIAL_POSTS;
      }
      const data = import_fs.default.readFileSync(POSTS_FILE, "utf-8");
      const posts = JSON.parse(data);
      console.log(`[ReadPosts] ${posts.length} post letti da file locale.`);
      return posts;
    } catch (error) {
      console.error("[ReadPosts] Errore lettura file locale:", error);
      return INITIAL_POSTS;
    }
  }
}
async function writePosts(posts) {
  const dataStr = JSON.stringify(posts, null, 2);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const hasBlob = !!(token && !token.startsWith("vercel_blob_rw_..."));
  if (IS_VERCEL) {
    if (!hasBlob) {
      console.error("[WritePosts] BLOB_READ_WRITE_TOKEN mancante! Impossibile salvare.");
      return false;
    }
    try {
      await (0, import_blob.put)("db/posts.json", dataStr, { access: "public", allowOverwrite: true, token });
      console.log(`[WritePosts] ${posts.length} post salvati su Vercel Blob.`);
      return true;
    } catch (err) {
      console.error("[WritePosts] Errore scrittura Blob:", err);
      return false;
    }
  } else {
    let localOk = false;
    try {
      import_fs.default.writeFileSync(POSTS_FILE, dataStr, "utf-8");
      localOk = true;
      console.log(`[WritePosts] ${posts.length} post salvati in posts.json locale.`);
    } catch (error) {
      console.error("[WritePosts] Errore scrittura file locale:", error);
    }
    if (hasBlob) {
      (0, import_blob.put)("db/posts.json", dataStr, { access: "public", allowOverwrite: true, token }).then(() => console.log("[WritePosts] Sync Blob completato.")).catch((err) => console.warn("[WritePosts] Sync Blob fallito (non critico in locale):", err));
    }
    return localOk;
  }
}
app.use(import_express.default.json({ limit: "100mb" }));
app.use(import_express.default.urlencoded({ limit: "100mb", extended: true }));
app.get("/api/posts", async (req, res) => {
  const posts = await readPosts();
  const now = /* @__PURE__ */ new Date();
  const activePosts = posts.filter((post) => {
    if (!post.expiresAt) return true;
    return new Date(post.expiresAt) > now;
  });
  activePosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(activePosts);
});
app.get("/api/all-posts", async (req, res) => {
  const posts = await readPosts();
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(posts);
});
app.post("/api/posts", async (req, res) => {
  const { title, price, description, mediaType, mediaUrl, ctaText, whatsappMessage, tags, expiresAt, overlayText, overlayX, overlayY } = req.body;
  if (!title || !mediaUrl) {
    return res.status(400).json({ error: "Titolo e URL media sono obbligatori." });
  }
  const posts = await readPosts();
  const newPost = {
    id: "post-" + Date.now(),
    title,
    price: price || void 0,
    description: description || void 0,
    mediaType: mediaType || "image",
    mediaUrl,
    ctaText: ctaText || "Ordina su WhatsApp",
    whatsappMessage: whatsappMessage || `Ciao! Vorrei ordinare ${title}.`,
    tags: Array.isArray(tags) ? tags : [],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    clickCount: 0,
    overlayText: overlayText || void 0,
    overlayX: typeof overlayX === "number" ? overlayX : void 0,
    overlayY: typeof overlayY === "number" ? overlayY : void 0
  };
  posts.push(newPost);
  await writePosts(posts);
  res.status(201).json(newPost);
});
app.put("/api/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { title, price, description, mediaType, mediaUrl, ctaText, whatsappMessage, tags, expiresAt, overlayText, overlayX, overlayY } = req.body;
  const posts = await readPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Post non trovato." });
  }
  const updatedPost = {
    ...posts[index],
    title: title ?? posts[index].title,
    price: price !== void 0 ? price : posts[index].price,
    description: description !== void 0 ? description : posts[index].description,
    mediaType: mediaType ?? posts[index].mediaType,
    mediaUrl: mediaUrl ?? posts[index].mediaUrl,
    ctaText: ctaText ?? posts[index].ctaText,
    whatsappMessage: whatsappMessage ?? posts[index].whatsappMessage,
    tags: Array.isArray(tags) ? tags : posts[index].tags,
    expiresAt: expiresAt !== void 0 ? expiresAt ? new Date(expiresAt).toISOString() : null : posts[index].expiresAt,
    overlayText: overlayText !== void 0 ? overlayText : posts[index].overlayText,
    overlayX: overlayX !== void 0 ? overlayX : posts[index].overlayX,
    overlayY: overlayY !== void 0 ? overlayY : posts[index].overlayY
  };
  posts[index] = updatedPost;
  await writePosts(posts);
  res.json(updatedPost);
});
app.post("/api/upload", async (req, res) => {
  try {
    const { filename, fileData, mimeType } = req.body;
    if (!filename || !fileData) {
      return res.status(400).json({ error: "Nome file e dati file (base64 o data URL) sono obbligatori." });
    }
    let buffer;
    if (fileData.startsWith("data:")) {
      buffer = Buffer.from(fileData.split(",")[1], "base64");
    } else {
      buffer = Buffer.from(fileData, "base64");
    }
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const hasBlob = !!(token && !token.startsWith("vercel_blob_rw_..."));
    if (IS_VERCEL) {
      if (!hasBlob) {
        return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN non configurato su Vercel. Impossibile caricare file." });
      }
      const blob = await (0, import_blob.put)(filename, buffer, {
        access: "public",
        contentType: mimeType,
        addRandomSuffix: true,
        token
      });
      console.log(`[Upload] File caricato su Vercel Blob. URL: ${blob.url}`);
      return res.json({ url: blob.url });
    } else {
      const uploadsDir = import_path.default.join(process.cwd(), "assets", "uploads");
      if (!import_fs.default.existsSync(uploadsDir)) import_fs.default.mkdirSync(uploadsDir, { recursive: true });
      const ext = import_path.default.extname(filename) || "";
      const base = import_path.default.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const uniqueName = `${base}-${Date.now()}${ext}`;
      const filePath = import_path.default.join(uploadsDir, uniqueName);
      import_fs.default.writeFileSync(filePath, buffer);
      const fileUrl = `/assets/uploads/${uniqueName}`;
      console.log(`[Upload] File salvato in locale: ${filePath} \u2192 URL: ${fileUrl}`);
      if (hasBlob) {
        (0, import_blob.put)(`uploads/${uniqueName}`, buffer, { access: "public", contentType: mimeType, token }).then((b) => console.log(`[Upload] Sync Blob completato: ${b.url}`)).catch((err) => console.warn("[Upload] Sync Blob fallito (non critico):", err.message));
      }
      return res.json({ url: fileUrl });
    }
  } catch (err) {
    console.error("[Upload] Errore caricamento:", err);
    res.status(500).json({ error: "Errore durante il caricamento del file: " + err.message });
  }
});
app.get("/api/debug", async (req, res) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const hasToken = !!(token && !token.startsWith("vercel_blob_rw_..."));
  let blobList = [];
  let blobError = null;
  if (hasToken) {
    try {
      const { blobs } = await (0, import_blob.list)({ token });
      blobList = blobs.map((b) => b.pathname);
    } catch (e) {
      blobError = e.message;
    }
  }
  res.json({
    isVercel: !!process.env.VERCEL,
    hasToken,
    tokenPrefix: token ? token.substring(0, 25) + "..." : "(none)",
    blobFiles: blobList,
    blobError,
    nodeEnv: process.env.NODE_ENV
  });
});
app.post("/api/posts/clear-demo", async (req, res) => {
  try {
    const saved = await writePosts([]);
    if (!saved) {
      return res.status(500).json({ error: "Impossibile svuotare il DB. Verificare BLOB_READ_WRITE_TOKEN." });
    }
    console.log("[ClearDemo] DB post azzerato con successo.");
    res.json({ success: true, message: "Tutti i post demo eliminati. DB azzerato." });
  } catch (err) {
    res.status(500).json({ error: "Errore: " + err.message });
  }
});
app.post("/api/posts/reset-clicks", async (req, res) => {
  try {
    const posts = await readPosts();
    posts.forEach((p) => {
      p.clickCount = 0;
    });
    const saved = await writePosts(posts);
    if (!saved) {
      return res.status(500).json({ error: "Impossibile salvare le statistiche. Verificare la configurazione di BLOB_READ_WRITE_TOKEN su Vercel." });
    }
    res.json({ success: true, message: "Statistiche azzerate con successo." });
  } catch (err) {
    console.error("[Reset-Clicks] Errore:", err);
    res.status(500).json({ error: "Errore interno durante il reset delle statistiche: " + err.message });
  }
});
app.delete("/api/posts/:id", async (req, res) => {
  const { id } = req.params;
  const posts = await readPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Post non trovato." });
  }
  const post = posts[index];
  if (post.mediaUrl && post.mediaUrl.includes("public.blob.vercel-storage.com")) {
    try {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (token && !token.startsWith("vercel_blob_rw_...")) {
        console.log(`[Delete-Post] Eliminazione del blob associato al post: ${post.mediaUrl}`);
        await (0, import_blob.del)(post.mediaUrl, { token });
      }
    } catch (err) {
      console.error("[Delete-Post] Errore durante l'eliminazione del blob dal Vercel Storage:", err);
    }
  }
  const filtered = posts.filter((p) => p.id !== id);
  const saved = await writePosts(filtered);
  if (!saved) {
    return res.status(500).json({
      error: "Impossibile salvare le modifiche. Verificare la configurazione di BLOB_READ_WRITE_TOKEN su Vercel."
    });
  }
  res.json({ success: true, message: "Post eliminato correttamente e blob rimosso se presente." });
});
app.post("/api/posts/:id/click", async (req, res) => {
  const { id } = req.params;
  const posts = await readPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index !== -1) {
    posts[index].clickCount = (posts[index].clickCount || 0) + 1;
    await writePosts(posts);
    return res.json({ success: true, clicks: posts[index].clickCount });
  }
  res.status(404).json({ error: "Post non trovato." });
});
app.get("/api/settings", async (req, res) => {
  const settings = await readSettings();
  res.json(settings);
});
app.post("/api/settings", async (req, res) => {
  const { whatsappNumber, streamTitle, streamSubtitle, notificationEmail } = req.body;
  const currentSettings = await readSettings();
  const updatedSettings = {
    whatsappNumber: whatsappNumber || currentSettings.whatsappNumber,
    streamTitle: streamTitle || currentSettings.streamTitle,
    streamSubtitle: streamSubtitle || currentSettings.streamSubtitle,
    notificationEmail: notificationEmail || currentSettings.notificationEmail || "castromassimo@gmail.com"
  };
  await writeSettings(updatedSettings);
  res.json(updatedSettings);
});
app.get("/api/bookings", async (req, res) => {
  await cleanupExpiredBookings();
  const bookings = await readBookings();
  bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(bookings);
});
app.delete("/api/bookings/:id", async (req, res) => {
  const { id } = req.params;
  const bookings = await readBookings();
  const filtered = bookings.filter((b) => b.id !== id);
  if (bookings.length === filtered.length) {
    return res.status(404).json({ error: "Prenotazione non trovata." });
  }
  await writeBookings(filtered);
  res.json({ success: true, message: "Prenotazione eliminata." });
});
app.post("/api/bookings", async (req, res) => {
  const { postId, date, name, guests, phone } = req.body;
  if (!postId || !date || !name || !phone) {
    return res.status(400).json({ error: "Tutti i campi (Post, Data, Nome, Cellulare) sono obbligatori." });
  }
  const posts = await readPosts();
  const post = posts.find((p) => p.id === postId);
  const postTitle = post ? post.title : "Esperienza Sconosciuta";
  const bookings = await readBookings();
  const newBooking = {
    id: "booking-" + Date.now(),
    postId,
    postTitle,
    date,
    name,
    guests: guests ? parseInt(guests) : 1,
    phone,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  bookings.push(newBooking);
  await writeBookings(bookings);
  res.status(201).json({
    success: true,
    booking: newBooking
  });
});
async function start() {
  const uploadsDir = import_path.default.join(process.cwd(), "assets", "uploads");
  if (!IS_VERCEL) {
    if (!import_fs.default.existsSync(uploadsDir)) import_fs.default.mkdirSync(uploadsDir, { recursive: true });
    app.use("/assets/uploads", import_express.default.static(uploadsDir));
  }
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
    console.log("Production static server configured.");
  }
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      cleanupExpiredBookings();
      setInterval(cleanupExpiredBookings, 6e4);
      console.log("[Auto-Cleanup] Servizio di pulizia automatica prenotazioni attivato (frequenza: 60s).");
      cleanupExpiredBlobs();
      setInterval(cleanupExpiredBlobs, 15 * 60 * 1e3);
      console.log("[Blob-Cleanup] Servizio di pulizia automatica blob attivato (frequenza: 15m).");
    });
  } else {
    cleanupExpiredBookings();
    setInterval(cleanupExpiredBookings, 6e4);
    cleanupExpiredBlobs();
    setInterval(cleanupExpiredBlobs, 15 * 60 * 1e3);
    console.log("[Vercel] Serverless functions started, cleanup intervals registered.");
  }
}
start().catch((err) => {
  console.error("Failed to start server:", err);
});
var server_default = app;
//# sourceMappingURL=server.cjs.map
