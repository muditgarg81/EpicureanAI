const dishName = "Dal Tadka";
const searchName = dishName.replace(/\([^)]*\)/g, '').trim();

async function run() {
  const wpRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchName)}&utf8=&format=json&origin=*`);
  const wpData = await wpRes.json();
  if (wpData.query?.search?.length > 0) {
    const bestTitle = wpData.query.search[0].title;
    console.log("Best Wikipedia Title:", bestTitle);
    
    const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(bestTitle)}&origin=*`);
    const imgData = await imgRes.json();
    const pages = Object.values(imgData.query.pages);
    if (pages.length > 0 && pages[0].original?.source) {
      console.log("Image URL:", pages[0].original.source);
    } else {
      console.log("No image found on page");
    }
  } else {
    console.log("No wikipedia search results.");
  }
}
run();
