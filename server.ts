import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

type RoomType = "duel" | "sandbox";

interface Room {
  players: string[];
  state: Record<string, unknown>;
  type: RoomType;
}

interface MentorChatMessage {
  role: "user" | "assistant";
  content: string;
}

const readString = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length <= maxLength ? normalized : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null
);

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.APP_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      methods: ["GET", "POST"]
    }
  });

  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

  
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const model = geminiApiKey
    ? new GoogleGenerativeAI(geminiApiKey).getGenerativeModel({ model: "gemini-1.5-flash" })
    : null;

  app.use(express.json({ limit: "64kb" }));

  
  const rooms = new Map<string, Room>();
  let waitingDuelSocketId: string | null = null;

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join_room", (payload: unknown) => {
      if (!isRecord(payload)) return;
      const roomId = readString(payload.roomId, 100);
      const type = payload.type;
      if (type !== 'sandbox' || !roomId) return;
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { players: [socket.id], state: {}, type });
      } else {
        const room = rooms.get(roomId)!;
        if (room.type === 'sandbox' && !room.players.includes(socket.id)) {
          room.players.push(socket.id);
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
      rooms.set(roomId, { players, state: {}, type: 'duel' });
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
      socket.to(roomId).emit("remote_update", { code, cursor, userId: socket.id });
    });

    socket.on("duel_action", (payload: unknown) => {
      if (!isRecord(payload)) return;
      const roomId = readString(payload.roomId, 100);
      const action = readString(payload.action, 40);
      if (!roomId || !action) return;
      const room = rooms.get(roomId);
      if (!room || room.type !== 'duel' || !room.players.includes(socket.id)) return;
      io.to(roomId).emit("duel_event", { playerId: socket.id, action });
      if (action === 'finish' || action === 'timeout') {
        rooms.delete(roomId);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
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

  app.post("/api/mentor/hint", async (req, res) => {
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

  app.post("/api/mentor/chat", async (req, res) => {
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

  app.post("/api/daily-challenge", async (req, res) => {
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

  app.post("/api/admin/generate-daily", async (req, res) => {
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

startServer();
