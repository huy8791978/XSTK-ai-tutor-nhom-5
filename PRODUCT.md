# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS (ES modules, no build step) served by a Cloudflare Worker. The Worker proxies Gemini (`gemini-3.8-flash`, falling back silently to weaker models) so the API key stays server-side; a Durable Object enforces global RPM/TPM/RPD. Deployed from GitHub Actions; the key lives in a GitHub Secret. No Python.

## Users

Vietnamese university students taking Xác suất Thống kê (XSTK), studying alone on laptop or phone, often before exams. Lecturers may recommend it.

## Product Purpose

An AI tutor that teaches XSTK the way a good teacher does: it guides with strategy before answers, grades the student's own work, and remembers recurring mistakes to recommend a study plan.

## Positioning

Every AI response follows Vietnamese math pedagogy: Polya's 4-step problem solving (tìm hiểu đề → xây dựng chương trình giải → trình bày → kiểm tra & nghiên cứu), and Trải nghiệm → Hình thành → Củng cố → Vận dụng for concepts and theorems. Strategy never leaks the answer.

## Capabilities and Constraints

- Learning profile per user, stored in the browser (localStorage) with export/import; AI analyzes mistakes across sessions and proposes a study plan.
- AI Tutor: grade photo/PDF of handwritten work (Gemini multimodal OCR); separate buttons for strategy (no answer), grading, detailed solution.
- Practice: generate 5 multiple-choice or 5 essay problems; strategy / grade / solution buttons.
- Oral exam (vấn đáp) on theory with grading, knowledge gaps, mistakes.
- Interactive mind map with full Vietnamese diacritics.
- Math symbol input on every text field; KaTeX rendering.
- Illustrations/animations for examples (distribution charts, Galton board).
- Shared rate limits (RPM, TPM, RPD) for all visitors.
- UI language: Vietnamese.

## Brand Commitments

User-named references: Seeing Theory (seeing-theory.brown.edu) — visual explanation of probability, calm and generous.

## Evidence on Hand

None. No testimonials, users, or metrics exist; do not invent them.

## Product Principles

1. Guide before telling: strategy first, solution only on explicit request.
2. Grade the student's work, not the AI's.
3. Every mistake is data: log it, classify it, act on it.
4. Show probability, don't just state it.

## Accessibility & Inclusion

Works on low-end Android phones and desktop; keyboard accessible; respects reduced motion; Vietnamese diacritics must render everywhere.
