---
claud_doc_uuid: 78f6bf24-3f6a-43f9-b37f-fcfd55a08915
---

# Product Brainstorm — Memoir AI (Hackathon Recording Summary)

**Date**: 2026-06-06  
**Context**: Recorded walking conversation at AI Beavers Hackathon Hamburg. No speaker attribution — treated as one shared document.

---

## Core Idea

An AI-powered biography/memoir creator that:
- Records real conversations between family members (e.g. grandchild interviewing grandparent)
- Transcribes audio locally (privacy-safe)
- Uses AI to organise transcript segments into structured book chapters — written in the interviewee's voice
- Builds a "voice fingerprint" that improves with each session
- Produces multiple output formats: digital book, physical book, audiobook, children's picture book
- Traces every passage back to its source audio clip (no hallucination risk; verifiable provenance)
- Chapters update as new conversations happen; content can flow across chapters organically

---

## Problem Being Solved

**Human memory is finite — and the clock is running.**

When elderly relatives die, their experiences die with them. The generation that lived through WWII, the post-war rebuilding, pre-digital childhoods, has no digital footprint. Their memories cannot be Googled. Once they're gone, the knowledge is gone.

Current generation of grandparents are ~75–100 years old. This window is closing every day.

Key sub-problems:
- **Personal loss**: grandchildren never knew their grandparent's world — what school was like, what the neighbourhood looked like, who they loved and lost
- **Historical loss**: eyewitness accounts of transformative political/social events (WWII, Holocaust, post-war democracy) are disappearing faster than they can be documented
- **Effort gap**: the desire exists, but the tools require either enormous effort (ghost writer, self-writing) or produce shallow output (photo albums, passing mentions)
- **Distributed families**: large families, spread geographically, see grandparents 1–2x/year. There isn't enough time or intimacy to carry memories forward naturally

---

## Product Vision & Iterations

**v1 (Hackathon scope)**: Record a conversation → transcribe → AI writes a chapter

**Near-term iterations**:
- AI suggests follow-up questions based on what's missing ("You mentioned school was destroyed — can you record more about that?")
- Source tracing: click any sentence in the book → hear the original audio moment
- Voice fingerprint: book is written in the interviewee's actual tone and rhythm, improving session by session

**Longer-term vision**:
- Children's picture-book version generated from the same source material (simplified language, illustrated)
- Audiobook that narrates the grandfather's story in accessible language
- Family product: annual "session" tradition — meet every Christmas, record one year of memory
- Historical archive layer: anonymous testimony preservation for NGOs / education

---

## Target Customer vs. User vs. Subject

| Role | Person | Motivation |
|------|--------|-----------|
| **Customer** (pays) | Adult grandchild / child, 30–50 years old | Wants to preserve family history before it's too late; can't afford/access a ghost writer |
| **User** (participates) | Same adult + broader family | Records conversations, reads/shares the book |
| **Subject** (the product) | Grandparent/parent, 70–99 years old | Often couldn't or wouldn't do this alone; benefits from someone caring enough to ask |
| **Reader** (future) | Great-grandchildren, family members not yet born | Will never meet the subject; the book is their only access |

The subject is not the customer. The family is. This matters for marketing.

---

## Business Model Discussion

**Not freemium** — free devalues the product and removes commitment to actually use it. If it's free, people sign up and never record.

**Not monthly subscription** — usage is not predictable. Grandfather dies 2 months in. You shouldn't be penalised for that.

**Proposed model**:
- Pay for outcome, not for time
- Upfront fee + add-ons (physical book, extra copies, extended hours)
- Example: ~€150 for 30 hours of transcribed audio + 12 chapters
- Smaller packages available for narrower scope (e.g. "just the war years")
- One free chapter as acquisition/demo tool — not full product for free

**Ghost writer as price anchor**: Real ghost writers cost several thousand euros. This product delivers comparable output at a fraction of the cost.

---

## Emotional & Historical Angle

The strongest emotional pitch is not "technology" — it's the irreversibility of loss.

