import artistCountForPlaylist from './artist-count-for-playlist';

jest.mock('./spotifyApi', () => ({
  fetchPlaylistById: jest.fn(),
}));
import { fetchPlaylistById } from './spotifyApi';

test('counts artist occurrences in playlist tracks', async () => {
  // mock response shape returned by fetchPlaylistById
  fetchPlaylistById.mockResolvedValue({
    data: {
      tracks: {
        items: [
          { track: { artists: [{ name: 'Artist A' }, { name: 'Artist B' }] } },
          { track: { artists: [{ name: 'Artist A' }] } },
          { track: { artists: [{ name: 'Artist C' }] } },
          // edge: track may be null/undefined
          { track: null },
        ],
      },
    },
  });

  const result = await artistCountForPlaylist('fake-token', 'playlist-id-123');
  expect(result).toEqual({ 'Artist A': 2, 'Artist B': 1, 'Artist C': 1 });
});