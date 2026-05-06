# AI Coding Lessons

Purpose:
This file records practical lessons learned while using AI coding tools on the Jothi Learning website.

The goal is to reduce token burn, improve instruction quality, and keep coding work narrow, reviewable, and production-safe.

## Daily Review Rule

At the end of each coding day:
- record one lesson learned
- record one prompt pattern that worked
- record one prompt pattern that caused waste or drift
- record one rule to use tomorrow

## Lessons

### 2026-05-06

Lesson:
AI coding tools should be used as narrow executors, not open-ended designers or reviewers.

What caused waste:
Broad prompts such as "review", "improve", "polish", "optimise", or "make it premium" encouraged the tool to inspect too much, reason too broadly, and make design decisions.

Better pattern:
Decide the design direction first, then ask the coding tool for the smallest safe patch using named files only.

Example:
"Edit contact.html and styles.css only. Add spacing above the Contact hero CTA row. Do not change copy, links, layout, metadata, or other pages."

Rule for tomorrow:
One task. Named files. Smallest safe patch. No broad review unless explicitly planned.
