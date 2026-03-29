import { Composition, Sequence, AbsoluteFill } from "remotion";
import { FPS, TOTAL_FRAMES, SCENES, SITES, COLORS } from "./tokens";
import { IntroScene } from "./scenes/IntroScene";
import { TransformScene } from "./scenes/TransformScene";
import { CTAScene } from "./scenes/CTAScene";

const WebSkinsDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.dark }}>
      <Sequence from={SCENES.intro.start} durationInFrames={SCENES.intro.dur}>
        <IntroScene />
      </Sequence>

      <Sequence from={SCENES.hn.start} durationInFrames={SCENES.hn.dur}>
        <TransformScene
          siteName={SITES[0].name}
          beforeImg={SITES[0].before}
          afterImg={SITES[0].after}
          prompt={SITES[0].prompt}
          dur={SCENES.hn.dur}
        />
      </Sequence>

      <Sequence from={SCENES.youtube.start} durationInFrames={SCENES.youtube.dur}>
        <TransformScene
          siteName={SITES[1].name}
          beforeImg={SITES[1].before}
          afterImg={SITES[1].after}
          prompt={SITES[1].prompt}
          dur={SCENES.youtube.dur}
        />
      </Sequence>

      <Sequence from={SCENES.wiki.start} durationInFrames={SCENES.wiki.dur}>
        <TransformScene
          siteName={SITES[2].name}
          beforeImg={SITES[2].before}
          afterImg={SITES[2].after}
          prompt={SITES[2].prompt}
          dur={SCENES.wiki.dur}
        />
      </Sequence>

      <Sequence from={SCENES.cta.start} durationInFrames={SCENES.cta.dur}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="WebSkinsDemo"
      component={WebSkinsDemo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
