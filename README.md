# 🧠 Cognify

> **AI-Powered Spaced Repetition Study Platform**  
> Transform your learning with AI-generated flashcards and proven spaced repetition algorithms

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

---

## ✨ Features

### 🤖 **AI-Powered Content Generation**

- **Multi-Provider Support**: OpenAI, Anthropic, Ollama, LM Studio, DeepSeek, and custom endpoints
- **BYO API Keys**: Secure client-side key storage - never stored on our servers
- **PDF to Flashcards**: Extract and generate study materials from any PDF document
- **Intelligent Parsing**: Advanced content chunking and context-aware generation

### 📚 **Spaced Repetition System (SRS)**

- **Evidence-Based Algorithms**: Optimized intervals based on memory science
- **Adaptive Learning**: Personalized scheduling based on your performance
- **Progress Tracking**: Detailed analytics on learning patterns and retention
- **Study Sessions**: Structured practice with immediate feedback

### 🎯 **Study Management**

- **Project Organization**: Group flashcards by subject or topic
- **Flexible Import/Export**: JSON, CSV, and Anki-compatible formats
- **Duplicate Detection**: Smart identification of similar content
- **Bulk Operations**: Efficient management of large flashcard collections

### 🔒 **Security & Privacy**

- **Row Level Security (RLS)**: Database-level user isolation
- **Client-Side Keys**: API keys stored locally, never on servers
- **Open Source**: Full transparency and community-driven development
- **Self-Hostable**: Deploy on your own infrastructure

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm**
- **Supabase** account and project
- **AI Provider** API key (OpenAI, Anthropic, etc.)

### Installation

1. **Clone and Install**

   ```bash
   git clone https://github.com/chaosweasl/cognify.git
   cd cognify
   pnpm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Database Setup**

   ```bash
   # Run migrations in your Supabase dashboard or via CLI
   # Schema is provided in schema-dump.sql
   ```

4. **Development Server**
   ```bash
   pnpm dev
   ```
   Visit [http://localhost:3000](http://localhost:3000)

---

## 🔧 Configuration

### AI Providers Setup

Cognify supports multiple AI providers. Set up your preferred provider:

1. **Navigate to Settings** → **AI Configuration**
2. **Choose Provider**: OpenAI, Anthropic, Ollama, etc.
3. **Enter API Key**: Stored securely in your browser's localStorage
4. **Test Connection**: Verify your configuration works

### BYO (Bring Your Own) API Keys Model

- ✅ **Your Keys, Your Control**: API keys never leave your browser
- ✅ **No Usage Limits**: Use your own quotas and billing
- ✅ **Provider Choice**: Switch between providers anytime
- ⚠️ **Security Notice**: Keys are stored in localStorage - clear them when using shared computers

---

## � Security & API Keys

### BYO (Bring Your Own) API Keys Model

Cognify is built with a **privacy-first, security-by-design** approach. We use a "Bring Your Own" (BYO) API keys model that puts you in complete control of your AI usage and data.

#### 🛡️ **How It Works**

| **Component**     | **Your Control**               | **Our Involvement**            |
| ----------------- | ------------------------------ | ------------------------------ |
| **API Keys**      | ✅ Stored in your browser only | ❌ Never stored on our servers |
| **AI Requests**   | ✅ Direct from your browser    | ❌ Never proxied through us    |
| **Usage & Costs** | ✅ Your provider account       | ❌ We don't monitor or bill    |
| **Data Privacy**  | ✅ Content stays with you      | ❌ We never see your content   |

#### 🔐 **Security Features**

- **Client-Side Storage**: API keys stored in browser `localStorage` only
- **Ephemeral Mode**: Option to never store keys anywhere
- **Manual Workflow**: Copy-paste prompts when browser CORS fails
- **Clear Controls**: One-click key deletion and management
- **Self-Hostable**: Deploy on your own infrastructure for maximum control

#### ⚠️ **Your Responsibilities**

As the key holder, you are responsible for:

- **API Key Security**: Keep your keys private and secure
- **Usage Monitoring**: Monitor your provider billing and set limits
- **Shared Computers**: Use ephemeral mode or clear keys when done
- **Account Management**: Manage quotas and permissions on provider accounts

### 🚀 **Getting Started with BYO**

#### **Option 1: Direct API Integration**

1. Get API keys from [OpenAI](https://platform.openai.com), [Anthropic](https://console.anthropic.com), or other providers
2. Configure in Cognify Settings → AI Configuration
3. Generate content directly in your browser

#### **Option 2: Manual Copy-Paste Workflow**

1. Copy prompts from [/docs/generate](/docs/generate)
2. Paste into ChatGPT, Claude, or any AI service
3. Import the JSON response back into Cognify

### 📚 **Documentation & Support**

- **📖 [Security Guide](/docs/api-keys)**: Comprehensive key management documentation
- **⚡ [Generation Templates](/docs/generate)**: Copy-paste prompts for manual workflow
- **🛠️ [Troubleshooting](/docs/troubleshooting)**: Common issues and CORS solutions

### 🏠 **Self-Hosting for Maximum Privacy**

For organizations requiring complete data control:

```bash
# Deploy your own instance
git clone https://github.com/chaosweasl/cognify.git
cd cognify

