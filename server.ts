import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createHash, createPublicKey, randomInt, randomUUID, verify as verifySignature } from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { App as FirebaseAdminApp, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth as getFirebaseAdminAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json";
import { LESSONS } from "./src/constants/lessons";
import { PERKS } from "./src/constants/perks";
import "dotenv/config";

type RoomType = "duel" | "sandbox";

interface Room {
  players: string[];
  state: Record<string, unknown>;
  type: RoomType;
  lastActivity: number;
}

interface MentorChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface FirebaseIdentity {
  uid: string;
  email?: string;
  admin: boolean;
}

interface AuthenticatedRequest extends express.Request {
  identity?: FirebaseIdentity;
}

interface FirebaseSigningKeyCache {
  keys: Record<string, string>;
  expiresAt: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

let signingKeyCache: FirebaseSigningKeyCache | null = null;
const rateLimitBuckets = new Map<string, RateLimitBucket>();
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const firebaseIssuer = `https://securetoken.google.com/${firebaseProjectId}`;

const SHOP_CATALOG = new Map([
  ["xp_boost_1", { name: "XP Буст (1ч)", price: 500 }],
  ["shield_1", { name: "Защита серии", price: 300 }],
  ["extra_life_1", { name: "Дополнительная жизнь", price: 200 }],
  ["premium_avatar_1", { name: "Золотая рамка", price: 1000 }],
]);
const LESSON_IDS = new Set(LESSONS.map((lesson) => lesson.id));
const LESSON_XP_REWARD = 50;
const LESSON_COIN_REWARD = 50;
const ARCADE_REWARDS = new Map([
  ["pyarcade", { xp: 100, coins: 50 }],
  ["speedtyper", { xp: 75, coins: 38 }],
  ["logicgates", { xp: 100, coins: 50 }],
  ["syntaxmatch", { xp: 120, coins: 60 }],
  ["snake", { xp: 100, coins: 50 }],
  ["debugrush", { xp: 250, coins: 125 }],
  ["predictor", { xp: 300, coins: 150 }],
  ["regexracer", { xp: 160, coins: 80 }],
  ["algoascent", { xp: 200, coins: 100 }],
  ["triviachase", { xp: 80, coins: 40 }],
]);
const SOLO_BOSS_REWARDS = new Map([
  ["b1", { xp: 500, coins: 300 }],
  ["b2", { xp: 1000, coins: 600 }],
]);
const TOURNAMENT_REWARDS = new Map([
  ["t_1", { xp: 1500, coins: 150 }],
  ["t_2", { xp: 1500, coins: 150 }],
  ["t_3", { xp: 1500, coins: 150 }],
  ["t_4", { xp: 1500, coins: 150 }],
  ["t_5", { xp: 1500, coins: 150 }],
]);
type StatName = "logic" | "speed" | "power" | "intellect" | "stamina";
interface ItemEffect {
  message: string;
  xp?: number;
  stats?: Partial<Record<StatName, number>>;
  petStats?: Partial<Record<StatName, number>>;
  randomPetStat?: { amount: number; stats: StatName[] };
}
const ITEM_EFFECTS = new Map<string, ItemEffect>([
  ["logic_booster", { message: "Логика повышена на 5!", stats: { logic: 5 } }],
  ["speed_serum", { message: "Скорость повышена на 5!", stats: { speed: 5 } }],
  ["power_gloves", { message: "Сила повышена на 5!", stats: { power: 5 } }],
  ["intellect_chip", { message: "Интеллект повышен на 5!", stats: { intellect: 5 } }],
  ["stamina_drink", { message: "Выносливость повышена на 5!", stats: { stamina: 5 } }],
  ["apple_red", { message: "Логика питомца повышена на 5!", petStats: { logic: 5 } }],
  ["coffee_cup", { message: "Скорость питомца повышена на 5!", petStats: { speed: 5 } }],
  ["burger_king", { message: "Сила питомца повышена на 5!", petStats: { power: 5 } }],
  ["brain_boost", { message: "Интеллект питомца повышен на 8!", petStats: { intellect: 8 } }],
  ["energy_drink", { message: "Скорость питомца повышена на 8!", petStats: { speed: 8 } }],
  ["pizza_slice", { message: "Логика и сила питомца повышены!", petStats: { logic: 2, power: 3 } }],
  ["bit_bot_food", { message: "Бит-Бот накормлен! +10 к случайной характеристике питомца.", randomPetStat: { amount: 10, stats: ["logic", "speed", "power", "intellect"] } }],
  ["data_crystal", { message: "Вы получили 100 XP!", xp: 100 }],
  ["coding_manual", { message: "Вы получили 50 XP и массу знаний!", xp: 50 }],
  ["xp_boost_1", { message: "Использован XP Буст! +250 XP!", xp: 250 }],
  ["xp_boost_2", { message: "Использован Супер XP Буст! +600 XP!", xp: 600 }],
  ["scroll_logic", { message: "Свиток логики: +10!", stats: { logic: 10 } }],
  ["scroll_speed", { message: "Свиток скорости: +10!", stats: { speed: 10 } }],
  ["scroll_power", { message: "Свиток силы: +10!", stats: { power: 10 } }],
  ["scroll_intellect", { message: "Свиток интеллекта: +10!", stats: { intellect: 10 } }],
  ["scroll_stamina", { message: "Свиток выносливости: +10!", stats: { stamina: 10 } }],
  ["ancient_scroll", { message: "Древний манускрипт: все характеристики +5!", stats: { logic: 5, speed: 5, power: 5, intellect: 5, stamina: 5 } }],
  ["guido_wisdom", { message: "Мудрость Гвидо: +1000 XP!", xp: 1000 }],
  ["quantum_core", { message: "Квантовое ядро: все характеристики +10!", stats: { logic: 10, speed: 10, power: 10, intellect: 10, stamina: 10 } }],
]);
const PET_TYPES = new Set(["pixel-slime", "code-cube", "bit-spark", "logic-owl", "cyber-cat", "ghost-shell", "dragon-bit"]);
const DEFAULT_PET = {
  name: "Bit-Bot",
  type: "pixel-slime",
  level: 1,
  xp: 0,
  stats: { logic: 10, speed: 10, power: 10, intellect: 10 },
  color: "#6366f1",
  customPixels: Array(64).fill("transparent"),
  lastFed: 0,
};
const DAILY_CHALLENGE_TIME_ZONE = process.env.APP_TIME_ZONE || "Asia/Almaty";

const getDailyChallengeDate = (): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DAILY_CHALLENGE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const createFirebaseAdminApp = (): FirebaseAdminApp | null => {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!rawServiceAccount) {
    console.error("[FIREBASE] FIREBASE_SERVICE_ACCOUNT_JSON is not set or empty");
    return null;
  }
  try {
    console.log("[FIREBASE] Parsing FIREBASE_SERVICE_ACCOUNT_JSON, length:", rawServiceAccount.length);
    const serviceAccount: unknown = JSON.parse(rawServiceAccount);
    if (typeof serviceAccount !== "object" || serviceAccount === null) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is invalid");
    }
    const candidate = serviceAccount as Record<string, unknown>;
    if (typeof candidate.project_id !== "string" ||
      typeof candidate.client_email !== "string" ||
      typeof candidate.private_key !== "string") {
      console.error("[FIREBASE] Missing fields:", Object.keys(candidate));
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields");
    }
    console.log("[FIREBASE] Service account OK, project_id:", candidate.project_id);
    console.log("[FIREBASE] private_key starts with:", String(candidate.private_key).substring(0, 30));
    console.log("[FIREBASE] private_key contains \\\\n:", String(candidate.private_key).includes("\\n"));
    console.log("[FIREBASE] private_key contains newline:", String(candidate.private_key).includes("\n"));
    return getApps()[0] || initializeApp({
      credential: cert({
        projectId: candidate.project_id,
        clientEmail: candidate.client_email,
        privateKey: candidate.private_key,
      }),
    });
  } catch (error) {
    console.error("[FIREBASE] Firebase Admin is unavailable:", error instanceof Error ? error.message : "invalid configuration");
    console.error("[FIREBASE] Full error:", error);
    return null;
  }
};

const firebaseAdminApp = createFirebaseAdminApp();
const firebaseAdminAuth = firebaseAdminApp ? getFirebaseAdminAuth(firebaseAdminApp) : null;
const firebaseAdminDb = firebaseAdminApp ? getFirestore(firebaseAdminApp) : null;

const readString = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length <= maxLength ? normalized : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null
);

const readUniqueStringArray = (value: unknown, maxItems: number, maxLength: number): string[] | null => {
  if (!Array.isArray(value) || value.length === 0 || value.length > maxItems) return null;
  const values = value.map((entry) => readString(entry, maxLength));
  if (values.some((entry) => !entry)) return null;
  const normalized = values as string[];
  return new Set(normalized).size === normalized.length ? normalized : null;
};

const decodeBase64UrlJson = (value: string): Record<string, unknown> | null => {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const getSigningKeys = async (): Promise<Record<string, string>> => {
  if (signingKeyCache && signingKeyCache.expiresAt > Date.now()) return signingKeyCache.keys;

  const response = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  if (!response.ok) throw new Error("Unable to load Firebase signing keys");
  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Object.values(payload).every((value) => typeof value === "string")) {
    throw new Error("Firebase signing keys response is invalid");
  }

  const cacheControl = response.headers.get("cache-control") || "";
  const maxAgeSeconds = Number(/max-age=(\d+)/.exec(cacheControl)?.[1]) || 3600;
  const keys = payload as Record<string, string>;
  signingKeyCache = { keys, expiresAt: Date.now() + maxAgeSeconds * 1000 };
  return keys;
};

const verifyFirebaseIdToken = async (token: string): Promise<FirebaseIdentity> => {
  if (firebaseAdminAuth) {
    const claims = await firebaseAdminAuth.verifyIdToken(token, true);
    return {
      uid: claims.uid,
      email: claims.email,
      admin: claims.admin === true,
    };
  }

  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed bearer token");

  const header = decodeBase64UrlJson(parts[0]);
  const claims = decodeBase64UrlJson(parts[1]);
  if (!header || !claims || header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new Error("Token header is invalid");
  }

  const keys = await getSigningKeys();
  const certificate = keys[header.kid];
  if (!certificate || !verifySignature(
    "RSA-SHA256",
    Buffer.from(`${parts[0]}.${parts[1]}`),
    createPublicKey(certificate),
    Buffer.from(parts[2], "base64url"),
  )) {
    throw new Error("Token signature is invalid");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const uid = typeof claims.user_id === "string" ? claims.user_id : claims.sub;
  if (
    claims.aud !== firebaseProjectId ||
    claims.iss !== firebaseIssuer ||
    typeof uid !== "string" || uid.length === 0 || uid.length > 128 ||
    claims.sub !== uid ||
    typeof claims.exp !== "number" || claims.exp <= nowSeconds ||
    typeof claims.iat !== "number" || claims.iat > nowSeconds + 60 ||
    typeof claims.auth_time !== "number" || claims.auth_time > nowSeconds + 60
  ) {
    throw new Error("Token claims are invalid");
  }

  return {
    uid,
    email: typeof claims.email === "string" ? claims.email : undefined,
    admin: claims.admin === true,
  };
};

const extractBearerToken = (authorization: string | undefined): string | null => {
  const [scheme, token, ...extra] = (authorization || "").trim().split(/\s+/);
  return scheme === "Bearer" && typeof token === "string" && token.length > 0 && extra.length === 0
    ? token
    : null;
};

const requireAuth: express.RequestHandler = async (req, res, next) => {
  const token = extractBearerToken(req.header("authorization"));
  if (!token) {
    res.status(401).json({ error: "Authentication is required" });
    return;
  }

  try {
    (req as AuthenticatedRequest).identity = await verifyFirebaseIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired authentication token" });
  }
};

const requireAdmin: express.RequestHandler = (req, res, next) => {
  if (!(req as AuthenticatedRequest).identity?.admin) {
    res.status(403).json({ error: "Administrator access is required" });
    return;
  }
  next();
};

const rateLimit = (scope: string, maxRequests: number, windowMs: number): express.RequestHandler => (req, res, next) => {
  const now = Date.now();
  const key = `${scope}:${req.ip}`;
  const current = rateLimitBuckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;
  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);

  if (bucket.count > maxRequests) {
    res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }
  next();
};

