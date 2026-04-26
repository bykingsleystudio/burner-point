# Burner Point Public App Flow

## Public acquisition flow
1. User lands on homepage.
2. User understands full product ecosystem from hero and product sections.
3. User reviews pricing, trust/safety, FAQ, and support.
4. User clicks `Get Started` or a product CTA.
5. User enters signup or login.

## Auth flow
1. User chooses OAuth, phone, or email/password.
2. Clerk handles sign-in or sign-up.
3. Verification and recovery remain in the existing Clerk-driven states.
4. User lands in dashboard after successful auth.

## Support flow
1. User opens `/faq` from nav or homepage.
2. User filters by category.
3. User escalates to email or Telegram if self-service is insufficient.
