# GlobalLinkup

## Complete Project Handover & Development Brief

**Project:** GlobalLinkup
**Previous name:** Global Amor
**Project type:** Bilingual web application
**Languages:** English / Spanish
**Primary platform:** Responsive web application
**Status:** Greenfield rebuild
**Current phase:** Project setup → specification → architecture → implementation

---

# 1. PROJECT OVERVIEW

GlobalLinkup is a simple international social discovery and dating platform.

The product allows users to:

1. Create a Persona
2. Discover other people's Personas
3. View a social-style Post feed
4. Send Connect requests
5. Approve or decline connection requests
6. Reveal social/contact information only after a connection is mutually accepted
7. Browse an official GlobalLinkup Marketplace

The platform also has an Admin area for:

* User approval
* User management
* Post moderation
* Marketplace management
* Reports

The product should remain intentionally simple.

---

# 2. IMPORTANT PRODUCT PHILOSOPHY

GlobalLinkup is NOT intended to become a full social network.

The core product is:

> **Persona + Posts + Connect + Marketplace**

The main goal is helping people discover interesting people and decide whether they want to connect.

Do not add features simply because other dating/social applications have them.

---

# 3. EXISTING CLIENT WEBSITE

The client previously built a website under the name Global Amor:

https://global-amor.vercel.app/

Use this website as a **functional and content reference**.

It is NOT the design source of truth.

The new application should be rebuilt from scratch under:

# GlobalLinkup

The existing website should help the development/design agent understand:

* Existing product concept
* Existing terminology
* Existing content
* Existing client expectations

Do not blindly copy its implementation or visual design.

---

# 4. CORE FEATURES

## 4.1 Authentication

Users authenticate using:

* Email
* Password

Required flows:

* Create account
* Login
* Logout
* Forgot password
* Password reset

There should be no requirement for users to enter their Persona information when logging in.

---

# 5. ACCOUNT CREATION

Account creation has two conceptual parts.

## Step 1 — Authentication Account

Required:

* Email
* Password
* Confirm Password

This creates the authentication account.

---

## Step 2 — Persona

After creating the authentication account, the user creates their Persona.

Required/expected Persona information:

* Name
* Country
* City
* Profile image
* Bio
* Interests
* Social/contact information

The user then submits the Persona for Admin approval.

---

# 6. ACCOUNT APPROVAL

New accounts require Admin approval before they can use the platform normally.

Account states should include:

```text
PENDING
APPROVED
REJECTED
SUSPENDED
```

### Pending

User has completed registration but has not yet been approved.

### Approved

User can access the main application.

### Rejected

User cannot access the platform as an approved user.

### Suspended

Previously approved user has been restricted by Admin.

---

# 7. LOGIN

Once approved, returning users only enter:

```text
Email
Password
```

They do NOT recreate their Persona.

Persona information is stored separately from authentication credentials.

Recommended conceptual separation:

```text
Authentication
    email
    password/auth credentials
    account status

Persona
    name
    country
    city
    image
    bio
    interests
    social/contact information
```

The email is an authentication identifier.

It does not need to appear publicly on the Persona.

---

# 8. PERSONA

Persona is one of the primary features.

A Persona represents a user's public identity on GlobalLinkup.

A Persona contains:

* Profile image
* Name
* Country
* City
* Bio
* Interests
* Photos if supported by final implementation
* Connection state

Social/contact information is treated separately because of privacy.

---

# 9. SOCIAL / CONTACT INFORMATION PRIVACY

A user's social/contact information must NOT automatically be visible to everyone.

Before connection:

```text
Social Information
🔒 Private until connected
```

A user can request a connection.

The other user must approve.

Only after mutual approval should the protected social/contact information become visible.

Example:

```text
User A
   ↓
Connect
   ↓
User B receives request
   ↓
Accept
   ↓
Connection established
   ↓
Protected social/contact information revealed
```

There is no chat required.

---

# 10. CONNECT SYSTEM

