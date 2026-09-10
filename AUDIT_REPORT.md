# PyQuest — полный аудит проекта
Дата проверки: 10 сентября 2026. Тип проверки: read-only аудит исходников, сборки и локального runtime. Продуктовый код не изменялся.

## Итог

Проект компилируется и собирается, но в текущем виде не готов к публичному production. Центральная проблема — браузер считается доверенным источником XP, монет, предметов, социальных операций и результатов соревнований. Это одновременно разрушает игровую экономику, делает лидерборд фиктивным и создаёт реальные уязвимости.

Подтверждено:

- 7 security/privacy findings: 1 critical, 4 high, 1 medium, 1 low;
- 12 явно сломанных или логически некорректных пользовательских сценариев;
- 8 фиктивных/вводящих в заблуждение элементов интерфейса и документации;
- 10 повторяющихся ID уроков: 73 записи, но только 63 уникальных урока;
- 58-кратное копирование нескольких шаблонных абзацев в учебном материале;
- отсутствие автоматических тестов, слабый TypeScript quality gate и очень крупные production chunks.

## Scope and coverage

### Reviewed

| Поверхность | Что проверено |
|---|---|
| Архитектура | `server.ts`, маршрутизация, React providers, Firebase/Firestore, Socket.IO, Pyodide, Gemini proxy |
| Данные и доступ | все правила `firestore.rules`, клиентские коллекции, профиль/экономика, marketplace, trades, friends, guilds, chats, snippets |
| Основные сценарии | обучение, редактор, sandbox, duel, tournaments, community, leaderboard, shop/inventory, guilds, admin |
| Контент | структура 73 уроков и 365 challenges, уникальность ID, наличие tests, повторяемость шаблонного текста |
| Runtime | главная, pathways, sandbox и admin в браузере; локальные HTTP и Socket.IO smoke-тесты |
| Build/tooling | `package.json`, TypeScript config, Vite config, корневая и video-production сборки |
| UX/accessibility | семантика интерактивных элементов, keyboard paths, modal patterns, reduced motion, runtime AX tree |

First-party область: 68 файлов в `src`, 28 953 строки TS/TSX/CSS; 168 файлов вне исключённых vendor/build директорий.

### Excluded or partially reviewed

- `node_modules/**` и `video-production/node_modules/**`: инвентаризированы, но исходники зависимостей не читались построчно.
- `dist/**` и `video-production/out/**`: generated output; проверялись сборка и размеры, не минифицированный код.
- бинарные изображения, видео и аудио: проверялись только как assets и зависимости UI.
- реальный Firebase проект не изменялся; rules подтверждены статически, но emulator test suite отсутствует.
- advisory-база npm не получена: `npm audit --omit=dev` не смог обратиться к registry в sandbox, а внешний запрос с передачей dependency metadata не был разрешён.

## Verification results

| Проверка | Результат | Наблюдение |
|---|---|---|
| `npm run lint` | PASS | Это только `tsc --noEmit`; ESLint и строгие правила не запускаются. |
| `npm run build -- --outDir /tmp/pyquest-audit-build` | PASS с предупреждениями | Основной chunk 3 178 kB (gzip 893 kB), physics 1 988 kB, lessons 957 kB, Pathways 813 kB; Vite предупреждает о chunks >500 kB и смешанных static/dynamic imports. |
| Локальный `GET /api/health` | PASS | 200 `{"status":"ok"}`; также раскрывается `X-Powered-By: Express`. |
| AI endpoints без авторизации | FAIL security | `/api/daily-challenge` и `/api/admin/generate-daily` доступны анонимно и вернули fallback с HTTP 200. |
| Два анонимных Socket.IO клиента | FAIL security/function | Клиенты без токенов вошли в duel; отправивший `finish` получил loss, второй — win. |
| Валидатор lesson dataset | FAIL data integrity | 73 entries, 63 unique IDs, 365 challenges, 0 challenges без tests, 0 malformed quiz; 330 challenges не имеют optional `code` reference field. |
| Browser smoke/AX | FAIL quality | Реальные React duplicate-key warnings; hardcoded status/traction; 2–4 кнопки без доступного имени на проверенных страницах. |
| video-production render | BLOCKED/FAIL reproducibility | Remotion попытался скачать Chrome Headless Shell с `storage.googleapis.com` и упал на DNS, хотя в системе есть Chromium; render script не передаёт documented browser executable. |
| `npm audit --omit=dev` | BLOCKED | Registry недоступен в sandbox; внешняя отправка dependency metadata не была авторизована. CVE-выводы не делались. |
| Git status/history | BLOCKED | Каталог не является валидным Git repository; воспроизводимая история изменений отсутствует. |

