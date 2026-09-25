import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function youtubePlaylistPlugin(): Plugin {
  return {
    name: 'soundpad-youtube-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/soundpad/youtube-playlist')) {
          const url = new URL(req.url, 'http://127.0.0.1:5173');
          const playlistId = url.searchParams.get('id');
          if (!playlistId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'ID da playlist não fornecido' }));
            return;
          }

          try {
            const body = JSON.stringify({
              context: {
                client: {
                  clientName: 'WEB',
                  clientVersion: '2.20240101.00.00',
                },
              },
              browseId: `VL${playlistId}`,
            });

            const ytRes = await fetch(
              'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                body,
              },
            );

            if (!ytRes.ok) {
              res.statusCode = ytRes.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: `YouTube retornou status ${ytRes.status}`,
                }),
              );
              return;
            }

            const data = (await ytRes.json()) as any;
            const title =
              data?.header?.pageHeaderRenderer?.pageTitle ||
              data?.header?.playlistHeaderRenderer?.title?.simpleText ||
              data?.metadata?.playlistMetadataRenderer?.title ||
              'Playlist do YouTube';

            const tabs =
              data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
            const contents =
              tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
              [];
            const items = contents[0]?.itemSectionRenderer?.contents || [];

            const videos: Array<{
              name: string;
              author: string;
              duration: number;
              sourceType: 'youtube';
              sourceUrl: string;
            }> = [];

            for (const item of items) {
              if (item?.lockupViewModel) {
                const vm = item.lockupViewModel;
                const videoId = vm.contentId;
                const vTitle =
                  vm.metadata?.lockupMetadataViewModel?.title?.content ||
                  'Música sem título';

                let author = 'YouTube';
                const rows =
                  vm.metadata?.lockupMetadataViewModel?.metadata
                    ?.contentMetadataViewModel?.metadataRows || [];
                if (rows[0]?.metadataParts?.[0]?.text?.content) {
                  author = rows[0].metadataParts[0].text.content;
                }

                let duration = 0;
                const label =
                  vm.rendererContext?.accessibilityContext?.label || '';
                const hrMatch = label.match(/(\d+)\s*(?:hour|hora)/i);
                const minMatch = label.match(/(\d+)\s*(?:minute|minuto)/i);
                const secMatch = label.match(/(\d+)\s*(?:second|segundo)/i);
                if (hrMatch) duration += parseInt(hrMatch[1], 10) * 3600;
                if (minMatch) duration += parseInt(minMatch[1], 10) * 60;
                if (secMatch) duration += parseInt(secMatch[1], 10);

                if (videoId) {
                  videos.push({
                    name: vTitle,
                    author,
                    duration,
                    sourceType: 'youtube',
                    sourceUrl: videoId,
                  });
                }
              } else if (item?.playlistVideoListRenderer?.contents) {
                for (const pvr of item.playlistVideoListRenderer.contents) {
                  const vr = pvr.playlistVideoRenderer;
                  if (vr && vr.videoId) {
                    const vTitle =
                      vr.title?.runs?.map((r: any) => r.text).join('') ||
                      vr.title?.simpleText ||
                      'Música sem título';
                    const vAuthor =
                      vr.shortBylineText?.runs
                        ?.map((r: any) => r.text)
                        .join('') || 'YouTube';
                    const duration = parseInt(vr.lengthSeconds, 10) || 0;
                    videos.push({
                      name: vTitle,
                      author: vAuthor,
                      duration,
                      sourceType: 'youtube',
                      sourceUrl: vr.videoId,
                    });
                  }
                }
              }
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ title, videos }));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: err.message || 'Falha ao processar playlist do YouTube',
              }),
            );
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), youtubePlaylistPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@sgm/engine': path.resolve(__dirname, '../../packages/engine/src'),
    },
  },
  server: {
    watch: {
      ignored: ['**/dist/**'],
    },
  },
});