const parseMentorMessages = (value: unknown): MentorChatMessage[] | null => {
  if (!Array.isArray(value)) return null;

  const messages = value.slice(-6).map((message): MentorChatMessage | null => {
    if (!isRecord(message) || (message.role !== "user" && message.role !== "assistant")) return null;
    const content = readString(message.content, 2000);
    return content ? { role: message.role, content } : null;
  });

  return messages.every((message): message is MentorChatMessage => message !== null)
    ? messages
    : null;
};

export async function createServerApp() {
  const app = express();
  const httpServer = createServer(app);
  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.APP_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0 && !process.env.VERCEL) {
    throw new Error("CORS_ORIGINS or APP_URL must be configured in production");
  }
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      methods: ["GET", "POST"]
    }
  });

  
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const model = geminiApiKey
    ? new GoogleGenerativeAI(geminiApiKey).getGenerativeModel({ model: "gemini-1.5-flash" })
    : null;

  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });
  app.use(express.json({ limit: "64kb" }));

  
  const rooms = new Map<string, Room>();
  let waitingDuelSocketId: string | null = null;

  setInterval(() => {
    const expiration = Date.now() - 60 * 60 * 1000;
    for (const [roomId, room] of rooms) {
      if (room.lastActivity < expiration) rooms.delete(roomId);
    }
    for (const [key, bucket] of rateLimitBuckets) {
      if (bucket.resetAt < Date.now()) rateLimitBuckets.delete(key);
    }
  }, 10 * 60 * 1000).unref();

  io.use(async (socket, next) => {
    const token = typeof socket.handshake.auth?.token === "string" ? socket.handshake.auth.token : null;
    if (!token) {
      next(new Error("Authentication is required"));
      return;
    }
    try {
      socket.data.identity = await verifyFirebaseIdToken(token);
      next();
    } catch {
      next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_room", (payload: unknown) => {
      if (!isRecord(payload)) return;
      const roomId = readString(payload.roomId, 100);
      const type = payload.type;
      if (type !== 'sandbox' || !roomId || !/^[a-f0-9-]{36}$/i.test(roomId)) return;
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { players: [socket.id], state: {}, type, lastActivity: Date.now() });
      } else {
        const room = rooms.get(roomId)!;
        if (room.type === 'sandbox' && room.players.length < 12 && !room.players.includes(socket.id)) {
          room.players.push(socket.id);
          room.lastActivity = Date.now();
          io.to(roomId).emit("user_joined", { userId: socket.id, count: room.players.length });
        }
      }
    });

    socket.on("find_duel", () => {
      const waitingSocket = waitingDuelSocketId
        ? io.sockets.sockets.get(waitingDuelSocketId)
        : undefined;

      if (!waitingSocket || waitingSocket.id === socket.id) {
        waitingDuelSocketId = socket.id;
        socket.emit("duel_waiting");
        return;
      }

      const roomId = `duel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const players = [waitingSocket.id, socket.id];
      waitingSocket.join(roomId);
      socket.join(roomId);
      rooms.set(roomId, { players, state: {}, type: 'duel', lastActivity: Date.now() });
      waitingDuelSocketId = null;

      io.to(roomId).emit("duel_start", {
        roomId,
        players,
        challengeIndex: Math.floor(Math.random() * 3)
      });
    });

    socket.on("code_update", (payload: unknown) => {
      if (!isRecord(payload)) return;
      const roomId = readString(payload.roomId, 100);
      const code = readString(payload.code, 20000);
      if (!roomId || code === null) return;
      const room = rooms.get(roomId);
      if (!room || room.type !== 'duel' || !room.players.includes(socket.id)) return;
      room.lastActivity = Date.now();
      socket.to(roomId).emit("opponent_code", code);
    });

    socket.on("sandbox_update", (payload: unknown) => {
      if (!isRecord(payload)) return;
      const roomId = readString(payload.roomId, 100);
      const code = readString(payload.code, 20000);
      const cursor = typeof payload.cursor === "number" && Number.isFinite(payload.cursor)
        ? Math.max(0, Math.floor(payload.cursor))
        : undefined;
      if (!roomId || code === null) return;
      const room = rooms.get(roomId);
      if (!room || room.type !== 'sandbox' || !room.players.includes(socket.id)) return;
      room.lastActivity = Date.now();
      socket.to(roomId).emit("remote_update", { code, cursor, userId: socket.id });
    });

    socket.on("duel_action", (payload: unknown) => {
      if (!isRecord(payload)) return;
      const roomId = readString(payload.roomId, 100);
      const action = readString(payload.action, 40);
      if (!roomId || !action || !["finish", "timeout"].includes(action)) return;
      const room = rooms.get(roomId);
      if (!room || room.type !== 'duel' || !room.players.includes(socket.id)) return;
      room.lastActivity = Date.now();
      io.to(roomId).emit("duel_event", { playerId: socket.id, action });
      if (action === 'finish' || action === 'timeout') {
        rooms.delete(roomId);
      }
    });

    socket.on("disconnect", () => {
      if (waitingDuelSocketId === socket.id) {
        waitingDuelSocketId = null;
      }

      for (const [roomId, room] of rooms) {
        if (!room.players.includes(socket.id)) continue;
        room.players = room.players.filter((playerId) => playerId !== socket.id);
        if (room.type === 'duel') {
          socket.to(roomId).emit("duel_event", { playerId: socket.id, action: 'opponent_left' });
          rooms.delete(roomId);
        } else if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit("user_left", { userId: socket.id, count: room.players.length });
        }
      }
    });
  });

  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/lessons/complete", requireAuth, rateLimit("lesson-complete", 30, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const lessonId = readString(req.body?.lessonId, 200);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted lesson service is not configured" });
      return;
    }
    if (!lessonId || !LESSON_IDS.has(lessonId)) {
      res.status(400).json({ error: "Unknown lesson" });
      return;
    }

    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error("USER_NOT_FOUND");
        const profile = snapshot.data()!;
        const completedLessons = Array.isArray(profile.completedLessons)
          ? profile.completedLessons.filter((value: unknown): value is string => typeof value === "string")
          : [];
        if (completedLessons.includes(lessonId)) throw new Error("ALREADY_COMPLETED");

        const xp = Math.max(0, Number(profile.xp) || 0) + LESSON_XP_REWARD;
        const coins = Math.max(0, Number(profile.coins) || 0) + LESSON_COIN_REWARD;
        const level = Math.floor(xp / 250) + 1;
        const skillPoints = Math.max(0, Number(profile.skillPoints) || 0) + Math.max(0, level - (Number(profile.level) || 1)) * 5;
        const nextCompletedLessons = [...completedLessons, lessonId];
        transaction.update(userRef, {
          completedLessons: nextCompletedLessons,
          xp,
          coins,
          level,
          skillPoints,
        });
        return { completedLessons: nextCompletedLessons, xp, coins, level, skillPoints };
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      if (message === "ALREADY_COMPLETED") {
        res.status(409).json({ error: "Lesson has already been completed" });
        return;
      }
      console.error("Lesson completion transaction failed");
      res.status(500).json({ error: "Unable to complete lesson" });
    }
  });

  app.post("/api/daily-challenges/complete", requireAuth, rateLimit("daily-challenge-complete", 10, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const challengeId = readString(req.body?.challengeId, 200);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted daily challenge service is not configured" });
      return;
    }
    if (!challengeId || !/^[A-Za-z0-9_-]+$/.test(challengeId)) {
      res.status(400).json({ error: "Invalid daily challenge" });
      return;
    }

    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const dateKey = getDailyChallengeDate();
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const isBackupChallenge = new RegExp(`^backup_${dateKey}_\\d$`).test(challengeId);
        const isGeneratedChallenge = challengeId === "ai_daily";
        const questRef = !isBackupChallenge && !isGeneratedChallenge
          ? firebaseAdminDb.collection("ai_quests").doc(challengeId)
          : null;
        const [userSnapshot, questSnapshot] = await Promise.all([
          transaction.get(userRef),
          questRef ? transaction.get(questRef) : Promise.resolve(null),
        ]);
        if (!userSnapshot.exists) throw new Error("USER_NOT_FOUND");

        let xpReward = 50;
        let coinReward = 25;
        if (questSnapshot) {
          if (!questSnapshot.exists) throw new Error("CHALLENGE_NOT_FOUND");
          const quest = questSnapshot.data()!;
          const reward = isRecord(quest.reward) ? quest.reward : null;
          const candidateXp = Number(reward?.xp);
          const candidateCoins = Number(reward?.coins);
          if (quest.dateStr !== dateKey || !Number.isSafeInteger(candidateXp) || !Number.isSafeInteger(candidateCoins)
            || candidateXp < 1 || candidateXp > 300 || candidateCoins < 1 || candidateCoins > 200) {
            throw new Error("INVALID_CHALLENGE");
          }
          xpReward = candidateXp;
          coinReward = candidateCoins;
        }

        const profile = userSnapshot.data()!;
        const completedChallenges = Array.isArray(profile.completedDailyChallenges)
          ? profile.completedDailyChallenges.filter((value: unknown): value is string => typeof value === "string")
          : [];
        const completionId = `${dateKey}_${challengeId}`;
        if (completedChallenges.includes(completionId)) throw new Error("ALREADY_COMPLETED");

        const xp = Math.max(0, Number(profile.xp) || 0) + xpReward;
        const coins = Math.max(0, Number(profile.coins) || 0) + coinReward;
        const level = Math.floor(xp / 250) + 1;
        const skillPoints = Math.max(0, Number(profile.skillPoints) || 0) + Math.max(0, level - (Number(profile.level) || 1)) * 5;
        const nextCompletedChallenges = [...completedChallenges, completionId];
        transaction.update(userRef, {
          completedDailyChallenges: nextCompletedChallenges,
          xp,
          coins,
          level,
          skillPoints,
        });
        return {
          completedDailyChallenges: nextCompletedChallenges,
          xp,
          coins,
          level,
          skillPoints,
          reward: { xp: xpReward, coins: coinReward },
        };
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND" || message === "CHALLENGE_NOT_FOUND") {
        res.status(404).json({ error: "Daily challenge was not found" });
        return;
      }
      if (message === "ALREADY_COMPLETED") {
        res.status(409).json({ error: "Daily challenge has already been completed" });
        return;
      }
      if (message === "INVALID_CHALLENGE") {
        res.status(409).json({ error: "Daily challenge is not available today" });
        return;
      }
      console.error("Daily challenge completion transaction failed");
      res.status(500).json({ error: "Unable to complete daily challenge" });
    }
  });

  app.post("/api/arcade/complete", requireAuth, rateLimit("arcade-complete", 20, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const gameId = readString(req.body?.gameId, 50);
    const reward = gameId ? ARCADE_REWARDS.get(gameId) : undefined;
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted arcade service is not configured" });
      return;
    }
    if (!gameId || !reward) {
      res.status(400).json({ error: "Unknown arcade game" });
      return;
    }

    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error("USER_NOT_FOUND");
        const profile = snapshot.data()!;
        const claims = Array.isArray(profile.arcadeRewardClaims)
          ? profile.arcadeRewardClaims.filter((value: unknown): value is string => typeof value === "string")
          : [];
        const claimId = `${getDailyChallengeDate()}_${gameId}`;
        if (claims.includes(claimId)) throw new Error("ALREADY_CLAIMED");

        const xp = Math.max(0, Number(profile.xp) || 0) + reward.xp;
        const coins = Math.max(0, Number(profile.coins) || 0) + reward.coins;
        const level = Math.floor(xp / 250) + 1;
        const skillPoints = Math.max(0, Number(profile.skillPoints) || 0) + Math.max(0, level - (Number(profile.level) || 1)) * 5;
        const arcadeRewardClaims = [...claims, claimId].slice(-3650);
        transaction.update(userRef, { xp, coins, level, skillPoints, arcadeRewardClaims });
        return { xp, coins, level, skillPoints, reward };
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      if (message === "ALREADY_CLAIMED") {
        res.status(409).json({ error: "This arcade reward has already been claimed today" });
        return;
      }
      console.error("Arcade reward transaction failed");
      res.status(500).json({ error: "Unable to grant arcade reward" });
    }
  });

  app.post("/api/bosses/complete", requireAuth, rateLimit("solo-boss-complete", 10, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const bossId = readString(req.body?.bossId, 50);
    const reward = bossId ? SOLO_BOSS_REWARDS.get(bossId) : undefined;
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted boss service is not configured" });
      return;
    }
    if (!bossId || !reward) {
      res.status(400).json({ error: "Unknown boss" });
      return;
    }

    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error("USER_NOT_FOUND");
        const profile = snapshot.data()!;
        const completedBosses = Array.isArray(profile.completedBosses)
          ? profile.completedBosses.filter((value: unknown): value is string => typeof value === "string")
          : [];
        if (completedBosses.includes(bossId)) throw new Error("ALREADY_COMPLETED");

        const xp = Math.max(0, Number(profile.xp) || 0) + reward.xp;
        const coins = Math.max(0, Number(profile.coins) || 0) + reward.coins;
        const level = Math.floor(xp / 250) + 1;
        const skillPoints = Math.max(0, Number(profile.skillPoints) || 0) + Math.max(0, level - (Number(profile.level) || 1)) * 5;
        const nextCompletedBosses = [...completedBosses, bossId];
        transaction.update(userRef, { xp, coins, level, skillPoints, completedBosses: nextCompletedBosses });
        return { xp, coins, level, skillPoints, reward };
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      if (message === "ALREADY_COMPLETED") {
        res.status(409).json({ error: "Boss reward has already been claimed" });
        return;
      }
      console.error("Solo boss reward transaction failed");
      res.status(500).json({ error: "Unable to grant boss reward" });
    }
  });

  app.post("/api/bosses/global/contribute", requireAuth, rateLimit("global-boss-contribute", 10, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const bossId = readString(req.body?.bossId, 100);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted boss service is not configured" });
      return;
    }
    if (!bossId) {
      res.status(400).json({ error: "bossId is required" });
      return;
    }

    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const bossRef = firebaseAdminDb.collection("active_bosses").doc(bossId);
        const [userSnapshot, bossSnapshot] = await Promise.all([transaction.get(userRef), transaction.get(bossRef)]);
        if (!userSnapshot.exists) throw new Error("USER_NOT_FOUND");
        if (!bossSnapshot.exists) throw new Error("BOSS_NOT_FOUND");
        const boss = bossSnapshot.data()!;
        const endsAtMs = boss.endsAt && typeof boss.endsAt.toMillis === "function" ? boss.endsAt.toMillis() : Number(boss.endsAt);
        const currentHp = Math.max(0, Number(boss.currentHp) || 0);
        if (boss.active !== true || !Number.isSafeInteger(endsAtMs) || endsAtMs <= Date.now() || currentHp <= 0) {
          throw new Error("BOSS_INACTIVE");
        }

        const profile = userSnapshot.data()!;
        const claims = Array.isArray(profile.globalBossClaims)
          ? profile.globalBossClaims.filter((value: unknown): value is string => typeof value === "string")
          : [];
        const claimId = `${bossId}_${endsAtMs}`;
        if (claims.includes(claimId)) throw new Error("ALREADY_CONTRIBUTED");
        const damage = 20;
        const reward = { xp: 50, coins: 25 };
        const xp = Math.max(0, Number(profile.xp) || 0) + reward.xp;
        const coins = Math.max(0, Number(profile.coins) || 0) + reward.coins;
        const level = Math.floor(xp / 250) + 1;
        const skillPoints = Math.max(0, Number(profile.skillPoints) || 0) + Math.max(0, level - (Number(profile.level) || 1)) * 5;
        transaction.update(bossRef, { currentHp: Math.max(0, currentHp - damage) });
        transaction.update(userRef, {
          xp,
          coins,
          level,
          skillPoints,
          globalBossClaims: [...claims, claimId].slice(-1000),
        });
        return { damage, currentHp: Math.max(0, currentHp - damage), xp, coins, level, skillPoints, reward };
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND" || message === "BOSS_NOT_FOUND") {
        res.status(404).json({ error: "Boss or user profile was not found" });
        return;
      }
      if (message === "ALREADY_CONTRIBUTED") {
        res.status(409).json({ error: "You have already contributed to this boss" });
        return;
      }
      if (message === "BOSS_INACTIVE") {
        res.status(409).json({ error: "This boss is no longer active" });
        return;
      }
      console.error("Global boss contribution transaction failed");
      res.status(500).json({ error: "Unable to record contribution" });
    }
  });

  app.post("/api/tournaments/complete", requireAuth, rateLimit("tournament-complete", 10, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const tournamentId = readString(req.body?.tournamentId, 50);
    const reward = tournamentId ? TOURNAMENT_REWARDS.get(tournamentId) : undefined;
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted tournament service is not configured" });
      return;
    }
    if (!tournamentId || !reward) {
      res.status(400).json({ error: "Unknown tournament" });
      return;
    }

    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error("USER_NOT_FOUND");
        const profile = snapshot.data()!;
        const completedTournaments = Array.isArray(profile.completedTournaments)
          ? profile.completedTournaments.filter((value: unknown): value is string => typeof value === "string")
          : [];
        if (completedTournaments.includes(tournamentId)) throw new Error("ALREADY_COMPLETED");

        const xp = Math.max(0, Number(profile.xp) || 0) + reward.xp;
        const coins = Math.max(0, Number(profile.coins) || 0) + reward.coins;
        const level = Math.floor(xp / 250) + 1;
        const skillPoints = Math.max(0, Number(profile.skillPoints) || 0) + Math.max(0, level - (Number(profile.level) || 1)) * 5;
        transaction.update(userRef, {
          xp,
          coins,
          level,
          skillPoints,
          completedTournaments: [...completedTournaments, tournamentId],
        });
        return { xp, coins, level, skillPoints, reward };
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      if (message === "ALREADY_COMPLETED") {
        res.status(409).json({ error: "Tournament reward has already been claimed" });
        return;
      }
      console.error("Tournament reward transaction failed");
      res.status(500).json({ error: "Unable to grant tournament reward" });
    }
  });

  app.post("/api/rewards/daily", requireAuth, rateLimit("daily-reward", 5, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    if (!identity || !firebaseAdminDb) {
      console.error("[DAILY] Service unavailable. identity:", !!identity, "firebaseAdminDb:", !!firebaseAdminDb);
      res.status(503).json({ error: "Trusted rewards service is not configured" });
      return;
    }

    try {
      const reward = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error("USER_NOT_FOUND");

        const profile = snapshot.data()!;
        const lastDailyReward = profile.lastDailyReward;
        const lastClaimMs = lastDailyReward && typeof lastDailyReward.toDate === "function"
          ? lastDailyReward.toDate().getTime()
          : typeof lastDailyReward === "string" || typeof lastDailyReward === "number"
            ? new Date(lastDailyReward).getTime()
            : 0;
        const now = Date.now();
        if (Number.isFinite(lastClaimMs) && lastClaimMs > 0 && now - lastClaimMs < 24 * 60 * 60 * 1000) {
          throw new Error("ALREADY_CLAIMED");
        }

        const xp = Math.max(0, Number(profile.xp) || 0);
        const coins = Math.max(0, Number(profile.coins) || 0);
        const xpReward = 50;
        const coinReward = 25;
        const nextXp = xp + xpReward;
        const nextCoins = coins + coinReward;
        const nextLevel = Math.floor(nextXp / 250) + 1;

        transaction.update(userRef, {
          xp: nextXp,
          coins: nextCoins,
          level: nextLevel,
          lastDailyReward: FieldValue.serverTimestamp(),
        });

        return { xpReward, coinReward, xp: nextXp, coins: nextCoins, level: nextLevel, claimedAt: new Date(now).toISOString() };
      });
      res.json(reward);
    } catch (error) {
      if (error instanceof Error && error.message === "ALREADY_CLAIMED") {
        res.status(409).json({ error: "Daily reward has already been claimed" });
        return;
      }
      if (error instanceof Error && error.message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      console.error("Daily reward transaction failed");
      res.status(500).json({ error: "Unable to claim daily reward" });
    }
  });

  app.post("/api/shop/purchase", requireAuth, rateLimit("shop-purchase", 20, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const itemId = readString(req.body?.itemId, 100);
    const item = itemId ? SHOP_CATALOG.get(itemId) : undefined;
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted shop service is not configured" });
      return;
    }
    if (!item || !itemId) {
      res.status(400).json({ error: "This item cannot be purchased" });
      return;
    }

    try {
      const purchase = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error("USER_NOT_FOUND");

        const profile = snapshot.data()!;
        const coins = Math.max(0, Number(profile.coins) || 0);
        if (coins < item.price) throw new Error("INSUFFICIENT_COINS");
        const inventory = Array.isArray(profile.inventory) ? profile.inventory : [];
        const purchasedItem = {
          id: `${itemId}_${randomUUID()}`,
          itemId,
          name: item.name,
          acquiredAt: Date.now(),
        };
        const nextInventory = [...inventory, purchasedItem];
        const nextCoins = coins - item.price;
        transaction.update(userRef, { coins: nextCoins, inventory: nextInventory });
        return { coins: nextCoins, inventory: nextInventory, purchasedItem };
      });
      res.json(purchase);
    } catch (error) {
      if (error instanceof Error && error.message === "INSUFFICIENT_COINS") {
        res.status(409).json({ error: "Insufficient coins" });
        return;
      }
      if (error instanceof Error && error.message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      console.error("Shop purchase transaction failed");
      res.status(500).json({ error: "Unable to complete purchase" });
    }
  });

  app.post("/api/shop/quick-sell", requireAuth, rateLimit("shop-quick-sell", 20, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const inventoryId = readString(req.body?.inventoryId, 200);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted shop service is not configured" });
      return;
    }
    if (!inventoryId) {
      res.status(400).json({ error: "inventoryId is required" });
      return;
    }

    try {
      const sale = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error("USER_NOT_FOUND");
        const profile = snapshot.data()!;
        const inventory = Array.isArray(profile.inventory) ? profile.inventory : [];
        const itemIndex = inventory.findIndex((entry: unknown) => isRecord(entry) && entry.id === inventoryId);
        if (itemIndex === -1) throw new Error("ITEM_NOT_FOUND");

        const nextInventory = inventory.filter((_: unknown, index: number) => index !== itemIndex);
        const nextCoins = Math.max(0, Number(profile.coins) || 0) + 100;
        transaction.update(userRef, { coins: nextCoins, inventory: nextInventory });
        return { coins: nextCoins, inventory: nextInventory, sellPrice: 100 };
      });
      res.json(sale);
    } catch (error) {
      if (error instanceof Error && error.message === "ITEM_NOT_FOUND") {
        res.status(404).json({ error: "Inventory item was not found" });
        return;
      }
      if (error instanceof Error && error.message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      console.error("Quick sell transaction failed");
      res.status(500).json({ error: "Unable to complete sale" });
    }
  });

  app.post("/api/shop/refresh", requireAuth, rateLimit("shop-refresh", 10, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted shop service is not configured" });
      return;
    }

    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error("USER_NOT_FOUND");
        const profile = snapshot.data()!;
        const coins = Math.max(0, Number(profile.coins) || 0);
        const refreshCost = 50;
        if (coins < refreshCost) throw new Error("INSUFFICIENT_COINS");
        const nextCoins = coins - refreshCost;
        transaction.update(userRef, { coins: nextCoins });
        return { coins: nextCoins, refreshCost };
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      if (message === "INSUFFICIENT_COINS") {
        res.status(409).json({ error: "Insufficient coins" });
        return;
      }
      console.error("Shop refresh transaction failed");
      res.status(500).json({ error: "Unable to refresh shop" });
    }
  });

  app.post("/api/inventory/use", requireAuth, rateLimit("inventory-use", 30, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const inventoryId = readString(req.body?.inventoryId, 200);
    const asPetFood = req.body?.asPetFood === true;
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted inventory service is not configured" });
      return;
    }
    if (!inventoryId) {
      res.status(400).json({ error: "inventoryId is required" });
      return;
    }

    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error("USER_NOT_FOUND");
        const profile = snapshot.data()!;
        const inventory = Array.isArray(profile.inventory) ? profile.inventory : [];
        const itemIndex = inventory.findIndex((entry: unknown) => isRecord(entry) && entry.id === inventoryId);
        if (itemIndex === -1) throw new Error("ITEM_NOT_FOUND");
        const inventoryItem = inventory[itemIndex];
        const itemId = isRecord(inventoryItem) && typeof inventoryItem.itemId === "string" ? inventoryItem.itemId : null;
        const effect = itemId ? ITEM_EFFECTS.get(itemId) : undefined;
        if (!effect) throw new Error("ITEM_NOT_USABLE");
        if (asPetFood && !effect.petStats && !effect.randomPetStat) throw new Error("ITEM_NOT_PET_FOOD");

        const nextInventory = inventory.filter((_: unknown, index: number) => index !== itemIndex);
        const changes: Record<string, unknown> = { inventory: nextInventory };
        const stats = isRecord(profile.stats) ? { ...profile.stats } : {};
        if (effect.stats) {
          for (const [stat, amount] of Object.entries(effect.stats)) {
            stats[stat] = Math.min(10_000, Math.max(0, Number(stats[stat]) || 0) + amount);
          }
          changes.stats = stats;
        }

        let nextPet: Record<string, unknown> | null = null;
        if (effect.petStats || effect.randomPetStat) {
          if (!isRecord(profile.pet)) throw new Error("PET_REQUIRED");
          nextPet = { ...profile.pet };
          const petStats = isRecord(nextPet.stats) ? { ...nextPet.stats } : {};
          const petBoosts = { ...(effect.petStats || {}) };
          if (effect.randomPetStat) {
            const randomStat = effect.randomPetStat.stats[randomInt(effect.randomPetStat.stats.length)];
            petBoosts[randomStat] = (petBoosts[randomStat] || 0) + effect.randomPetStat.amount;
          }
          for (const [stat, amount] of Object.entries(petBoosts)) {
            petStats[stat] = Math.min(10_000, Math.max(0, Number(petStats[stat]) || 0) + amount);
          }
          nextPet.stats = petStats;
          if (asPetFood) {
            nextPet.level = Math.min(100, Math.max(1, Number(nextPet.level) || 1) + 1);
            nextPet.lastFed = Date.now();
          }
          changes.pet = nextPet;
        }

        const xpGain = effect.xp || 0;
        if (xpGain > 0) {
          const xp = Math.max(0, Number(profile.xp) || 0) + xpGain;
          const level = Math.floor(xp / 250) + 1;
          changes.xp = xp;
          changes.level = level;
          changes.skillPoints = Math.max(0, Number(profile.skillPoints) || 0) + Math.max(0, level - (Number(profile.level) || 1)) * 5;
        }

        transaction.update(userRef, changes);
        return {
          inventory: nextInventory,
          stats: changes.stats,
          pet: changes.pet,
          xp: changes.xp,
          level: changes.level,
          skillPoints: changes.skillPoints,
          message: effect.message,
        };
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND" || message === "ITEM_NOT_FOUND") {
        res.status(404).json({ error: "Inventory item was not found" });
        return;
      }
      if (message === "PET_REQUIRED") {
        res.status(409).json({ error: "A pet is required to use this item" });
        return;
      }
      if (message === "ITEM_NOT_USABLE" || message === "ITEM_NOT_PET_FOOD") {
        res.status(409).json({ error: "This item cannot be used this way" });
        return;
      }
      console.error("Inventory use transaction failed");
      res.status(500).json({ error: "Unable to use inventory item" });
    }
  });

  app.post("/api/pet/customize", requireAuth, rateLimit("pet-customize", 30, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const name = req.body?.name === undefined ? undefined : readString(req.body.name, 32);
    const type = req.body?.type === undefined ? undefined : readString(req.body.type, 32);
    const customPixels = req.body?.customPixels;
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted pet service is not configured" });
      return;
    }
    const validType = type === undefined || PET_TYPES.has(type) || /^emoji:[\p{Extended_Pictographic}\u200d\ufe0f]{1,8}$/u.test(type);
    const validPixels = customPixels === undefined || (
      Array.isArray(customPixels)
      && customPixels.length === 64
      && customPixels.every((pixel) => typeof pixel === "string" && (pixel === "transparent" || /^#[0-9a-fA-F]{6}$/.test(pixel)))
    );
    if ((name !== undefined && name.length === 0) || !validType || !validPixels) {
      res.status(400).json({ error: "Invalid pet customization" });
      return;
    }

    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error("USER_NOT_FOUND");
        const profile = snapshot.data()!;
        const pet = isRecord(profile.pet) ? { ...DEFAULT_PET, ...profile.pet } : { ...DEFAULT_PET };
        if (name !== undefined) pet.name = name;
        if (type !== undefined) pet.type = type;
        if (customPixels !== undefined) pet.customPixels = customPixels;
        transaction.update(userRef, { pet });
        return { pet };
      });
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      console.error("Pet customization transaction failed");
      res.status(500).json({ error: "Unable to customize pet" });
    }
  });

  app.post("/api/pet/train", requireAuth, rateLimit("pet-train", 20, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const stat = readString(req.body?.stat, 20);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted pet service is not configured" });
      return;
    }
    if (stat !== "logic" && stat !== "speed" && stat !== "power") {
      res.status(400).json({ error: "Invalid training stat" });
      return;
    }

    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error("USER_NOT_FOUND");
        const profile = snapshot.data()!;
        const coins = Math.max(0, Number(profile.coins) || 0);
        if (coins < 50) throw new Error("INSUFFICIENT_COINS");
        const pet = isRecord(profile.pet) ? { ...DEFAULT_PET, ...profile.pet } : { ...DEFAULT_PET };
        const petStats = isRecord(pet.stats) ? { ...pet.stats } : { ...DEFAULT_PET.stats };
        petStats[stat] = Math.min(10_000, Math.max(0, Number(petStats[stat]) || 0) + 1);
        pet.stats = petStats;
        const nextCoins = coins - 50;
        transaction.update(userRef, { coins: nextCoins, pet });
        return { coins: nextCoins, pet };
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      if (message === "INSUFFICIENT_COINS") {
        res.status(409).json({ error: "Insufficient coins" });
        return;
      }
      console.error("Pet training transaction failed");
      res.status(500).json({ error: "Unable to train pet" });
    }
  });

  app.post("/api/perks/unlock", requireAuth, rateLimit("perk-unlock", 20, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const perkId = readString(req.body?.perkId, 100);
    const perk = perkId ? PERKS.find((candidate) => candidate.id === perkId) : undefined;
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted perks service is not configured" });
      return;
    }
    if (!perk) {
      res.status(400).json({ error: "Unknown perk" });
      return;
    }

    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error("USER_NOT_FOUND");
        const profile = snapshot.data()!;
        const perks = Array.isArray(profile.perks)
          ? profile.perks.filter((value: unknown): value is string => typeof value === "string")
          : [];
        if (perks.includes(perk.id)) throw new Error("ALREADY_UNLOCKED");
        const skillPoints = Math.max(0, Number(profile.skillPoints) || 0);
        if (skillPoints < perk.cost) throw new Error("INSUFFICIENT_SKILL_POINTS");
        const stats = isRecord(profile.stats) ? { ...profile.stats } : {};
        if (!perk.requirements.every((requirement) => (Number(stats[requirement.stat]) || 0) >= requirement.min)) {
          throw new Error("REQUIREMENTS_NOT_MET");
        }
        if (perk.bonus.type === "stat_boost" && perk.bonus.targetStat) {
          const stat = perk.bonus.targetStat;
          stats[stat] = Math.min(10_000, Math.max(0, Number(stats[stat]) || 0) + perk.bonus.value);
        }
        const nextSkillPoints = skillPoints - perk.cost;
        transaction.update(userRef, { perks: [...perks, perk.id], skillPoints: nextSkillPoints, stats });
        return { perks: [...perks, perk.id], skillPoints: nextSkillPoints, stats };
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      if (message === "ALREADY_UNLOCKED") {
        res.status(409).json({ error: "Perk is already unlocked" });
        return;
      }
      if (message === "INSUFFICIENT_SKILL_POINTS" || message === "REQUIREMENTS_NOT_MET") {
        res.status(409).json({ error: "Perk requirements are not met" });
        return;
      }
      console.error("Perk unlock transaction failed");
      res.status(500).json({ error: "Unable to unlock perk" });
    }
  });

  app.post("/api/guilds/create", requireAuth, rateLimit("guild-create", 5, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const name = readString(req.body?.name, 50);
    const description = readString(req.body?.description, 500);
    const icon = readString(req.body?.icon, 16) || "⚔️";
    const requiredLevel = Number(req.body?.requiredLevel);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted guild service is not configured" });
      return;
    }
    if (!name || !description || !Number.isSafeInteger(requiredLevel) || requiredLevel < 1 || requiredLevel > 100) {
      res.status(400).json({ error: "Invalid guild details" });
      return;
    }

    try {
      const guild = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const guildRef = firebaseAdminDb.collection("guilds").doc();
        const userSnapshot = await transaction.get(userRef);
        if (!userSnapshot.exists) throw new Error("USER_NOT_FOUND");
        const profile = userSnapshot.data()!;
        if (profile.guildId) throw new Error("ALREADY_IN_GUILD");
        const username = typeof profile.username === "string" ? profile.username.slice(0, 50) : "Игрок";
        const guildData = {
          id: guildRef.id,
          name,
          description,
          icon,
          color: "brand-primary",
          leaderId: identity.uid,
          members: [{ uid: identity.uid, username, role: "leader", contribution: 0, joinedAt: Date.now() }],
          memberCount: 1,
          level: 1,
          xp: 0,
          perks: [],
          createdAt: FieldValue.serverTimestamp(),
          isPublic: true,
          requiredLevel,
        };
        transaction.create(guildRef, guildData);
        transaction.update(userRef, { guildId: guildRef.id, guildRole: "leader" });
        return { id: guildRef.id, ...guildData };
      });
      res.status(201).json({ guild });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      if (message === "ALREADY_IN_GUILD") {
        res.status(409).json({ error: "You are already in a guild" });
        return;
      }
      console.error("Guild creation transaction failed");
      res.status(500).json({ error: "Unable to create guild" });
    }
  });

  app.post("/api/guilds/join", requireAuth, rateLimit("guild-join", 10, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const guildId = readString(req.body?.guildId, 200);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted guild service is not configured" });
      return;
    }
    if (!guildId) {
      res.status(400).json({ error: "guildId is required" });
      return;
    }

    try {
      await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const guildRef = firebaseAdminDb.collection("guilds").doc(guildId);
        const [userSnapshot, guildSnapshot] = await Promise.all([transaction.get(userRef), transaction.get(guildRef)]);
        if (!userSnapshot.exists) throw new Error("USER_NOT_FOUND");
        if (!guildSnapshot.exists) throw new Error("GUILD_NOT_FOUND");
        const profile = userSnapshot.data()!;
        const guild = guildSnapshot.data()!;
        if (profile.guildId) throw new Error("ALREADY_IN_GUILD");
        const members = Array.isArray(guild.members) ? guild.members : [];
        if (guild.isPublic !== true || members.length >= 50 || (Number(profile.level) || 1) < (Number(guild.requiredLevel) || 1)) {
          throw new Error("GUILD_UNAVAILABLE");
        }
        const username = typeof profile.username === "string" ? profile.username.slice(0, 50) : "Игрок";
        transaction.update(guildRef, {
          members: [...members, { uid: identity.uid, username, role: "member", contribution: 0, joinedAt: Date.now() }],
          memberCount: members.length + 1,
        });
        transaction.update(userRef, { guildId, guildRole: "member" });
      });
      res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND" || message === "GUILD_NOT_FOUND") {
        res.status(404).json({ error: "Guild or user profile was not found" });
        return;
      }
      if (message === "ALREADY_IN_GUILD" || message === "GUILD_UNAVAILABLE") {
        res.status(409).json({ error: "You cannot join this guild" });
        return;
      }
      console.error("Guild join transaction failed");
      res.status(500).json({ error: "Unable to join guild" });
    }
  });

  app.post("/api/guilds/leave", requireAuth, rateLimit("guild-leave", 10, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const guildId = readString(req.body?.guildId, 200);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted guild service is not configured" });
      return;
    }
    if (!guildId) {
      res.status(400).json({ error: "guildId is required" });
      return;
    }
    try {
      await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const guildRef = firebaseAdminDb.collection("guilds").doc(guildId);
        const [userSnapshot, guildSnapshot] = await Promise.all([transaction.get(userRef), transaction.get(guildRef)]);
        if (!userSnapshot.exists || !guildSnapshot.exists) throw new Error("NOT_FOUND");
        const guild = guildSnapshot.data()!;
        const members = Array.isArray(guild.members) ? guild.members : [];
        const member = members.find((candidate: unknown) => isRecord(candidate) && candidate.uid === identity.uid);
        if (!member) throw new Error("NOT_MEMBER");
        if (guild.leaderId === identity.uid && members.length > 1) throw new Error("LEADER_MUST_TRANSFER");
        if (members.length === 1) transaction.delete(guildRef);
        else transaction.update(guildRef, { members: members.filter((candidate: unknown) => !isRecord(candidate) || candidate.uid !== identity.uid), memberCount: members.length - 1 });
        transaction.update(userRef, { guildId: null, guildRole: null });
      });
      res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "NOT_FOUND" || message === "NOT_MEMBER") {
        res.status(404).json({ error: "Guild membership was not found" });
        return;
      }
      if (message === "LEADER_MUST_TRANSFER") {
        res.status(409).json({ error: "Transfer leadership before leaving" });
        return;
      }
      console.error("Guild leave transaction failed");
      res.status(500).json({ error: "Unable to leave guild" });
    }
  });

  app.post("/api/guilds/messages", requireAuth, rateLimit("guild-message", 30, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const guildId = readString(req.body?.guildId, 200);
    const text = readString(req.body?.text, 1000);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted guild service is not configured" });
      return;
    }
    if (!guildId || !text) {
      res.status(400).json({ error: "guildId and text are required" });
      return;
    }
    try {
      const message = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const userSnapshot = await transaction.get(userRef);
        if (!userSnapshot.exists || userSnapshot.data()!.guildId !== guildId) throw new Error("NOT_MEMBER");
        const profile = userSnapshot.data()!;
        const messageRef = firebaseAdminDb.collection("guilds").doc(guildId).collection("messages").doc();
        const payload = {
          id: messageRef.id,
          text,
          senderId: identity.uid,
          senderName: typeof profile.username === "string" ? profile.username.slice(0, 50) : "Игрок",
          timestamp: FieldValue.serverTimestamp(),
        };
        transaction.create(messageRef, payload);
        return { id: messageRef.id, ...payload };
      });
      res.status(201).json({ message });
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_MEMBER") {
        res.status(403).json({ error: "You are not a member of this guild" });
        return;
      }
      console.error("Guild message transaction failed");
      res.status(500).json({ error: "Unable to send guild message" });
    }
  });

  app.post("/api/friends/requests", requireAuth, rateLimit("friend-request", 10, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const receiverId = readString(req.body?.receiverId, 128);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted social service is not configured" });
      return;
    }
    if (!receiverId || receiverId === identity.uid) {
      res.status(400).json({ error: "A different recipient is required" });
      return;
    }
    try {
      const request = await firebaseAdminDb.runTransaction(async (transaction) => {
        const senderRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const receiverRef = firebaseAdminDb.collection("users").doc(receiverId);
        const [senderSnapshot, receiverSnapshot] = await Promise.all([transaction.get(senderRef), transaction.get(receiverRef)]);
        if (!senderSnapshot.exists || !receiverSnapshot.exists) throw new Error("USER_NOT_FOUND");
        const sender = senderSnapshot.data()!;
        const senderFriends = Array.isArray(sender.friends) ? sender.friends : [];
        if (senderFriends.includes(receiverId)) throw new Error("ALREADY_FRIENDS");
        const requestRef = firebaseAdminDb.collection("friend_requests").doc();
        const payload = {
          id: requestRef.id,
          senderId: identity.uid,
          senderName: typeof sender.username === "string" ? sender.username.slice(0, 50) : "Игрок",
          receiverId,
          status: "pending",
          createdAt: FieldValue.serverTimestamp(),
        };
        transaction.create(requestRef, payload);
        return { id: requestRef.id, ...payload };
      });
      res.status(201).json({ request });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      if (message === "ALREADY_FRIENDS") {
        res.status(409).json({ error: "You are already friends" });
        return;
      }
      console.error("Friend request transaction failed");
      res.status(500).json({ error: "Unable to send friend request" });
    }
  });

  app.post("/api/friends/requests/accept", requireAuth, rateLimit("friend-accept", 20, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const requestId = readString(req.body?.requestId, 200);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted social service is not configured" });
      return;
    }
    if (!requestId) {
      res.status(400).json({ error: "requestId is required" });
      return;
    }
    try {
      await firebaseAdminDb.runTransaction(async (transaction) => {
        const requestRef = firebaseAdminDb.collection("friend_requests").doc(requestId);
        const requestSnapshot = await transaction.get(requestRef);
        if (!requestSnapshot.exists) throw new Error("REQUEST_NOT_FOUND");
        const friendRequest = requestSnapshot.data()!;
        const senderId = typeof friendRequest.senderId === "string" ? friendRequest.senderId : null;
        if (!senderId || friendRequest.receiverId !== identity.uid || friendRequest.status !== "pending") throw new Error("INVALID_REQUEST");
        const receiverRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const senderRef = firebaseAdminDb.collection("users").doc(senderId);
        const [receiverSnapshot, senderSnapshot] = await Promise.all([transaction.get(receiverRef), transaction.get(senderRef)]);
        if (!receiverSnapshot.exists || !senderSnapshot.exists) throw new Error("USER_NOT_FOUND");
        const receiverFriends = Array.isArray(receiverSnapshot.data()!.friends) ? receiverSnapshot.data()!.friends : [];
        const senderFriends = Array.isArray(senderSnapshot.data()!.friends) ? senderSnapshot.data()!.friends : [];
        transaction.update(receiverRef, { friends: [...new Set([...receiverFriends, senderId])] });
        transaction.update(senderRef, { friends: [...new Set([...senderFriends, identity.uid])] });
        transaction.update(requestRef, { status: "accepted", acceptedAt: FieldValue.serverTimestamp() });
      });
      res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "REQUEST_NOT_FOUND" || message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "Friend request or user profile was not found" });
        return;
      }
      if (message === "INVALID_REQUEST") {
        res.status(403).json({ error: "This request cannot be accepted" });
        return;
      }
      console.error("Friend acceptance transaction failed");
      res.status(500).json({ error: "Unable to accept friend request" });
    }
  });

  app.post("/api/friends/requests/decline", requireAuth, rateLimit("friend-decline", 20, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const requestId = readString(req.body?.requestId, 200);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted social service is not configured" });
      return;
    }
    if (!requestId) {
      res.status(400).json({ error: "requestId is required" });
      return;
    }
    try {
      await firebaseAdminDb.runTransaction(async (transaction) => {
        const requestRef = firebaseAdminDb.collection("friend_requests").doc(requestId);
        const requestSnapshot = await transaction.get(requestRef);
        if (!requestSnapshot.exists) throw new Error("REQUEST_NOT_FOUND");
        const friendRequest = requestSnapshot.data()!;
        if (friendRequest.receiverId !== identity.uid || friendRequest.status !== "pending") throw new Error("INVALID_REQUEST");
        transaction.update(requestRef, { status: "declined", declinedAt: FieldValue.serverTimestamp() });
      });
      res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "REQUEST_NOT_FOUND") {
        res.status(404).json({ error: "Friend request was not found" });
        return;
      }
      if (message === "INVALID_REQUEST") {
        res.status(403).json({ error: "This request cannot be declined" });
        return;
      }
      console.error("Friend decline transaction failed");
      res.status(500).json({ error: "Unable to decline friend request" });
    }
  });

  app.post("/api/friends/remove", requireAuth, rateLimit("friend-remove", 20, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const friendId = readString(req.body?.friendId, 128);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted social service is not configured" });
      return;
    }
    if (!friendId || friendId === identity.uid) {
      res.status(400).json({ error: "A different friendId is required" });
      return;
    }
    try {
      await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const friendRef = firebaseAdminDb.collection("users").doc(friendId);
        const [userSnapshot, friendSnapshot] = await Promise.all([transaction.get(userRef), transaction.get(friendRef)]);
        if (!userSnapshot.exists || !friendSnapshot.exists) throw new Error("USER_NOT_FOUND");
        const friends = Array.isArray(userSnapshot.data()!.friends) ? userSnapshot.data()!.friends : [];
        if (!friends.includes(friendId)) throw new Error("NOT_FRIENDS");
        const otherFriends = Array.isArray(friendSnapshot.data()!.friends) ? friendSnapshot.data()!.friends : [];
        transaction.update(userRef, { friends: friends.filter((candidate: unknown) => candidate !== friendId) });
        transaction.update(friendRef, { friends: otherFriends.filter((candidate: unknown) => candidate !== identity.uid) });
      });
      res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      if (message === "NOT_FRIENDS") {
        res.status(409).json({ error: "Users are not friends" });
        return;
      }
      console.error("Friend removal transaction failed");
      res.status(500).json({ error: "Unable to remove friend" });
    }
  });

  app.post("/api/community/snippets", requireAuth, rateLimit("snippet-create", 10, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const title = readString(req.body?.title, 100);
    const description = readString(req.body?.description, 500) || "";
    const code = readString(req.body?.code, 10_000);
    const tags = Array.isArray(req.body?.tags)
      ? req.body.tags.map((tag: unknown) => readString(tag, 32)).filter((tag: string | null): tag is string => Boolean(tag)).slice(0, 8)
      : null;
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted community service is not configured" });
      return;
    }
    if (!title || !code || !tags || new Set(tags).size !== tags.length || /(?:lesson_solution|challenge_answer)/i.test(title)) {
      res.status(400).json({ error: "Invalid snippet details" });
      return;
    }

    try {
      const userSnapshot = await firebaseAdminDb.collection("users").doc(identity.uid).get();
      if (!userSnapshot.exists) {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      const profile = userSnapshot.data()!;
      const snippetRef = firebaseAdminDb.collection("snippets").doc();
      const snippet = {
        id: snippetRef.id,
        title,
        description,
        code,
        authorId: identity.uid,
        authorName: typeof profile.username === "string" ? profile.username.slice(0, 50) : "Игрок",
        authorPhoto: typeof profile.avatar === "string" ? profile.avatar.slice(0, 2_000) : "",
        tags,
        likes: 0,
        stars: 0,
        starredBy: [],
        commentCount: 0,
        createdAt: FieldValue.serverTimestamp(),
      };
      await snippetRef.create(snippet);
      res.status(201).json({ snippet: { ...snippet, createdAt: null } });
    } catch {
      console.error("Snippet creation failed");
      res.status(500).json({ error: "Unable to publish snippet" });
    }
  });

  app.post("/api/community/snippets/like", requireAuth, rateLimit("snippet-like", 30, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const snippetId = readString(req.body?.snippetId, 200);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted community service is not configured" });
      return;
    }
    if (!snippetId) {
      res.status(400).json({ error: "snippetId is required" });
      return;
    }
    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const snippetRef = firebaseAdminDb.collection("snippets").doc(snippetId);
        const likeRef = snippetRef.collection("likes").doc(identity.uid);
        const [snippetSnapshot, likeSnapshot] = await Promise.all([transaction.get(snippetRef), transaction.get(likeRef)]);
        if (!snippetSnapshot.exists) throw new Error("SNIPPET_NOT_FOUND");
        if (likeSnapshot.exists) throw new Error("ALREADY_LIKED");
        const likes = Math.max(0, Number(snippetSnapshot.data()!.likes) || 0) + 1;
        transaction.create(likeRef, { userId: identity.uid, createdAt: FieldValue.serverTimestamp() });
        transaction.update(snippetRef, { likes });
        return { likes };
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "SNIPPET_NOT_FOUND") res.status(404).json({ error: "Snippet was not found" });
      else if (message === "ALREADY_LIKED") res.status(409).json({ error: "Snippet has already been liked" });
      else {
        console.error("Snippet like failed");
        res.status(500).json({ error: "Unable to like snippet" });
      }
    }
  });

  app.post("/api/community/snippets/star", requireAuth, rateLimit("snippet-star", 30, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const snippetId = readString(req.body?.snippetId, 200);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted community service is not configured" });
      return;
    }
    if (!snippetId) {
      res.status(400).json({ error: "snippetId is required" });
      return;
    }
    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const snippetRef = firebaseAdminDb.collection("snippets").doc(snippetId);
        const starRef = snippetRef.collection("stars").doc(identity.uid);
        const [snippetSnapshot, starSnapshot] = await Promise.all([transaction.get(snippetRef), transaction.get(starRef)]);
        if (!snippetSnapshot.exists) throw new Error("SNIPPET_NOT_FOUND");
        const snippet = snippetSnapshot.data()!;
        const starredBy = Array.isArray(snippet.starredBy)
          ? snippet.starredBy.filter((value: unknown): value is string => typeof value === "string")
          : [];
        if (starSnapshot.exists) {
          const nextStarredBy = starredBy.filter((userId) => userId !== identity.uid);
          const stars = Math.max(0, Number(snippet.stars) || 0) - 1;
          transaction.delete(starRef);
          transaction.update(snippetRef, { stars, starredBy: nextStarredBy });
          return { stars, starred: false };
        }
        if (starredBy.length >= 5_000) throw new Error("STAR_LIMIT_REACHED");
        const stars = Math.max(0, Number(snippet.stars) || 0) + 1;
        transaction.create(starRef, { userId: identity.uid, createdAt: FieldValue.serverTimestamp() });
        transaction.update(snippetRef, { stars, starredBy: [...new Set([...starredBy, identity.uid])] });
        return { stars, starred: true };
      });
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "SNIPPET_NOT_FOUND") res.status(404).json({ error: "Snippet was not found" });
      else if (message === "STAR_LIMIT_REACHED") res.status(409).json({ error: "Snippet has reached the favorites limit" });
      else {
        console.error("Snippet star failed");
        res.status(500).json({ error: "Unable to update favorite" });
      }
    }
  });

  app.post("/api/community/snippets/comments", requireAuth, rateLimit("snippet-comment", 20, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const snippetId = readString(req.body?.snippetId, 200);
    const text = readString(req.body?.text, 1_000);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted community service is not configured" });
      return;
    }
    if (!snippetId || !text) {
      res.status(400).json({ error: "snippetId and text are required" });
      return;
    }
    try {
      const result = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snippetRef = firebaseAdminDb.collection("snippets").doc(snippetId);
        const [userSnapshot, snippetSnapshot] = await Promise.all([transaction.get(userRef), transaction.get(snippetRef)]);
        if (!userSnapshot.exists || !snippetSnapshot.exists) throw new Error("NOT_FOUND");
        const profile = userSnapshot.data()!;
        const commentRef = snippetRef.collection("comments").doc();
        const comment = {
          id: commentRef.id,
          text,
          authorId: identity.uid,
          authorName: typeof profile.username === "string" ? profile.username.slice(0, 50) : "Игрок",
          authorPhoto: typeof profile.avatar === "string" ? profile.avatar.slice(0, 2_000) : "",
          createdAt: FieldValue.serverTimestamp(),
        };
        const commentCount = Math.max(0, Number(snippetSnapshot.data()!.commentCount) || 0) + 1;
        transaction.create(commentRef, comment);
        transaction.update(snippetRef, { commentCount });
        return { comment: { ...comment, createdAt: null }, commentCount };
      });
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Snippet or user profile was not found" });
        return;
      }
      console.error("Snippet comment failed");
      res.status(500).json({ error: "Unable to post comment" });
    }
  });

  app.post("/api/chats/direct", requireAuth, rateLimit("chat-create", 20, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const recipientId = readString(req.body?.recipientId, 128);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted chat service is not configured" });
      return;
    }
    if (!recipientId || recipientId === identity.uid) {
      res.status(400).json({ error: "A different recipient is required" });
      return;
    }
    try {
      const participants = [identity.uid, recipientId].sort();
      const chatId = createHash("sha256").update(participants.join(":"), "utf8").digest("hex");
      await firebaseAdminDb.runTransaction(async (transaction) => {
        const recipientRef = firebaseAdminDb.collection("users").doc(recipientId);
        const chatRef = firebaseAdminDb.collection("chats").doc(chatId);
        const [recipientSnapshot, chatSnapshot] = await Promise.all([transaction.get(recipientRef), transaction.get(chatRef)]);
        if (!recipientSnapshot.exists) throw new Error("RECIPIENT_NOT_FOUND");
        if (!chatSnapshot.exists) transaction.create(chatRef, {
          participants,
          updatedAt: FieldValue.serverTimestamp(),
          lastMessage: "",
          unreadCount: { [identity.uid]: 0, [recipientId]: 0 },
        });
      });
      res.json({ chatId });
    } catch (error) {
      if (error instanceof Error && error.message === "RECIPIENT_NOT_FOUND") {
        res.status(404).json({ error: "Recipient profile was not found" });
        return;
      }
      console.error("Direct chat creation failed");
      res.status(500).json({ error: "Unable to start chat" });
    }
  });

  app.post("/api/chats/messages", requireAuth, rateLimit("chat-message", 30, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const chatId = readString(req.body?.chatId, 128);
    const text = readString(req.body?.text, 1_000);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted chat service is not configured" });
      return;
    }
    if (!chatId || !text) {
      res.status(400).json({ error: "chatId and text are required" });
      return;
    }
    try {
      await firebaseAdminDb.runTransaction(async (transaction) => {
        const chatRef = firebaseAdminDb.collection("chats").doc(chatId);
        const chatSnapshot = await transaction.get(chatRef);
        if (!chatSnapshot.exists) throw new Error("CHAT_NOT_FOUND");
        const participants = Array.isArray(chatSnapshot.data()!.participants) ? chatSnapshot.data()!.participants : [];
        if (!participants.includes(identity.uid)) throw new Error("NOT_PARTICIPANT");
        const messageRef = chatRef.collection("messages").doc();
        transaction.create(messageRef, { id: messageRef.id, senderId: identity.uid, text, timestamp: FieldValue.serverTimestamp() });
        transaction.update(chatRef, { lastMessage: text, updatedAt: FieldValue.serverTimestamp() });
      });
      res.status(201).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "CHAT_NOT_FOUND") res.status(404).json({ error: "Chat was not found" });
      else if (message === "NOT_PARTICIPANT") res.status(403).json({ error: "You are not a participant in this chat" });
      else {
        console.error("Chat message failed");
        res.status(500).json({ error: "Unable to send message" });
      }
    }
  });

  app.post("/api/marketplace/list", requireAuth, rateLimit("marketplace-list", 20, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const inventoryId = readString(req.body?.inventoryId, 200);
    const price = Number(req.body?.price);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted marketplace service is not configured" });
      return;
    }
    if (!inventoryId || !Number.isSafeInteger(price) || price < 1 || price > 100_000) {
      res.status(400).json({ error: "inventoryId and a price from 1 to 100000 are required" });
      return;
    }

    try {
      const listing = await firebaseAdminDb.runTransaction(async (transaction) => {
        const userRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const snapshot = await transaction.get(userRef);
        if (!snapshot.exists) throw new Error("USER_NOT_FOUND");
        const profile = snapshot.data()!;
        const inventory = Array.isArray(profile.inventory) ? profile.inventory : [];
        const itemIndex = inventory.findIndex((entry: unknown) => isRecord(entry) && entry.id === inventoryId);
        if (itemIndex === -1) throw new Error("ITEM_NOT_FOUND");
        const item = inventory[itemIndex] as Record<string, unknown>;
        if (typeof item.itemId !== "string" || typeof item.name !== "string") throw new Error("INVALID_ITEM");

        const listingRef = firebaseAdminDb.collection("marketplace").doc();
        const nextInventory = inventory.filter((_: unknown, index: number) => index !== itemIndex);
        const sellerName = typeof profile.username === "string" ? profile.username.slice(0, 50) : "Игрок";
        const listingData = {
          sellerId: identity.uid,
          sellerName,
          itemId: item.itemId,
          itemName: item.name.slice(0, 100),
          price,
          createdAt: FieldValue.serverTimestamp(),
        };
        transaction.update(userRef, { inventory: nextInventory });
        transaction.create(listingRef, listingData);
        return { id: listingRef.id, inventory: nextInventory, listing: { id: listingRef.id, ...listingData } };
      });
      res.json(listing);
    } catch (error) {
      if (error instanceof Error && error.message === "ITEM_NOT_FOUND") {
        res.status(404).json({ error: "Inventory item was not found" });
        return;
      }
      if (error instanceof Error && error.message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      console.error("Marketplace listing transaction failed");
      res.status(500).json({ error: "Unable to create marketplace listing" });
    }
  });

  app.post("/api/marketplace/purchase", requireAuth, rateLimit("marketplace-purchase", 20, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const listingId = readString(req.body?.listingId, 200);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted marketplace service is not configured" });
      return;
    }
    if (!listingId) {
      res.status(400).json({ error: "listingId is required" });
      return;
    }

    try {
      const purchase = await firebaseAdminDb.runTransaction(async (transaction) => {
        const listingRef = firebaseAdminDb.collection("marketplace").doc(listingId);
        const buyerRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const listingSnapshot = await transaction.get(listingRef);
        if (!listingSnapshot.exists) throw new Error("LISTING_NOT_FOUND");
        const listing = listingSnapshot.data()!;
        const sellerId = typeof listing.sellerId === "string" ? listing.sellerId : null;
        const price = Number(listing.price);
        if (!sellerId || !Number.isSafeInteger(price) || price < 1 || price > 100_000 || sellerId === identity.uid) {
          throw new Error("INVALID_LISTING");
        }
        const sellerRef = firebaseAdminDb.collection("users").doc(sellerId);
        const [buyerSnapshot, sellerSnapshot] = await Promise.all([transaction.get(buyerRef), transaction.get(sellerRef)]);
        if (!buyerSnapshot.exists || !sellerSnapshot.exists) throw new Error("USER_NOT_FOUND");
        const buyer = buyerSnapshot.data()!;
        const seller = sellerSnapshot.data()!;
        const buyerCoins = Math.max(0, Number(buyer.coins) || 0);
        if (buyerCoins < price) throw new Error("INSUFFICIENT_COINS");
        if (typeof listing.itemId !== "string" || typeof listing.itemName !== "string") throw new Error("INVALID_LISTING");

        const buyerInventory = Array.isArray(buyer.inventory) ? buyer.inventory : [];
        const nextInventory = [...buyerInventory, {
          id: `${listing.itemId}_${randomUUID()}`,
          itemId: listing.itemId,
          name: listing.itemName,
          acquiredAt: Date.now(),
        }];
        const sellerCoins = Math.max(0, Number(seller.coins) || 0);
        const nextBuyerCoins = buyerCoins - price;
        const nextSellerCoins = sellerCoins + price;
        transaction.update(buyerRef, { coins: nextBuyerCoins, inventory: nextInventory });
        transaction.update(sellerRef, { coins: nextSellerCoins });
        transaction.delete(listingRef);
        return { coins: nextBuyerCoins, inventory: nextInventory };
      });
      res.json(purchase);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "LISTING_NOT_FOUND") {
        res.status(404).json({ error: "Listing was not found or has already been sold" });
        return;
      }
      if (message === "INSUFFICIENT_COINS") {
        res.status(409).json({ error: "Insufficient coins" });
        return;
      }
      if (message === "INVALID_LISTING") {
        res.status(409).json({ error: "Listing is invalid or belongs to you" });
        return;
      }
      if (message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "User profile was not found" });
        return;
      }
      console.error("Marketplace purchase transaction failed");
      res.status(500).json({ error: "Unable to complete marketplace purchase" });
    }
  });

  app.post("/api/trades/create", requireAuth, rateLimit("trade-create", 10, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const receiverId = readString(req.body?.receiverId, 128);
    const senderItemIds = readUniqueStringArray(req.body?.senderItemIds, 10, 200);
    const receiverItemIds = readUniqueStringArray(req.body?.receiverItemIds, 10, 200);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted trade service is not configured" });
      return;
    }
    if (!receiverId || receiverId === identity.uid || !senderItemIds || !receiverItemIds) {
      res.status(400).json({ error: "A recipient and one to ten unique items from each player are required" });
      return;
    }

    try {
      const trade = await firebaseAdminDb.runTransaction(async (transaction) => {
        const senderRef = firebaseAdminDb.collection("users").doc(identity.uid);
        const receiverRef = firebaseAdminDb.collection("users").doc(receiverId);
        const [senderSnapshot, receiverSnapshot] = await Promise.all([
          transaction.get(senderRef),
          transaction.get(receiverRef),
        ]);
        if (!senderSnapshot.exists || !receiverSnapshot.exists) throw new Error("USER_NOT_FOUND");
        const sender = senderSnapshot.data()!;
        const receiver = receiverSnapshot.data()!;
        const senderInventory = Array.isArray(sender.inventory) ? sender.inventory : [];
        const receiverInventory = Array.isArray(receiver.inventory) ? receiver.inventory : [];
        const senderOwned = new Set(senderInventory.flatMap((item: unknown) => isRecord(item) && typeof item.id === "string" ? [item.id] : []));
        const receiverOwned = new Set(receiverInventory.flatMap((item: unknown) => isRecord(item) && typeof item.id === "string" ? [item.id] : []));
        if (!senderItemIds.every((itemId) => senderOwned.has(itemId)) || !receiverItemIds.every((itemId) => receiverOwned.has(itemId))) {
          throw new Error("ITEM_NOT_OWNED");
        }

        const tradeRef = firebaseAdminDb.collection("trades").doc();
        const senderName = typeof sender.username === "string" ? sender.username.slice(0, 50) : "Игрок";
        const tradeData = {
          senderId: identity.uid,
          senderName,
          receiverId,
          senderItems: senderItemIds,
          receiverItems: receiverItemIds,
          status: "pending",
          createdAt: FieldValue.serverTimestamp(),
        };
        transaction.create(tradeRef, tradeData);
        return { id: tradeRef.id, ...tradeData };
      });
      res.status(201).json({ trade });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "Player profile was not found" });
        return;
      }
      if (message === "ITEM_NOT_OWNED") {
        res.status(409).json({ error: "One of the selected items is no longer owned" });
        return;
      }
      console.error("Trade creation transaction failed");
      res.status(500).json({ error: "Unable to create trade" });
    }
  });

  app.post("/api/trades/accept", requireAuth, rateLimit("trade-accept", 10, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const tradeId = readString(req.body?.tradeId, 200);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted trade service is not configured" });
      return;
    }
    if (!tradeId) {
      res.status(400).json({ error: "tradeId is required" });
      return;
    }

    try {
      const acceptedTrade = await firebaseAdminDb.runTransaction(async (transaction) => {
        const tradeRef = firebaseAdminDb.collection("trades").doc(tradeId);
        const tradeSnapshot = await transaction.get(tradeRef);
        if (!tradeSnapshot.exists) throw new Error("TRADE_NOT_FOUND");
        const trade = tradeSnapshot.data()!;
        const senderId = typeof trade.senderId === "string" ? trade.senderId : null;
        const receiverId = typeof trade.receiverId === "string" ? trade.receiverId : null;
        const senderItemIds = readUniqueStringArray(trade.senderItems, 10, 200);
        const receiverItemIds = readUniqueStringArray(trade.receiverItems, 10, 200);
        if (trade.status !== "pending" || !senderId || receiverId !== identity.uid || !senderItemIds || !receiverItemIds) {
          throw new Error("INVALID_TRADE");
        }

        const senderRef = firebaseAdminDb.collection("users").doc(senderId);
        const receiverRef = firebaseAdminDb.collection("users").doc(receiverId);
        const [senderSnapshot, receiverSnapshot] = await Promise.all([
          transaction.get(senderRef),
          transaction.get(receiverRef),
        ]);
        if (!senderSnapshot.exists || !receiverSnapshot.exists) throw new Error("USER_NOT_FOUND");
        const sender = senderSnapshot.data()!;
        const receiver = receiverSnapshot.data()!;
        const senderInventory = Array.isArray(sender.inventory) ? sender.inventory : [];
        const receiverInventory = Array.isArray(receiver.inventory) ? receiver.inventory : [];
        const senderItems = senderInventory.filter((item: unknown) => isRecord(item) && typeof item.id === "string" && senderItemIds.includes(item.id));
        const receiverItems = receiverInventory.filter((item: unknown) => isRecord(item) && typeof item.id === "string" && receiverItemIds.includes(item.id));
        if (senderItems.length !== senderItemIds.length || receiverItems.length !== receiverItemIds.length) {
          throw new Error("ITEM_NOT_OWNED");
        }

        const nextSenderInventory = [
          ...senderInventory.filter((item: unknown) => !isRecord(item) || typeof item.id !== "string" || !senderItemIds.includes(item.id)),
          ...receiverItems,
        ];
        const nextReceiverInventory = [
          ...receiverInventory.filter((item: unknown) => !isRecord(item) || typeof item.id !== "string" || !receiverItemIds.includes(item.id)),
          ...senderItems,
        ];
        transaction.update(senderRef, { inventory: nextSenderInventory });
        transaction.update(receiverRef, { inventory: nextReceiverInventory });
        transaction.update(tradeRef, { status: "accepted", acceptedAt: FieldValue.serverTimestamp() });
        return { inventory: nextReceiverInventory };
      });
      res.json(acceptedTrade);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "TRADE_NOT_FOUND") {
        res.status(404).json({ error: "Trade was not found" });
        return;
      }
      if (message === "ITEM_NOT_OWNED" || message === "INVALID_TRADE") {
        res.status(409).json({ error: "Trade is no longer valid" });
        return;
      }
      if (message === "USER_NOT_FOUND") {
        res.status(404).json({ error: "Player profile was not found" });
        return;
      }
      console.error("Trade acceptance transaction failed");
      res.status(500).json({ error: "Unable to accept trade" });
    }
  });

  app.post("/api/trades/cancel", requireAuth, rateLimit("trade-cancel", 20, 60_000), async (req, res) => {
    const identity = (req as AuthenticatedRequest).identity;
    const tradeId = readString(req.body?.tradeId, 200);
    if (!identity || !firebaseAdminDb) {
      res.status(503).json({ error: "Trusted trade service is not configured" });
      return;
    }
    if (!tradeId) {
      res.status(400).json({ error: "tradeId is required" });
      return;
    }

    try {
      await firebaseAdminDb.runTransaction(async (transaction) => {
        const tradeRef = firebaseAdminDb.collection("trades").doc(tradeId);
        const tradeSnapshot = await transaction.get(tradeRef);
        if (!tradeSnapshot.exists) throw new Error("TRADE_NOT_FOUND");
        const trade = tradeSnapshot.data()!;
        if (trade.status !== "pending") throw new Error("INVALID_TRADE");
        if (trade.senderId !== identity.uid && trade.receiverId !== identity.uid) throw new Error("FORBIDDEN");
        transaction.update(tradeRef, {
          status: "cancelled",
          cancelledBy: identity.uid,
          cancelledAt: FieldValue.serverTimestamp(),
        });
      });
      res.status(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "TRADE_NOT_FOUND") {
        res.status(404).json({ error: "Trade was not found" });
        return;
      }
      if (message === "FORBIDDEN") {
        res.status(403).json({ error: "You are not part of this trade" });
        return;
      }
      if (message === "INVALID_TRADE") {
        res.status(409).json({ error: "Trade is no longer pending" });
        return;
      }
      console.error("Trade cancellation transaction failed");
      res.status(500).json({ error: "Unable to cancel trade" });
    }
  });

  app.post("/api/mentor/hint", requireAuth, rateLimit("mentor-hint", 12, 60_000), async (req, res) => {
    try {
      const code = readString(req.body?.code, 20000);
      const challenge = readString(req.body?.challenge, 2000);
      const error = typeof req.body?.error === "string" ? req.body.error.slice(0, 2000) : "";
      if (code === null || challenge === null) {
        res.status(400).json({ error: "code and challenge must be valid strings" });
        return;
      }
      if (!model) {
        res.status(503).json({ error: "AI mentor is not configured" });
        return;
      }
      const prompt = `
        Ты — ИИ-Ментор по Python в обучающей игре PyQuest. 
        Ученик застрял на задаче: "${challenge}".
        Его текущий код:
        \`\`\`python
        ${code}
        \`\`\`
        ${error ? `Ошибка при выполнении: ${error}` : ''}
        
        Дай короткую, вдохновляющую подсказку. СТРОГО ЗАПРЕЩЕНО писать готовый код решения. 
        Не давай прямых ответов. Задавай наводящие вопросы и концептуальные подсказки.
        Используй стиль мудрого, но дружелюбного наставника. 
        Отвечай на русском языке.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json({ text: response.text() });
    } catch (err) {
      console.error("Gemini Proxy Error:", err);
      res.status(500).json({ error: "Failed to generate hint" });
    }
  });

  app.post("/api/mentor/chat", requireAuth, rateLimit("mentor-chat", 20, 60_000), async (req, res) => {
    try {
      const messages = parseMentorMessages(req.body?.messages);
      if (!messages || messages.length === 0) {
        res.status(400).json({ error: "messages must contain up to six valid messages" });
        return;
      }
      if (!model) {
        res.status(503).json({ error: "AI mentor is not configured" });
        return;
      }

      const username = readString(req.body?.profile?.username, 80) || "Ученик";
      const level = typeof req.body?.profile?.level === "number" && Number.isFinite(req.body.profile.level)
        ? Math.max(1, Math.min(100, Math.floor(req.body.profile.level)))
        : 1;
      const history = messages
        .map((message) => `${message.role === "user" ? "Ученик" : "Наставник"}: ${message.content}`)
        .join("\n");
      const prompt = `Ты — ИИ-наставник в игровом приложении PyQuest для изучения Python.
Помогай ученику понимать Python, давай подсказки, но не решай задачи за него полностью.
Будь дружелюбным и используй игровой сленг (квесты, опыт, уровни).
Информация об ученике: имя — ${username}, уровень — ${level}.

История последних сообщений:
${history}

Ответь на последнее сообщение ученика.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: "Ты — мудрый и веселый наставник-программист. Используй Markdown для форматирования кода.",
      });
      res.json({ text: result.response.text() });
    } catch (err) {
      console.error("Gemini Chat Proxy Error:", err);
      res.status(500).json({ error: "Failed to generate chat response" });
    }
  });

  app.post("/api/daily-challenge", requireAuth, rateLimit("daily-challenge", 5, 60_000), async (req, res) => {
    try {
      const requestedLevel = Number(req.body?.userLevel);
      const userLevel = Number.isFinite(requestedLevel)
        ? Math.max(1, Math.min(100, Math.floor(requestedLevel)))
        : 1;
      if (!model) throw new Error("Gemini is not configured");
      const prompt = `
        Сгенерируй ежедневное испытание по Python для ученика ${userLevel} уровня.
        Верни ответ в формате JSON:
        {
          "title": "Название задачи",
          "description": "Описание задачи",
          "initialCode": "Начальный код",
          "testCases": [
            { "inputValues": ["ввод 1", "ввод 2"], "expectedOutput": "ожидаемый результат", "description": "описание теста" }
          ],
          "reward": { "xp": 100, "coins": 50 }
        }
      `;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const response = await result.response;
      res.json(JSON.parse(response.text()));
    } catch (err) {
      console.error("Gemini Proxy Error:", err);
      
      res.json({
        title: "Сумма четных чисел (Резервная задача)",
        description: "Напишите функцию sum_even(numbers), которая принимает список чисел через пробел и возвращает сумму всех четных чисел.",
        initialCode: "def sum_even(numbers_str):\n    # Ваш код здесь\n    pass\n\n# Не меняйте код ниже\nuser_input = input()\nprint(sum_even(user_input))",
        testCases: [
          { inputValues: ["1 2 3 4 5 6"], expectedOutput: "12", description: "Смешанные числа" },
          { inputValues: ["1 3 5"], expectedOutput: "0", description: "Только нечетные" },
          { inputValues: ["2 4 6 8"], expectedOutput: "20", description: "Только четные" }
        ],
        reward: { xp: 150, coins: 75 }
      });
    }
  });

  app.post("/api/admin/generate-daily", requireAuth, requireAdmin, rateLimit("admin-generate-daily", 2, 60_000), async (req, res) => {
    try {
      if (!model) throw new Error("Gemini is not configured");
      const prompt = `
        Ты — ИИ-Мастер в ролевой игре PyQuest. Сгенерируй 10 РАЗНЫХ ежедневных программистских задания на языке Python.
        Сложность должна быть разной: 3 easy, 4 medium, 3 hard.
        Для каждого задания придумай:
        1. "title": Фэнтези/Киперпанк название.
        2. "description": Текст задачи.
        3. "difficulty": "easy", "medium", или "hard".
        4. "recommendedRank": Один из (F, E, D, C, B, A, S, S+, SS, SS+, SSS, SSS+).
        5. "reward": { "xp": число, "coins": число }.
        6. "initialCode": Заготовка кода.
        7. "testCases": Минимум 2 теста.
        
        Верни ответ СТРОГО В ВИДЕ JSON-МАССИВА из 10 объектов.
      `;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const response = await result.response;
      let text = response.text().trim();
      res.json(JSON.parse(text));
    } catch (err) {
      console.error("Global Daily Quests Generation Error:", err);
      
      res.json([
        { title: "Цикличное Эхо", description: "Верните список [1, 2, 3, 4, 5].", difficulty: "easy", recommendedRank: "F", reward: { xp: 50, coins: 25 }, initialCode: "def solve():\\n    pass", testCases: [{ inputValues: [], expectedOutput: "[1, 2, 3, 4, 5]", description: "Test" }], type: "code" },
        { title: "Страж Четности", description: "Функция returns True если число четное.", difficulty: "easy", recommendedRank: "F", reward: { xp: 50, coins: 25 }, initialCode: "def is_even(n):\\n    pass", testCases: [{ inputValues: ["2"], expectedOutput: "True", description: "Even" }], type: "code" },
        { title: "Маг Реверса", description: "Разверните строку.", difficulty: "easy", recommendedRank: "E", reward: { xp: 60, coins: 30 }, initialCode: "def rev(s):\\n    pass", testCases: [{ inputValues: ["abc"], expectedOutput: "cba", description: "Rev" }], type: "code" },
        { title: "Алхимия Списков", description: "Верните квадраты чисел.", difficulty: "medium", recommendedRank: "D", reward: { xp: 100, coins: 50 }, initialCode: "def sq(l):\\n    pass", testCases: [{ inputValues: ["1 2 3"], expectedOutput: "[1, 4, 9]", description: "Sq" }], type: "code" },
        { title: "Поиск Истины", description: "Найдите максимум в списке.", difficulty: "medium", recommendedRank: "C", reward: { xp: 110, coins: 55 }, initialCode: "def find_max(l):\\n    pass", testCases: [{ inputValues: ["1 5 3"], expectedOutput: "5", description: "Max" }], type: "code" },
        { title: "Фильтр Пустоты", description: "Удалите None из списка.", difficulty: "medium", recommendedRank: "B", reward: { xp: 120, coins: 60 }, initialCode: "def clear(l):\\n    pass", testCases: [{ inputValues: ["1 None 2"], expectedOutput: "[1, 2]", description: "Clear" }], type: "code" },
        { title: "Слияние Миров", description: "Объедините два словаря.", difficulty: "medium", recommendedRank: "A", reward: { xp: 130, coins: 65 }, initialCode: "def merge(d1, d2):\\n    pass", testCases: [{ inputValues: ["{}"], expectedOutput: "{}", description: "Merge" }], type: "code" },
        { title: "Код Дракона", description: "Реализуйте Фибоначчи рекурсией.", difficulty: "hard", recommendedRank: "S", reward: { xp: 200, coins: 100 }, initialCode: "def fib(n):\\n    pass", testCases: [{ inputValues: ["5"], expectedOutput: "5", description: "Fib" }], type: "code" },
        { title: "Тень Алгоритма", description: "Проверьте строку на палиндром.", difficulty: "hard", recommendedRank: "SS", reward: { xp: 220, coins: 110 }, initialCode: "def pal(s):\\n    pass", testCases: [{ inputValues: ["radar"], expectedOutput: "True", description: "Pal" }], type: "code" },
        { title: "Клинок Оптимизации", description: "Сортировка пузырьком.", difficulty: "hard", recommendedRank: "SSS", reward: { xp: 300, coins: 150 }, initialCode: "def bubble(l):\\n    pass", testCases: [{ inputValues: ["3 1 2"], expectedOutput: "[1, 2, 3]", description: "Sort" }], type: "code" }
      ]);
    }
  });

  
  return { app, httpServer };
}

async function startServer() {
  const { app, httpServer } = await createServerApp();
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
