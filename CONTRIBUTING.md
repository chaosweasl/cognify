# Contributing to Cognify

Thank you for your interest in contributing to Cognify! We appreciate community involvement in making this learning platform better for everyone.

## 🎯 Areas We Welcome Contributions

Cognify has a **selective contribution model**. We welcome contributions in these specific areas:

### 🎨 **Themes & UI Improvements**

- Create new DaisyUI themes
- Improve existing component designs
- Enhance mobile responsiveness
- Add animations and visual polish
- Improve accessibility features

### 📝 **Documentation**

- Improve README and setup guides
- Write tutorials and how-to guides
- Create video documentation
- Translate documentation
- Fix typos and clarity issues

### 🐛 **Bug Reports**

- Report issues with detailed reproduction steps
- Identify UI bugs and visual inconsistencies
- Suggest improvements for error handling and user feedback
- Report performance issues

### 💡 **Feature Suggestions & Ideas**

- Suggest UI/UX improvements
- Propose new themes or design concepts
- Recommend accessibility enhancements
- Ideas for better user onboarding
- Export/import functionality suggestions
- Minor workflow enhancement ideas

## ❌ Areas We're NOT Accepting Contributions For

To maintain code quality and architectural consistency, we're **not accepting contributions** for:

- Core SRS (Spaced Repetition System) algorithm changes (unless well-documented and well-argued!)
- Database schema modifications
- Authentication system changes
- AI integration architecture
- Core application logic and business rules
- Major feature additions or architectural changes

## 📋 Before Contributing

### 1. Check Existing Issues

