# Cognify

**Transform Your Notes Into Smart Flashcards**

Cognify is an AI-powered learning platform that automatically converts your notes, documents, and study materials into interactive flashcards. Study smarter with personalized spaced repetition that adapts to your learning pace.

## ✨ Features

- **🤖 AI-Powered Generation**: Advanced AI automatically extracts key concepts from your notes and creates targeted flashcards for optimal learning
- **📄 Multiple Input Formats**: Upload text, paste content directly, or upload PDF files - Cognify handles various content types seamlessly
- **🧠 Intelligent Spaced Repetition**: Anki-inspired SRS algorithm with customizable learning steps, intervals, and difficulty ratings
- **📊 Personal Study Database**: All your flashcards are stored securely in your personal database, accessible anytime for review sessions
- **🔑 Bring Your Own API**: Use your own AI API token for complete control and privacy - no subscription fees, just bring your preferred AI service
- **⚙️ Customizable Settings**: Adjust daily card limits, learning steps, graduation intervals, and ease factors to match your learning style
- **📈 Progress Tracking**: Detailed study statistics, session analytics, and performance insights
- **🎯 Smart Scheduling**: Automatic reminders for due cards and optimized review sessions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account for database
- AI API key (OpenAI, Anthropic, etc.) for flashcard generation

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/chaosweasl/cognify.git
   cd cognify
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase credentials and other required environment variables.

4. **Run the development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000` to start using Cognify.

## 🛠️ Development Commands

### Essential Commands

````bash
# Development
pnpm dev                    # Start development server with Turbopack
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm lint                   # Run ESLint checks
pnpm lint --fix            # Fix auto-fixable lint issues

# Type Checking
npx tsc --noEmit           # Check TypeScript compilation

### Environment Setup

**Required Environment Variables**:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS=true
````

Copy `.env.example` to `.env.local` and fill in your Supabase credentials.

### Development Workflow

1. **Start development server**: `pnpm dev`
2. **Make changes**: Edit files with hot reloading
3. **Check types**: `npx tsc --noEmit`
4. **Lint code**: `pnpm lint`
5. **Test build**: `pnpm build`

### Authentication Flow

Cognify uses Supabase Auth with the following flow:

1. User signs up/in via Supabase Auth
2. JWT token stored in httpOnly cookies
3. Middleware validates tokens on protected routes
4. Row Level Security (RLS) enforces data isolation
5. User profile automatically created on first login

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, ShadCN
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Deployment**: Vercel-ready

## 📚 How It Works

1. **Create a Project**: Start by creating a new study project
2. **Add Content**: Upload documents, paste notes, or manually create flashcards
3. **AI Generation**: Let AI analyze your content and generate smart flashcards
4. **Study Sessions**: Review flashcards using the spaced repetition system
5. **Rate Performance**: Use Anki-style ratings (Again, Hard, Good, Easy) to optimize scheduling
6. **Track Progress**: Monitor your learning progress with detailed analytics

## 🎯 Spaced Repetition System

Cognify implements a sophisticated SRS algorithm inspired by Anki, featuring:

- **Learning Steps**: Customizable intervals for new cards (default: 1m, 10m, 1d)
- **Graduation**: Cards move to review status after completing learning steps
- **SM-2 Algorithm**: Mature cards use spaced repetition based on performance
- **Relearning**: Failed cards enter relearning mode with adjusted intervals
- **Daily Limits**: Control how many new cards and reviews you study per day

## ⚙️ Configuration

Customize your learning experience through the settings page:

- **Daily Limits**: New cards per day, maximum reviews
- **Learning Steps**: Intervals for new card progression
- **Ease Settings**: Starting ease, minimum ease, bonus multipliers
- **AI Integration**: Configure your preferred AI service and model

## 📖 Documentation

- [Study System Guide](docs/study-system.md) - Learn how the SRS algorithm works
- [AI Integration](docs/ai-setup.md) - Set up AI-powered flashcard generation
- [API Reference](docs/api.md) - Technical documentation for developers

## 🤝 Contributing

We welcome contributions in specific areas! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- 🎨 **Themes & UI**: Help make Cognify more beautiful
- 📝 **Documentation**: Improve guides and help content
- 🐛 **Bug Reports**: Report issues and help fix them
- 💡 **Feature Suggestions**: Propose new improvements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Privacy & Security

- **Local Control**: Your AI API keys are stored securely in your browser
- **Data Ownership**: All your study data belongs to you
- **No Tracking**: We don't track your study habits or personal information
- **Open Source**: Transparent codebase you can audit and self-host

## 🚧 Development Status

Cognify is actively developed with regular updates. Current focus areas:

- Enhanced AI integration options
- Mobile-responsive improvements
- Advanced analytics dashboard
- Import/export functionality
- Community themes and templates

## 💬 Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Join community discussions for help and ideas
- **Documentation**: Check our comprehensive guides and FAQ

---

**Start learning smarter today with Cognify!** 🧠✨
