 # Project 2 — AI Document Q&A Tool

## Problem
Users have large PDFs and need answers fast 
without reading the whole document.

## What It Does

1. User uploads a PDF
2. User types a question
3. App returns answer + page number it came from

## Tech Stack
- Backend: Node.js + Express
- AI: Claude API with Tool Use
- PDF Parsing: pdf-parse library
- Frontend: HTML, CSS, Vanilla JS

## How It Works (RAG Flow)
1. PDF uploaded → extract all text
2. Split text into chunks (500 words each)
3. User asks question
4. Find most relevant chunks
5. Send chunks + question to Claude
6. Claude answers using only that context

## Edge Cases
- What if PDF is scanned (no text)?
- What if question is unrelated to document?
- What if PDF is very large (100+ pages)?

## Success Criteria
- User uploads any PDF
- Asks a question
- Gets accurate answer with page reference
- Under 10 seconds response time

## API Endpoints
- POST /api/upload → accepts PDF, returns doc ID
- POST /api/ask → accepts question + doc ID, returns answer