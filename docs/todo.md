# TODO.md — Cognify AI-first MVP Roadmap

> **BYO (Bring Your Own) API Keys MVP:** Enable users to generate flashcards, cheatsheets, and quizzes using their own AI API keys, with copy/paste prompts for non-devs, staying secure and open-source.

---

## 📊 Current State Analysis

### ✅ **ALREADY IMPLEMENTED**

- **Multi-provider AI Integration**: OpenAI, Anthropic, Ollama, LM Studio, DeepSeek, custom OpenAI-compatible endpoints
- **Secure API Key Management**: localStorage-only storage with explicit warnings (`useAISettings.ts`, `aiKeyStorage`)
- **PDF → Flashcard Generation**: Full pipeline via `PDFUploadModal` and `/api/ai/generate-flashcards`
- **JSON Import/Export**: `FlashcardJsonImporter` with validation and preview
- **Draft-first UX**: Generated cards require user acceptance before DB save
- **Error Handling**: CORS, rate-limit, provider-specific error mapping
- **Token Usage Tracking**: Cost estimation and usage monitoring
- **Connection Testing**: `/api/ai/test-connection` for provider validation

### ⚠️ **MISSING FOR BYO MVP**

- **Multi-content Type Generation**: Currently only flashcards, need cheatsheets & quizzes
- **Documentation Site**: No `/docs` page for copy/paste prompts
- **Provider Fallback UX**: No clear manual workflow when browser CORS fails
- **Security Warnings**: Insufficient UI messaging about API key risks
- **Unified Generate Modal**: No single modal for flashcards/cheatsheets/quizzes toggle

---

## 🎯 MVP Roadmap (Must-Have)

### **Phase 1: Security & Documentation (Week 1)**

- [ ] **Enhanced API Key Security UI**

  - [ ] Add explicit security warnings in key input modal
  - [ ] Implement "remember key" toggle with localStorage warning
  - [ ] Add global banner explaining BYO model on AI pages
  - [ ] Provide key clearing and ephemeral mode options

- [ ] **Create Documentation Site (`/docs`)**

  - [ ] Build `/app/(main)/docs/page.tsx` with navigation
  - [ ] Create `/docs/generate.md` with copy/paste prompt templates
  - [ ] Add provider compatibility table (CORS support matrix)
  - [ ] Include sample JSON outputs for testing import flow
  - [ ] Provide step-by-step manual workflow instructions

- [ ] **Policy & Security Documentation**
  - [ ] Update README with explicit BYO approach explanation
  - [ ] Add `Security & API Keys` section to README
  - [ ] Document key storage model and user risks
  - [ ] Clarify license and hosting/fork expectations

### **Phase 2: Content Type Expansion (Week 2)**

- [ ] **Cheatsheet Generation**

  - [ ] Create `/api/ai/generate-cheatsheets` endpoint
  - [ ] Build cheatsheet database schema and CRUD operations
  - [ ] Add cheatsheet display and management components
  - [ ] Implement cheatsheet-specific prompt templates

- [ ] **Quiz Generation**

  - [ ] Create `/api/ai/generate-quizzes` endpoint
  - [ ] Build quiz database schema with question types (multiple choice, true/false, short answer)
  - [ ] Add quiz taking and scoring interface
  - [ ] Implement quiz-specific prompt templates and validation

- [ ] **Unified Generate Modal**
  - [ ] Replace `PDFUploadModal` with `GenerateModal`
  - [ ] Add content type toggle (Flashcards/Cheatsheets/Quizzes)
  - [ ] Unify preview and acceptance flow for all content types
  - [ ] Add cost estimation for different content types

### **Phase 3: Provider Fallbacks & UX (Week 3)**

- [ ] **CORS Fallback System**

  - [ ] Detect browser CORS failures in AI calls
  - [ ] Show provider-specific fallback instructions
  - [ ] Add "Use Manual Import Instead" option with direct link to docs
  - [ ] Implement provider testing with clear success/failure states

- [ ] **Enhanced Error Handling**

  - [ ] Map provider-specific errors to user-friendly messages
  - [ ] Add retry mechanisms with backoff for rate limits
  - [ ] Provide troubleshooting guides for common failures
  - [ ] Show clear path to manual workflow on persistent failures

