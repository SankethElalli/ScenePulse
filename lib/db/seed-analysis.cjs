/**
 * Seeds demo Phase 2 enrichment data (audio + lyric analysis, discovery tags,
 * media gallery, links, and curated summaries) for the four demo artists.
 * No external providers or AI are used — this is hand-authored demo content so
 * the Artist Discovery UI is populated until Cyanite/Musixmatch keys arrive.
 *
 * Run from lib/db:  node ./seed-analysis.cjs
 */
const pg = require("pg");

const raw = process.env.SUPABASE_DB_URL;
if (!raw) {
  console.error("SUPABASE_DB_URL is not set");
  process.exit(1);
}
const re =
  /^(postgres(?:ql)?):\/\/([^:@/]+):(.*)@([^:/?@]+)(?::(\d+))?(?:\/([^?]*))?(?:\?(.*))?$/;
const m = raw.match(re);
const [, , user, pass, host, port, database] = m;
let uh = null;
try {
  uh = new URL(raw).hostname;
} catch {}
const cfg = {
  user: decodeURIComponent(user),
  password: uh !== host ? pass : decodeURIComponent(pass),
  host,
  port: port ? +port : 5432,
  database,
  ssl: { rejectUnauthorized: false },
};

const A = {
  neon: "a1111111-1111-1111-1111-111111111111",
  ananya: "a2222222-2222-2222-2222-222222222222",
  bass: "a3333333-3333-3333-3333-333333333333",
  filter: "a4444444-4444-4444-4444-444444444444",
};

const summaries = {
  [A.neon]:
    "Neon Tigers turn Bengaluru's indie circuit into a pressure cooker of distortion and singalong choruses. Their sound pairs wiry guitar riffs with anthemic, fist-in-the-air hooks built for sweaty club rooms and festival fields alike.",
  [A.ananya]:
    "Ananya Rao bridges Carnatic tradition and modern electronic production, weaving classical vocal runs through ambient, slow-building soundscapes. The result is meditative and cinematic — equal parts temple and after-hours studio.",
  [A.bass]:
    "Basswala builds dark, hypnotic dancefloor sets out of sub-heavy dubstep and bass music. Tightly engineered drops and rolling low end make for an intense, body-moving live experience.",
  [A.filter]:
    "The Filter Coffee serve up smooth, intimate jazz fusion — the kind of warm, conversational playing made for low-lit rooms. Improvisation-forward sets reward close listening without ever losing their easy groove.",
};

const audio = {
  [A.neon]: {
    energy: 0.86, danceability: 0.58, valence: 0.72, acousticness: 0.08,
    instrumentalness: 0.05, tempo: 148, loudness: -5.2, key: "E", mode: "major",
    genres: ["indie rock", "alternative"], moods: ["energetic", "euphoric", "raw"],
  },
  [A.ananya]: {
    energy: 0.42, danceability: 0.46, valence: 0.55, acousticness: 0.61,
    instrumentalness: 0.34, tempo: 96, loudness: -9.8, key: "D", mode: "minor",
    genres: ["fusion", "classical", "electronic"], moods: ["ethereal", "soulful", "meditative"],
  },
  [A.bass]: {
    energy: 0.91, danceability: 0.79, valence: 0.34, acousticness: 0.02,
    instrumentalness: 0.72, tempo: 140, loudness: -3.8, key: "F", mode: "minor",
    genres: ["electronic", "bass", "dubstep"], moods: ["dark", "hypnotic", "intense"],
  },
  [A.filter]: {
    energy: 0.38, danceability: 0.52, valence: 0.64, acousticness: 0.54,
    instrumentalness: 0.48, tempo: 104, loudness: -11.2, key: "B", mode: "major",
    genres: ["jazz", "fusion"], moods: ["smooth", "intimate", "warm"],
  },
};

const lyric = {
  [A.neon]: {
    themes: ["youth", "rebellion", "city nights"],
    keywords: ["run", "fire", "streets", "alive", "tonight"],
    sentiment: "positive", sentimentScore: 0.62, language: "en",
    summary: "Restless, defiant lyrics about youth and freedom set against a neon-lit cityscape.",
  },
  [A.ananya]: {
    themes: ["devotion", "nature", "longing"],
    keywords: ["river", "light", "breath", "home", "silence"],
    sentiment: "reflective", sentimentScore: 0.18, language: "mixed",
    summary: "Contemplative, spiritual verses in English and Kannada exploring devotion and belonging.",
  },
  [A.bass]: {
    themes: ["energy", "darkness", "movement"],
    keywords: ["drop", "pulse", "deep", "shadow", "rise"],
    sentiment: "neutral", sentimentScore: -0.05, language: "en",
    summary: "Sparse, percussive vocal hooks built to ride the drops rather than tell a story.",
  },
  [A.filter]: {
    themes: ["love", "nostalgia", "everyday life"],
    keywords: ["coffee", "rain", "slow", "stay", "morning"],
    sentiment: "positive", sentimentScore: 0.71, language: "en",
    summary: "Warm, wistful storytelling about small moments, love, and lazy mornings.",
  },
};

