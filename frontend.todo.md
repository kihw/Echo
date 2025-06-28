# Plan TODO - frontend

| Status | Action | File | Type | Priority | Complexity | Current State | Target State | Tests to Update |
|--------|-------|------|------|----------|-----------|---------------|-------------|----------------|
| TODO | CREATE | src/app/auth/callback/page.tsx | Page | CRITICAL | Low | Missing | Handle OAuth redirect and token storage | tests/pages/auth.test.js |
| TODO | COMPLETE | src/app/auth/forgot-password/page.tsx | Page | HIGH | Low | Placeholder API call | Implement password reset request | tests/pages/auth.test.js |
| TODO | COMPLETE | src/app/settings/page.tsx | Page | HIGH | Low | Preferences update TODO | Persist user preferences via API | tests/pages/settings.test.js |
| TODO | COMPLETE | src/app/profile/page.tsx | Page | HIGH | Low | Profile update TODO | Save profile changes via API | tests/pages/profile.test.js |
| TODO | CREATE | tests/pages/auth.test.js | Test | HIGH | Low | Missing | Cover login, register, callback flows | N/A |
| TODO | CREATE | tests/pages/settings.test.js | Test | MEDIUM | Low | Missing | Ensure preferences update works | N/A |
| TODO | CREATE | tests/pages/profile.test.js | Test | MEDIUM | Low | Missing | Ensure profile update works | N/A |
| TODO | CREATE | tests/contexts/AuthContext.test.tsx | Test | HIGH | Medium | Missing | Validate auth context logic | N/A |
| TODO | CREATE | tests/contexts/PlayerContext.test.tsx | Test | HIGH | Medium | Missing | Validate player context functions | N/A |
| TODO | CREATE | tests/services/api.test.ts | Test | MEDIUM | Low | Missing | Mock API client calls | N/A |

