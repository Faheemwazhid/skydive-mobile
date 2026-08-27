import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web shell. On phones the app is edge-to-edge. On wider screens it sits in a
 * phone-width column that scales with the window instead of a fixed 844px box,
 * so the bottom nav can never be clipped off-screen.
 */
const shell = `
  html, body { height: 100%; margin: 0; padding: 0; background: #EBEBE9; }
  body { overflow: hidden; }

  #root {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    background: #EBEBE9;
  }

  /* The app root that Expo renders. Phone-width column, height follows the
     window so short windows still show the whole app including the tab bar. */
  #root > div {
    width: 100%;
    max-width: 420px;
    height: 100dvh;
    max-height: 880px;
    background: #F7F7F7;
    overflow: hidden;
  }

  /* Wide screens: give the column a device-like frame and a soft tinted shadow
     that matches the backdrop (never pure black). */
  @media (min-width: 600px) and (min-height: 620px) {
    #root { padding: 24px 0; }
    #root > div {
      height: calc(100dvh - 48px);
      border-radius: 28px;
      box-shadow: 0 18px 48px rgba(38, 37, 35, 0.16),
                  0 2px 8px rgba(38, 37, 35, 0.08);
    }
  }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <title>Skydive</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: shell }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