## Findings

### A. Подтверждённые security/privacy проблемы

Полный канонический security-отчёт: `/tmp/codex-security-scans-BbJenJ/PyQuest-main/unversioned_20260910T101618Z_lurxjjk7/report.md` (scan `d948cde0-e6a7-40bc-8164-911edd2ad415`).

| ID | Severity | Confidence | Проблема и доказательство | Влияние | Рекомендация |
|---|---|---|---|---|---|
| SEC-01 | Critical | High | Owner update в `firestore.rules:208-213` защищает только `role`; `updateProfile` пересылает arbitrary `Partial<UserProfile>` (`src/contexts/AuthContext.tsx:984-989`). | Любой аккаунт назначает себе XP, coins, level, inventory, stats и completion flags; экономика и leaderboard не имеют целостности. | Все награды — только серверными idempotent transactions; rules allowlist только косметических полей. |
| SEC-02 | High | High | `/api/mentor/*`, `/api/daily-challenge` и `/api/admin/generate-daily` не имеют auth/rate limit (`server.ts:186-348`). | Анонимный расход Gemini quota/cost, DoS; admin route фактически не admin. | Firebase ID token middleware, admin claim, per-user/IP quota, timeouts, telemetry и circuit breaker. |
| SEC-03 | High | High | Socket.IO handshake без auth; `join_room` принимает room ID, `duel_action` доверяет `finish` (`server.ts:79-158`). | Подделка duel outcomes и доступ/вмешательство в совместный код. Smoke-тест воспроизвёл anonymous duel. | Auth handshake, invite capability, event authorization, server-side duel judge/state machine. |
| SEC-04 | High | High | Reaction branch использует `affectedKeys().hasAny(...)` (`firestore.rules:150-157`). | Не-владелец меняет `likes` вместе с `code`, `title` или `authorId` и переписывает чужой snippet. | `hasOnly`, immutable ownership, validation counters/types, rules tests. |
| SEC-05 | High | High | `active_bosses`, `ai_quests`, `friend_requests` дают полный доступ любому auth user (`firestore.rules:177-187`). | Глобальная порча боссов/квестов, чтение и подделка чужих friend requests. | Global collections server/admin-only; friend requests только sender/receiver и строгая state machine. |
| SEC-06 | Medium | High | Участник чата может update всего chat document, включая `participants` (`firestore.rules:166-174`). | Добавление третьего лица раскрывает ему историю сообщений; можно удалить собеседника и переписать metadata. | Immutable participants либо серверный membership workflow; field allowlists и message schema limits. |
| SEC-07 | Low | High | `handleFirestoreError` сериализует UID, email, tenant и provider data в console и thrown Error (`src/contexts/AuthContext.tsx:46-66`). | Избыточная PII попадает в логи, screenshots и возможную error telemetry. | Redaction, stable error codes и correlation ID; не помещать PII в пользовательские ошибки. |

Дополнительные security hardening gaps: CORS становится `true`, если env не задан (`server.ts:53-62`); нет Helmet/CSP/security headers; `rooms` — неограниченная in-memory Map; нет per-socket/message rate limit; Gemini JSON парсится без schema validation (`server.ts:263-346`). Это требует исправления, но не объединено с SEC-01–07, чтобы не раздувать количество findings одной первопричиной.

### B. Явно сломанная функциональность