Connect is NOT messaging.

There is no private chat system in the current scope.

Connection states:

```text
NONE
REQUESTED
RECEIVED
ACCEPTED
DECLINED
```

Possible UI states:

### No connection

`Connect`

### Request sent

`Request Sent`

### Incoming request

`Accept` / `Decline`

### Accepted

`Connected`

### Declined

Return to:

`Connect`

---

# 11. NO CHAT

This is an explicit product constraint.

Do NOT implement:

* Direct messages
* Chat inbox
* Conversations
* Message threads
* Chat notifications
* Real-time messaging

Connection is the mechanism for granting access to protected social/contact information.

---

# 12. POSTS

Posts are the second major product feature.

The Posts experience should feel similar in concept to an Instagram-style feed.

However, do not copy Instagram's interface.

A Post can contain:

* Author Persona
* Image
* Caption
* Date/time
* Simple engagement information

The exact engagement functionality should remain minimal unless explicitly required.

---

# 13. POST FEED

The main Posts page is a vertical social feed.

Example:

```text
Posts

Sofia Martinez
Barcelona, Spain

[Large Image]

Beautiful afternoon in Barcelona.

♡ 42

------------------

Daniel Rivera
Mexico City

[Large Image]

Exploring Mexico City.

♡ 31
```

Photography should be the dominant visual element.

---

# 14. POST CREATION

Users can create Posts if enabled by the final product specification.

Basic Post creation:

```text
Upload image
Caption
Publish
```

Do NOT add:

* Stories
* Reels
* Live video
* Music
* Advanced photo editing
* Complex creator tools

Keep posting simple.

---

# 15. MARKETPLACE

GlobalLinkup has an official Marketplace.

IMPORTANT:

# Only ADMIN can create and manage Marketplace products.

Normal users cannot create marketplace listings.

Users can:

* Browse products
* Search products
* Filter products
* View product details
* Contact the seller/platform using provided contact information

The Marketplace is NOT a user-to-user marketplace.

---

# 16. MARKETPLACE PRODUCT

A product should contain approximately:

* Product name
* Price
* Category
* Description
* Product image(s)
* Availability
* Contact information

Do not introduce ecommerce functionality unless explicitly requested.

Current scope does NOT require:

* Shopping cart
* Checkout
* Payment processing
* Orders
* Shipping management
* Seller accounts
* Vendor dashboards

---

# 17. ADMIN

There are only two application roles:

```text
USER
ADMIN
```

Do NOT create:

* Main Admin
* Sub-admin
* Moderator
* Vendor
* Seller role

Keep authorization simple.

---

# 18. ADMIN RESPONSIBILITIES

Admin can:

### Users

* View users
* Review pending accounts
* Approve users
* Reject users
* Suspend users
* Review Personas

### Posts

* Review posts
* Remove inappropriate posts
* Handle reported posts

### Marketplace

* Create products
* Edit products
* Delete products
* Upload product images
* Set prices
* Set categories
* Set availability
* Manage contact information

### Reports

* Review reports
* Resolve reports
* Take moderation action

---

# 19. ADMIN NAVIGATION

Keep it simple:

```text
Dashboard

Users
Posts
Marketplace
Reports
Settings
```

Do not build a huge enterprise-style admin dashboard.

---

# 20. MAIN USER NAVIGATION

Recommended desktop navigation:

```text
GlobalLinkup

Persona
Posts
Marketplace

EN | ES
Profile
```

The exact naming can be adjusted during UX design.

Do not create navigation for features that do not exist.

---

# 21. MOBILE NAVIGATION

Recommended:

```text
Persona
Posts
Marketplace
Profile
```

Keep it to approximately four primary destinations.

Connect actions live inside Persona/Profile experiences.

---

# 22. BILINGUAL SUPPORT

The application supports:

```text
English
Spanish
```

Language selection:

```text
EN | ES
```

The architecture must support proper internationalization.

Do not hardcode English text directly throughout components.

Use translation keys.

