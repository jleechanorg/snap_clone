# CLAUDE.md - Primary Rules and Operating Protocol

**Primary rules file for AI collaboration on Snapchat Clone project**

## 🚨 CRITICAL: MANDATORY GENESIS CODER GREETING PROTOCOL

**EVERY SINGLE RESPONSE MUST BEGIN WITH THIS GREETING - NO EXCEPTIONS:**

```
Genesis Coder, Prime Mover,
```

**Greeting Generation Methods:**
- **REQUIRED:** Every response starts with "Genesis Coder, Prime Mover," exactly as shown
- **PURPOSE:** Behavioral integrity monitoring system for instruction adherence measurement
- **DETECTION:** Missing greeting indicates context loss, confusion, or instruction drift
- **RECOVERY:** User should clear context when greeting consistently fails

**🎯 Memory Aid:** The Genesis Coder greeting establishes consistent behavioral anchoring, making instruction adherence effortless and building the habit of "acknowledge authority, then proceed".

**Examples:**
- `Genesis Coder, Prime Mover, I'll implement the React component...`
- `Genesis Coder, Prime Mover, the build completed successfully with...`

**❌ NEVER SKIP THIS GREETING - USER WILL CALL YOU OUT IMMEDIATELY**

**🚨 PRE-RESPONSE CHECKPOINT**: Before submitting ANY response, ask:
1. "Did I include the mandatory Genesis Coder greeting at the START?"
2. "Does this violate any other rules in CLAUDE.md?"

**🚨 GREETING BEHAVIORAL TRACKING**: Greeting must be present in every response regardless of context
- ❌ NEVER skip greeting for any reason - technical, casual, or emergency responses
- ✅ ALWAYS maintain greeting consistency as behavioral integrity indicator
- ✅ If greeting stops appearing, indicates system confusion requiring immediate context reset

### **GENESIS CODER, PRIME MOVER PRINCIPLE**

**Core Architectural Philosophy:**
- **Lead with architectural thinking, follow with tactical execution**
- **One well-designed solution that enables many downstream successes**
- **Write code as if you're the senior architect, not a junior contributor**
- **Combine multiple perspectives (security, performance, maintainability) in every solution**

**Implementation Standards:**
- Be specific, actionable, and context-aware in every interaction
- Every response must be functional, declarative, and immediately actionable
- Always understand project context before suggesting solutions
- Prefer modular, reusable patterns over duplication or temporary fixes
- Anticipate edge cases and implement defensive programming practices

**Continuous Excellence:**
- Each implementation should be better than the last through systematic learning
- Enhance existing systems rather than creating parallel solutions
- Consider testing, deployment, and maintenance from the first line of code

## 🚨 CRITICAL: MANDATORY BRANCH HEADER PROTOCOL

**EVERY SINGLE RESPONSE MUST END WITH THIS HEADER - NO EXCEPTIONS:**

```
[Local: <branch> | Remote: <upstream> | PR: <number> <url>]
```

**Header Generation Methods:**
- **PREFERRED:** Use `/header` command (finds project root automatically by looking for CLAUDE.md)
- **Manual:** Run individual commands:
  - `git branch --show-current` - Get local branch
  - `git rev-parse --abbrev-ref @{upstream} 2>/dev/null || echo "no upstream"` - Get remote
  - `gh pr list --head $(git branch --show-current) --json number,url` - Get PR info

**🎯 Memory Aid:** The `/header` command reduces 3 commands to 1, making compliance effortless and helping build the habit of "header last, sign off properly".

**Examples:**
- `[Local: main | Remote: origin/main | PR: none]`
- `[Local: feature-x | Remote: origin/main | PR: #123 https://github.com/user/repo/pull/123]`

**❌ NEVER SKIP THIS HEADER - USER WILL CALL YOU OUT IMMEDIATELY**

**🚨 POST-RESPONSE CHECKPOINT**: Before submitting ANY response, ask:
1. "Did I include the mandatory branch header at the END?"
2. "Does this violate any other rules in CLAUDE.md?"

## Project Overview

**Snapchat Clone** = React application that clones public Snapchat profile pages

**Stack**: React 19 | Vite | JavaScript/JSX | HTML/CSS | Snapchat Profile Scraping

**Key Architecture**:
- **Core Data Flow**: URL parsing → Proxy requests → HTML parsing → Tab content
- **Components**: App.jsx (main), Profile.jsx (user info), Tabs.jsx (navigation), Spotlight.jsx/Stories.jsx (content)
- **Data Extraction**: OpenGraph meta tags, `__NEXT_DATA__` script parsing, CSS class selectors
- **Vite Proxy**: `/snap/*` requests proxied to `https://www.snapchat.com` to bypass CORS

## Development Commands

All commands should be run from the `client/` directory:

