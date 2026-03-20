import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Storytel Clone',
    short_name: 'Storytel',
    description: 'Listen to your downloaded audiobooks offline.',
    start_url: '/',
    display: 'standalone',
    background_color: '#141414',
    theme_color: '#141414',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      }
    ],
  }
}
