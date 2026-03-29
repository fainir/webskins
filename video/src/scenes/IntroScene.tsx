import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { COLORS, SCENES } from "../tokens";
import { useSceneOpacity } from "../helpers";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = useSceneOpacity(SCENES.intro.dur);

  const logoScale = spring({ fps, frame, config: { damping: 10, stiffness: 100 } });
  const taglineOpacity = spring({ fps, frame: frame - 12, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ opacity, background: COLORS.dark, overflow: "hidden" }}>
      {/* Gradient background */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${COLORS.primary}22 0%, transparent 70%)`,
      }} />

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100%",
      }}>
        <h1 style={{
          fontSize: 90, fontWeight: 800, color: COLORS.white,
          fontFamily: "system-ui, -apple-system, sans-serif",
          transform: `scale(${logoScale})`, margin: 0, letterSpacing: -3,
        }}>
          Web<span style={{ color: COLORS.accent }}>Skins</span>
        </h1>

        <p style={{
          fontSize: 32, color: COLORS.grayLight,
          fontFamily: "system-ui, sans-serif", marginTop: 16,
          opacity: taglineOpacity,
        }}>
          Describe it. Generate it. Apply it.
        </p>
      </div>
    </AbsoluteFill>
  );
};
