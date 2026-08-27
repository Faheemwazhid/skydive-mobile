import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body { height: 100%; margin: 0; padding: 0; }
              #root { display: flex; align-items: center; justify-content: center; background: #262523; min-height: 100vh; }
              #root > div { width: 100%; max-width: 428px; height: 100vh; max-height: 844px; background: #F7F7F7; border-radius: 24px; overflow: hidden; }
              @media (max-width: 500px) {
                #root { padding: 0; }
                #root > div { border-radius: 0; max-height: none; height: 100vh; }
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
