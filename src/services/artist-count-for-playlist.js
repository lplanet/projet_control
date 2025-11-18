/**
 * Récupère une playlist via fetchPlaylistById et compte les occurrences de chaque artiste.
 *
 * @param {string} token - Token d'accès Spotify
 * @param {string} playlistId - ID de la playlist
 * @returns {Promise<Object>} - Objet { "Artist Name": count, ... }
 */
export default async function artistCountForPlaylist(token, playlistId) {
  let fetchPlaylistById;

  // try common service module names where fetchPlaylistById might be exported
  const tryImport = async (path) => {
    try {
      // dynamic import so l'outil de build / test résout correctement
      const mod = await import(path);
      return mod.fetchPlaylistById ?? mod.default?.fetchPlaylistById ?? mod.fetchPlaylistById;
    } catch (err) {
      return undefined;
    }
  };

  fetchPlaylistById = await tryImport('./spotifyApi');
  if (!fetchPlaylistById) fetchPlaylistById = await tryImport('./spotify');
  if (!fetchPlaylistById) fetchPlaylistById = await tryImport('./api');

  if (!fetchPlaylistById) {
    throw new Error('fetchPlaylistById not found. Vérifie l\'export dans les services (spotifyApi/spotify/api).');
  }

  const res = await fetchPlaylistById(token, playlistId);

  // normalize to array of track items
  const items = (res && (res.data?.tracks?.items ?? res.items ?? res.tracks?.items)) || [];

  const counts = {};

  for (const item of items) {
    // Spotify playlist track item shape : { track: { artists: [ { name } ] } }
    const track = item?.track ?? item;
    const artists = Array.isArray(track?.artists) ? track.artists : [];

    for (const artist of artists) {
      const name = artist?.name ?? 'Unknown Artist';
      counts[name] = (counts[name] || 0) + 1;
    }
  }

  return counts;
}