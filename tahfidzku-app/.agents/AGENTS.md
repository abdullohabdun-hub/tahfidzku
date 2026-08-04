# Project Rules

## Database Migrations
**Wajib disepakati sebelum migrasi APAPUN menyentuh production:**
Untuk SEMUA migrasi skema (Fase 2, Fase 3, dan seterusnya), mekanisme berikut WAJIB dipakai secara konsisten:

1. **`npx drizzle-kit generate`**: Selalu buat file migrasi versioned.
2. **Review Manual**: Selalu review isi file migrasi tersebut secara manual sebelum dieksekusi.
3. **Fail-Fast Script**: Eksekusi SQL harus menggunakan script yang **BERHENTI TOTAL (fail-fast)** pada statement pertama yang gagal (tidak boleh ada `try-catch` yang hanya melakukan *log-and-continue*). Script wajib melaporkan persis statement mana yang berhasil dan mana yang gagal.
4. **Eksekusi Production**: Untuk *PRODUCTION*, eksekusi migrasi HANYA boleh dijalankan secara manual oleh USER (menggunakan kredensial production sementara). Antigravity tidak boleh mengeksekusi migrasi ke production secara mandiri.
5. **No Stealth Mutations (Raw SQL / Push)**: Setiap eksekusi raw SQL (`ALTER TABLE`, dsb) atau penggunaan `drizzle-kit push` terhadap database **mana pun (termasuk Dev/Local)** WAJIB dilaporkan dan di-flag/disepakati terlebih dahulu bersama USER sebelum dieksekusi. Tidak boleh ada eksekusi diam-diam tanpa persetujuan eksplisit sebagai jalan pintas.

## Type Checking Sebelum Commit
**Wajib dijalankan sebelum commit kode apa pun:**
Sebelum melaporkan "siap commit", Anda WAJIB menjalankan `npx tsc --noEmit` untuk mendeteksi *syntax error* atau *TypeScript error*. Jangan biarkan kode yang merusak *build* lolos ke commit.

## Production Deployment & Migration Protocol

### 1. Verification of Environment Variables
- `DATABASE_URL` di Vercel Dashboard (Production) harus selalu berisi URL Neon DB Production (`ep-twilight-feather-ao5fmi2r`) yang valid, tidak boleh berupa string kosong `""`.
- Setelah melakukan update environment variable di Vercel, **selalu lakukan Redeploy** (`npx vercel --prod --yes`) agar serverless function Vercel memuat nilai environment terbaru. **PERHATIAN: Tindakan redeploy ini tetap tunduk mutlak pada Aturan 3 (Strict Guardrail) di bawah ini — WAJIB ada kata "approved" eksplisit dari USER sebelum mengeksekusinya, tanpa terkecuali.**

### 2. Prosedur Eksekusi Migrasi Production (Fail-Fast & Explicit Target)
- Jangan pernah menjalankan script migrasi tanpa menentukan target environment secara eksplisit.
- Gunakan flag `--prod` pada script `scripts/run-migration.ts` agar script secara eksplisit membaca `.env.production` (Database Production).
- Format perintah eksekusi migrasi production yang aman:
  ```powershell
  $env:CONFIRM_PRODUCTION="yes"; npx tsx scripts/run-migration.ts src/db/migrations/<nama_file_migrasi>.sql --prod
  ```
- Script `scripts/run-migration.ts` harus memiliki fitur *Safe-Skip* untuk error DDL duplikat (`already exists` / PostgreSQL code `42710`, `42701`, `42P07`) agar tidak berhenti secara tidak sengaja pada tabel/kolom yang sudah ada.
- **PERHATIAN: Walaupun perintah di atas formatnya sudah aman, eksekusi migrasi ke production ini tetap tunduk mutlak pada Aturan 3 dan Aturan Induk (Database Migrations poin 4) — WAJIB ada kata "approved" eksplisit dari USER sebelum dieksekusi.**

