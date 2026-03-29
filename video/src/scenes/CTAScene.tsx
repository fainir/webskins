import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, SCENES } from "../tokens";
import { useSceneOpacity } from "../helpers";

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = useSceneOpacity(SCENES.cta.dur);

  const titleSpring = spring({ fps, frame, config: { damping: 12, stiffness: 100 } });
  const buttonSpring = spring({ fps, frame: frame - 20, config: { damping: 14 } });
  const subSpring = spring({ fps, frame: frame - 30, config: { damping: 16 } });

  const pulse = Math.sin(frame * 0.08) * 0.4 + 0.6;

  return (
    <AbsoluteFill style={{ opacity, background: COLORS.dark, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 40%, ${COLORS.primary}33 0%, transparent 60%)`,
      }} />

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100%",
      }}>
        <h1 style={{
          fontSize: 72, fontWeight: 800, color: COLORS.white,
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center", margin: 0, lineHeight: 1.15, letterSpacing: -2,
          transform: `scale(${titleSpring})`,
        }}>
          Transform Any Website
          <br />
          <span style={{ color: COLORS.accent }}>With Your Words</span>
        </h1>

        <div style={{
          marginTop: 40,
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
          padding: "16px 44px", borderRadius: 14,
          transform: `scale(${buttonSpring})`,
          boxShadow: `0 0 ${35 * pulse}px ${COLORS.primary}88`,
        }}>
          <span style={{
            fontSize: 24, fontWeight: 600, color: COLORS.white,
            fontFamily: "system-ui, sans-serif",
          }}>
            Try WebSkins — Free on Chrome Web Store
          </span>
        </div>

        <p style={{
          marginTop: 16, fontSize: 16, color: COLORS.grayLight,
          fontFamily: "system-ui, sans-serif",
          opacity: subSpring,
        }}>
          Free • Bring Your Own API Key • No Subscription
        </p>
      </div>
    </AbsoluteFill>
  );
};
