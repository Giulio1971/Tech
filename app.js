// Parole da escludere (case-insensitive)
const excludedWords = [
  "Oroscopo", "Basket", "Calcio", "Tennis",
  "Formula 1", "Nuoto", "partita"
];

// Parole da evidenziare e portare in cima (case-insensitive)
const priorityWords = [
  "Livorno", "Pisa", "Lucca", "Versilia",
  "Viareggio", "Firenze", "Toscana"
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
  { name: "Wired Italia", url: "https://www.wired.it/feed/" },
  { name: "Televideo RAI", url: "https://www.servizitelevideo.rai.it/televideo/pub/rss101.xml" }
];

// Colore di default (celeste chiaro)
const sourceColors = {};
feeds.forEach(f => sourceColors[f.name] = "#C9E2F8");

const container = document.getElementById("news");
const list = document.createElement("ul");
container.appendChild(list);

let allItems = [];

// --- Rendering notizie ---
function renderAllNews() {
  list.innerHTML = "";
  const now = new Date();

  allItems.forEach(item => {
    const li = document.createElement("li");

    // Colore sfondo
    if (item.priority) {
      li.style.backgroundColor = "#F8C9E2"; // rosa prioritarie
    } else {
      const hoursDiff = (now - item.pubDate) / (1000 * 60 * 60);
      if (hoursDiff <= 24) {
        li.style.backgroundColor = "#C9E2F8"; // celeste ultime 24h
      } else {
        li.style.backgroundColor = "#E0E0E0"; // grigio chiaro 24-48h
      }
    }

    const description = item.description || "";
    const safeDescription = description.replace(/(<([^>]+)>)/gi, "");
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
            pubDate.setHours(pubDate.getHours() - 2);

            const title = item.title || "";
            const description = item.description || "";

            // Prioritarie
            let isPriority = false;
            for (const word of priorityWords) {
              if (new RegExp(word, "i").test(title) || new RegExp(word, "i").test(description)) {
                isPriority = true;
                break;
              }
            }

            return {
              title: title || "Titolo mancante",
              link: item.link || "#",
              description: description || "",
              pubDate: pubDate,
              source: feed.name,
              priority: isPriority
            };
          })
        )
        .catch(err => {
          console.error("Errore nel caricare", feed.name, err);
          return [];
        });
    })
  ).then(results => {
    let items = results.flat();

    // Solo ultime 48 ore
    const now = new Date();
    items = items.filter(n => (now - n.pubDate) <= 48 * 60 * 60 * 1000);

    // Split in prioritarie, televideo e normali
    const priorityItems = items.filter(n => n.priority);
    const televideoItems = items.filter(n => n.source === "Televideo RAI" && !n.priority);
    const normalItems = items.filter(n => n.source !== "Televideo RAI" && !n.priority);

    // Funzione per assegnare "peso" in base al gruppo testata
    function getSourceRank(source) {
      if (source === "Il Fatto Quotidiano") return 1;
      if (/Repubblica/i.test(source)) return 2;
      if (/Corriere/i.test(source)) return 3;
      if (/ANSA/i.test(source)) return 4;
      if (/TGCOM24/i.test(source)) return 5;
      return 6;
    }

    // Ordina le normali in base a rank e data
    normalItems.sort((a, b) => {
      const rankA = getSourceRank(a.source);
      const rankB = getSourceRank(b.source);
      if (rankA !== rankB) return rankA - rankB;
      return b.pubDate - a.pubDate;
    });

    // Ordina anche Televideo per data
    televideoItems.sort((a, b) => b.pubDate - a.pubDate);

    // Combina: prioritarie → televideo → normali
    allItems = [...priorityItems, ...televideoItems, ...normalItems];

    renderAllNews();
  });
}

// Caricamento iniziale
loadNews();

// Refresh ogni 5 minuti
setInterval(loadNews, 300000);