### 3. Eksekusi Deployment ke Production (Strict Guardrail)
- **TIDAK BOLEH** menjalankan perintah `npx vercel --prod` atau deploy ke production tanpa ada kata **"approved"** atau persetujuan eksplisit secara literal dari USER di dalam percakapan. Jangan pernah berasumsi bahwa perbaikan yang berhasil secara teknis berarti otomatis disetujui untuk di-deploy.
- Selalu tahan eksekusi (halt) dan tunggu lampu hijau (sign-off) dari USER sebelum menyentuh production.

### 4. Skrip Langsung ke Database Production (Strict Guardrail)
- Jika harus menjalankan skrip diagnostik / audit ke database production di luar flow aplikasi utama, **wajib** menggunakan kredensial/role DB yang khusus read-only (jika tersedia) untuk menjamin skrip bersifat read-only secara struktural.
- Jika role read-only belum tersedia dan terpaksa menggunakan `DATABASE_URL` dengan hak akses penuh, isi literal dari file skrip tersebut **WAJIB** ditunjukkan kepada USER untuk direview **SEBELUM** skrip tersebut dieksekusi. Jangan mem-bypass dengan alasan "ini hanya query SELECT".

### 5. Checklist Diagnosis Error "Akses Ditolak / Terjadi Kesalahan pada Server"
- Jika frontend menampilkan `AuthErrorAlert` ("Terjadi kesalahan pada server"), penyebab utamanya biasanya salah satu dari dua hal ini:
  1. **Autentikasi/Koneksi DB Gagal**: `DATABASE_URL` di Vercel kosong atau password kedaluwarsa (`password authentication failed`).
  2. **Schema Mismatch (Missing Column)**: Fitur/kolom baru di kodingan belum dieksekusi di database production (`column ... does not exist` / PostgreSQL code `42703`).
- Selalu jalankan uji query langsung ke database production dengan script diagnostic sebelum membuat hipotesis atau mengubah kode UI frontend.




