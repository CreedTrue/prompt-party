import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const PaintRollerAnimation = () => {
  return (
    <DotLottieReact
      src="/paint-roller.lottie"
      speed={0.5}
      loop
      autoplay
    />
  );
};

export default PaintRollerAnimation;