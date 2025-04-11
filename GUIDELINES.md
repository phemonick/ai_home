You are an AI code assistant. Your goal is to generate a full-stack, multi-tenant AI Assistant MVP based on the provided architecture. Produce code and configuration files in a monorepo layout, step by step, module by module. Follow these tasks in order, and output only code files or file trees as requested:

1. **Monorepo Scaffold**
   - Create a root directory `ai-assistant/` with subdirectories: `client/`, `api/`, `admin-portal/`, `vector-data/`, `llm/`.
   - Add a root `package.json`, `tsconfig.json`, `.gitignore`, and `README.md` with project description.

2. **Client SDK & Widget**
   - Under `client/sdk/`, generate a TypeScript module `contextSdk.ts` that:
     - Exports a function `getContext()` returning `{ currentPage, userRole, permissions, recentApiErrors }` by intercepting `window.location`, a global `USER` object, and `fetch`/`axios` hooks.
     - Provides an `initWidget(apiUrl: string)` to inject the React widget.
   - Under `client/components/`, create `AssistantWidget.tsx`:
     - A React component with chat UI and stepper view.
     - Uses Tailwind CSS for styling.
     - Accepts props: `apiUrl: string`, `tenantId: string`, `config: WidgetConfig`.
   - In `client/App.tsx`, demonstrate usage of `initWidget` and mount `AssistantWidget`.
   - Add `client/package.json` and `vite.config.ts` for a Vite React project.

3. **API Middleware (FastAPI)**
   - Under `api/`, scaffold a Python FastAPI project:
     - `main.py` with routes `/chat` and `/ingest-docs`.
     - `services/llm_client.py` wrapping calls to a local Ollama endpoint.
     - `services/vector_store.py` for querying Chroma or Qdrant.
     - `routes/chat.py` to accept JSON `{ tenantId, context, message }`, enrich context, call vector store and LLM, and return `{ response, steps }`.
     - `routes/ingest_docs.py` to accept file uploads and embed them.
   - Add `api/requirements.txt` and Dockerfile for containerization.

4. **Vector Data Ingestion**
   - In `vector-data/ingest_docs.py`, write a Python script using LangChain:
     - Reads markdown, PDF, and OpenAPI specs from `vector-data/docs/`.
     - Embeds with `Instructor-XL` or `all-MiniLM-L6-v2`.
     - Upserts into a local ChromaDB instance.
   - Provide a shell script `vector-data/run_ingest.sh`.

5. **Local LLM Integration**
   - In `llm/run_model.sh`, add commands to launch Ollama with a chosen model (e.g., `ollama run llama3`).
   - Document in `llm/README.md` how to install Ollama and load the model.

6. **Guided Task Engine**
   - Under `api/services/`, create `guided_task_engine.py`:
     - A class `GuidedTaskEngine` that parses LLM JSON output into step objects.
     - Methods `get_next_step(sessionId)`, `get_previous_step(sessionId)`, `handle_error(sessionId)`.
   - Write unit tests under `api/tests/` for step navigation.

7. **API Monitoring Engine**
   - In `client/sdk/contextSdk.ts`, enhance `fetch` and `axios` wrappers to log recent errors in memory.
   - Expose these logs via `getContext()` so the backend can diagnose errors.

8. **Escalation Module**
   - Under `api/services/escalation.py`, implement functions:
     - `create_ticket(tenantId, details)` that logs to a database or sends to Slack via webhook.
     - `notify_support(tenantId, message)`.

9. **Admin Portal (Next.js)**
   - Under `admin-portal/`, scaffold a Next.js + Tailwind project:
     - Pages: `/login`, `/dashboard`, `/orgs/[id]/settings`, `/orgs/[id]/docs`, `/orgs/[id]/permissions`, `/orgs/[id]/widget`.
     - Components for file upload, form inputs, analytics charts (placeholder data).
     - API routes under `admin-portal/pages/api/` proxying to the main `api/` service.

10. **Authentication & Multi-Tenancy**
   - Add middleware in `api/main.py` to validate an API key per request and set `tenantId` in context.
   - In `admin-portal`, implement basic JWT auth for org admins.

11. **Testing & CI**
   - Add Jest configuration in `client/` and `admin-portal/` for unit tests.
   - Add pytest in `api/` for backend tests.
   - Create a GitHub Actions workflow `.github/workflows/ci.yml` that runs lint, tests, and builds containers.

12. **Documentation**
   - Flesh out `README.md` in root with setup, development, and deployment instructions.
   - Add API docs via OpenAPI (FastAPI auto-generated) and embed in the Admin Portal.