<!-- intent-skills:start -->
# TanStack Intent - before editing files, run the matching guidance command.
tanstackIntent:
  - id: "@tanstack/devtools#devtools-app-setup"
    run: "npx @tanstack/intent@latest load @tanstack/devtools#devtools-app-setup"
    for: "Install TanStack Devtools, pick framework adapter (React/Vue/Solid/Preact), register plugins via plugins prop, configure shell (position, hotkeys, theme, hideUntilHover, requireUrlFlag, eventBusConfig). TanStackDevtools component, defaultOpen, localStorage persistence."
  - id: "@tanstack/devtools#devtools-marketplace"
    run: "npx @tanstack/intent@latest load @tanstack/devtools#devtools-marketplace"
    for: "Publish plugin to npm and submit to TanStack Devtools Marketplace. PluginMetadata registry format, plugin-registry.ts, pluginImport (importName, type), requires (packageName, minVersion), framework tagging, multi-framework submissions, featured plugins."
  - id: "@tanstack/devtools#devtools-plugin-panel"
    run: "npx @tanstack/intent@latest load @tanstack/devtools#devtools-plugin-panel"
    for: "Build devtools panel components that display emitted event data. Listen via EventClient.on(), handle theme (light/dark), use @tanstack/devtools-ui components. Plugin registration (name, render, id, defaultOpen), lifecycle (mount, activate, destroy), max 3 active plugins. Two paths: Solid.js core with devtools-ui for multi-framework support, or framework-specific panels."
  - id: "@tanstack/devtools#devtools-production"
    run: "npx @tanstack/intent@latest load @tanstack/devtools#devtools-production"
    for: "Handle devtools in production vs development. removeDevtoolsOnBuild, devDependency vs regular dependency, conditional imports, NoOp plugin variants for tree-shaking, non-Vite production exclusion patterns."
  - id: "@tanstack/devtools-event-client#devtools-bidirectional"
    run: "npx @tanstack/intent@latest load @tanstack/devtools-event-client#devtools-bidirectional"
    for: "Two-way event patterns between devtools panel and application. App-to-devtools observation, devtools-to-app commands, time-travel debugging with snapshots and revert. structuredClone for snapshot safety, distinct event suffixes for observation vs commands, serializable payloads only."
  - id: "@tanstack/devtools-event-client#devtools-event-client"
    run: "npx @tanstack/intent@latest load @tanstack/devtools-event-client#devtools-event-client"
    for: "Create typed EventClient for a library. Define event maps with typed payloads, pluginId auto-prepend namespacing, emit()/on()/onAll()/onAllPluginEvents() API. Connection lifecycle (5 retries, 300ms), event queuing, enabled/disabled state, SSR fallbacks, singleton pattern. Unique pluginId requirement to avoid event collisions."
  - id: "@tanstack/devtools-event-client#devtools-instrumentation"
    run: "npx @tanstack/intent@latest load @tanstack/devtools-event-client#devtools-instrumentation"
    for: "Analyze library codebase for critical architecture and debugging points, add strategic event emissions. Identify middleware boundaries, state transitions, lifecycle hooks. Consolidate events (1 not 15), debounce high-frequency updates, DRY shared payload fields, guard emit() for production. Transparent server/client event bridging."
  - id: "@tanstack/devtools-vite#devtools-vite-plugin"
    run: "npx @tanstack/intent@latest load @tanstack/devtools-vite#devtools-vite-plugin"
    for: "Configure @tanstack/devtools-vite for source inspection (data-tsd-source, inspectHotkey, ignore patterns), console piping (client-to-server, server-to-client, levels), enhanced logging, server event bus (port, host, HTTPS), production stripping (removeDevtoolsOnBuild), editor integration (launch-editor, custom editor.open). Must be FIRST plugin in Vite config. Vite ^6 || ^7 only."
  - id: "@tanstack/react-start#lifecycle/migrate-from-nextjs"
    run: "npx @tanstack/intent@latest load @tanstack/react-start#lifecycle/migrate-from-nextjs"
    for: "Step-by-step migration from Next.js App Router to TanStack Start: route definition conversion, API mapping, server function conversion from Server Actions, middleware conversion, data fetching pattern changes."
  - id: "@tanstack/react-start#react-start"
    run: "npx @tanstack/intent@latest load @tanstack/react-start#react-start"
    for: "React bindings for TanStack Start: createStart, StartClient, StartServer, React-specific imports, re-exports from @tanstack/react-router, full project setup with React, useServerFn hook."
  - id: "@tanstack/react-start#react-start/server-components"
    run: "npx @tanstack/intent@latest load @tanstack/react-start#react-start/server-components"
    for: "Implement, review, debug, and refactor TanStack Start React Server Components in React 19 apps. Use when tasks mention @tanstack/react-start/rsc, renderServerComponent, createCompositeComponent, CompositeComponent, renderToReadableStream, createFromReadableStream, createFromFetch, Composite Components, React Flight streams, loader or query owned RSC caching, router.invalidate, structuralSharing: false, selective SSR, stale names like renderRsc or .validator, or migration from Next App Router RSC patterns. Do not use for generic SSR or non-TanStack RSC frameworks except brief comparison."
  - id: "@tanstack/router-core#router-core"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core"
    for: "Framework-agnostic core concepts for TanStack Router: route trees, createRouter, createRoute, createRootRoute, createRootRouteWithContext, addChildren, Register type declaration, route matching, route sorting, file naming conventions. Entry point for all router skills."
  - id: "@tanstack/router-core#router-core/auth-and-guards"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/auth-and-guards"
    for: "Route protection with beforeLoad, redirect()/throw redirect(), isRedirect helper, authenticated layout routes (_authenticated), non-redirect auth (inline login), RBAC with roles and permissions, auth provider integration (Auth0, Clerk, Supabase), router context for auth state."
  - id: "@tanstack/router-core#router-core/code-splitting"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/code-splitting"
    for: "Automatic code splitting (autoCodeSplitting), .lazy.tsx convention, createLazyFileRoute, createLazyRoute, lazyRouteComponent, getRouteApi for typed hooks in split files, codeSplitGroupings per-route override, splitBehavior programmatic config, critical vs non-critical properties."
  - id: "@tanstack/router-core#router-core/data-loading"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/data-loading"
    for: "Route loader option, loaderDeps for cache keys, staleTime/gcTime/ defaultPreloadStaleTime SWR caching, pendingComponent/pendingMs/ pendingMinMs, errorComponent/onError/onCatch, beforeLoad, router context and createRootRouteWithContext DI pattern, router.invalidate, Await component, deferred data loading with unawaited promises."
  - id: "@tanstack/router-core#router-core/navigation"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/navigation"
    for: "Link component, useNavigate, Navigate component, router.navigate, ToOptions/NavigateOptions/LinkOptions, from/to relative navigation, activeOptions/activeProps, preloading (intent/viewport/render), preloadDelay, navigation blocking (useBlocker, Block), createLink, linkOptions helper, scroll restoration, MatchRoute."
  - id: "@tanstack/router-core#router-core/not-found-and-errors"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/not-found-and-errors"
    for: "notFound() function, notFoundComponent, defaultNotFoundComponent, notFoundMode (fuzzy/root), errorComponent, CatchBoundary, CatchNotFound, isNotFound, NotFoundRoute (deprecated), route masking (mask option, createRouteMask, unmaskOnReload)."
  - id: "@tanstack/router-core#router-core/path-params"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/path-params"
    for: "Dynamic path segments ($paramName), splat routes ($ / _splat), optional params ({-$paramName}), prefix/suffix patterns ({$param}.ext), useParams, params.parse/stringify, pathParamsAllowedCharacters, i18n locale patterns."
  - id: "@tanstack/router-core#router-core/search-params"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/search-params"
    for: "validateSearch, search param validation with Zod/Valibot/ArkType adapters, fallback(), search middlewares (retainSearchParams, stripSearchParams), custom serialization (parseSearch, stringifySearch), search param inheritance, loaderDeps for cache keys, reading and writing search params."
  - id: "@tanstack/router-core#router-core/ssr"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/ssr"
    for: "Non-streaming and streaming SSR, RouterClient/RouterServer, renderRouterToString/renderRouterToStream, createRequestHandler, defaultRenderHandler/defaultStreamHandler, HeadContent/Scripts components, head route option (meta/links/styles/scripts), ScriptOnce, automatic loader dehydration/hydration, memory history on server, data serialization, document head management."
  - id: "@tanstack/router-core#router-core/type-safety"
    run: "npx @tanstack/intent@latest load @tanstack/router-core#router-core/type-safety"
    for: "Full type inference philosophy (never cast, never annotate inferred values), Register module declaration, from narrowing on hooks and Link, strict:false for shared components, getRouteApi for code-split typed access, addChildren with object syntax for TS perf, LinkProps and ValidateLinkOptions type utilities, as const satisfies pattern."
  - id: "@tanstack/router-plugin#router-plugin"
    run: "npx @tanstack/intent@latest load @tanstack/router-plugin#router-plugin"
    for: "TanStack Router bundler plugin for route generation and automatic code splitting. Supports Vite, Webpack, Rspack, and esbuild. Configures autoCodeSplitting, routesDirectory, target framework, and code split groupings."
  - id: "@tanstack/start-client-core#start-core"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core"
    for: "Core overview for TanStack Start: tanstackStart() Vite plugin, getRouter() factory, root route document shell (HeadContent, Scripts, Outlet), client/server entry points, routeTree.gen.ts, tsconfig configuration. Entry point for all Start skills."
  - id: "@tanstack/start-client-core#start-core/auth-server-primitives"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/auth-server-primitives"
    for: "Server-side authentication primitives for TanStack Start: session cookies (HttpOnly, Secure, SameSite, __Host- prefix), session read/issue/destroy via createServerFn and middleware, OAuth authorization-code flow with state and PKCE, password-reset enumeration defense, CSRF for non-GET RPCs, rate limiting auth endpoints, session rotation on privilege change. Pairs with router-core/auth-and-guards for the routing side."
  - id: "@tanstack/start-client-core#start-core/deployment"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/deployment"
    for: "Deploy to Cloudflare Workers, Netlify, Vercel, Node.js/Docker, Bun, Railway. Selective SSR (ssr option per route), SPA mode, static prerendering, ISR with Cache-Control headers, SEO and head management."
  - id: "@tanstack/start-client-core#start-core/execution-model"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/execution-model"
    for: "Isomorphic-by-default principle, environment boundary functions (createServerFn, createServerOnlyFn, createClientOnlyFn, createIsomorphicFn), ClientOnly component, useHydrated hook, import protection, dead code elimination, environment variable safety (VITE_ prefix, process.env)."
  - id: "@tanstack/start-client-core#start-core/middleware"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/middleware"
    for: "createMiddleware, request middleware (.server only), server function middleware (.client + .server), context passing via next({ context }), sendContext for client-server transfer, global middleware via createStart in src/start.ts, middleware factories, method order enforcement, fetch override precedence."
  - id: "@tanstack/start-client-core#start-core/server-functions"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/server-functions"
    for: "createServerFn (GET/POST), validator (Zod or function), useServerFn hook, server context utilities (getRequest, getRequestHeader, setResponseHeader, setResponseStatus), error handling (throw errors, redirect, notFound), streaming, FormData handling, file organization (.functions.ts, .server.ts)."
  - id: "@tanstack/start-client-core#start-core/server-routes"
    run: "npx @tanstack/intent@latest load @tanstack/start-client-core#start-core/server-routes"
    for: "Server-side API endpoints using the server property on createFileRoute, HTTP method handlers (GET, POST, PUT, DELETE), createHandlers for per-handler middleware, handler context (request, params, context), request body parsing, response helpers, file naming for API routes."
  - id: "@tanstack/start-server-core#start-server-core"
    run: "npx @tanstack/intent@latest load @tanstack/start-server-core#start-server-core"
    for: "Server-side runtime for TanStack Start: createStartHandler, request/response utilities (getRequest, setResponseHeader, setCookie, getCookie, useSession), three-phase request handling, AsyncLocalStorage context."
  - id: "@tanstack/virtual-file-routes#virtual-file-routes"
    run: "npx @tanstack/intent@latest load @tanstack/virtual-file-routes#virtual-file-routes"
    for: "Programmatic route tree building as an alternative to filesystem conventions: rootRoute, index, route, layout, physical, defineVirtualSubtreeConfig. Use with TanStack Router plugin's virtualRouteConfig option."
