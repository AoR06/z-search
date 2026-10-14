import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: "duckduckgo" | "wikipedia" | "github" | "reddit" | "google" | "youtube";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q");

  if (!rawQuery) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  const query = rawQuery.trim();

  try {
    // 1. DuckDuckGo API
    const ddgPromise = axios.get("https://api.duckduckgo.com/", {
      params: { q: query, format: "json", no_html: 1, skip_disambig: 1 },
      timeout: 4000,
    });

    // 2. Wikipedia API
    const wikiPromise = axios.get("https://en.wikipedia.org/w/api.php", {
      params: { action: "query", list: "search", srsearch: query, format: "json", origin: "*" },
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      timeout: 4000,
    });

    // 3. GitHub Search API
    const githubPromise = axios.get("https://api.github.com/search/repositories", {
      params: { q: query, per_page: 3 },
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      timeout: 4000,
    });

    // 4. Reddit Public Search API
    const redditPromise = axios.get("https://www.reddit.com/search.json", {
      params: { q: query, limit: 4 },
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      timeout: 4000,
    });

    // 5. Google Suggestions
    const googlePromise = axios.get("https://suggestqueries.google.com/complete/search", {
      params: { client: "firefox", q: query },
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      timeout: 4000,
    });

    // 6. YouTube HTML Search Fetcher
    const youtubePromise = axios.get(`https://www.youtube.com/results`, {
      params: { search_query: query },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 5000,
    });

    const [ddgRes, wikiRes, ghRes, redRes, googRes, ytRes] = await Promise.allSettled([
      ddgPromise,
      wikiPromise,
      githubPromise,
      redditPromise,
      googlePromise,
      youtubePromise,
    ]);

    const results: SearchResultItem[] = [];

    // DuckDuckGo
    if (ddgRes.status === "fulfilled" && ddgRes.value.data) {
      const data = ddgRes.value.data;
      if (data.AbstractText && data.AbstractURL) {
        results.push({
          id: "ddg-main",
          title: data.Heading || query,
          snippet: data.AbstractText,
          url: data.AbstractURL,
          source: "duckduckgo",
        });
      }
      if (Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.slice(0, 3).forEach((topic: any, idx: number) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              id: `ddg-rel-${idx}`,
              title: topic.Text.split(" - ")[0] || "Related Result",
              snippet: topic.Text,
              url: topic.FirstURL,
              source: "duckduckgo",
            });
          }
        });
      }
    }

    // Wikipedia
    if (wikiRes.status === "fulfilled" && wikiRes.value.data?.query?.search) {
      wikiRes.value.data.query.search.slice(0, 4).forEach((item: any) => {
        results.push({
          id: `wiki-${item.pageid}`,
          title: item.title,
          snippet: item.snippet.replace(/<[^>]*>?/gm, ""),
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
          source: "wikipedia",
        });
      });
    }

    // GitHub
    if (ghRes.status === "fulfilled" && ghRes.value.data?.items) {
      ghRes.value.data.items.forEach((repo: any) => {
        results.push({
          id: `gh-${repo.id}`,
          title: `${repo.full_name} (★ ${repo.stargazers_count})`,
          snippet: repo.description || "No description provided.",
          url: repo.html_url,
          source: "github",
        });
      });
    }

    // Reddit
    if (redRes.status === "fulfilled" && redRes.value.data?.data?.children) {
      redRes.value.data.data.children.forEach((post: any, idx: number) => {
        const p = post.data;
        results.push({
          id: `reddit-${p.id || idx}`,
          title: `r/${p.subreddit}: ${p.title}`,
          snippet: p.selftext ? p.selftext.slice(0, 160) + "..." : `Upvotes: ${p.score} | Comments: ${p.num_comments}`,
          url: `https://reddit.com${p.permalink}`,
          source: "reddit",
        });
      });
    }

    // Google
    if (googRes.status === "fulfilled" && Array.isArray(googRes.value.data?.[1])) {
      const suggestions: string[] = googRes.value.data[1];
      suggestions.slice(0, 4).forEach((item, idx) => {
        results.push({
          id: `google-${idx}`,
          title: item,
          snippet: `Google Search result for "${item}"`,
          url: `https://www.google.com/search?q=${encodeURIComponent(item)}`,
          source: "google",
        });
      });
    }

    // YouTube Parser
    if (ytRes.status === "fulfilled" && typeof ytRes.value.data === "string") {
      const html = ytRes.value.data;
      const matches = [...html.matchAll(/"videoRenderer":\{"videoId":"([^"]+)","thumbnail":.*?,"title":\{"runs":\[\{"text":"([^"]+)"\}/g)];

      if (matches.length > 0) {
        matches.slice(0, 5).forEach((match, idx) => {
          const videoId = match[1];
          const title = match[2];
          results.push({
            id: `yt-${videoId}-${idx}`,
            title: title,
            snippet: `Watch "${title}" on YouTube`,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            source: "youtube",
          });
        });
      } else {
        // Fallback search link if regex extraction gets rate limited
        results.push({
          id: `yt-fallback-0`,
          title: `YouTube Search: ${query}`,
          snippet: `View all video results directly on YouTube for "${query}"`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
          source: "youtube",
        });
      }
    }

    return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Search fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch search results" }, { status: 500 });
  }
}