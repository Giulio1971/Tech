// Parole da escludere (case-insensitive)
const excludedWords = [
  "Oroscopo", "Basket", "Calcio", "Pielle",
  "Libertas", "Serie C", "partita",
  "Piombino", "Cecina", "Capraia", "lirica"
];

// Lista completa dei feed RSS
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

// Colore unico celeste chiaro per tutti
const sourceColors = {};
feeds.forEach(f => sourceColors[f.name] = "#C9E2F8");

const container = document.getElementById("news");
const list = document.createElement("ul");
container.appendChild(list);

let allItems = [];

// --- Rendering notizie ---
function renderAllNews() {
  list.innerHTML = "";
  allItems.forEach(item => {
    const li = document.createElement("li");
    li.style.backgroundColor = sourceColors[item.source] || "#C9E2F8";

    const description = item.description || "";
    const safeDescription = description.replace(/(<([^>]+)>)/gi, ""); // rimuove HTML
    const shortDesc = safeDescription.length > 300 ? safeDescription.substring(0, 300) + "..." : safeDescription;

    li.innerHTML = `
      <a href="${item.link}" target="_blank" class="news-title">${item.title}</a>
      <div class="news-desc">${shortDesc}</div>
      <div class="news-source">${item.source}</div>
    `;

    list.appendChild(li);
  });
}

// --- Caricamento notizie ---
function loadNews() {
  Promise.all(
    feeds.map(feed => {
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
      return fetch(apiUrl)
        .then(res => res.json())
        .then(data => data.items
          .filter(item => {
            const title = item.title || "";
            const description = item.description || "";

            for (const word of excludedWords) {
              if (new RegExp(word, "i").test(title) || new RegExp(word, "i").test(description)) {
                return false;
              }
            }
            return true;
          })
          .map(item => {
            const pubDate = new Date(item.pubDate || Date.now());
            pubDate.setHours(pubDate.getHours() - 2); // fuso orario

            return {
              title: item.title || "Titolo mancante",
              link: item.link || "#",
              description: item.description || "",
              pubDate: pubDate,
              source: feed.name
            };
          })
        )
        .catch(err => {
          console.error("Errore nel caricare", feed.name, err);
          return [];
        });
    })
  ).then(results => {
    allItems = results.flat();

    // Solo ultime 24 ore
    const now = new Date();
    allItems = allItems.filter(n => (now - n.pubDate) <= 24 * 60 * 60 * 1000);

    // Ordinamento per data decrescente
    allItems.sort((a, b) => b.pubDate - a.pubDate);

    renderAllNews();
  });
}

// Caricamento iniziale
loadNews();

// Refresh ogni 5 minuti
setInterval(loadNews, 300000);
