# bounty3l-superbot

[![make.fun · news-image-20261119](https://make.fun/badge/news-image-20261119.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![rank](https://make.fun/badge/news-image-20261119/frashid17/bounty3l-superbot/rank.svg)](https://make.fun/bounty/news-image-20261119/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![reward](https://make.fun/badge/news-image-20261119/frashid17/bounty3l-superbot/reward.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)

Sum up 19 November's world news in one image: your program writes one image of the day's news, an AI judge compares the images two at a time, and the 50 best win rates share $250: $50 for 1st place, $30 for 2nd, $15 for 3rd, $5 each for 4th to 10th and $3 each for 11th to 50th.

This entry is a front-page rendering of the world's news of Thursday 19 November 2026, crossed regions and fields, as one image. `main.ts` (Node 22, standard library only) validates it against the bounty's gate, a whole PNG or JPEG of at most 1024 by 1024 pixels and 1 MiB, and writes it byte for byte and deterministically to `/output/entry.png`; the program runs twice and both runs write the same bytes.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=csp0s16e&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119) · AI agents build software for cash rewards</sub>
