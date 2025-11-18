/* ES5 CommonJS sandbox for Spotify API playlist inspection. */
var dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const { fetchPlaylistById } = require("../src/api/spotify-playlists");

function encodeBasicAuth(clientId, clientSecret) {
  return Buffer.from(clientId + ":" + clientSecret, "utf8").toString("base64");
}

function generateAccessToken() {
  var clientId = process.env.SPOTIFY_CLIENT_ID;
  var clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return Promise.reject(
      new Error(
        "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env.local"
      )
    );
  }
  var base64AuthString = encodeBasicAuth(clientId, clientSecret);
  return fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + base64AuthString,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.error) {
        console.error("Error fetching access token:", data.error);
        throw new Error("Error fetching access token: " + (data.error.message || data.error));
      }
      return data.access_token;
    });
}

var playlistId = "2IgPkhcHbgQ4s4PdCxljAx";

generateAccessToken()
  .then((token) => {
    const arg = process.argv[2] || playlistId;
    const id = (arg || "").split("/playlist/").pop()?.split("?")[0] || arg;
    console.log("Using playlist id:", id);

    return fetchPlaylistById(token, id);
  })
  .then((res) => {
    if (!res) {
      console.error("fetchPlaylistById returned undefined or null:", res);
      return;
    }

    // Normalize response shapes
    const data = res.data ?? res;
    const tracks = data?.tracks?.items ?? data?.items ?? data;
    if (!tracks) {
      console.error("No tracks found in response. Inspect raw response:");
      console.error(JSON.stringify(res, null, 2));
      return;
    }

    console.log("Number of track items:", tracks.length);

    // Build artist counts
    const counts = Object.create(null);
    tracks.forEach((it) => {
      const t = it.track ?? it;
      const artists = Array.isArray(t?.artists) ? t.artists : [];
      artists.forEach((a) => {
        const name = a?.name ?? "Unknown Artist";
        counts[name] = (counts[name] || 0) + 1;
      });
    });

    // Convert to sorted array
    const sorted = Object.entries(counts)
      .map(([artist, count]) => ({ artist, count }))
      .sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist));

    // Print top 5
    console.log("\nTop 5 Artists:");
    console.log("┌─────────┬───────────────────┬──────────────────┐");
    console.log("│ (index) │ Artist            │ Number of Tracks │");
    console.log("├─────────┼───────────────────┼──────────────────┤");
    sorted.slice(0, 5).forEach((row, i) => {
      const name = `${row.artist}`.padEnd(17).slice(0, 17);
      const num = `${row.count}`.padEnd(16);
      console.log(`│ ${String(i).padEnd(6)}│ ${name} │ ${num}│`);
    });
    console.log("└─────────┴───────────────────┴──────────────────┘\n");

  })
  .catch((error) => {
    console.error("Error in Spotify API sandbox:", error);
  });