- Browse [existing issues](https://github.com/chaosweasl/cognify/issues) to avoid duplicates
- Look for issues labeled `good first issue` or `help wanted`
- Join discussions to understand requirements

### 2. Create an Issue First

For any non-trivial contribution:

- Create an issue describing your proposed change
- Wait for maintainer approval before starting work
- Discuss implementation approaches

### 3. Development Environment

**⚠️ Important Note**: Due to Cognify's sophisticated database schema and complex infrastructure requirements, local development setup is **not practical** for most contributors.

**We welcome contributions that don't require local development:**

- **📝 Documentation edits** (can be done directly on GitHub)
- **🎨 Theme suggestions** (CSS snippets or design mockups)
- **🐛 Bug reports** (no setup needed)
- **💡 Feature suggestions** (through GitHub issues)
- **🌍 Translations** (text-only contributions)

**For advanced contributors only** (contact maintainers first):

```bash
# Complex enterprise-grade setup required
# Requires sophisticated Supabase schema, RLS policies,
# custom authentication flows, and extensive environment configuration
git clone https://github.com/YOUR_USERNAME/cognify.git
# ... extensive database setup and configuration required
```

## 🛠️ Contribution Guidelines

### Non-Development Contributions

Most contributions don't require local setup! You can contribute by:

- **Editing documentation** directly on GitHub
- **Suggesting themes** with CSS snippets or color palettes
- **Reporting bugs** with detailed descriptions
- **Proposing features** through GitHub issues
- **Improving content** like README files, guides, and help text

### For Advanced Contributors

If you're working on code changes (themes, UI improvements), please:

- **Contact maintainers first** to discuss the complex setup requirements
- **Focus on CSS/styling changes** that can be reviewed without full local testing
- **Provide detailed screenshots** of any visual changes
- **Test across multiple browsers** if possible

### Contribution Process

1. **Create an Issue First**

   - Describe your proposed change or report
   - Wait for maintainer feedback before proceeding
   - Discuss implementation approach if needed

2. **For Documentation/Content Changes**

   - Edit files directly on GitHub
   - Use the web interface for simple changes
   - Submit pull request with clear description

3. **For Theme/Design Contributions**

   - Provide CSS snippets or design mockups
   - Include screenshots or previews
   - Reference DaisyUI documentation for compatibility

4. **Submit Pull Request**
   - Use a descriptive title
   - Include screenshots for visual changes
   - Reference any related issues
   - Keep description clear and concise

## 📋 Pull Request Guidelines

### Before Submitting a PR

**Code Quality Checklist**:
- [ ] ESLint passes without warnings (`pnpm lint`)
- [ ] TypeScript compilation succeeds (`npx tsc --noEmit`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No console errors in browser
- [ ] Changes tested in multiple browsers/devices

**Performance Checklist**:
- [ ] No N+1 database queries introduced
- [ ] API endpoints use batch operations where possible
- [ ] Components use React.memo/useCallback for optimization
- [ ] No unnecessary re-renders or infinite loops
- [ ] Images optimized and properly sized
- [ ] Bundle size impact considered

**Documentation Checklist**:
- [ ] README updated if functionality changed
- [ ] Comments added for complex logic
- [ ] Type definitions updated if needed
- [ ] API documentation updated if endpoints changed

### PR Template

Use this template for your pull request:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Style/UI improvement
- [ ] ⚡ Performance improvement

## Testing
- [ ] Tested locally in development mode
- [ ] Tested build version
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified

## Screenshots (if applicable)
Include before/after screenshots for UI changes.

## Performance Impact
- [ ] No performance degradation
- [ ] Database queries optimized
- [ ] No infinite loops or excessive re-renders
- [ ] Bundle size impact acceptable

## Checklist
- [ ] ESLint passes
- [ ] TypeScript compiles without errors
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] Related issue referenced
```

### Code Review Process

**Review Focus Areas**:

1. **Performance**: Check for N+1 queries, excessive re-renders, memory leaks
2. **Security**: Validate input sanitization, authentication checks
3. **Accessibility**: Ensure ARIA labels, keyboard navigation, contrast
4. **Type Safety**: Verify TypeScript usage, no `any` types
5. **Code Quality**: Consistent patterns, readable code, proper error handling

**Review Timeline**:
- Initial feedback within 48 hours
- Final approval within 1 week
- Merge after all checks pass

## 🎨 Theme Contribution Guide

We especially welcome new themes! Here's how to contribute:

### Creating a New Theme

1. **Design Your Theme**

   - Create a color palette following DaisyUI conventions
   - Ensure accessibility with sufficient contrast ratios
   - Consider both light and dark mode preferences

2. **Provide Theme Definition**

   ```css
   /* Custom DaisyUI theme example for globals.css */
   @plugin "daisyui/theme" {
     name: "your-theme-name";
     color-scheme: light;

     /* Base colors */
     --color-base-100: oklch(98% 0.01 240);
     --color-base-200: oklch(95% 0.015 240);
     /* ...etc */

     /* ...add or adjust variables as needed for your theme */
   }
   ```

3. **Submit Your Theme**
   - Create a GitHub issue with your theme
   - Include color palette and rationale
   - Provide screenshots or mockups if possible
   - Maintainers will implement and test the theme

### Theme Guidelines

- Ensure sufficient contrast for accessibility
- Test with all component states (hover, active, disabled)
- Consider both light and dark preferences
- Follow semantic color naming

## 📝 Documentation Contributions

### What We Need

- Step-by-step setup guides
- Troubleshooting documentation
- Feature explanation guides
- Video tutorials
- Translation to other languages

### Documentation Style

- Use clear, simple language
- Include code examples where helpful
- Add screenshots for UI guidance
- Structure with proper headings

## 🐛 Bug Reports

### Before Reporting

- Check if the bug already exists
- Try reproducing in different browsers
- Clear cache and try again

### Good Bug Reports Include

- **Clear title** describing the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Screenshots or videos** if applicable
- **Environment details** (browser, OS, device)
- **Console errors** if any

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**

1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**

- Browser: [e.g. Chrome 91]
- OS: [e.g. Windows 10]
- Device: [e.g. Desktop, iPhone 12]
```

## ✅ Contribution Checklist

Before submitting your contribution:

- [ ] Created an issue to discuss the change first
- [ ] Contribution aligns with our accepted areas
- [ ] Documentation changes are clear and helpful
- [ ] Theme suggestions include complete color palettes
- [ ] Bug reports include detailed reproduction steps
- [ ] Screenshots included for visual changes
- [ ] Related issue referenced (if applicable)

## 🚫 What We Won't Accept

Due to the sophisticated architecture and complex setup requirements:

- Code changes to core SRS algorithm or business logic
- Database schema or migration modifications
- Major architectural changes or new features
- Pull requests without prior issue discussion
- Contributions that require extensive local testing
- Changes that break existing functionality
- Features that conflict with project goals

## 🤔 Questions?

- **Small questions**: Comment on related issues
- **General discussion**: Use GitHub Discussions
- **Bug reports**: Create a new issue
- **Feature ideas**: Create an issue for discussion first

## 📄 License

By contributing to Cognify, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make Cognify better!** 🙏

Your contributions in themes, documentation, and quality-of-life improvements help create a better learning experience for everyone.