Be thorough and produce complete code files, not just pseudocode. Confirm completion of each step before proceeding to the next.```
---

## 🛠️ Backend: Detailed Instructions & Acceptance Criteria

### Features
- **Tenant-Aware API Layer**: Authenticate requests via API key, extract `tenantId`, and route accordingly.
- **/chat Endpoint**: Accept JSON `{ tenantId, context, message }`, perform context enrichment (permissions, API logs, vector search), invoke LLM, and return `{ response: string, steps?: Step[] }`.
- **/ingest-docs Endpoint**: Accept file uploads (Markdown, PDF, OpenAPI), parse, embed content into Vector DB, and return ingestion status.
- **Context Enrichment**: Query Permission DB and API Monitoring Engine to attach user permissions and recent network errors to each request.
- **LLM Integration**: Call local Ollama instance with constructed prompt, handle timeouts, retries, and error responses.
- **Guided Task Engine**: Parse LLM output into a session-based step flow; expose `getNextStep`, `getPrevStep`, and `handleStepError` methods.
- **Escalation Engine**: Monitor failed resolutions, threshold triggers, and create support tickets via Slack webhook or email.
- **Health & Metrics**: Expose `/health` and `/metrics` endpoints for service status and basic usage stats.

### Acceptance Criteria
1. **Authentication**: Requests without or with invalid API key receive HTTP 401.
2. **/chat Contract**: Valid requests return HTTP 200 with JSON containing non-empty `response` and optional `steps` array when context indicates a task.
3. **/ingest-docs Contract**: Uploaded files are processed and indexed; response includes ingestion result and any errors.
4. **Context Accuracy**: Permission DB and last 5 API errors appear correctly in enriched context (unit tested).
5. **LLM Performance**: Responses returned within 2 seconds under normal load; timeouts handled with friendly error message.
6. **Guided Task Flow**: Step navigation methods maintain correct session state and boundary conditions (start/end).
7. **Escalation Trigger**: Unresolved interactions beyond 3 attempts trigger a ticket creation and return a confirmation in the chat response.
8. **Test Coverage**: Unit and integration tests cover all routes and services with ≥80% code coverage.

---

## 🎨 Widget: Detailed Instructions & Acceptance Criteria

### Features
- **Floating Chat Button**: Visible on all pages, toggles open/close.
- **Chat UI**: Display user and assistant messages; input box with send button; loading indicator.
- **Step-by-Step Pane**: Render structured `steps` with Next, Previous, and "I’m stuck" controls.
- **Context SDK**: Capture and expose `{ currentPage, userRole, permissions, recentApiErrors }`.
- **Initialization API**: `initWidget({ apiUrl, tenantId, config })` to bootstrap the widget.
- **Theming & Customization**: Apply brand colors, logo, tone settings from `config`.
- **Offline & Error Handling**: Detect offline state or API failures and show user-friendly fallback.

### Acceptance Criteria
1. **Load Performance**: Widget JS and assets load and initialize within 200ms on page load.
2. **Chat Functionality**: User can send messages and receive AI responses; UI updates correctly.
3. **Step Navigation**: Steps array renders correctly; Next/Previous navigate through steps; "I’m stuck" calls escalation.
4. **Context Accuracy**: `getContext()` returns accurate values in unit tests.
5. **Customization**: Changes to `config` (colors, logo, tone) reflect immediately without reload.
6. **SPA Compatibility**: Widget remains mounted and updates context on route changes in single-page apps.
7. **E2E Tests**: Automated tests simulate a user flow: open widget, send message, navigate steps, escalate.

---

## 🛂 Admin Portal: Detailed Instructions & Acceptance Criteria

### Features
- **Authentication & Authorization**: JWT-based login for org admins; role-based access.
- **Org & Project Management**: Create, update, and delete organizations; register website domains.
- **Data Ingestion Dashboard**: Upload and manage documentation files; view ingestion status and logs.
- **Permission Management UI**: Define and edit role-action-page mappings via form or JSON editor.
- **Widget Customization UI**: Configure branding (logo, colors, tone), feature toggles, and embed snippet.
- **Analytics & Monitoring**: Dashboards showing widget usage, top queries, error rates, and escalation counts.
- **API Key Management**: Generate, rotate, and revoke API keys for each org.

### Acceptance Criteria
1. **Secure Access**: Only authenticated org admins can access portal pages; unauthorized access returns HTTP 403.
2. **Org Lifecycle**: CRUD operations on orgs and projects function correctly; domains validated.
3. **Doc Ingestion**: File uploads trigger ingestion; dashboard displays real-time status and any parsing errors.
4. **Permission Rules**: Saved rules persist and are applied in backend context enrichment (verified via test chat calls).
5. **Customization Persistence**: Widget settings saved per org and used by the SDK to style the widget.
6. **Analytics Accuracy**: Charts reflect real or simulated data; filters and date ranges work as expected.
7. **API Key Security**: Keys can be generated, displayed once, rotated, and revoked; invalid keys blocked.
8. **E2E Tests**: Automated portal tests cover login, org setup, doc upload, permission config, and customization flows.
