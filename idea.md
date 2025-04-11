# 🧱 AI Assistant MVP Development Document

## 📌 Overview

The AI Assistant will serve as an embedded widget across your web application to help users troubleshoot, guide them step-by-step, and escalate issues when needed. It will leverage a **local LLM** and be trained on internal data such as permission rules, API documentation, and help guides. This version is also built to support **multi-tenant setups** so any company can integrate it into their own website.

This document outlines the MVP architecture and development plan.

---

## ✅ MVP Core Features

1. **Contextual Help per Page**
   - Detect current page and user permissions.
   - Understand which actions are allowed or blocked.

2. **Conversational Assistant**
   - Chat interface for user queries.
   - Friendly, instructional tone.

3. **Document QA using Vector DB**
   - Query internal documentation using vector search.

4. **Step-by-Step Instructions**
   - Break down complex flows into interactive, UI-based steps.

5. **Escalation Module**
   - Open support ticket or notify team if issue can't be resolved.

6. **Runs Locally**
   - Use Ollama to run LLMs like LLaMA 3 or Mistral locally.

7. **Admin Portal for Org Integration**
   - Allow any company to configure their own docs, roles, APIs.
   - Manage and monitor their assistant in one dashboard.

---

## 🧠 System Architecture

### Client Website SDK (Integrators)

- **Assistant Widget (React)**
  - Chat UI
  - Step-by-step instructional pane

- **Context SDK (JavaScript)**
  - Tracks:
    - Current route/page
    - User role/permissions
    - Recent clicks and network calls (via fetch/axios interception)
  - Injected via simple JS snippet like: `<script src='https://cdn.aiassistant.dev/widget.js'></script>`

### Backend Platform (Multi-Tenant)

- **Tenant-Aware API Layer (FastAPI / Express)**
  - Routes request to tenant-specific context and LLM chains

- **Vector DB (Chroma / Qdrant)**
  - Stores embedded org-specific:
    - Internal docs
    - API reference
    - Help guides / FAQs

- **Local LLM (via Ollama)**
  - Runs local models per tenant or shared across tenants
  - Powers the actual conversation and response generation

- **Guided Task Engine**
  - Converts LLM answers into structured JSON tasks
  - Renders each step via frontend widget

- **API Monitoring Engine**
  - Hooks into network requests (via SDK)
  - Detects errors and includes recent network context in prompt

- **Escalation Engine**
  - Fallback logic to notify human support
  - Escalates via Slack/Email/Zendesk

### Admin Portal (Multi-Tenant Configuration Interface)

1. **Org & Project Setup**
   - Create organization & linked websites
   - Set domain for widget access control

2. **Data Ingestion Dashboard**
   - Upload:
     - Markdown, PDF, JSON
     - OpenAPI / Postman API Specs
   - Parsed, embedded and stored per org

3. **Permission Management UI**
   - Define role-action-page mappings
   - Upload JSON rules or configure visually

4. **Widget Customization UI**
   - Branding: name, colors, avatar, tone
   - Toggle features (escalation, logs, chat only, etc.)

5. **Analytics & Monitoring**
   - View usage logs, failed queries, escalation rates
   - Insights to improve support material

---

## 📂 Project Structure (MVP)

```
ai-assistant/
├── client/                  # React app
│   ├── components/          # Chat widget, stepper UI
│   ├── sdk/                 # JS SDK for context tracking
│   └── App.tsx
│
├── api/                     # Middleware server
│   ├── routes/
│   ├── services/
│   ├── llm/                 # LLM call wrappers
│   ├── vector/              # Vector DB query logic
│   ├── tenants/             # Tenant-specific config handling
│   └── main.ts              # FastAPI or Express entry point
│
├── admin-portal/           # Org dashboard
│   ├── pages/
│   ├── upload-docs/
│   ├── permissions-ui/
│   ├── analytics/
│   └── customize-widget/
│
├── vector-data/
│   ├── ingest_docs.py       # Script to embed and index docs
│   └── embeddings/
│
├── llm/                     # Ollama scripts
│   └── run_model.sh
│
├── README.md
└── package.json
```

---

## 🔨 Development Milestones

### Phase 1: Single-Tenant POC
- Build widget
- Integrate context SDK
- Add vector DB & LLM chaining
- Hardcode role/page for demo

### Phase 2: Admin Portal MVP
- Org onboarding + doc upload
- Role/permission input
- Simple API reference parser

### Phase 3: Multi-Tenant & Escalation
- Support multiple orgs
- Escalation routing & logs
- Widget theming per org

---

## 🧩 Example Prompt Flow

**Context:**
- Page: `/transfers/new`
- Role: `finance-analyst`
- Recent Error: `403 POST /transfers`

**Prompt sent to LLM:**
> "User is on the Transfer page but got a 403 on POST /transfers. Their role is finance-analyst. Explain what they can or can’t do, and guide them through a transfer if possible."

**Expected Output:**
```json
{
  "response": "You don’t have permission to create a transfer. Contact an admin to get the 'canCreateTransfer' permission.",
  "steps": []
}
```

---

## 🧠 Technologies Used

| Use Case           | Tech                          |
|--------------------|-------------------------------|
| Frontend           | React, Tailwind, Vite         |
| Context SDK        | Vanilla JS / TypeScript       |
| Backend API        | FastAPI (Python) / Express    |
| Vector DB          | Chroma / Qdrant               |
| Embeddings         | Instructor-XL, MiniLM         |
| Local LLM          | Ollama + LLaMA 3 / Mistral    |
| Auth/Perms         | Supabase / Role DB            |
| Support Escalation | Email / Slack / Zendesk APIs  |
| Admin Portal       | Next.js / React / Tailwind    |

