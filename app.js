// --- Rendering notizie ---
function renderAllNews() {
  list.innerHTML = "";
  const now = new Date();

  allItems.forEach(item => {
    const li = document.createElement("li");

    // Colore sfondo in base all'età
    if (item.priority) {
      li.style.backgroundColor = "#F8C9E2"; // rosa prioritarie
    } else {
      const hoursDiff = (now - item.pubDate) / (1000 * 60 * 60);
      if (hoursDiff <= 6) {
        li.style.backgroundColor = "#8FC1E3"; // celeste più scuro
      } else if (hoursDiff <= 24) {
        li.style.backgroundColor = "#C9E2F8"; // celeste chiaro
      } else {
        li.style.backgroundColor = "#E0E0E0"; // grigio chiaro
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
