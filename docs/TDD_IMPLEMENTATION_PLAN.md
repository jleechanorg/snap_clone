# TDD Implementation Plan: Lighthouse Optimization

## Overview

This Test-Driven Development plan transforms the Snapchat clone into a high-performing, accessible application achieving 90+ Lighthouse scores. Each implementation phase follows Red-Green-Refactor TDD cycles.

---

## Testing Infrastructure Setup

### Required Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest-axe": "^8.0.0",
    "lighthouse": "^11.0.0",
    "@lhci/cli": "^0.12.0",
    "puppeteer": "^21.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "msw": "^2.0.0"
  }
}
```

### CI/CD Configuration

```yaml
# .github/workflows/tdd-pipeline.yml
name: TDD Pipeline
on: [push, pull_request]
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:a11y
  
  lighthouse-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci && npm run build
      - run: npx @lhci/cli@0.12.x autorun
```

---

## Week 1: Foundation & Testing Setup

### Day 1-2: Core Testing Infrastructure

#### Test Setup Requirements
```typescript
// setupTests.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
configure({ testIdAttribute: 'data-testid' });

// Mock fetch for data fetching tests
global.fetch = jest.fn();
```

#### TDD Cycle 1: Error Boundary Component

**RED: Write failing test**
```typescript
// __tests__/ErrorBoundary.test.tsx
describe('ErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    const ThrowError = () => { throw new Error('Test error'); };
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
```

**GREEN: Minimal implementation**
```typescript
// components/ui/ErrorBoundary.tsx
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h2>Something went wrong</h2>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**REFACTOR: Enhance with accessibility and logging**

### Day 3-4: Loading States & Performance Testing

#### TDD Cycle 2: Loading Components

**RED: Performance test for loading states**
```typescript
// __tests__/LoadingStates.test.tsx
describe('Loading Performance', () => {
  it('should render skeleton within 16ms (60fps)', async () => {
    const startTime = performance.now();
    
    render(<ProfileSkeleton />);
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(16);
  });

  it('should have proper ARIA attributes for loading state', () => {
    render(<ProfileSkeleton />);
    
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
  });
});
```

**GREEN: Implement basic skeleton**
**REFACTOR: Optimize rendering performance**

### Day 5: Accessibility Foundation

#### TDD Cycle 3: Keyboard Navigation

**RED: Keyboard navigation tests**
```typescript
// __tests__/KeyboardNavigation.test.tsx
describe('Keyboard Navigation', () => {
  it('should focus first tab when pressing Tab key', async () => {
    const user = userEvent.setup();
    render(<TabNavigation />);
    
    await user.tab();
    
    expect(screen.getByRole('tab', { name: /spotlight/i })).toHaveFocus();
  });

  it('should navigate tabs with arrow keys', async () => {
    const user = userEvent.setup();
    render(<TabNavigation />);
    
    const firstTab = screen.getByRole('tab', { name: /spotlight/i });
    firstTab.focus();
    
    await user.keyboard('{ArrowRight}');
    
    expect(screen.getByRole('tab', { name: /stories/i })).toHaveFocus();
  });
});
```

**Acceptance Criteria Week 1:**
- [ ] All components have error boundaries
- [ ] Loading states render < 16ms
- [ ] Basic keyboard navigation works
- [ ] Zero accessibility violations in Jest-axe
- [ ] Test coverage > 80%

---

## Week 2: Performance Optimization

### Day 1-2: Code Splitting & Lazy Loading

#### TDD Cycle 4: Lazy Loading Performance

**RED: Bundle size and loading tests**
```typescript
// __tests__/BundleOptimization.test.tsx
describe('Bundle Optimization', () => {
  it('should load main bundle under 150KB', async () => {
    const bundleStats = await analyzeBundleSize();
    expect(bundleStats.mainBundle.size).toBeLessThan(150 * 1024);
  });

  it('should lazy load tab content on demand', async () => {
    const user = userEvent.setup();
    
    // Mock dynamic imports
    const mockImport = jest.fn().mockResolvedValue({
      default: () => <div>Stories content</div>
    });
    
    render(<TabNavigation />);
    
    await user.click(screen.getByRole('tab', { name: /stories/i }));
    
    expect(mockImport).toHaveBeenCalledWith('./StoriesContent');
  });
});
```

**GREEN: Implement React.lazy and Suspense**
```typescript
// components/tabs/TabContent.tsx
const SpotlightContent = lazy(() => import('./SpotlightContent'));
const StoriesContent = lazy(() => import('./StoriesContent'));

export function TabContent({ activeTab }: TabContentProps) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      {activeTab === 'spotlight' && <SpotlightContent />}
      {activeTab === 'stories' && <StoriesContent />}
    </Suspense>
  );
}
```

### Day 3-4: Image Optimization

#### TDD Cycle 5: Progressive Image Loading

**RED: Image performance tests**
```typescript
// __tests__/ImageOptimization.test.tsx
describe('Image Optimization', () => {
  it('should use WebP format when supported', () => {
    // Mock WebP support
    Object.defineProperty(document.createElement('canvas'), 'toDataURL', {
      value: () => 'data:image/webp;base64,test'
    });
    
    render(<OptimizedImage src="test.jpg" alt="Test" />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('.webp'));
  });

  it('should lazy load images below the fold', () => {
    // Mock IntersectionObserver
    const mockObserve = jest.fn();
    global.IntersectionObserver = jest.fn(() => ({
      observe: mockObserve,
      disconnect: jest.fn(),
    }));

    render(<LazyImage src="test.jpg" alt="Test" />);
    
    expect(mockObserve).toHaveBeenCalled();
  });
});
```

### Day 5: Caching Strategy

#### TDD Cycle 6: Service Worker & Cache

**RED: Caching behavior tests**
```typescript
// __tests__/CacheStrategy.test.tsx
describe('Cache Strategy', () => {
  it('should cache API responses for 5 minutes', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' })
    });
    global.fetch = mockFetch;

    const service = new ProfileService();
    
    // First call
    await service.getProfile('test-user');
    // Second call within cache period
    await service.getProfile('test-user');
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
```

**Acceptance Criteria Week 2:**
- [ ] Main bundle < 150KB gzipped
- [ ] Images lazy load and use WebP
- [ ] Code splitting reduces initial load by 60%
- [ ] Cache hit rate > 80% for repeated requests
- [ ] Lighthouse Performance score > 85

---

## Week 3: Accessibility Implementation

### Day 1-2: Semantic HTML & ARIA

#### TDD Cycle 7: Screen Reader Support

**RED: Screen reader accessibility tests**
```typescript
// __tests__/ScreenReaderSupport.test.tsx
describe('Screen Reader Support', () => {
  it('should have proper heading hierarchy', () => {
    render(<ProfilePage />);
    
    const headings = screen.getAllByRole('heading');
    expect(headings[0]).toHaveProperty('tagName', 'H1');
    expect(headings[1]).toHaveProperty('tagName', 'H2');
  });

  it('should announce dynamic content changes', async () => {
    render(<TabNavigation />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    
    await userEvent.click(screen.getByRole('tab', { name: /stories/i }));
    
    expect(liveRegion).toHaveTextContent(/stories content loaded/i);
  });
});
```

### Day 3-4: Focus Management

#### TDD Cycle 8: Focus Trapping and Skip Links

**RED: Focus management tests**
```typescript
// __tests__/FocusManagement.test.tsx
describe('Focus Management', () => {
  it('should provide skip links for navigation', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Press Tab to focus skip link
    await user.tab();
    
    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toHaveFocus();
    
    await user.keyboard('{Enter}');
    
    expect(screen.getByRole('main')).toHaveFocus();
  });
});
```

### Day 5: Color Contrast & Visual Accessibility

#### TDD Cycle 9: Visual Accessibility

**RED: Visual accessibility tests**
```typescript
// __tests__/VisualAccessibility.test.tsx
describe('Visual Accessibility', () => {
  it('should meet WCAG contrast requirements', async () => {
    render(<App />);
    const results = await axe(document.body);
    
    expect(results.violations.filter(v => v.id === 'color-contrast')).toHaveLength(0);
  });

  it('should show focus indicators on all interactive elements', async () => {
    const user = userEvent.setup();
    render(<TabNavigation />);
    
    const button = screen.getByRole('tab', { name: /spotlight/i });
    await user.tab();
    
    expect(button).toHaveStyle('outline: 2px solid blue');
  });
});
```

**Acceptance Criteria Week 3:**
- [ ] Zero axe-core violations
- [ ] WCAG 2.1 AA compliance verified
- [ ] All interactive elements keyboard accessible
- [ ] Screen reader testing passes
- [ ] Lighthouse Accessibility score > 95

---

## Week 4: SEO & Final Optimization

### Day 1-2: Meta Tags & Structured Data

#### TDD Cycle 10: SEO Implementation

**RED: SEO metadata tests**
```typescript
// __tests__/SEO.test.tsx
describe('SEO Implementation', () => {
  it('should generate dynamic meta tags based on profile data', async () => {
    const profileData = {
      displayName: 'Test User',
      bio: 'Test bio',
      image: 'https://example.com/image.jpg'
    };
    
    render(<ProfilePage profileData={profileData} />);
    
    await waitFor(() => {
      expect(document.title).toBe('Test User - Snapchat Profile');
      expect(document.querySelector('meta[name="description"]'))
        .toHaveAttribute('content', 'Test bio');
    });
  });

  it('should include structured data for search engines', () => {
    render(<ProfilePage profileData={mockProfile} />);
    
    const structuredData = document.querySelector('script[type="application/ld+json"]');
    expect(structuredData).toBeInTheDocument();
    
    const data = JSON.parse(structuredData!.textContent!);
    expect(data['@type']).toBe('ProfilePage');
  });
});
```

### Day 3-4: Performance Monitoring

#### TDD Cycle 11: Performance Measurement

**RED: Performance monitoring tests**
```typescript
// __tests__/PerformanceMonitoring.test.tsx
describe('Performance Monitoring', () => {
  it('should measure and report Core Web Vitals', async () => {
    const vitalsData: any[] = [];
    
    // Mock performance observer
    global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    }));
    
    render(<App />);
    
    // Simulate performance entries
    await act(async () => {
      // Trigger performance measurements
    });
    
    expect(vitalsData).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'FCP' }),
        expect.objectContaining({ name: 'LCP' }),
      ])
    );
  });
});
```

### Day 5: Final Integration & Testing

#### TDD Cycle 12: End-to-End Lighthouse Testing

**RED: Full Lighthouse integration test**
```typescript
// __tests__/LighthouseIntegration.test.tsx
describe('Lighthouse Integration', () => {
  it('should achieve target Lighthouse scores', async () => {
    const lighthouse = await import('lighthouse');
    const chromeLauncher = await import('chrome-launcher');
    
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };
    
    const runnerResult = await lighthouse('http://localhost:3000', options);
    const scores = runnerResult!.lhr.categories;
    
    expect(scores.performance.score! * 100).toBeGreaterThanOrEqual(90);
    expect(scores.accessibility.score! * 100).toBeGreaterThanOrEqual(95);
    expect(scores['best-practices'].score! * 100).toBeGreaterThanOrEqual(90);
    expect(scores.seo.score! * 100).toBeGreaterThanOrEqual(90);
    
    await chrome.kill();
  });
});
```

**Acceptance Criteria Week 4:**
- [ ] Lighthouse Performance score > 90
- [ ] Lighthouse Accessibility score > 95  
- [ ] Lighthouse Best Practices score > 90
- [ ] Lighthouse SEO score > 90
- [ ] Core Web Vitals all in "Good" range
- [ ] Zero console errors in production

---

## Continuous Integration Setup

```yaml
# .lhci/lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      url: ['http://localhost:4173/?username=moonlightbae'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

This TDD implementation plan ensures systematic development with measurable quality improvements at each step, ultimately delivering a high-performing, accessible Snapchat clone prototype.