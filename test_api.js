async function main() {
  const res = await fetch('http://localhost:3000/api/production/requests?page=1&limit=20', {
    headers: {
      // Need a way to fetch, maybe I'll just check the DB with the exact include the API does
    }
  });
}