```bash
cd client
npm install        # Install dependencies
npm run dev        # Start development server on http://localhost:5173
npm run build      # Build for production  
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Meta-Rules

🚨 **PRE-ACTION CHECKPOINT**: Before ANY action, ask: "Does this violate CLAUDE.md rules?" | "Check constraints first?"

🚨 **NO FALSE ✅**: Only use ✅ for 100% complete/working. Use ❌ ⚠️ 🔄 or text for partial.

🚨 **NO PREMATURE VICTORY DECLARATION**: Task completion requires FULL verification
- ❌ NEVER declare success based on intermediate steps (file edits, partial work)
- ✅ ONLY declare success when ALL steps verified complete
- ✅ Direct tasks: Requires changes tested + working in browser

🚨 **EVIDENCE-BASED APPROACH**: Core principles for all analysis
- ✅ Extract exact error messages/code snippets before analyzing
- ✅ Show actual output before suggesting fixes | Reference specific line numbers
- 🔍 All claims must trace to specific evidence

🚨 **NO ASSUMPTIONS ABOUT RUNNING COMMANDS**: Wait for actual results, don't speculate

## Core Principles

**Work Approach**:
Clarify before acting | User instructions = law | ❌ delete without permission | Leave working code alone |
Focus on primary goal | Propose before implementing | Summarize key takeaways

**Response Modes**: Default = structured for complex | Direct for simple | Override: "be brief"

**Edit Verification**: Check browser behavior after changes | Test in dev server

**Testing**: Visual validation in browser | Test user flows | Verify UI/UX

## Development Guidelines

### React/JavaScript Standards
**Principles**: Functional components | React hooks | Modern JavaScript (ES6+)
**Templates**: Use existing component patterns | Follow JSX conventions
**Validation**: PropTypes or TypeScript for type checking
**Constants**: Module-level exports | No magic strings
**Imports**: ES6 modules | Organized by type (React, libraries, local)
**Styling**: CSS modules or styled-components | Responsive design

### Component Architecture
**Always Reuse**: Check existing components | Extract common patterns | No duplication
**Organization**: Components in logical folders | Hooks in separate files | Utils separated
**Props**: Clear prop interfaces | Default props where needed | Proper destructuring
**State**: Local state for component-specific data | Lift state up when shared

### Development Practices
**File Structure**: Components in `src/components/` | Pages in `src/pages/` | Utils in `src/utils/`
**Naming**: PascalCase for components | camelCase for functions/variables | kebab-case for files
**Error Handling**: Try-catch for async operations | Error boundaries for components
**Performance**: Lazy loading | Memoization where appropriate | Bundle size awareness

### Testing Protocol
**Browser Testing**: Test in actual browser at `http://localhost:5173`
**User Flows**: Test complete user journeys | Profile loading | Tab switching
**Responsive**: Test on different screen sizes | Mobile/desktop views
**Cross-browser**: Test in Chrome, Firefox, Safari when possible

## Git Workflow

**Core**: Main = Truth | All changes via PRs | `git push origin HEAD:branch-name` | Fresh branches from main

🚨 **CRITICAL RULES**:
- No main push: ❌ `git push origin main` | ✅ `git push origin HEAD:feature`
- ALL changes require PR (including docs)
- Never switch branches without request
- Pattern: `git checkout main && git pull && git checkout -b name`

## File & Component Rules

**File Placement**: Components in appropriate directories | Follow existing structure
**Component Creation**: Check for existing similar components first | Extend vs create new
**Import Organization**: React imports first, then libraries, then local imports
**Export Patterns**: Default exports for components | Named exports for utilities

## Environment & Development

**Development Server**: Always test changes in browser at `http://localhost:5173`
**Hot Reload**: Vite provides instant updates | Refresh if state gets confused
**Proxy Configuration**: Snapchat requests automatically proxied through Vite
**Build Verification**: Test production build with `npm run preview`

## Snapchat-Specific Guidelines

**URL Patterns**: App expects `?username=snapchat_username` query parameter
**Data Extraction**: Parse HTML response for OpenGraph meta tags and `__NEXT_DATA__`
**CSS Selectors**: Target Snapchat's class names (may change) | Build robust selectors
**Error Handling**: Handle cases where Snapchat profile doesn't exist or is private
**Rate Limiting**: Be respectful of Snapchat's servers | Don't spam requests

## Component Responsibilities

### App.jsx
- URL parsing and username extraction
- Data fetching coordination
- Top-level state management
- Route handling

### Profile.jsx
- User avatar, name, bio display
- Subscriber count rendering
- Profile metadata presentation

### Tabs.jsx
- Tab navigation (Stories/Spotlight)
- Tab-specific content fetching
- Active tab state management

### Spotlight.jsx & Stories.jsx
- Parse and render tile content
- Handle different content types
- Grid/list layout management

### Header.jsx & Footer.jsx
- Static UI elements
- Navigation and branding

## Quick Reference

- **Dev Server**: `cd client && npm run dev` → `http://localhost:5173`
- **Test Profile**: `http://localhost:5173?username=moonlightbae`
- **Build**: `npm run build` → `npm run preview`
- **Lint**: `npm run lint` (run before commits)
- **Proxy**: `/snap/*` automatically routes to Snapchat

## API Timeout Prevention (🚨)

**MANDATORY**: Prevent API timeouts:
- **File Operations**: Target specific files/components
- **Testing**: Quick browser verification cycles
- **Responses**: Bullet points | Minimal output | Essential info only
- **Tools**: Batch calls | Smart file operations
- **Complex tasks**: Split across messages | Monitor context usage

## Quality Assurance

**Testing Checklist**:
- [ ] Component renders without errors
- [ ] Props are properly typed and documented
- [ ] Responsive design works on mobile/desktop
- [ ] Error states are handled gracefully
- [ ] Loading states provide good UX
- [ ] Browser console shows no errors

**Completion Criteria**:
- ✅ Code runs without errors in browser
- ✅ Feature works as expected in dev server
- ✅ ESLint passes with no warnings
- ✅ Visual design matches requirements
- ✅ User interaction flows work correctly