const media = {
  [A.neon]: [
    { url: "/seed/artist-neon-tigers.png", caption: "Live at The Humming Tree" },
    { url: "/seed/event-rock-night.png", caption: "Rock Night headline set" },
    {
      type: "video",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnailUrl: "/seed/artist-neon-tigers.png",
      caption: "Live performance (video)",
    },
  ],
  [A.ananya]: [
    { url: "/seed/artist-ananya.png", caption: "Studio session" },
    { url: "/seed/event-jazz-evening.png", caption: "Fusion evening" },
  ],
  [A.bass]: [
    { url: "/seed/artist-basswala.png", caption: "Bass Drop residency" },
    { url: "/seed/event-bass-drop.png", caption: "Warehouse set" },
  ],
  [A.filter]: [
    { url: "/seed/artist-filter-coffee.png", caption: "Intimate club gig" },
    { url: "/seed/event-jazz-evening.png", caption: "Late-night jazz" },
  ],
};

function linksFor(spotify, ig, yt, web) {
  const out = [];
  if (spotify) out.push({ type: "spotify", url: spotify, label: "Spotify" });
  if (ig) out.push({ type: "instagram", url: ig, label: "Instagram" });
  if (yt) out.push({ type: "youtube", url: yt, label: "YouTube" });
  if (web) out.push({ type: "website", url: web, label: "Website" });
  return out;
}

const links = {
  [A.neon]: linksFor("https://open.spotify.com", "https://instagram.com", "https://youtube.com", "https://example.com"),
  [A.ananya]: linksFor("https://open.spotify.com", "https://instagram.com", null, "https://example.com"),
  [A.bass]: linksFor("https://open.spotify.com", "https://instagram.com", "https://youtube.com", null),
  [A.filter]: linksFor("https://open.spotify.com", null, "https://youtube.com", "https://example.com"),
};

(async () => {
  const p = new pg.Pool(cfg);
  const c = await p.connect();
  try {
    await c.query("begin");
    const ids = Object.values(A);

    // Idempotent: clear demo-sourced rows for these artists first.
    for (const t of [
      "artist_audio_analysis",
      "artist_lyric_analysis",
      "artist_tags",
      "artist_links",
      "artist_media",
    ]) {
      await c.query(`delete from ${t} where artist_id = any($1::uuid[])`, [ids]);
    }

    for (const id of ids) {
      await c.query(
        `update artists set summary = $2 where id = $1`,
        [id, summaries[id]],
      );

      const a = audio[id];
      await c.query(
        `insert into artist_audio_analysis
         (artist_id, energy, danceability, valence, acousticness, instrumentalness, tempo, loudness, musical_key, mode, genres, moods, source)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'demo')`,
        [id, a.energy, a.danceability, a.valence, a.acousticness, a.instrumentalness, a.tempo, a.loudness, a.key, a.mode, a.genres, a.moods],
      );

      const l = lyric[id];
      await c.query(
        `insert into artist_lyric_analysis
         (artist_id, themes, keywords, sentiment, sentiment_score, language, summary, source)
         values ($1,$2,$3,$4,$5,$6,$7,'demo')`,
        [id, l.themes, l.keywords, l.sentiment, l.sentimentScore, l.language, l.summary],
      );

      // Tags from analysis: genres, moods, lyric themes.
      const tagRows = [
        ...a.genres.map((tag) => ({ tag, type: "genre" })),
        ...a.moods.map((tag) => ({ tag, type: "mood" })),
        ...l.themes.map((tag) => ({ tag, type: "theme" })),
      ];
      for (const { tag, type } of tagRows) {
        await c.query(
          `insert into artist_tags (artist_id, tag, type, source)
           values ($1,$2,$3,'demo')
           on conflict (artist_id, tag, type) do nothing`,
          [id, tag, type],
        );
      }

      let order = 0;
      for (const mItem of media[id]) {
        await c.query(
          `insert into artist_media (artist_id, type, url, thumbnail_url, caption, sort_order)
           values ($1,$2,$3,$4,$5,$6)`,
          [
            id,
            mItem.type ?? "image",
            mItem.url,
            mItem.thumbnailUrl ?? null,
            mItem.caption,
            order++,
          ],
        );
      }

      let lorder = 0;
      for (const lk of links[id]) {
        await c.query(
          `insert into artist_links (artist_id, type, url, label, sort_order)
           values ($1,$2,$3,$4,$5)`,
          [id, lk.type, lk.url, lk.label, lorder++],
        );
      }
    }

    await c.query("commit");
    console.log("Seed complete for", ids.length, "artists.");

    const counts = await c.query(
      `select
        (select count(*) from artist_audio_analysis) as audio,
        (select count(*) from artist_lyric_analysis) as lyric,
        (select count(*) from artist_tags) as tags,
        (select count(*) from artist_media) as media,
        (select count(*) from artist_links) as links`,
    );
    console.log("Counts:", counts.rows[0]);
  } catch (e) {
    await c.query("rollback");
    console.error("SEED FAILED:", e.message);
    process.exitCode = 1;
  } finally {
    c.release();
    await p.end();
  }
})();
