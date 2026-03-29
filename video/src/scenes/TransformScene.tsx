import { AbsoluteFill, Img, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from "remotion";
import { COLORS } from "../tokens";
import { useSceneOpacity, useTypewriter } from "../helpers";

interface TransformSceneProps {
  siteName: string;
  beforeImg: string;
  afterImg: string;
  prompt: string;
  dur: number;
}

export const TransformScene: React.FC<TransformSceneProps> = ({
  siteName, beforeImg, afterImg, prompt, dur,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = useSceneOpacity(dur);

  // Phase 1 (0-40): Both images slide in side by side
  const leftSlide = spring({ fps, frame, config: { damping: 14, stiffness: 100 } });
  const rightSlide = spring({ fps, frame: frame - 5, config: { damping: 14, stiffness: 100 } });

  // Prompt typing starts at frame 15
  const typedPrompt = useTypewriter(prompt, 15, 1.5);
  const promptOpacity = interpolate(frame, [10, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Glow pulse on the after side
  const glowPulse = Math.sin(frame * 0.1) * 0.3 + 0.7;

  // Site label
  const labelOpacity = spring({ fps, frame, config: { damping: 16 } });

  const imgStyle: React.CSSProperties = {
    width: "100%", height: "100%", objectFit: "cover",
  };

  return (
    <AbsoluteFill style={{ opacity, background: COLORS.dark, overflow: "hidden" }}>
      {/* Site name top center */}
      <div style={{
        position: "absolute", top: 20, left: 0, right: 0, zIndex: 10,
        display: "flex", justifyContent: "center", opacity: labelOpacity,
      }}>
        <span style={{
          fontSize: 16, color: COLORS.grayLight, fontFamily: "system-ui, sans-serif",
          textTransform: "uppercase", letterSpacing: 6, fontWeight: 600,
        }}>
          {siteName}
        </span>
      </div>

      {/* Side by side container */}
      <div style={{
        position: "absolute", top: 50, bottom: 70, left: 30, right: 30,
        display: "flex", gap: 16,
      }}>
        {/* BEFORE */}
        <div style={{
          flex: 1, borderRadius: 12, overflow: "hidden",
          border: "2px solid #333",
          transform: `translateX(${interpolate(leftSlide, [0, 1], [-60, 0])}px)`,
          opacity: leftSlide,
          position: "relative",
        }}>
          <Img src={staticFile(beforeImg)} style={imgStyle} />
          <div style={{
            position: "absolute", top: 10, left: 10,
            background: "rgba(0,0,0,0.75)", padding: "4px 14px", borderRadius: 6,
            fontSize: 12, color: "#888", fontFamily: "system-ui, sans-serif",
            fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
          }}>
            Before
          </div>
        </div>

        {/* Center divider with arrow */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 40, flexShrink: 0,
        }}>
          <div style={{
            fontSize: 28, color: COLORS.accent,
            opacity: interpolate(frame, [20, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            →
          </div>
        </div>

        {/* AFTER */}
        <div style={{
          flex: 1, borderRadius: 12, overflow: "hidden",
          border: `2px solid ${COLORS.primary}`,
          boxShadow: `0 0 ${30 * glowPulse}px ${COLORS.primary}44`,
          transform: `translateX(${interpolate(rightSlide, [0, 1], [60, 0])}px)`,
          opacity: rightSlide,
          position: "relative",
        }}>
          <Img src={staticFile(afterImg)} style={imgStyle} />
          <div style={{
            position: "absolute", top: 10, left: 10,
            background: COLORS.accent, padding: "4px 14px", borderRadius: 6,
            fontSize: 12, color: COLORS.white, fontFamily: "system-ui, sans-serif",
            fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
          }}>
            After
          </div>
        </div>
      </div>

      {/* Prompt bar at bottom */}
      <div style={{
        position: "absolute", bottom: 18, left: 40, right: 40,
        display: "flex", justifyContent: "center", opacity: promptOpacity,
      }}>
        <div style={{
          background: COLORS.darkAlt,
          border: `1px solid ${COLORS.primary}44`,
          borderRadius: 10, padding: "10px 24px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 14, color: COLORS.primaryLight }}>✨</span>
          <span style={{
            fontSize: 17, color: COLORS.whiteAlpha,
            fontFamily: "system-ui, sans-serif", fontStyle: "italic",
          }}>
            "{typedPrompt}"
          </span>
          {typedPrompt.length < prompt.length && (
            <span style={{
              width: 2, height: 18, background: COLORS.accent,
              opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
            }} />
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
