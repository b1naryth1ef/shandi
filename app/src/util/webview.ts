export type WindowWithChrome = Window & {
  chrome?: Chrome;
};

export type Chrome = {
  webview?: WebView;
};

export type WebView = {
  postMessage: (msg: string) => void;
};

export function getWebView(): WebView | undefined {
  return (window as any as WindowWithChrome).chrome?.webview;
}

export function isWebView(): boolean {
  return getWebView() !== undefined;
}

export function postWebViewMessage(message: any) {
  const webview = getWebView();
  if (!webview) {
    throw new Error("Failed to post message, not in a webview");
  }

  webview.postMessage(JSON.stringify(message));
}

function openInNewTab(href: string) {
  Object.assign(document.createElement("a"), {
    target: "_blank",
    rel: "noopener noreferrer",
    href: href,
  }).click();
}

export function openInExternalBrowser(url: string) {
  const webview = getWebView();
  if (!webview) {
    openInNewTab(url);
    return;
  }

  return postWebViewMessage({
    e: "open-in-external-browser",
    d: url,
  });
}
