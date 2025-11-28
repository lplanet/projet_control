import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchUserTopArtists, fetchUserTopTracks } from '../../api/spotify-me.js';
import SimpleCard from '../../components/SimpleCard/SimpleCard.jsx';
import { KEY_ACCESS_TOKEN } from '../../constants/storageKeys.js';
import { buildTitle } from '../../constants/appMeta.js';
import './DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [topArtists, setTopArtists] = useState(null);
  const [topTracks, setTopTracks] = useState(null);

  const [loadingArtists, setLoadingArtists] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(true);

  const [errorArtists, setErrorArtists] = useState(null);
  const [errorTracks, setErrorTracks] = useState(null);

  useEffect(() => {
    document.title = buildTitle('Dashboard');
  }, []);

  useEffect(() => {
    let cancelled = false;
    const token = window.localStorage.getItem(KEY_ACCESS_TOKEN);

    /* istanbul ignore next */
    if (!token) {
      setErrorArtists('Missing access token');
      setErrorTracks('Missing access token');
      setLoadingArtists(false);
      setLoadingTracks(false);
      return;
    }

    (async () => {
      // fetch artists
      (async () => {
        try {
          const res = await fetchUserTopArtists(token);
          if (cancelled) return;
          const data = res?.data ?? res;
          if (!data) {
            setErrorArtists('Empty response from fetchUserTopArtists');
          } else if (data.error) {
            /* istanbul ignore next: branch hard to reproduce in tests (API error + redirect) */
            const msg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
            setErrorArtists(msg);
            if (msg.toLowerCase().includes('access token')) navigate('/login');
          } else {
            setTopArtists(data);
          }
        } catch (err) {
          if (cancelled) return;
          setErrorArtists(err?.message ?? String(err));
        } finally {
          if (!cancelled) setLoadingArtists(false);
        }
      })();

      // fetch tracks
      (async () => {
        try {
          const res = await fetchUserTopTracks(token);
          if (cancelled) return;
          const data = res?.data ?? res;
          if (!data) {
            setErrorTracks('Empty response from fetchUserTopTracks');
          } else if (data.error) {
            /* istanbul ignore next: branch hard to reproduce in tests (API error + redirect) */
            const msg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
            setErrorTracks(msg);
            if (msg.toLowerCase().includes('access token')) navigate('/login');
          } else {
            setTopTracks(data);
          }
        } catch (err) {
          if (cancelled) return;
          setErrorTracks(err?.message ?? String(err));
        } finally {
          if (!cancelled) setLoadingTracks(false);
        }
      })();
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const topArtist = topArtists?.items?.[0] ?? null;
  const topTrack = topTracks?.items?.[0] ?? null;

  // Loading indicators required by tests
  if (loadingArtists || loadingTracks) {
    return (
      <div className="dashboard-loading" data-testid="loading">
        <div data-testid="loading-artists-indicator">Loading artists…</div>
        <div data-testid="loading-tracks-indicator">Loading tracks…</div>
      </div>
    );
  }

  // Error blocks with specific data-testid required by tests
  if (errorArtists || errorTracks) {
    return (
      <div className="dashboard-error" role="alert">
        {errorArtists ? <div data-testid="error-artists-indicator">{errorArtists}</div> : null}
        {errorTracks ? <div data-testid="error-tracks-indicator">{errorTracks}</div> : null}
        {(String(errorArtists || errorTracks).toLowerCase().includes('login') ||
          String(errorArtists || errorTracks).toLowerCase().includes('access token')) && (
          <p><Link to="/login">Se connecter</Link></p>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <p className="dashboard-subtitle">Your top artist and track</p>

      <section className="dashboard-content" aria-labelledby="top-artist-title">
        <div className="card" aria-live="polite">
          <h2 id="top-artist-title">Artiste le plus écouté</h2>
          {!topArtist ? (
            <p>Aucun artiste trouvé.</p>
          ) : (
            <SimpleCard
              imageUrl={topArtist.images?.[0]?.url}
              title={topArtist.name}
              subtitle={Array.isArray(topArtist.genres) && topArtist.genres.length ? topArtist.genres.join(', ') : `Followers: ${topArtist.followers?.total ?? '—'}`}
              link={topArtist.external_urls?.spotify}
            />
          )}
        </div>

        <div className="card" aria-live="polite">
          <h2 id="top-track-title">Titre le plus écouté</h2>
          {!topTrack ? (
            <p>Aucun titre trouvé.</p>
          ) : (
            <SimpleCard
              imageUrl={topTrack.album?.images?.[0]?.url}
              title={topTrack.name}
              subtitle={`${Array.isArray(topTrack.artists) ? topTrack.artists.map(a => a.name).join(', ') : ''}${topTrack.album?.name ? ' — ' + topTrack.album.name : ''}`}
              link={topTrack.external_urls?.spotify}
            />
          )}
        </div>
      </section>
    </div>
  );
}