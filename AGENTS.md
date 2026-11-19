# Bounty3L news-image-20261119 workspace agent rules

- The entry is main.ts (Node 22, standard library only): it validates entry.png and writes it to /output/entry.png ($MAKEFUN_OUTPUT_DIR/entry.png outside the grader's sandbox).
- Rules live in /tmp/news-image-20261119-kit/RULES.txt; the entry gate is a whole PNG or JPEG, at most 1 MiB and 1024x1024 pixels.
- The program must run twice writing identical bytes, with no network access.
- Never commit secrets; keep out/ ignored.
