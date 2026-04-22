import { useEffect } from "react";
import { Platform } from "react-native";

const FEATHER_FONT_URL =
  "https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.2.0/Fonts/Feather.ttf";

export function WebFontsLoader() {
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof document === "undefined") return;
    if (document.getElementById("alvee-feather-fallback")) return;

    const style = document.createElement("style");
    style.id = "alvee-feather-fallback";
    style.textContent = `
      @font-face {
        font-family: 'Feather';
        src: url('${FEATHER_FONT_URL}') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: block;
      }
    `;
    document.head.appendChild(style);

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "font";
    link.type = "font/ttf";
    link.href = FEATHER_FONT_URL;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }, []);

  return null;
}
