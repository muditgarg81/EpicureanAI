async function testMealDB() {
  try {
    console.log("Fetching TheMealDB search for 'chicken'...");
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=chicken');
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("JSON response count:", json.meals ? json.meals.length : "No meals");
    if (json.meals && json.meals.length > 0) {
      console.log("Sample:", json.meals[0].strMeal);
    }
  } catch (err) {
    console.error("Error fetching TheMealDB:", err);
  }
}

testMealDB();
