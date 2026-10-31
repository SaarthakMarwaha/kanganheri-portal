import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #d97706 100%)",
        color: "white",
        fontFamily: "sans-serif",
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 92,
          fontWeight: 900,
          lineHeight: 1,
          textShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        क
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 2,
          marginTop: 6,
          opacity: 0.95,
        }}
      >
        110071
      </div>
    </div>,
    {
      ...size,
    },
  );
}
