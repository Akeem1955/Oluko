import { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, useSpring } from "framer-motion";

export function useLandingAnimations() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const ecoRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Spring configuration for smooth motion
  const springConfig = {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  };

  const rawOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const rawScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95]);

  const opacity = useSpring(rawOpacity, springConfig);
  const scale = useSpring(rawScale, springConfig);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) setScrolled(isScrolled);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return {
    isMenuOpen,
    setIsMenuOpen,
    scrolled,
    heroRef,
    ecoRef,
    opacity,
    scale,
  };
}
