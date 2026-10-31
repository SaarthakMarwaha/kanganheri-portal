import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const alt = "Kanganheri Darpan — Village Kanganheri (110071) Civic Portal";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "radial-gradient(circle at 10% 20%, #fff7ed 0%, #fef3c7 40%, #fed7aa 100%)",
        fontFamily: "sans-serif",
        padding: 60,
        border: "12px solid #ea580c",
      }}
    >
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#ea580c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 38,
              fontWeight: 900,
            }}
          >
            क
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#1c1917" }}>
              कांगनहेड़ी दर्पण • Kanganheri Darpan
            </span>
            <span style={{ fontSize: 18, color: "#78350f", fontWeight: 700 }}>
              kanganheri.com • PIN 110071
            </span>
          </div>
        </div>

        <div
          style={{
            padding: "10px 20px",
            backgroundColor: "#ea580c",
            color: "white",
            borderRadius: 30,
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 1,
          }}
        >
          SOUTH WEST DELHI
        </div>
      </div>

      {/* Center Title & Tagline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h1
          style={{
            fontSize: 54,
            fontWeight: 900,
            color: "#1c1917",
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          गाँव कांगनहेड़ी डिजिटल नागरिक पोर्टल
        </h1>
        <p
          style={{
            fontSize: 24,
            color: "#44403c",
            lineHeight: 1.4,
            margin: 0,
            maxWidth: 960,
          }}
        >
          जन-शिकायत निवारण (बिना लॉगिन) • दैनिक मंडी भाव • स्थानीय कारीगर डायरेक्टरी • 24x7
          आपातकालीन सेवाएँ • भूमि यूनिट कनवर्टर
        </p>
      </div>

      {/* Bottom Feature Badges */}
      <div style={{ display: "flex", gap: 16 }}>
        {[
          "🌾 लाइव मंडी भाव (नजफगढ़/नरेला)",
          "📋 नो-लॉगिन नागरिक शिकायत",
          "🛠️ सत्यापित कारीगर व दुकानें",
          "⚡ 24x7 आपातकालीन नंबर",
          "📐 बीघा-बिस्वा भूमि कनवर्टर",
        ].map((pill, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "white",
              padding: "10px 18px",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              color: "#1c1917",
              border: "2px solid #fed7aa",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            }}
          >
            {pill}
          </div>
        ))}
      </div>
    </div>,
    {
      ...size,
    },
  );
}