| ID | Severity | Confidence | Что сломано | Evidence / причина | Исправление |
|---|---|---|---|---|---|
| FUN-01 | High | High | Побеждает не тот, кто первым решил duel. | Сервер рассылает ID отправителя `finish` (`server.ts:147-157`), клиент считает sender проигравшим (`src/pages/Duel.tsx:79-92`). Воспроизведено двумя sockets. | Сервер должен объявлять winner; убрать инверсию и client-declared finish. |
| FUN-02 | High | High | Community chat не читает и не отправляет сообщения. | UI использует root `/messages` (`src/pages/Community.tsx:105-156`), такого match нет; catch-all deny (`firestore.rules:236-239`). При этом UI пишет «Система онлайн». | Добавить scoped rules/schema или перенести в защищённый chat backend; показывать реальный status/error. |
| FUN-03 | High | High | Submission history всегда пуста, сохранение падает. | `saveSubmission/getSubmissions` используют `/submissions` (`AuthContext.tsx:1389-1423`), rules отсутствуют. Ошибка save только логируется. | Owner-only rules, schema/size limits, indexes, visible retry/error. |
| FUN-04 | High | High | Guild join/leave/update и guild chat не работают. | `members` — массив maps (`GuildService.ts:6-22,100-111`), а rule сравнивает string UID с map list (`firestore.rules:201-205`); nested `guilds/{id}/messages` rules отсутствуют (`GuildService.ts:177-199`). | Проверять `members.map(m, m.uid)` невозможно напрямую в rules — хранить memberIds map/subcollection; добавить nested message rules. |
| FUN-05 | High | High | Marketplace purchase выполняется частично. | Сначала buyer списывает coins и получает item, затем пытается изменить чужой seller profile и удалить чужой listing (`AuthContext.tsx:890-929`); rules это запрещают (`firestore.rules:208-227`). Нет transaction. | Callable Function/Admin SDK transaction: проверить listing, balance, ownership, atomically transfer и delete. |
| FUN-06 | High | High | Listing может уничтожить предмет при промежуточной ошибке. | Inventory удаляется до создания listing (`AuthContext.tsx:854-887`). | Одна transaction/batch с rollback semantics. |
| FUN-07 | High | High | Accept trade и двусторонняя friendship операция ломаются на записи другого пользователя. | Trade обновляет sender profile (`AuthContext.tsx:558-601`); friend accept/remove пишет обе user records (`SocialService.ts:70-98`), owner rule запрещает чужую запись. | Только server transaction; не давать клиенту cross-user write. |
| FUN-08 | Medium | High | Кнопка «Начать серию» ведёт на несуществующий route. | Навигация `/tournament/${id}` (`Tournaments.tsx:37-45`), route — `/tournaments/:id` (`App.tsx:118-120`). Нет catch-all 404. | Исправить путь и добавить `*` route с 404/recovery. |
| FUN-09 | Medium | High | 10 последних уроков недостижимы/конфликтуют. | Дубли `git`, `requests`, `os-pathlib`, `pytest`, `logging`, `sql`, `algorithms`, `docker`, `cicd`, `type-hinting` (`lessons.ts:6950-8921`); `find` берёт первый (`LessonDetail.tsx:23`), React key повторяется (`Pathways.tsx:165`). | Уникальные IDs, migration completedLessons, dataset schema test в CI. |
| FUN-10 | Medium | High | XP perk локально начисляется иначе, чем в Firestore. | UI считает `xpGain`, DB делает `increment(amount)` (`AuthContext.tsx:693-727`). | Записывать тот же server-computed amount и тестировать reload consistency. |
| FUN-11 | Medium | High | Daily reward меняет level только локально. | DB update не содержит `level`, state содержит `newLevel` (`AuthContext.tsx:1005-1041`). | Атомарно обновлять XP и level сервером. |
| FUN-12 | Medium | High | Rank `SSS` по stats-ветке недостижим. | Сначала `avgStat >= 80` возвращает `S`, поэтому следующая проверка `>=95` не выполняется (`AuthContext.tsx:284-288`). | Проверять более высокий threshold первым; unit tests на границы. |
| FUN-13 | Medium | High | Повреждённый localStorage способен уронить весь AuthProvider. | `JSON.parse(saved)` без try/catch (`AuthContext.tsx:253-256`). | Safe parse, schema/versioning, reset corrupt state. |
| FUN-14 | Medium | High | Pyodide download failure оставляет editor неготовым без recovery. | CDN script не имеет `onerror` (`CodeEditor.tsx:204-230`); UI только держит disabled controls. | Self-host/SRI, explicit loading/error state, retry и offline message. |
| FUN-15 | Medium | High | Бесконечный/тяжёлый Python код замораживает вкладку. | `runPythonAsync` выполняется в main window без worker, timeout или cancel (`CodeEditor.tsx:103-173,232-366`). | Dedicated Web Worker, hard time/memory/output limits, terminate/recreate worker. |
| FUN-16 | Medium | High | Tests не изолированы друг от друга. | Один global Pyodide interpreter; user code меняет `builtins`, globals/modules, и состояние сохраняется между cases (`CodeEditor.tsx:255-314`). | Новый namespace/runtime snapshot на case; всегда восстанавливать stdout/stderr/input/builtins. |
| FUN-17 | Medium | High | Trace modal монтируется дважды. | `CodeVisualizer` рендерится на `CodeEditor.tsx:392-396` и `633-637`. | Оставить один экземпляр и regression UI test. |
| FUN-18 | Medium | High | Trace wrapper ломается на допустимом пользовательском коде и может бесконтрольно разрастаться. | Код вставляется в Python triple-quoted string с неполным escaping; нет filename filter/step limit (`CodeVisualizer.tsx:43-89`). | Передавать code через base64/pyodide globals, фильтровать filename, ограничить steps/time. |
| FUN-19 | Low | High | Cancel trade записывает статус вне объявленной модели и sender не может отменять. | UI пишет `cancelled` (`AuthContext.tsx:604-611`), validator перечисляет только pending/accepted/rejected, update разрешён receiver/admin (`firestore.rules:102-110,223-227`). | Явная state machine с sender-cancel transition. |
| FUN-20 | Low | High | Неавторизованный leaderboard показывает permission error как «Пока никого нет». | Query запускается без auth guard, error очищает loading (`Leaderboard.tsx:74-97,151-159`). | Показывать login CTA/error, не пустой dataset. |

