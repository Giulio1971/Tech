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

// Colore uniforme
const sourceColors = {};
feeds.forEach(f => sourceColors[f.name] = "#C9E2F8");

// Contenitore
const container = document.getElementById("news");
if (!container) {
  console.error("Elemento #news non trovato nell'HTML");
}

const list = document.createElement("ul");
container.appendChild(list);

let allItems = [];

// Rendering
function renderAllNews() {
  list.innerHTML = "";
  if (allItems.length === 0) {
    list.innerHTML = "<li>Nessuna notizia disponibile.</li>";
    return;
  }

  allItems.forEach(item => {
    const li = document.createElement("li");
    li.style.backgroundColor = sourceColors[item.source] || "#C9E2F8";

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

    list.appendChild(li);
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
          if (!data.items) return [];
          // Filtra e ordina per data all'interno del feed
          return data.items
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
            .filter(n => {
              // Solo ultime 24 ore
              const now = new Date();
              return (now - n.pubDate) <= 24 * 60 * 60 * 1000;
            })
            .sort((a, b) => b.pubDate - a.pubDate); // Ordina per data decrescente nel feed
        })
        .catch(err => {
          console.error("Errore nel caricare", feed.name, err);
          return [];
        });
    })
  ).then(results => {
    // results è un array di array, già nell'ordine dei feed
    allItems = results.flat();
    renderAllNews();
  });
}

// Avvio
loadNews();
setInterval(loadNews, 300000);