<!-- intent-skills:end -->


## Security Restrictions
**DILARANG membaca file .env, dilarang melakukan query ke kolom kredensial/password di database, dan dilarang mencoba login ke akun manapun � dalam kondisi apapun, tanpa instruksi tertulis eksplisit dari user saat itu juga.** Improvisasi untuk mencari kredensial demi 'verifikasi UI' atau 'screenshot' dilarang keras.

## Bukti Mentah — Aturan Wajib
- `git diff` pada file yang BELUM di-track (file baru) akan selalu kosong — ini BUKAN berarti "tidak ada perubahan untuk dilaporkan". Untuk file baru, gunakan `cat`/`view` untuk membaca ISI FILE SAAT INI dari disk, lalu laporkan itu sebagai bukti.
- DILARANG KERAS merekonstruksi/menulis ulang isi kode dari ingatan lalu menyajikannya seolah hasil pembacaan file/diff asli. Kalau ragu isi file yang sebenarnya, BACA ULANG filenya — jangan pernah menebak dan melaporkan tebakan sebagai fakta.
- Kalau sebuah tool/command tidak menghasilkan output yang diharapkan (mis. diff kosong untuk file yang seharusnya berubah), laporkan keanehan itu apa adanya dan cari cara lain untuk verifikasi — jangan isi kekosongan itu dengan konten buatan.