- Margot Friedlander (famous Holocaust survivor, Berlin) used her voice until the end to say "change before it's too late" — she has since died
- NGOs that bring Holocaust survivors to schools can no longer find first-generation survivors — they are now using children of survivors
- The Nazi Party was democratically elected — this process is visible again in AFD's rise. People who remember how it started are almost all gone
- Matthieu's grandfather is 99. His two young nephews (aged 1 and 3) are meeting him now but will not remember him. The book becomes their connection

**Pitch angle**: Lead with emotion and the problem (memory is expiring right now). Then reveal the solution. The AI is the tool, not the story.

---

## Scope / Cutting Warning

The biggest internal risk noted: **getting lost in the feature set**. The hackathon requires one working end-to-end slice. Everything else is vision. Define the slice, ship it, show it works.

---

## Framework Questions — Answered

### 1. What is the strongest evidence that someone actually wants this — not 'interested,' but would be genuinely upset if it disappeared tomorrow?

**Evidence signals:**
- **"Grandpa, tell me about your life" books** sell commercially (€15–25). They exist because people want this. The fact that the format is a blank journal that grandpa has to fill in himself shows the demand exists even when the UX is terrible.
- **Ghost writers are hired** for autobiographies at multi-thousand-euro price points. The market for memoir creation is real and has established willingness to pay — our product just makes it accessible.
- **NGOs actively preserving Holocaust testimony** — institutionally funded efforts to capture eyewitness accounts before they're gone. This validates both the urgency and the value of preservation.
- **Personal urgency**: Matthieu's grandfather is 99. Many families have a version of this person right now. When you ask "would you be upset if this disappeared?" — yes, if the grandfather dies without being recorded, the loss is permanent and irreversible. That's about as strong a signal as you get.

The upset-if-gone test is easiest to answer at the individual level: once someone has recorded three sessions and seen the first chapter come out, there is no going back. You would not accept losing that.

### 2. What are people doing right now to solve this problem, even badly? What does that workaround cost them in hours or money?

| Workaround | Cost (money) | Cost (time/effort) | Quality |
|------------|-------------|-------------------|---------|
| Physical fill-in journals | €15–25 | Months of writing for grandparent; rarely completed | Low — shallow prompts, illegible, not digital |
| Hiring a ghost writer | €3,000–15,000+ | Multiple interview sessions, months of editing rounds | High — but inaccessible to most |
| Family-member writes memoir | €0 | Weeks to months of personal time; almost never done | Medium — but biased, incomplete |
| Home video/audio recordings | €0 | Ongoing — but no editing, no structure, no findability | Raw — stored on a hard drive, never watched |
| Family photo albums | €30–100 | Hours of curation | Visual only — no stories, no context |
| **Do nothing (most common)** | €0 | 0 | Nothing preserved |

The dominant workaround is "do nothing" — the pain is not acute enough day-to-day until it's too late. That's the real competitor.

### 3. Name the actual human who needs this most. What is their title? What gets them promoted? What gets them fired?

**The primary customer**: A 35–45 year old adult grandchild or child. Likely a knowledge worker (manager, engineer, consultant, doctor). Lives in a different city or country than their grandparents. Sees them 1–3 times a year. Has the emotional desire to capture their grandparent's story but has never actually done it because it always feels like something to do "next visit."

- **What gets them "promoted"** in this context: Being the family member who actually made the book happen. Being remembered as the one who sat down with Grandpa and asked the questions. Having something to give to their children.
- **What gets them "fired"**: Grandparent dies. The window closes. Regret is permanent.

**Secondary actor**: The grandparent/parent themselves (ages 70–95). Not the payer, but sometimes the initiator — especially if they've been meaning to write their memoir for years and never found the time or capability.

**B2B angle (secondary)**: Company founders or family business owners who want to preserve their founding story. Less emotionally charged but still valid — ghost writers are hired for exactly this use case.

### 4. What is the smallest version of this that someone would pay real money for this week — not after the platform is built?

