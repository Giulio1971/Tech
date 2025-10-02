**Pseudocode Plan:**

1. Add the new RSS feed to the feeds array with a special identifier
2. Add a light red color definition for this feed
3. Modify the item processing to identify items from this special feed
4. Update the sorting logic to place items from this feed at the very top
5. Apply light red background to items from this feed

**Detailed Steps:**
- Add feed object with special flag 'isSpecial: true'
- Define light red color (#FFE4E4)
- In item mapping, add 'isSpecial' property based on feed
- In sorting: special items → priority items → televideo → normal
- In rendering, check for 'isSpecial' flag to apply light red background

```javascript
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
  { name: "RSU Ericsson", url: "https://politepol.com/fd/8In5MvNwmHzA.xml", isSpecial: true },
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
feeds.forEach(f => {
  if (f.isSpecial) {
    sourceColors[f.name] = "#FFE4E4"; // rosso chiaro per feed speciale
  } else {
    sourceColors[f.name] = "#C9E2F8"; // celeste chiaro default
  }
});

const container = document.getElementById("news");
const list = document.createElement("ul");
container.appendChild(list);

let allItems = [];

// --- Rendering notizie ---
function renderAllNews() {
  list.innerHTML = "";
  allItems.forEach(item => {
    const li = document.createElement("li");
    // Priorità colori: special > priority > source default
    if (item.isSpecial) {
      li.style.backgroundColor = "#FFE4E4"; // rosso chiaro
    } else if (item.priority) {
      li.style.backgroundColor = "#F8C9E2"; // rosa
    } else {
      li.style.backgroundColor = sourceColors[item.source] || "#C9E2F8";
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

            return {
              title: title || "Titolo mancante",
              link: item.link || "#",
              description: description || "",
              pubDate: pubDate,
              source: feed.name,
              priority: isPriority,
              isSpecial: feed.isSpecial || false
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

    // Solo ultime 24 ore
    const now = new Date();
    items = items.filter(n => (now - n.pubDate) <= 24 * 60 * 60 * 1000);

    // Split in speciali, prioritarie, televideo e normali
    const specialItems = items.filter(n => n.isSpecial);
    const priorityItems = items.filter(n => n.priority && !n.isSpecial);
    const televideoItems = items.filter(n => n.source === "Televideo RAI" && !n.priority && !n.isSpecial);
    const normalItems = items.filter(n => n.source !== "Televideo RAI" && !n.priority && !n.isSpecial);

    // Funzione per assegnare "peso" in base al gruppo testata
    function getSourceRank(source) {
      if (source === "Il Fatto Quotidiano") return 1;
      if (/Repubblica/i.test(source)) return 2;
      if (/Corriere/i.test(source)) return 3;
      if (/ANSA/i.test(source)) return 4;
      if (/TGCOM24/i.test(source)) return 5;
      return 6;
    }

    // Ordina tutti i gruppi per data
    specialItems.sort((a, b) => b.pubDate - a.pubDate);
    priorityItems.sort((a, b) => b.pubDate - a.pubDate);
    
    // Ordina le normali in base a rank e data
    normalItems.sort((a, b) => {
      const rankA = getSourceRank(a.source);
      const rankB = getSourceRank(b.source);
      if (rankA !== rankB) return rankA - rankB;
      return b.pubDate - a.pubDate;
    });

    // Ordina anche Televideo per data
    televideoItems.sort((a, b) => b.pubDate - a.pubDate);

    // Combina: speciali → prioritarie → televideo → normali
    allItems = [...specialItems, ...priorityItems, ...televideoItems, ...normalItems];

    renderAllNews();
  });
}

// Caricamento iniziale
loadNews();

// Refresh ogni 5 minuti
setInterval(loadNews, 300000);
```