Example conceptual structure:

```text
common.login
common.logout
persona.connect
persona.connected
persona.pending
marketplace.title
posts.create
```

Spanish must be treated as a first-class language, not as a later translation.

---

# 23. DESIGN DIRECTION

GlobalLinkup should feel:

* Warm
* Human
* International
* Social
* Trustworthy
* Simple
* Modern
* Photography-driven

The design should feel like a real consumer product.

---

# 24. COLOR SYSTEM

Primary:

```text
Warm Coral
#E86A5B
```

Main text:

```text
Warm Charcoal
#292725
```

Background:

```text
Warm Cream
#F8F6F2
```

Surface:

```text
White
#FFFFFF
```

Soft accent:

```text
#F4DED8
```

Secondary text:

```text
#716D68
```

Border:

```text
#E5E0D9
```

Success:

```text
#2E9B68
```

Do NOT use deep navy as a primary brand color.

---

# 25. DESIGN ANTI-PATTERNS

Avoid:

* Purple AI gradients
* Blue/purple SaaS aesthetics
* Deep navy dashboards
* Glassmorphism
* Neon
* Excessive gradients
* Huge rounded cards
* Excessive floating containers
* Excessive shadows
* Generic AI illustrations
* Futuristic UI
* Giant hearts
* Overly romantic dating clichés
* "Find your soulmate" stock messaging
* Every element being a pill
* Excessive decorative UI

Photography, typography, whitespace, and content should create the visual identity.

---

# 26. TYPOGRAPHY

Preferred:

**Manrope**

Alternative:

**Inter**

Typography should be:

* Clear
* Modern
* Friendly
* Highly readable

Use typography to establish hierarchy instead of excessive UI decoration.

---

# 27. RESPONSIVE REQUIREMENTS

The application must work well at:

```text
1440px
1280px
1024px
768px
390px
375px
360px
```

Mobile is not simply a scaled desktop layout.

Design mobile interaction patterns intentionally.

---

# 28. ACCESSIBILITY

Target a strong accessibility baseline.

At minimum:

* Keyboard navigation
* Visible focus states
* Proper form labels
* Accessible buttons
* Sufficient color contrast
* Meaningful alt text
* Touch-friendly targets
* Semantic HTML
* Screen-reader-friendly form errors

Do not sacrifice accessibility for visual effects.

---

# 29. TECHNICAL DIRECTION

The exact framework can be finalized during technical planning, but the application should be designed as a modern TypeScript web application.

Recommended architecture principles:

* TypeScript
* Component-based frontend
* Responsive CSS
* Proper i18n
* Supabase for backend/auth/data if consistent with the client's existing setup
* Row Level Security for protected data
* Clear separation between authentication and Persona data
* Environment variables for secrets
* No secrets committed to Git

---

# 30. DATA MODEL — HIGH LEVEL

The exact schema should be designed before implementation, but conceptually expect:

```text
auth.users
    ↓
profiles/personas
    ↓
posts
    ↓
connections
    ↓
marketplace_products
    ↓
reports
```

A possible conceptual model:

### profiles

```text
id
name
country
city
avatar_url
bio
interests
social_links
approval_status
created_at
updated_at
```

### posts

```text
id
user_id
image_url
caption
created_at
updated_at
```

### connections

```text
id
requester_id
recipient_id
status
created_at
updated_at
```

### marketplace_products

```text
id
name
price
category
description
image_urls
availability
contact_information
created_at
updated_at
```

### reports

```text
id
reporter_id
reported_user_id
reported_post_id
reason
status
created_at
resolved_at
```

This is conceptual only.

The implementation agent must review and improve the schema before creating migrations.

---

# 31. SECURITY REQUIREMENTS

Security is especially important because the application contains personal information.

Important rules:

### Authentication

Use the authentication provider rather than storing passwords manually.

### Authorization

Never rely only on frontend role checks.

Enforce permissions server-side/database-side.

### Social information

