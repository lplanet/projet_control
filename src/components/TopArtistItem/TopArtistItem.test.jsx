// src/components/TopArtistItem/TopArtistItem.test.jsx

import { describe, expect, test } from '@jest/globals'
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import TopArtistItem from './TopArtistItem';

describe('TopArtistItem component', () => {
    test('renders artist information correctly', () => {
        const artist = {
            id: 'artist1',
            name: 'Test Artist',
            images: [{ url: 'test.jpg' }, { url: 'test-medium.jpg' }, { url: 'test-small.jpg' }],
            genres: ['pop', 'rock'],
            followers: { total: 1000 },
            popularity: 85,
            external_urls: { spotify: 'https://open.spotify.com/artist/artist1' }
        };
        render(<TopArtistItem artist={artist} index={0} />);

        const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
        expect(listItem).toBeInTheDocument();

        const img = within(listItem).getByAltText(artist.name);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', artist.images[1].url);

        expect(listItem).toHaveTextContent(artist.name);
        expect(listItem).toHaveTextContent(`Genres: ${artist.genres.join(', ')}`);

        const text = listItem.textContent || '';
        expect(text.replace(/\D/g, '')).toContain(String(artist.followers.total));

        expect(listItem).toHaveTextContent(`Popularity: ${artist.popularity}`);

        const link = within(listItem).getByRole('link', { name: /view artist/i });
        expect(link).toHaveAttribute('href', artist.external_urls.spotify);
    });

    test('handles missing artist image gracefully', () => {
        const artist = {
            id: 'artist2',
            name: 'No Image Artist',
            genres: ['jazz'],
            // images: [],
            followers: { total: 500 },
            external_urls: { spotify: 'https://open.spotify.com/artist/artist2' }
        };
        render(<TopArtistItem artist={artist} index={1} />);

        const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
        expect(listItem).toBeInTheDocument();

        expect(within(listItem).queryByAltText(artist.name)).not.toBeInTheDocument();

        expect(listItem).toHaveTextContent(artist.name);
        expect(listItem).toHaveTextContent(`Genres: ${artist.genres.join(', ')}`);
        expect(listItem).toHaveTextContent(`Followers: ${artist.followers.total.toLocaleString()}`);

        const link = within(listItem).getByRole('link', { name: /view artist/i });
        expect(link).toHaveAttribute('href', artist.external_urls.spotify);
    });

    test('renders index prefix and link attributes (use specific title element)', () => {
        const artist = {
            id: 'artist3',
            name: 'Index Artist',
            images: [{}, { url: 'm.jpg' }],
            genres: [],
            followers: { total: 10 },
            popularity: 10,
            external_urls: { spotify: 'https://open.spotify.com/artist/artist3' }
        };
        render(<TopArtistItem artist={artist} index={1} />);

        const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
        // query the title element directly to avoid matching other content in the list item
        const titleEl = listItem.querySelector('.artist-title');
        expect(titleEl).toBeTruthy();
        expect(titleEl).toHaveTextContent('2. Index Artist');

        const link = within(listItem).getByRole('link', { name: /view artist/i });
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('renders genres element even when genres array is empty', () => {
        const artist = {
            id: 'artist7',
            name: 'No Genres Artist',
            images: [{}, { url: 'm.jpg' }],
            genres: [],
            followers: { total: 7 },
            external_urls: { spotify: 'https://open.spotify.com/artist/artist7' }
        };
        render(<TopArtistItem artist={artist} index={0} />);

        const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
        const genresEl = listItem.querySelector('.artist-genres');
        expect(genresEl).toBeTruthy();
        // allow optional whitespace after the colon
        expect(genresEl.textContent).toMatch(/^Genres:\s*$/);
    });

    test('does not render image when only images[0] exists (no fallback)', () => {
        const artist = {
            id: 'artist4',
            name: 'Only First Image',
            images: [{ url: 'only.jpg' }],
            genres: ['electronic'],
            followers: { total: 42 },
            external_urls: { spotify: 'https://open.spotify.com/artist/artist4' }
        };
        render(<TopArtistItem artist={artist} index={3} />);

        const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
        // component uses images[1], so no image should be rendered
        expect(within(listItem).queryByAltText(artist.name)).not.toBeInTheDocument();
    });

    test('throws when followers object is missing (component expects followers.total)', () => {
        const artist = {
            id: 'artist5',
            name: 'No Followers',
            images: [{}, { url: 'm.jpg' }],
            genres: [],
            // followers: undefined,
            external_urls: { spotify: 'https://open.spotify.com/artist/artist5' }
        };
        expect(() => render(<TopArtistItem artist={artist} index={4} />)).toThrow();
    });

    test('throws when external_urls is missing (component accesses external_urls.spotify)', () => {
        const artist = {
            id: 'artist6',
            name: 'No External URL',
            images: [{}, { url: 'm.jpg' }],
            genres: [],
            followers: { total: 1 }
            // external_urls: undefined
        };
        expect(() => render(<TopArtistItem artist={artist} index={5} />)).toThrow();
    });

        test('displays 1-based index when passed index 0', () => {
        const artist = {
            id: 'artist-zero',
            name: 'Zero Artist',
            images: [{}, { url: 'zero.jpg' }],
            genres: [],
            followers: { total: 1 },
            external_urls: { spotify: 'https://open.spotify.com/artist/artist-zero' }
        };
        render(<TopArtistItem artist={artist} index={0} />);

        const listItem = screen.getByTestId(`top-artist-item-${artist.id}`);
        const titleEl = listItem.querySelector('.artist-title');
        expect(titleEl).toBeTruthy();
        expect(titleEl).toHaveTextContent('1. Zero Artist');
    });



});