import React from "react";
import { Composition, registerRoot, CalculateMetadataFunction } from "remotion";
import { Reel, ReelProps } from "./Reel";

const meta: CalculateMetadataFunction<ReelProps> = async ({ props }) => ({
  durationInFrames: Math.max(30, Math.round(props.scenes.reduce((a, s) => a + s.dur, 0) * 30)),
});

const Root: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    durationInFrames={900}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      brand: "", brandLines: [], tagline: "", location: "", address: "", whatsapp: "", website: "",
      accent: "#F5B700", music: "", headline: [], badge: "", checks: [], features: [], strap: "",
      images: [], scenes: [],
    } as ReelProps}
    calculateMetadata={meta}
  />
);

registerRoot(Root);