Protected social/contact information must only be readable when the connection rules allow it.

Do not simply hide it with CSS.

### Marketplace

Only ADMIN users can create/update/delete marketplace products.

### Admin

Only ADMIN users can access administrative operations.

### Reports

Users should not be able to manipulate reports belonging to other users.

### Database

Use appropriate Row Level Security policies.

---

# 32. PROJECT SCOPE — DO NOT IMPLEMENT

The following are explicitly OUT OF SCOPE unless the client changes the requirements:

```text
Chat
Direct messaging
Community groups
Forums
Stories
Reels
Live streaming
Video calls
Voice calls
User marketplace listings
Seller accounts
Vendor dashboards
Shopping cart
Checkout
Payment processing
Shipping
Complex matching algorithm
AI matchmaking
Following/follower system
Events
Groups
Advanced creator tools
```

If an agent suggests one of these features, it must ask for confirmation instead of silently implementing it.

---

# 33. MVP PRIORITY

Implementation priority:

## Phase 1 — Foundation

* Project setup
* Design system
* Environment configuration
* Database
* Authentication
* i18n
* Core routing

## Phase 2 — Account & Approval

* Registration
* Persona creation
* Pending approval
* Admin approval
* Login
* Password reset

## Phase 3 — Persona

* Persona page
* People discovery
* Search/filter
* Connection requests
* Connection approval
* Protected social information

## Phase 4 — Posts

* Feed
* Create Post
* Post moderation

## Phase 5 — Marketplace

* Product listing
* Product detail
* Admin product management

## Phase 6 — QA / Production

* Security review
* Responsive testing
* Accessibility testing
* Browser testing
* Performance
* Production deployment

---

# 34. AGENT DEVELOPMENT WORKFLOW

This is a greenfield project.

The coding agent must NOT immediately start generating the entire application.

Follow:

```text
Understand
↓
Specify
↓
Plan
↓
Implement
↓
Test
↓
Review
↓
Ship
```

Do not skip specification and planning.

---

# 35. AGENT RULE — NO UNREQUESTED FEATURES

The agent must follow the project scope.

If a feature is not explicitly described in this handover:

1. Check whether it is necessary for an existing feature.
2. If not necessary, do not implement it.
3. If it could materially affect architecture, ask before proceeding.

The agent should prefer the smallest implementation that satisfies the requirement.

---

# 36. AGENT RULE — VERIFY BEFORE CLAIMING DONE

Never say:

> "Done"

without verification.

For meaningful changes, provide evidence such as:

* Tests passing
* Typecheck passing
* Build passing
* Lint passing
* Browser verification
* Database migration success
* Relevant screenshots where appropriate

---

# 37. AGENT RULE — SMALL VERTICAL SLICES

Do not create hundreds of files and features in one pass.

Implement in small vertical slices.

Example:

```text
Authentication
    ↓
Test
    ↓
Verify
    ↓
Commit

Persona
    ↓
Test
    ↓
Verify
    ↓
Commit

Connections
    ↓
Test
    ↓
Verify
    ↓
Commit
```

This makes failures easier to identify.

---

# 38. GIT WORKFLOW

Use small, meaningful commits.

Examples:

```text
feat: add authentication flow
feat: add persona approval workflow
feat: add persona discovery
feat: add connection requests
feat: add posts feed
feat: add marketplace
fix: protect social information access
test: add connection authorization tests
```

Avoid giant commits such as:

```text
"build entire app"
```

---

# 39. SKILLS / AI DEVELOPMENT SETUP

The planned AI development environment is:

```text
mise
+
OpenCode / Work Buddy
+
Agent Skills
```

Potential skill sources:

### Addy Osmani Agent Skills

Production-oriented lifecycle skills covering specification, planning, implementation, testing, review, performance, security, frontend engineering, and shipping.

Official repository:

[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills?utm_source=chatgpt.com)

### Taste Skill

Use this specifically for frontend visual quality, layout, typography, spacing, motion, and avoiding generic AI-generated UI.