- [ ] **Import Flow Improvements**
  - [ ] Enhance JSON schema validation with detailed error messages
  - [ ] Support multiple content types in single import
  - [ ] Add selective import (choose which items to accept)
  - [ ] Provide format conversion helpers for common AI outputs

### **Phase 4: Polish (Week 4)**

- [ ] **User Experience Polish**

  - [ ] Add onboarding flow for first-time AI users
  - [ ] Implement progressive disclosure for advanced AI settings
  - [ ] Add helpful tooltips and contextual guidance
  - [ ] Create sample content and templates for testing

- [ ] **Performance & Security**
  - [ ] Implement proper rate limiting on AI endpoints
  - [ ] Add request/response sanitization and validation
  - [ ] Optimize token usage and chunking algorithms
  - [ ] Add CSP headers and XSS protection auditing

---

## 📋 Acceptance Criteria

### **Core MVP Requirements**

- [ ] Users can input API key (memory or localStorage with explicit consent)
- [ ] Generate flashcards, cheatsheets, AND quizzes from text/PDF input
- [ ] All generated content shows in preview before DB save (draft-first UX)
- [ ] Manual copy/paste workflow documented and functional via `/docs`
- [ ] CORS failures gracefully redirect to manual import flow
- [ ] Clear security warnings and consent for key persistence

### **Quality Standards**

- [ ] Works across 3+ AI providers (OpenAI, Anthropic, local)
- [ ] Handles provider errors with helpful user guidance
- [ ] JSON import validates schema with clear error messages
- [ ] Documentation includes working examples and templates
- [ ] No API keys ever stored server-side or in database

### **User Journey Success**

1. **New User**: Reads docs → copies prompt to ChatGPT → imports JSON → reviews → saves
2. **API User**: Enters key → generates from PDF → previews → accepts → studies
3. **Error Recovery**: CORS failure → shown manual option → completes via docs workflow

---

## 🚀 Post-MVP Future Enhancements

### **Advanced AI Features**

- [ ] YouTube video transcription and content generation
- [ ] Multi-language support and translation
- [ ] Adaptive difficulty based on SRS performance
- [ ] Community prompt marketplace and templates

### **Collaboration & Sharing**

- [ ] Public content libraries and templates
- [ ] Team study groups and shared projects
- [ ] Content marketplace and peer review

### **Integrations & Apps**

- [ ] Browser extension for quick content capture
- [ ] React Native mobile app
- [ ] Desktop application with offline support

### **Enterprise Features** _(if you decide to offer hosted solution)_

- [ ] Server-side encrypted API key storage
- [ ] Team billing and usage quotas
- [ ] Admin dashboard and user management
- [ ] Advanced analytics and learning insights

---

## ⚠️ Risk Mitigation

### **Security**

- **XSS/Key Theft**: CSP headers, input sanitization, localStorage warnings
- **Data Leakage**: RLS policies, authentication checks, no cross-user data access

### **Technical**

- **Provider CORS**: Document limitations, provide manual fallback, test compatibility
- **AI Hallucinations**: Draft-first UX, source excerpt display, user validation required

### **UX**

- **User Confusion**: Clear documentation, step-by-step guides, sample content
- **Error States**: Graceful degradation, helpful messages, alternative workflows

---

## 💡 Implementation Notes

### **Database Schema Changes Needed**

```sql
-- Cheatsheets table
CREATE TABLE cheatsheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- sections, topics, key points
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  questions JSONB NOT NULL, -- array of question objects
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **File Structure**

```
app/(main)/docs/
├── page.tsx              # Documentation landing
├── generate/
│   └── page.tsx          # Copy/paste prompts & examples
└── api-keys/
    └── page.tsx          # Security & key management guide

src/components/generate/
├── GenerateModal.tsx     # Unified modal for all content types
├── CheatsheetPreview.tsx # Cheatsheet preview & editing
└── QuizPreview.tsx       # Quiz preview & editing

app/api/ai/
├── generate-cheatsheets/ # Cheatsheet generation endpoint
├── generate-quizzes/     # Quiz generation endpoint
└── test-providers/       # Enhanced provider testing
```

---

**Next Action**: Begin Phase 1 with security warnings and documentation site setup. This foundation enables the full BYO workflow while maintaining user safety and clear expectations.
