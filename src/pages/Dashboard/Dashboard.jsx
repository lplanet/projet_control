import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUserTopArtists, fetchUserTopTracks } from '../../api/spotify-me';
import { useRequireToken } from '../../hooks/useRequireToken';

export default function Dashboard() {
  const { token } = useRequireToken();
  const [topArtists, setTopArtists] = useState(null);
  const [topTracks, setTopTracks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Missing access token. Please login.');
      return;
    }

    let cancelled = false;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        // fetch artists + tracks in parallel
        const [artistsRes, tracksRes] = await Promise.all([
          fetchUserTopArtists(token),
          fetchUserTopTracks(token)
        ]);

        if (cancelled) return;

        const artistsData = artistsRes?.data ?? artistsRes;
        const tracksData = tracksRes?.data ?? tracksRes;

        // debug logs: full payloads and first items
        // eslint-disable-next-line no-console
        console.log('fetchUserTopArtists result:', artistsData);
        // eslint-disable-next-line no-console
        console.log('first artist (if present):', artistsData?.items?.[0] ?? null);
        // eslint-disable-next-line no-console
        console.log('fetchUserTopTracks result:', tracksData);
        // eslint-disable-next-line no-console
        console.log('first track (if present):', tracksData?.items?.[0] ?? null);

        if (!artistsData) throw new Error('Empty response from fetchUserTopArtists');
        if (!tracksData) throw new Error('Empty response from fetchUserTopTracks');

        if (artistsData.error) throw new Error(typeof artistsData.error === 'string' ? artistsData.error : JSON.stringify(artistsData.error));
        if (tracksData.error) throw new Error(typeof tracksData.error === 'string' ? tracksData.error : JSON.stringify(tracksData.error));

        setTopArtists(artistsData);
        setTopTracks(tracksData);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message ?? String(err));
        // eslint-disable-next-line no-console
        console.error('Error fetching dashboard data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const topArtist = topArtists?.items?.[0] ?? null;
  const topTrack = topTracks?.items?.[0] ?? null;

  if (loading) return <div>Loading…</div>;
  if (error) return (
    <div role="alert">
      {error} {error?.toLowerCase().includes('login') && <Link to="/login">Se connecter</Link>}
    </div>
  );

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <section className="dashboard-content" aria-labelledby="top-artist-title">
        <div className="card">
          <h2 id="top-artist-title">Artiste le plus écouté</h2>
          {!topArtist ? (
            <p>Aucun artiste trouvé.</p>
          ) : (
            <>
              {topArtist.images?.[0]?.url && (
                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                <img src={topArtist.images[0].url} alt={`${topArtist.name} image`} style={{ width: 200, height: 'auto', borderRadius: 8 }} />
              )}
              <h3>{topArtist.name}</h3>
              {Array.isArray(topArtist.genres) && topArtist.genres.length > 0 ? (
                <p>Genres: {topArtist.genres.join(', ')}</p>
              ) : (
                <p>Genres: —</p>
              )}
              <p>Followers: {topArtist.followers?.total ?? '—'}</p>
            </>
          )}
        </div>

        <div className="card">
          <h2 id="top-track-title">Titre le plus écouté</h2>
          {!topTrack ? (
            <p>Aucun titre trouvé.</p>
          ) : (
            <>
              {topTrack.album?.images?.[0]?.url && (
                <img src={topTrack.album.images[0].url} alt={`${topTrack.name} cover`} style={{ width: 200, height: 'auto', borderRadius: 8 }} />
              )}
              <h3>{topTrack.name}</h3>
              <p>
                Artiste(s): {Array.isArray(topTrack.artists) ? topTrack.artists.map(a => a.name).join(', ') : '—'}
              </p>
              <p>Album: {topTrack.album?.name ?? '—'}</p>
            </>
          )}
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>Raw response (console)</h3>
        <p>Les données complètes sont affichées dans la console (fetchUserTopArtists / fetchUserTopTracks).</p>
      </section>
    </div>
  );
}