### C. Fake, misleading, placeholder и неподтверждённые заявления

| ID | Confidence | Проблема | Evidence | Что делать |
|---|---|---|---|---|
| TRUTH-01 | High | Главная показывает выдуманную telemetry. | `active_users 1,337`, `quests_completed 42,069`, `server_load "OPTIMAL"`, `RENDER_STATUS: ONLINE` захардкожены (`Layout.tsx:977-1041`). | Подключить реальные агрегаты/health или честно маркировать demo. |
| TRUTH-02 | High | Гостю показываются фиктивные личные stats. | Всегда отображаются level 12, XP 1,240, coins 850, streak 5 (`Home.tsx:333-350`), хотя `userProfile` не используется. | Для guest показать value proposition; для user — реальные данные. |
| TRUTH-03 | High | Все feature cards говорят `STATUS: ONLINE` независимо от backend. | Единый hardcoded badge (`Home.tsx:555`); community chat фактически закрыт rules. | Status только из health/readiness; иначе убрать. |
| TRUTH-04 | High | Sandbox-декорация обещает несуществующие GPU/neural engine/VirtualEnvironment. | Статический fake code и строки GPU/Neural READY (`Home.tsx:394-410`); реальный runtime — Pyodide CDN на main thread. | Показывать реальный стек: Pyodide/WebAssembly, ограничения и offline state. |
| TRUTH-05 | High | Community claims без источника. | «50,000+ активных учеников», «24/7 поддержка экспертов», weekly challenges (`Community.tsx:34-70`). | Удалить до наличия аналитики/SLA или показать проверяемые метрики с датой. |
| TRUTH-06 | High | Discord/GitHub и leaderboard CTA — мёртвые кнопки. | `MagneticButton` без link/onClick (`Community.tsx:38-47`, `Leaderboard.tsx:173-185`). | Реальные ссылки/действия, keyboard focus и analytics. |
| TRUTH-07 | High | Privacy Policy фактически неверна и неполна. | Она заявляет только username/XP/level (`App.tsx:137-145`), но проект хранит code submissions, chats, avatar/bio, inventory, social/trade/guild data и передаёт code/chat/challenge Gemini proxy. | Полная data map, lawful basis/consent, processors, retention/deletion, contact/controller, effective date; юридическая проверка. |
| TRUTH-08 | High | AI outage маскируется как успешная генерация. | Оба generator catch возвращают fallback с HTTP 200 (`server.ts:290-346`). | Возвращать `source: fallback`, degraded status/telemetry; для admin — non-2xx либо явное предупреждение. |

### D. Учебный контент и педагогическое качество

- `lessons.ts` содержит 58 повторов абзаца «Овладение этой абстракцией…», 58 повторов одной цитаты Фаулера и 58 повторов «мины замедленного действия». Название урока механически подставляется в одинаковые утверждения; это сильный признак массового шаблонного/AI-generated filler, а не отредактированной программы.
- В intro утверждается, что interpreter «строка за строкой переводит [Python] в машинный двоичный код» (`lessons.ts:62`). Для CPython это вводит в заблуждение: исходник компилируется в bytecode, который выполняет VM; детали зависят от implementation.
- Beginner lesson использует угрозу про «склонного к насилию психопата, который знает, где вы живёте» и приписывает её «Мартину Голдингу» (`lessons.ts:94`). Это неуместно для образовательного продукта и требует fact-check/редакции.
- 330 из 365 challenges не имеют optional `code` reference field. Это не доказывает runtime-поломку, потому что tests присутствуют, но лишает контент единого эталона для QA, объяснений и server-side judging.
- Все 365 test groups присутствуют, но они выполняются на клиенте и видны учащемуся; hidden judge и защита от hardcoded answers отсутствуют.
- Нужна предметная редактура каждого урока: learning objectives, prerequisites, explanation → worked example → deliberate practice → feedback, factual citations и rubric.

