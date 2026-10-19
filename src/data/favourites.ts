import type { ImageMetadata } from 'astro';

// Import your own photos from ../assets/ here. Astro optimises them at build time.
export type FavouriteImage = {
  src: ImageMetadata;
  alt: string;
  position?: string; // Optional CSS object-position, e.g. '50% 35%'.
};

export type FavouriteItem = {
  title: string;
  note?: string;
  image?: FavouriteImage;
  href?: string;
};

// Set this to { src: importedPhoto, alt: '...', caption: '...' } to show a portrait.
// No photo or empty caption means no visible placeholder.
export const personalPhoto: (FavouriteImage & { caption?: string }) | null = null;

export const films: FavouriteItem[] = [
  { title: 'City of God' },
  { title: 'Day After Tomorrow' },
  { title: "You're Next" },
  { title: 'The Spiral' }, // Identify this film before adding metadata or a link.
  { title: 'Tar' },
];

export const books: FavouriteItem[] = [
  { title: 'Shantaram' },
  { title: 'Atlas Shrugged' },
  { title: 'Devil Take the Hindmost' },
  { title: 'When Genius Failed' },
  { title: 'Oryx & Crake' },
];

export const cities: FavouriteItem[] = [
  { title: 'Toronto' },
  { title: 'Rio' },
  { title: 'Warsaw' },
  { title: 'Lisbon' },
  { title: 'Orlando' },
];

export const collections = [
  { id: 'films', title: 'Films', items: films },
  { id: 'books', title: 'Books', items: books },
  { id: 'cities', title: 'Cities', items: cities },
];
