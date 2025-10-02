// Parole da escludere (case-insensitive)
const excludedWords = [
  "Oroscopo", "Basket", "Calcio", "Tennis",
  "Formula 1", "Nuoto", "partita","MotoGP", "campionato", "mondiali", 
  "Juventus", "Milan", "Inter", "Champions"
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
  { name: "Televideo RAI", url: "https://www.servizitelevideo.rai.it/televideo/pub/rss101.xml" },
  { name: "Ericsson RSU", url: "https://politepol.com/fd/8In5MvNwmHzA.xml" },
  { name: "Fistel", url: "https://politepol.com/fd/ag7rO151YT2D.xml" }
];

// Colore di default (celeste chiaro)
const sourceColors = {};
feeds.forEach(f => sourceColors[f.name] = "#C9E2F8");

// Colore giallo per i feed speciali
sourceColors["Ericsson RSU"] = "#FFF799";
sourceColors["Fistel"] = "#FFF799";

const container = document.getElementById("news");
const list = document.createElement("ul");
container.appendChild(list);

let allItems = [];

// --- Rendering notizie ---
function renderAllNews() {
  list.innerHTML = "";
  allItems.forEach(item => {
    const li = document.createElement("li");

    // Se notizia "speciale", sfondo giallo
    if (item.special) {
      li.style.backgroundColor = "#FFF799";
    } else {
      li.style.backgroundColor = item.priority ? "#F8C9E2" : (sourceColors[item.source] || "#C9E2F8");
    }

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

            // Esclusione parole
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

            const title = item.title || "";
            const description = item.description || "";

            // Verifica se è una notizia prioritaria
            let isPriority = false;
            for (const word of priorityWords) {
              if (new RegExp(word, "i").test(title) || new RegExp(word, "i").test(description)) {
                isPriority = true;
                break;
              }
            }

            // Verifica se è da feed speciale (Ericsson/Fistel) e non più vecchia di 7 giorni
            let isSpecial = false;
            if ((feed.name === "Ericsson RSU" || feed.name === "Fistel")) {
              const now = new Date();
              if ((now - pubDate) <= 7 * 24 * 60 * 60 * 1000) {
                isSpecial = true;
              }
            }

            return {
              title: title || "Titolo mancante",
              link: item.link || "#",
              description: description || "",
              pubDate: pubDate,
              source: feed.name,
              priority: isPriority,
              special: isSpecial
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

    // Solo ultime 24 ore (per gli altri feed)
    const now = new Date();
    items = items.filter(n => n.special || ((now - n.pubDate) <= 24 * 60 * 60 * 1000));

    // Split in gruppi
    const specialItems = items.filter(n => n.special);
    const priorityItems = items.filter(n => n.priority && !n.special);
    const televideoItems = items.filter(n => n.source === "Televideo RAI" && !n.priority && !n.special);
    const normalItems = items.filter(n => !n.priority && !n.special && n.source !== "Televideo RAI");

    // Funzione per assegnare "peso" in base al gruppo testata
    function getSourceRank(source) {
      if (source === "Il Fatto Quotidiano") return 1;
      if (/Repubblica/i.test(source)) return 2;
      if (/Corriere/i.test(source)) return 3;
      if (/ANSA/i.test(source)) return 4;
      if (/TGCOM24/i.test(source)) return 5;
      return 6;
    }

    // Ordina normali in base a rank e data
    normalItems.sort((a, b) => {
      const rankA = getSourceRank(a.source);
      const rankB = getSourceRank(b.source);
      if (rankA !== rankB) return rankA - rankB;
      return b.pubDate - a.pubDate;
    });

    // Ordina Televideo per data
    televideoItems.sort((a, b) => b.pubDate - a.pubDate);

    // Ordina speciali per data (decrescente)
    specialItems.sort((a, b) => b.pubDate - a.pubDate);

    // Combina: speciali → prioritarie → televideo → normali
    allItems = [...specialItems, ...priorityItems, ...televideoItems, ...normalItems];

    renderAllNews();
  });
}

// Caricamento iniziale
loadNews();

// Refresh ogni 5 minuti
setInterval(loadNews, 300000);
