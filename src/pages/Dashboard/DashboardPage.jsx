import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUserTopArtists, fetchUserTopTracks } from '../../api/spotify-me.js';
import { useRequireToken } from '../../hooks/useRequireToken.js';
import SimpleCard from '../../components/SimpleCard/SimpleCard.jsx';
import './DashboardPage.css';

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
        const [artistsRes, tracksRes] = await Promise.all([
          fetchUserTopArtists(token),
          fetchUserTopTracks(token)
        ]);

        if (cancelled) return;

        const artistsData = artistsRes?.data ?? artistsRes;
        const tracksData = tracksRes?.data ?? tracksRes;

        // debug logs
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

  if (loading) return <div className="dashboard-loading" data-testid="loading">Loading…</div>;
  if (error) return (
    <div className="dashboard-error" role="alert">
      {error} {error?.toLowerCase().includes('login') && <Link to="/login">Se connecter</Link>}
    </div>
  );

  const artistSubtitle = topArtist
    ? (Array.isArray(topArtist.genres) && topArtist.genres.length ? topArtist.genres.join(', ') : `Followers: ${topArtist.followers?.total ?? '—'}`)
    : '';

  const trackSubtitle = topTrack
    ? (Array.isArray(topTrack.artists) ? topTrack.artists.map(a => a.name).join(', ') : '')
    : '';

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <p className="dashboard-subtitle">Your top artist and track</p>

      <section className="dashboard-content" aria-labelledby="top-artist-title">
        <div className="card">
          <h2 id="top-artist-title">Artiste le plus écouté</h2>
          {!topArtist ? (
            <p>Aucun artiste trouvé.</p>
          ) : (
            <SimpleCard
              imageUrl={topArtist.images?.[0]?.url}
              title={topArtist.name}
              subtitle={artistSubtitle}
              link={topArtist.external_urls?.spotify}
            />
          )}
        </div>

        <div className="card">
          <h2 id="top-track-title">Titre le plus écouté</h2>
          {!topTrack ? (
            <p>Aucun titre trouvé.</p>
          ) : (
            <SimpleCard
              imageUrl={topTrack.album?.images?.[0]?.url}
              title={topTrack.name}
              subtitle={`${trackSubtitle}${topTrack.album?.name ? ' — ' + topTrack.album.name : ''}`}
              link={topTrack.external_urls?.spotify}
            />
          )}
        </div>
      </section>


    </div>
  );
}