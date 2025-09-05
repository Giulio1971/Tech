// Parole da escludere
const excludedWords = [
  "Oroscopo", "Basket", "Calcio", "Pielle",
  "Libertas", "Serie C", "partita",
  "Piombino", "Cecina", "Capraia", "lirica"
];

// Feed RSS
const feeds = [
  { name: "Il Fatto Quotidiano", url: "https://www.ilfattoquotidiano.it/rss/" },
  { name: "Fanpage", url: "https://www.fanpage.it/feed/" },
  { name: "Corriere Politica", url: "https://www.corriere.it/rss/politica.xml" },
  { name: "Corriere Cronaca", url: "https://www.corriere.it/rss/cronache.xml" },
  { name: "Corriere Economia", url: "https://www.corriere.it/rss/economia.xml" },
  { name: "Corriere Tecnologia", url: "https://www.corriere.it/rss/tecnologia.xml" },
  { name: "Repubblica Notizie", url: "https://www.repubblica.it/rss/homepage/rss2.0.xml" },
  { name: "Repubblica Politica", url: "https://www.repubblica.it/rss/politica/rss2.0.xml" },
  { name: "Repubblica Economia", url: "https://www.repubblica.it/rss/economia/rss2.0.xml" },
  { name: "Repubblica Tecnologia", url: "https://www.repubblica.it/rss/tecnologia/rss2.0.xml" },
  { name: "La Stampa", url: "https://www.lastampa.it/rss/ultimora.xml" },
  { name: "Il Sole 24 Ore", url: "https://www.ilsole24ore.com/rss/italia.xml" },
  { name: "ANSA Cronaca", url: "https://www.ansa.it/sito/ansait_rss.xml" },
  { name: "ANSA Politica", url: "https://www.ansa.it/sito/ansait_rss.xml/politica.xml" },
  { name: "TGCOM24 Cronaca", url: "https://www.tgcom24.mediaset.it/rss/cronaca.xml" },
  { name: "TGCOM24 Politica", url: "https://www.tgcom24.mediaset.it/rss/politica.xml" },
  { name: "Wired Italia", url: "https://www.wired.it/feed/" }
];

// Contenitore
const container = document.getElementById("news");
if (!container) {
  console.error("Elemento #news non trovato nell'HTML");
}

let allFeedsData = [];

// Rendering a blocchi per feed
function renderFeeds() {
  container.innerHTML = "";
  if (allFeedsData.length === 0) {
    container.innerHTML = "<p>Nessuna notizia disponibile.</p>";
    return;
  }

  allFeedsData.forEach(feedData => {
    const block = document.createElement("div");
    block.className = "feed-block";

    const title = document.createElement("div");
    title.className = "feed-title";
    title.textContent = feedData.name;
    block.appendChild(title);

    const ul = document.createElement("ul");

    feedData.items.forEach(item => {
      const li = document.createElement("li");

      const description = item.description || "";
      const safeDescription = description.replace(/(<([^>]+)>)/gi, "");
      const shortDesc = safeDescription.length > 300
        ? safeDescription.substring(0, 300) + "..."
        : safeDescription;

      li.innerHTML = `
        <a href="${item.link}" target="_blank" class="news-title">${item.title}</a>
        <div class="news-desc">${shortDesc}</div>
        <div class="news-source">${item.source}</div>
      `;

      ul.appendChild(li);
    });

    block.appendChild(ul);
    container.appendChild(block);
  });
}

// Caricamento
function loadNews() {
  Promise.all(
    feeds.map(feed => {
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
      return fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
          if (!data.items) return { name: feed.name, items: [] };

          const now = new Date();
          const filteredItems = data.items
            .filter(item => {
              const title = item.title || "";
              const description = item.description || "";
              return !excludedWords.some(word =>
                new RegExp(word, "i").test(title) || new RegExp(word, "i").test(description)
              );
            })
            .map(item => {
              const pubDate = new Date(item.pubDate || Date.now());
              pubDate.setHours(pubDate.getHours() - 2);
              return {
                title: item.title || "Titolo mancante",
                link: item.link || "#",
                description: item.description || "",
                pubDate: pubDate,
                source: feed.name
              };
            })
            .filter(n => (now - n.pubDate) <= 24 * 60 * 60 * 1000)
            .sort((a, b) => b.pubDate - a.pubDate); // Ordina per data nel feed

          return { name: feed.name, items: filteredItems };
        })
        .catch