---

## ✅ What's Next?
- Finalize multi-tenant data structure
- Define onboarding flow for integrators
- Choose embedding & model baseline
- Start with a test org to simulate integration

## 🛑 Problem Scenarios

### Scenario 1: Permission Denied on Critical Action
A user on the **Billing** page tries to add a new payment method but encounters a 403 error. Unaware of the required `canEditBilling` permission, they submit a support ticket and wait hours for a response. With our assistant, the widget detects the error, explains the missing permission, and offers step-by-step instructions to request access, resolving the issue instantly.

### Scenario 2: API Timeout on Data Fetch
On the **Dashboard** page, key metrics fail to load due to a network timeout. The user sees empty charts and isn’t sure if it’s their connection or a system fault. The assistant reviews recent API calls, identifies the timeout, suggests refreshing the page or checking the network, and if the issue persists, escalates to support with relevant logs.

### Scenario 3: Complex Workflow Assistance
A new user on the **Transfer Funds** page is overwhelmed by multiple fields and validation steps. The assistant proactively offers a guided flow:
1. Step 1: Click **New Transfer** at the top right.
2. Step 2: Select or add a recipient.
3. Step 3: Enter the amount and currency.
4. Step 4: Review and confirm.
By walking the user through each step, drop-off rates decrease and conversion improves.

---

## 📈 Market Comparison

- **Intercom**, **Drift**, **Zendesk AI**: Provide chat-based support but lack deep integration with client-side state or network calls. They rely on cloud-hosted models, raising data privacy concerns.
- **In-App Tooltips/Guides** (e.g., **Appcues**, **WalkMe**): Offer step-by-step flows but are static and manual; they can’t diagnose real-time API errors or adapt to user permissions.

Our assistant combines the best of both: dynamic, context-aware guidance plus conversational AI, all running locally for privacy and performance.

---

## 🔍 Differentiation from Command.ai

**Command.ai** is an AI-driven CLI tool for developers, focusing on code generation, terminal command suggestions, and automation within a developer workflow. In contrast, our AI Assistant:

- **Context Awareness**: Understands the exact web page, UI elements, user role, and permissions in real time.
- **API Monitoring**: Reads and interprets recent network calls (e.g., 403, 500 errors) to provide accurate diagnostics.
- **Interactive Guidance**: Delivers structured, step-by-step instructions directly in the UI, not just text responses.
- **Privacy & Locality**: Runs on local LLMs via Ollama, ensuring company data never leaves the premises.
- **Multi-Tenant Admin Portal**: Enables any organization to onboard, upload their own docs, define roles, and customize the assistant without code changes.

This makes our solution uniquely suited for customer-facing web apps requiring deep business logic integration, robust privacy controls, and seamless escalation paths.
---

## 🚀 Enhancements & Pain Point Capturing

To elevate the assistant beyond its core MVP and truly uncover and address user pain points, consider these advanced capabilities:

1. **Behavioral Analytics Integration**  
   - Integrate with tools like Google Analytics, Mixpanel, or Amplitude to correlate widget usage with user journeys.  
   - Identify pages or flows with high drop‑off rates and trigger proactive guidance.

2. **Sentiment & Emotion Analysis**  
   - Analyze user input tone using sentiment models (e.g., DistilBERT sentiment).  
   - Detect frustration, confusion, or urgency in messages to prioritize assistance or escalate faster.

3. **Frustration Signal Detection**  
   - Monitor UX signals: rapid clicks (rage clicks), excessive form errors, repeated retries.  
   - Automatically open the assistant or suggest help when these signals cross thresholds.

4. **User Feedback Loops**  
   - After each resolved interaction, prompt a one‑click feedback survey (e.g., “Was this helpful?”).  
   - Use feedback to retrain vector indexes, refine prompts, and improve documentation.

5. **Error & Session Replay Integration**  
   - Hook into Sentry, LogRocket, or FullStory to attach recent error logs or session replay snippets.  
   - Provide the assistant with concrete repro steps for more accurate diagnostics.

6. **Adaptive Troubleshooting Scripts**  
   - Implement dynamic flow branching based on real‑time outcomes (e.g., if step 2 fails, skip to alternate path).  
   - Allow the assistant to modify its instructions on the fly when a step error is detected.

7. **Continuous Learning & Auto‑Tuning**  
   - Collect anonymized transcripts and use them to fine‑tune the LLM or update the vector store.  
   - Automate retraining pipelines to incorporate new FAQs, error patterns, and feature changes.

8. **Personalization & User Profiling**  
   - Leverage user metadata (e.g., account tier, feature flags, past interactions) to tailor responses.  
   - Offer advanced tips for power users and simpler explanations for novices.

9. **Knowledge Base Feedback Loop**  
   - When the assistant can’t answer, log the query as a gap in your documentation.  
   - Create tasks for content teams to author new help articles or update existing guides.

10. **Analytics & Reporting Dashboard**  
    - Build a dashboard in the Admin Portal to visualize:  
      - Top help topics and pain points  
      - Success rates of guided flows  
      - Escalation triggers and resolution times  
    - Use these insights to prioritize UX improvements and support resources.

By layering these advanced features on top of your MVP, you’ll create a self‑improving assistant that not only solves problems but also continuously uncovers and addresses the root causes of user friction.
---

## 📝 Code Assistant Prompt for Vibe Coding

Use the following detailed instructions to drive an AI code assistant (e.g., GitHub Copilot, CodeGPT) to scaffold and implement each component of the AI Assistant MVP. You can feed this prompt as a single input to the assistant.

```
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