Official repository:

[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill?utm_source=chatgpt.com)

### Matt Pocock Skills

Use these as composable engineering/productivity skills rather than blindly enabling everything.

Official repository:

[mattpocock/skills](https://github.com/mattpocock/skills?utm_source=chatgpt.com)

---

# 40. SKILL USAGE PRINCIPLE

Do not allow multiple skill collections to create conflicting instructions.

Establish a hierarchy:

```text
PROJECT HANDOVER
       ↓
Project-specific constraints
       ↓
Engineering workflow skills
       ↓
Frontend/design skills
       ↓
General productivity skills
```

Project requirements always override generic skill suggestions.

For example:

If a generic skill suggests adding chat because "social platforms should have messaging", that does NOT override this project handover.

GlobalLinkup has:

**No chat.**

---

# 41. RECOMMENDED AGENT WORKFLOW

At the beginning of the project, use the equivalent of:

```text
/spec
```

to convert this handover into a formal technical/product specification.

Then:

```text
/plan
```

to create small implementation tasks.

Then implement using incremental slices.

Use:

```text
/test
```

for verification.

Use:

```text
/review
```

before important merges.

Use frontend-specific skills when building UI.

Use Taste Skill specifically when working on visual implementation.

Addy Osmani's agent-skills project is explicitly structured around this type of lifecycle.

---

# 42. DEFINITION OF DONE

A feature is not complete simply because it renders.

A feature is complete when:

* UX works
* Responsive behavior works
* Loading states exist
* Error states exist
* Authorization is correct
* Database rules are correct
* Tests exist where appropriate
* TypeScript passes
* Build passes
* Relevant browser behavior is verified
* No obvious accessibility regression exists

---

# 43. FIRST IMPLEMENTATION TASK

Do NOT start by implementing the whole application.

The first task should be:

## Project Foundation

The agent should:

1. Inspect the repository
2. Confirm the existing environment
3. Confirm the chosen framework
4. Confirm Node/package manager requirements
5. Set up the project with mise
6. Set up OpenCode/agent instructions
7. Install/configure the selected skills
8. Establish the project structure
9. Establish environment variable conventions
10. Establish the design tokens
11. Establish i18n structure
12. Establish Supabase connection if applicable
13. Create the initial database design
14. Document decisions
15. Run the project
16. Verify the baseline build

Do not build Persona, Posts, Marketplace, or Admin until the foundation is verified.

---

# 44. FIRST QUESTION FOR THE AGENT

Before making architectural decisions, the agent should inspect the project and determine:

* What framework is currently installed?
* Is the repository empty or already initialized?
* What package manager is being used?
* Is Supabase already configured?
* Is there an existing database?
* Is the existing Global Amor project intended to be migrated or completely replaced?
* What deployment target will be used?
* What environment variables already exist?

If the project is truly greenfield, prefer a clean implementation rather than carrying unnecessary legacy code forward.

---

# 45. PRODUCT NORTH STAR

When making any design or implementation decision, ask:

> Does this make it easier for a person to discover someone, understand their Persona, decide whether to connect, share a Post, or browse the Marketplace?

If not, it probably does not belong in the MVP.

---

# 46. FINAL PRODUCT DEFINITION

GlobalLinkup is:

> **A simple bilingual international people-discovery platform where users create Personas, discover other people, share Posts, send connection requests, and reveal social/contact information only after mutual approval. It also includes an official Admin-managed Marketplace.**

Core:

```text
PERSONA
POSTS
CONNECT
MARKETPLACE
```

Authentication:

```text
EMAIL
PASSWORD
ADMIN APPROVAL
```

Roles:

```text
USER
ADMIN
```

Languages:

```text
ENGLISH
SPANISH
```

No:

```text
CHAT
COMMUNITY
USER MARKETPLACE
STORIES
REELS
COMPLEX SOCIAL FEATURES
```

Keep the product **simple, human, warm, international, and production-ready**.