### E. UX и accessibility

- Runtime console выдаёт повторные React warnings о duplicate keys; причина подтверждена duplicate lesson IDs.
- На проверенных страницах AX tree нашёл 2–4 кнопки без accessible name. Примеры: icon-only close в `CodeVisualizer.tsx:155-168`, send в `GuildChat.tsx:61-75`, декоративные floating buttons.
- Clickable `motion.div` строка leaderboard не имеет button/link semantics, keyboard handler и focus (`Leaderboard.tsx:14-24`).
- Modals не задают `role="dialog"`, `aria-modal`, focus trap, initial focus, Escape и возврат фокуса (`CodeVisualizer.tsx:124-170`, create-guild modal `Guilds.tsx:263-340`).
- Много текста `white/20`, `white/30`, `text-[8px]`/`text-[10px]`; на тёмном фоне это часто ниже WCAG contrast/readability threshold.
- Много бесконечных и scroll-driven animations без системного `prefers-reduced-motion` поведения; `lowPerfMode` — ручной и не заменяет accessibility preference.
- Hover-first dropdown/navigation и custom cursor усложняют keyboard/touch use; мобильный viewport нуждается в отдельной матрице устройств.
- Нет ErrorBoundary и recovery для lazy chunk/runtime failures; неизвестный route не имеет 404.
- Один document title для всех route, нет route-specific meta/OG, skip link и явно проверенного focus order.
- Mixed Russian/English labels (`Run code`, `SUCCESS`, `FAILED`, `Press Enter`) снижают целостность локализации.

### F. Архитектура, maintainability, performance и operations

- `AuthContext.tsx` — 1 637 строк и совмещает auth, profile, economy, marketplace, trades, daily quests, admin, submissions и pet/items. Это high-coupling god object с race conditions и сложным тестированием.
- `lessons.ts` — около 9 000 строк в одном bundle; контент должен быть schema-validated data/content chunks, а не монолитный TS.
- Большинство write flows — последовательные read/modify/write без transaction, поэтому конкурирующие вкладки теряют updates или создают partial state.
- `rooms` хранится только в процессе (`server.ts:76`): restart/deploy теряет duel/sandbox state, горизонтальное масштабирование невозможно без shared adapter/store.
- Vite build предупреждает о static+dynamic imports `sounds.ts` и `Shop.tsx`; lazy loading фактически не разделяет эти модули.
- Production bundles чрезмерны: 3.18 MB основной JS и почти 2 MB physics до gzip. Monaco, Three/Spline, Pyodide и lesson data требуют route-level split и загрузки по требованию.
- `package.json` называется `react-example@0.0.0`, не содержит `engines`, `test`, format, CI, accessibility/e2e/security scripts; `vite` дублируется в dependencies/devDependencies.
- Одновременно установлены `@google/genai` и `@google/generative-ai`, но first-party code использует только второй; удалить неиспользуемый пакет после dependency graph check.
- TypeScript не включает `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`; `allowJs` и `skipLibCheck` снижают сигнал. Много `any` и `@ts-ignore` в доверительных границах.
- Vite вызывает `loadEnv`, но переменная `env` не используется; HMR читает `process.env`, поэтому `.env`-значение может не примениться ожидаемо (`vite.config.ts:6-19`).
- `clean` использует Unix-only `rm -rf`; проект заявляет лишь Node requirement, но script не cross-platform.
- Нет CI config, unit/integration/e2e/rules tests, coverage threshold, dependency update policy, SAST/secret scan и release checklist.
- Firebase auth config содержит только localhost redirect в repository config (`firebase.json:8-17`); production OAuth domains/redirects должны быть отдельно проверены.
- Remote runtime/assets (jsDelivr Pyodide, Spline scene, Dicebear avatars, transparenttextures) создают availability/privacy dependencies; отсутствует documented fallback/CSP strategy.
- Video render зависит от network download браузера и не использует установленный executable; это ломает offline/CI reproducibility.
- Логи сервера печатают socket IDs на каждое соединение, но нет structured logging, request IDs, metrics, readiness, graceful shutdown, persistence or alerting.

