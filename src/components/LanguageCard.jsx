import { useState } from 'react';

import Hover3DCard from './Hover3DCard';

const isActivationKey = (event) => event.key === 'Enter' || event.key === ' ';

const LanguageCard = ({
  iconSrc,
  name,
  placeholderSrc,
  intensity = 16,
  glowColor = 'rgba(58, 175, 169, 0.35)',
}) => {
  const [rotation, setRotation] = useState(0);

  const handleKeyDown = (event) => {
    if (isActivationKey(event)) {
      event.preventDefault();
      handleFlip();
    }
  };

  const handleFlip = () => {
    setRotation((prev) => prev + 360);
  };

  return (
    <Hover3DCard
      intensity={intensity}
      glowColor={glowColor}
      className="relative h-full min-h-[15rem] cursor-pointer select-none focus-visible:outline-none transition-transform duration-[1200ms]"
      extraTransform={`rotateY(${rotation}deg)`}
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="flex h-full min-h-[15rem] w-full items-center justify-center rounded-[2rem] bg-transparent p-6">
        <img
          src={iconSrc}
          alt={name}
          loading="lazy"
          className="h-20 w-20 object-contain"
          onError={(event) => {
            if (event.currentTarget.dataset.fallback !== 'true' && placeholderSrc) {
              event.currentTarget.dataset.fallback = 'true';
              event.currentTarget.src = placeholderSrc;
            }
          }}
        />
      </div>
    </Hover3DCard>
  );
};

export default LanguageCard;

