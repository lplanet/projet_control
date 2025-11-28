import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUserTopArtists } from '../../api/spotify-me';
import { useRequireToken } from '../../hooks/useRequireToken';

export default function Dashboard() {
  const { token } = useRequireToken();
  const [topArtists, setTopArtists] = useState(null);
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
        // call API (adjust signature if your implementation differs)
        const res = await fetchUserTopArtists(token);
        if (cancelled) return;
        const data = res?.data ?? res;

        // debug: log the full payload and the first artist
        // eslint-disable-next-line no-console
        console.log('fetchUserTopArtists result:', data);
        // eslint-disable-next-line no-console
        console.log('first artist (if present):', data?.items?.[0] ?? null);

        if (!data) throw new Error('Empty response from fetchUserTopArtists');
        if (data.error) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));

        setTopArtists(data);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message ?? String(err));
        // eslint-disable-next-line no-console
        console.error('Error fetching top artists:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const top = topArtists?.items?.[0] ?? null;

  if (loading) return <div>Loading…</div>;
  if (error) return (
    <div role="alert">
      {error} {error.toLowerCase().includes('login') && <Link to="/login">Se connecter</Link>}
    </div>
  );

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      {!top ? (
        <div>
          <p>Aucun artiste trouvé pour le moment.</p>
          <p>Vérifiez la console pour la réponse brute (fetchUserTopArtists).</p>
        </div>
      ) : (
        <section className="dashboard-content" aria-labelledby="top-artist-title">
          <div className="card">
            <h2 id="top-artist-title">Artiste le plus écouté</h2>
            {top.images?.[0]?.url && (
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img src={top.images[0].url} alt={`${top.name} image`} style={{ width: 200, height: 'auto', borderRadius: 8 }} />
            )}
            <h3>{top.name}</h3>
            {Array.isArray(top.genres) && top.genres.length > 0 ? (
              <p>Genres: {top.genres.join(', ')}</p>
            ) : (
              <p>Genres: —</p>
            )}
            <p>Followers: {top.followers?.total ?? '—'}</p>
          </div>
        </section>
      )}

      <section style={{ marginTop: 16 }}>
        <h3>Raw response (console)</h3>
        <p>Les données complètes sont affichées dans la console pour vérification.</p>
      </section>
    </div>
  );
}