## Recommendations

### P0 — до любого публичного запуска

1. Заморозить competitive/economy features до переноса наград, marketplace, trades, friends, bosses и quests в доверенный backend. Закрыть SEC-01–06 и написать Firestore emulator test matrix.
2. Защитить AI и Socket.IO: verify Firebase token, admin claims, room capabilities, rate limits, quotas, payload schemas, server-side duel judge.
3. Исправить FUN-01–09: duel result, missing collection rules, guild model, atomic marketplace/trades/friends, tournament route, lesson IDs.
4. Убрать/маркировать fake telemetry, fake community claims и false `ONLINE`; заменить privacy/terms на фактические документы.
5. Не выпускать leaderboard, пока XP не server-authoritative и historical tampered data не очищены.

### P1 — следующий стабилизационный спринт

1. Разделить `AuthContext` на auth/profile/economy/social/admin services; все multi-document writes — server transactions с idempotency.
2. Перенести Pyodide в Worker с terminate-on-timeout, чистым runtime/namespace на test и ограничениями output/memory/steps.
3. Удалить duplicate `CodeVisualizer`, безопасно передавать code в tracer, добавить error/retry/offline states.
4. Ввести Vitest + React Testing Library, Firestore Rules Emulator tests, API integration, Socket.IO state-machine tests и Playwright критических journeys.
5. Включить `strict`, ESLint, formatter, `noUncheckedIndexedAccess`, CI gates и schema validator для уроков.

### P2 — качество продукта

1. Полностью отредактировать curriculum: удалить 58-кратный filler, исправить фактические ошибки/атрибуции, добавить learning objectives и server-verifiable tasks.
2. Провести WCAG 2.2 AA pass: accessible names, dialogs/focus, keyboard rows/dropdowns, contrast, reduced motion, skip link, screen-reader smoke.
3. Сделать truthful product states: реальный health/readiness, empty/error/degraded UI, verified analytics with dates.
4. Добавить ErrorBoundary, 404, route metadata, consistency локализации и user-facing diagnostics без PII.

### P3 — performance и operations

1. Route/data code splitting: Monaco, Three/Spline, arcade physics и lessons загружать только по необходимости; установить bundle budgets.
2. Вынести realtime state в Redis/Socket.IO adapter или ограничить deployment одним процессом с явной потерей state; добавить graceful shutdown/reconnect.
3. Self-host критических runtime assets либо добавить CSP/SRI/fallback и privacy disclosure.
4. Закрепить Node/package manager versions, почистить зависимости, сделать render script reproducible с явным browser executable.
5. Добавить structured logs, metrics (latency/error/quota/rooms), alerting, backup/restore и incident runbook.

### Минимальный acceptance checklist

- Firestore rules tests доказывают отрицательные сценарии для каждой коллекции и каждого protected field.
- Ни один клиентский request не может сам назначить reward или изменить чужой/global документ.
- Duel winner определяется server-side; anonymous sockets rejected.
- Marketplace/trade/friend/guild операции атомарны и проходят end-to-end.
- Все lesson IDs уникальны; curriculum validator и content lint работают в CI.
- Нет dead CTA, fake status и ложных privacy claims.
- Keyboard-only и screen-reader critical journeys проходят; reduced motion соблюдается.
- Initial and route chunks укладываются в утверждённые budgets; Pyodide failure/retry/timeout протестированы.

## Limitations

- Нельзя математически гарантировать обнаружение «абсолютно всех» неизвестных дефектов; отчёт охватывает весь first-party контур, но не является формальной верификацией.
- Live Firebase/App Check/API-key restriction/production headers не проверялись: они могут быть настроены вне repository. Наличие внешней настройки не исправляет source-level broken rules и client authority.
- Firestore findings не запускались в emulator из-за отсутствия harness; они подтверждены прямой семантикой rules и соответствующими call paths.
- Dependency CVE status неизвестен, потому что registry advisory request был blocked; версии не объявляются безопасными.
- Browser pass был bounded smoke-аудитом, не полной device/browser/screen-reader матрицей.
- Независимый baseline-аудитор не применялся из-за активной политики, запрещавшей delegation; security coverage поэтому отмечен partial.
