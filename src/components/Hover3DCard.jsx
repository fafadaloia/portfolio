import { useEffect, useRef } from 'react';

const isTouchDevice = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const Hover3DCard = ({
  children,
  intensity = 15,
  glowColor = 'rgba(255, 255, 255, 0.3)',
  className = '',
  extraTransform = '',
  ...interactiveProps
}) => {
  const containerRef = useRef(null);
  const requestRef = useRef(null);
  const frame = useRef({ rotateX: 0, rotateY: 0, glowX: 50, glowY: 50 });
  const disabled = typeof window !== 'undefined' && window.innerWidth < 768 && isTouchDevice();

  useEffect(() => {
    const element = containerRef.current;
    if (!element || disabled) {
      return undefined;
    }

    element.style.transformStyle = 'preserve-3d';

    const applyTransform = (rotateX, rotateY, scale = 1.03) => {
      if (!element) {
        return;
      }

      const baseTransform = `perspective(900px) ${extraTransform ? `${extraTransform} ` : ''}rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
      element.style.transform = baseTransform;
    };

    const handlePointerMove = (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const percentX = (x - midX) / midX;
      const percentY = (y - midY) / midY;

      const targetRotateY = percentX * intensity;
      const targetRotateX = percentY * -intensity;
      const glowX = (percentX + 1) * 50;
      const glowY = (percentY + 1) * 50;

      frame.current = {
        rotateX: targetRotateX,
        rotateY: targetRotateY,
        glowX,
        glowY,
        scale: 1.03,
      };

      if (!requestRef.current) {
        requestRef.current = window.requestAnimationFrame(updateFrame);
      }
    };

    const updateFrame = () => {
      if (!element) {
        return;
      }

      const { rotateX, rotateY, glowX, glowY, scale } = frame.current;
      applyTransform(rotateX, rotateY, scale ?? 1.03);
      element.style.boxShadow = `${-rotateY * 1.5}px ${rotateX * 2}px 35px -15px rgba(42, 157, 143, 0.3)`;
      element.style.setProperty('--hover-card-glow', `${glowX}% ${glowY}%`);
      requestRef.current = null;
    };

    const handlePointerLeave = () => {
      frame.current = { rotateX: 0, rotateY: 0, glowX: 50, glowY: 50, scale: 1 };
      element.style.transition = 'transform 0.4s ease, box-shadow 0.5s ease';
      applyTransform(0, 0, 1);
      element.style.boxShadow = '0 18px 30px -20px rgba(42, 157, 143, 0.35)';
    };

    const handlePointerEnter = () => {
      element.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    };

    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerleave', handlePointerLeave);
    element.addEventListener('pointerenter', handlePointerEnter);

    return () => {
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerleave', handlePointerLeave);
      element.removeEventListener('pointerenter', handlePointerEnter);
      if (requestRef.current) {
        window.cancelAnimationFrame(requestRef.current);
      }
    };
  }, [disabled, intensity, extraTransform]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || disabled) {
      return;
    }

    element.style.transformStyle = 'preserve-3d';
    element.style.transform = `perspective(900px) ${extraTransform ? `${extraTransform} ` : ''}rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  }, [disabled, extraTransform]);

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden rounded-[2rem] border border-primary/10 bg-lightBg/95 shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-primary/20 dark:border-primary/20 dark:bg-darkBg/90 ${disabled ? '' : 'will-change-transform'} ${className}`}
      style={{
        boxShadow: '0 18px 30px -20px rgba(42, 157, 143, 0.35)',
      }}
      {...interactiveProps}
    >
      {!disabled && (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 dark:opacity-0 dark:group-hover:opacity-100"
            style={{
              background: 'linear-gradient(135deg, #3AAFA9, #2B7A78)',
              mixBlendMode: 'multiply',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:hidden"
            style={{
              background: `radial-gradient(circle at var(--hover-card-glow, 50% 50%), ${glowColor}, transparent 60%)`,
              mixBlendMode: 'normal',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 z-10 hidden opacity-0 transition-opacity duration-300 dark:block dark:opacity-0 dark:group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at var(--hover-card-glow, 50% 50%), ${glowColor}, transparent 60%)`,
              mixBlendMode: 'screen',
            }}
          />
        </>
      )}
      <div className="relative z-20 rounded-[2rem] bg-transparent p-5 transition-all duration-300">
        {children}
      </div>
    </div>
  );
};

export default Hover3DCard;

