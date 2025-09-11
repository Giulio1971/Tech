<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notizie</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 20px; }
    ul { list-style: none; padding: 0; }
    li { margin-bottom: 10px; padding: 10px; border-radius: 6px; }
    .news-title { font-weight: bold; text-decoration: none; color: #333; }
    .news-title:hover { text-decoration: underline; }
    .news-desc { margin: 5px 0; color: #555; }
    .news-source { font-size: 0.85em; color: #666; }
  </style>
</head>
<body>
  <h1>Ultime Notizie</h1>
  <div id="news"></div>

  <script>
    // --- Parole da escludere ---
    const excludedWords = [
      "Oroscopo", "Basket", "Calcio", "Tennis",
      "Formula 1", "Nuoto", "partita"
    ];

    // --- Parole prioritarie ---
    const priorityWords = [
      "Livorno", "Pisa", "Lucca", "Versilia",
      "Viareggio", "Firenze", "Toscana"
    ];

    // --- Lista feed RSS ---
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

    // --- Colori per brand ---
    const sourceColors = {
      // Corriere
      "Corriere Politica": "#ADCBE8",
      "Corriere Cronaca": "#ADCBE8",
      "Corriere Economia": "#ADCBE8",
      "Corriere Tecnologia": "#ADCBE8",

      // Repubblica
      "Repubblica Notizie": "#B0E0FA",
      "Repubblica Politica": "#B0E0FA",
      "Repubblica Economia": "#B0E0FA",
      "Repubblica Tecnologia": "#B0E0FA",

      // ANSA
      "ANSA Cronaca": "#C1E1F9",
      "ANSA Politica": "#C1E1F9",

      // TGCOM24
      "TGCOM24 Cronaca": "#D6E8F9",
      "TGCOM24 Politica": "#D6E8F9",

      // Altre testate singole
      "Il Fatto Quotidiano": "#E1EFFC",
      "Fanpage": "#B6D9F5",
      "La Stampa": "#D3EAFB",
      "Il Sole 24 Ore": "#BDE2EF",
      "Wired Italia": "#C9E2F8",
      "Televideo RAI": "#C8E1FA"
    };

    const container = document.getElementById("news");
    const list = document.createElement("ul");
    container.appendChild(list);

    let allItems = [];

    // --- Rendering notizie ---
    function renderAllNews() {
      list.innerHTML = "";
      allItems.forEach(item => {
        const li = document.createElement("li");
        li.style.backgroundColor = item.priority ? "#F8C9E2" : (sourceColors[item.source] || "#C9E2F8");

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
                pubDate.setHours(pubDate.getHours() - 2); // fuso orario

                const title = item.title || "";
                const description = item.description || "";

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

        const now = new Date();
        items = items.filter(n => (now - n.pubDate) <= 24 * 60 * 60 * 1000);

        const priorityItems = items.filter(n => n.priority);
        const televideoItems = items.filter(n => n.source === "Televideo RAI" && !n.priority);
        const normalItems = items.filter(n => n.source !== "Televideo RAI" && !n.priority);

        function getSourceRank(source) {
          if (source === "Il Fatto Quotidiano") return 1;
          if (/Repubblica/i.test(source)) return 2;
          if (/Corriere/i.test(source)) return 3;
          if (/ANSA/i.test(source)) return 4;
          if (/TGCOM24/i.test(source)) return 5;
          return 6;
        }

        normalItems.sort((a, b) => {
          const rankA = getSourceRank(a.source);
          const rankB = getSourceRank(b.source);
          if (rankA !== rankB) return rankA - rankB;
          return b.pubDate - a.pubDate;
        });

        televideoItems.sort((a, b) => b.pubDate - a.pubDate);

        allItems = [...priorityItems, ...televideoItems, ...normalItems];

        renderAllNews();
      });
    }

    loadNews();
    setInterval(loadNews, 300000); // refresh ogni 5 minuti
  </script>
</body>
</html>
