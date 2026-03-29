import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { FADE_IN, FADE_OUT } from "./tokens";

export function useSceneOpacity(durFrames: number) {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [0, FADE_IN, durFrames - FADE_OUT, durFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

export function useFadeSlide(delay: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ fps, frame: frame - delay, config: { damping: 18, stiffness: 120 } });
  return {
    opacity: s,
    transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
  };
}

export function useTypewriter(text: string, startFrame: number, charsPerFrame = 0.8) {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.min(Math.floor(elapsed * charsPerFrame), text.length);
  return text.slice(0, chars);
}
