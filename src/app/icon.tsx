import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ea580c 0%, #ca8a04 100%)",
        borderRadius: 6,
        color: "white",
        fontWeight: 800,
        fontSize: 20,
        fontFamily: "sans-serif",
        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
      }}
    >
      क
    </div>,
    {
      ...size,
    },
  );
}
