import React, { ReactNode } from 'react';
import { motion, Variants } from 'motion/react';

/**
 * Wrapper providing a fade‑up animation when the section scrolls into view.
 * If `stagger` is true, child elements animate sequentially.
 */
export const SectionMotion = ({
  children,
  className = '',
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        ...(stagger && { staggerChildren: 0.12, delayChildren: 0.2 }),
      },
    },
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.section>
  );
};
