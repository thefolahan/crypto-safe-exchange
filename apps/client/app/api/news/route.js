export const revalidate = 300;

function stripCdata(s = "") {
    return s.replace("<![CDATA[", "").replace("]]>", "").trim();
}

function pickTag(block, tag) {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    const m = block.match(re);
    return m ? stripCdata(m[1]) : "";
}

function decodeHtml(s = "") {
    return s
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", '"')
        .replaceAll("&#39;", "'");
}

function parseRss(xml = "") {
    const items = [];
    const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
    for (const block of itemBlocks) {
        const title = decodeHtml(pickTag(block, "title"));
        const link = pickTag(block, "link");
        const pubDate = pickTag(block, "pubDate") || pickTag(block, "published") || pickTag(block, "updated");
        const description =
            decodeHtml(pickTag(block, "description")) ||
            decodeHtml(pickTag(block, "content:encoded")) ||
            decodeHtml(pickTag(block, "summary"));

        items.push({
            title: title.trim(),
            link: link.trim(),
            pubDate: pubDate.trim(),
            description: description
                .replace(/<[^>]*>/g, " ")
                .replace(/\s+/g, " ")
                .trim(),
        });
    }
    return items;
}

function toTime(pubDate) {
    const t = Date.parse(pubDate || "");
    return Number.isFinite(t) ? t : 0;
}

async function fetchRss(url) {
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; NewsCarousel/1.0)",
            Accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7",
        },
        cache: "force-cache",
        next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`RSS fetch failed: ${url} (${res.status})`);
    return res.text();
}

export async function GET() {
    const feeds = [
        { topic: "crypto", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
        { topic: "forex", url: "https://www.forexlive.com/feed/news/" },
    ];

    try {
        const xmls = await Promise.all(feeds.map((f) => fetchRss(f.url)));

        const merged = xmls
            .flatMap((xml, i) => {
                const topic = feeds[i].topic;
                return parseRss(xml).map((x) => ({ ...x, topic }));
            })
            .filter((x) => x.title && x.link)
            .sort((a, b) => toTime(b.pubDate) - toTime(a.pubDate));

        const top5 = merged.slice(0, 5).map((x) => ({
            title: x.title,
            link: x.link,
            topic: x.topic,
            pubDate: x.pubDate,
            description: x.description?.slice(0, 220) || "",
        }));

        return Response.json({ items: top5 });
    } catch (e) {
        return Response.json(
            { items: [], error: "Failed to load news right now." },
            { status: 200 }
        );
    }
}
