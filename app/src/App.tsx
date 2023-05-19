import { setupEvents } from "./util/events";
import Window from "./components/Window";
import { isWebView, postWebViewMessage } from "./util/webview";

setupEvents();

export default function App() {
  return (
    <div>
      <Window />;
      {isWebView() && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 drag-bottom-right cursor-se-resize"
          onMouseDown={() => {
            postWebViewMessage({
              e: "resize",
              d: "bottom-right",
            });
          }}
        />
      )}
    </div>
  );
}
