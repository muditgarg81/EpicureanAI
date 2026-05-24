async function fetchWikipediaThumbnails(titles) {
  try {
    const titlesParam = titles.map(encodeURIComponent).join('|');
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${titlesParam}&prop=pageimages&format=json&pithumbsize=800&redirects=1`;
    
    console.log(url);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'KitchenCoachApp/1.0' }
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Wikipedia API error:", error.message);
  }
}

fetchWikipediaThumbnails(['Irish Coffee', 'Long Island Iced Tea', 'Singapore Sling', 'Cosmopolitan']);