# Configure your environment
cp .env.example .env.local
# Set your Supabase credentials

# Deploy to your infrastructure
pnpm build
pnpm start
```

**Benefits of self-hosting:**

- Complete data sovereignty
- Custom security policies
- Internal network deployment
- No external dependencies

---

## �📖 Usage Guide

### Creating Your First Study Set

1. **Create a Project**: Organize flashcards by topic
2. **Add Content**:
   - Upload PDF documents for AI generation
   - Import JSON/CSV files
   - Create flashcards manually
3. **Review & Edit**: Preview AI-generated content before saving
4. **Start Studying**: Begin spaced repetition sessions

### Study Workflow

1. **Study Session**: Practice flashcards with SRS scheduling
2. **Self-Assessment**: Rate difficulty (Easy/Medium/Hard)
3. **Progress Tracking**: Monitor retention and performance
4. **Adaptive Scheduling**: System adjusts based on your responses

---

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Styling**: Tailwind CSS, ShadCN/ui components
- **AI Integration**: Multi-provider support with client-side calls
- **State Management**: Zustand for global state
- **Deployment**: Vercel-ready, self-hostable

### Project Structure

```
cognify/
├── app/                    # Next.js App Router
│   ├── (main)/            # Authenticated routes
│   ├── api/               # API endpoints
│   └── auth/              # Authentication pages
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Core libraries
│   ├── ai/               # AI provider integrations
│   ├── srs/              # Spaced repetition logic
│   └── supabase/         # Database utilities
└── src/                   # Feature components
```

---

## 🤝 Contributing

We welcome contributions! This project follows a BYO (Bring Your Own) AI model for security and flexibility.

### Development Workflow

1. **Fork & Clone**: Create your feature branch
2. **Install Dependencies**: `pnpm install`
3. **Start Development**: `pnpm dev`
4. **Run Tests**: `pnpm test` (when available)
5. **Type Check**: `npx tsc --noEmit`
6. **Submit PR**: Include tests and documentation

### Key Development Notes

- **Security First**: Never store API keys server-side
- **RLS Compliance**: All database operations respect Row Level Security
- **Draft-First UX**: AI-generated content requires user acceptance
- **Provider Agnostic**: Support multiple AI providers equally

---

## 🔒 Security & API Keys

### Our Approach

- **No Server Storage**: API keys remain in your browser's localStorage
- **Explicit Consent**: Clear warnings before persisting keys locally
- **Ephemeral Mode**: Use keys without saving for maximum security
- **Open Source**: Full code transparency for security auditing

### Best Practices

- 🔑 **Use API Keys with Limited Scope**: Create keys with minimal permissions
- 🔄 **Rotate Keys Regularly**: Update keys periodically for security
- 🧹 **Clear Keys on Shared Devices**: Remove keys from localStorage when done
- 📱 **Use Device-Specific Keys**: Different keys for different devices

---

## 📊 Roadmap

### Current Status: BYO AI-First MVP

- ✅ Multi-provider AI integration
- ✅ PDF to flashcard generation
- ✅ Spaced repetition system
- ✅ Secure key management

### Coming Soon

- 🔄 **Cheatsheet & Quiz Generation**: Beyond just flashcards
- 📚 **Documentation Site**: Copy/paste prompts for non-developers
- 🌐 **CORS Fallback**: Manual workflow when browser calls fail
- 📱 **Mobile App**: React Native application
- 🔌 **Browser Extension**: Quick content capture

### Future Enhancements

- **YouTube Integration**: Generate content from video transcripts
- **Collaboration**: Share study sets and team learning
- **Advanced Analytics**: ML-powered learning insights
- **Community Marketplace**: Share and discover study materials

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Spaced Repetition Research**: Built on decades of memory science
- **Open Source Community**: ShadCN/ui, Tailwind CSS, and countless libraries
- **AI Providers**: OpenAI, Anthropic, and the broader AI community
- **Early Users**: Thank you for testing and providing feedback

---

## 📞 Support

- 📧 **Issues**: [GitHub Issues](https://github.com/chaosweasl/cognify/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/chaosweasl/cognify/discussions)
- 📖 **Documentation**: [Project Wiki](https://github.com/chaosweasl/cognify/wiki)
- 🎯 **Roadmap**: [Project Board](https://github.com/chaosweasl/cognify/projects)

---

**Transform your learning with AI-powered spaced repetition. Start studying smarter, not harder.** 🚀