**The MVP**: 
1. Record a 30–60 minute audio conversation on any phone
2. Upload the file to a simple form (email + file upload)
3. AI transcribes and outputs a single structured chapter — written in the interviewee's voice
4. Delivered as a PDF within 24 hours
5. Price: €15–25

No platform. No app. No login. A landing page, a Tally/Typeform, and a manual AI pipeline (Claude/GPT-4o + Whisper). Ship this in a day, validate in a week.

If someone pays €20 to see one chapter of their grandfather's life, you have product-market fit. If the chapter makes them cry or laugh and they immediately want to record the next session, you have retention.

### 5. What are the 3 strongest competitors or alternatives — including 'do nothing,' spreadsheets, agencies, and manual work? What do they do that we'd struggle to replicate?

*(This question was not directly answered in the conversation — answered here based on context:)*

| Competitor | Strength | What they do we'd struggle to match |
|------------|----------|-------------------------------------|
| **Do nothing / "next visit"** | Zero friction, zero cost, feels like a future problem | Emotional inertia is extremely hard to break without a triggering moment |
| **Ghost writers / biography agencies** | Human quality, editorial relationship, prestige output | Trust and relationship with interviewee; handles emotional complexity; produces polished prose at publication quality |
| **"Grandpa, tell me" journals** | Physical, giftable, well-understood format; already in grandparent's hands | Giftability as a cold acquisition channel — no app store, no account needed; grandparent already has it |
| **StoryWorth** (closest digital comp) | Weekly email prompts, digital book at end of year, established product | Subscription model already validated; established trust; existing customer base and testimonials |
| **Voice memos + manual editing** | Free, flexible, already happening | Zero marginal cost for people already recording; no switching cost |

StoryWorth is likely the closest existing competitor — worth researching their positioning and pricing gaps.

### 6. What changed recently that makes this possible or urgent now?

**Technology**:
- LLMs (GPT-4, Claude) are now capable of writing in a person's authentic voice, not just summarising
- Whisper-class local transcription is accurate, cheap, and privacy-preserving
- The cost of producing a chapter has dropped from "hire a human editor for days" to "API call in seconds"
- Voice cloning / voice fingerprinting now feasible for tone-matching output

**Urgency**:
- The WWII generation (1920–1930s birth cohort) is dying at accelerating pace — the window to capture first-hand accounts of the 20th century's defining events is closing this decade, not next
- Holocaust survivor NGOs can no longer find first-generation witnesses — they've started using second-generation (children of survivors). This is a documentable, citable signal of urgency
- Aging society demographics: in Germany, by 2035, 30%+ of the population will be 60+. The number of families facing this exact situation is growing
- AI-assisted creation is now culturally accepted — "AI helped me write this" no longer feels like cheating

**Cultural moment**:
- Political instability in Europe (AFD rise, Ukraine) is making people more aware that first-hand accounts of how democracies fail have enormous value
- The first generation born fully digital (Gen Z) is now old enough to notice they have no pre-digital record of their grandparents' lives — and no way to get it

### 7. What is the single biggest reason this idea fails?

**Distribution at the right moment.**

The product is emotionally charged — it only gets activated by a trigger: a visit, a health scare, a birthday, a death in the family. The challenge is reaching the right person (35–45 yo adult grandchild, distributed family) *at the moment they feel the urgency*, not three months later when the moment has passed.

Unlike a productivity tool that solves a daily pain, this product solves an intermittent, low-urgency pain that becomes catastrophic only once — when the grandparent dies. Getting the product into someone's hands before that moment requires either:
- Strong organic/emotional word-of-mouth (someone shares their book at Christmas → five cousins immediately want one)
- Event-triggered marketing (birthday gift season, hospital visit period, end-of-year family time)
- Gifting mechanics (I buy it for my dad, not for myself)

If the go-to-market relies on someone searching for "AI memoir tool" when they're not in an acute emotional state — it will fail. The product has to show up where people are *already feeling the urgency*: in a gift shop, in a hospice newsletter, in a WhatsApp family group, on a birthday card website.

---

*Saved: 2026-06-06 | Source: recorded walking conversation, AI Beavers Hackathon Hamburg*
