 

import type { Variants, Transition } from 'framer-motion';





export const transitions = {
    fast: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } as Transition,
    normal: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } as Transition,
    slow: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as Transition,
    spring: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
    springGentle: { type: 'spring', stiffness: 300, damping: 25 } as Transition,
};





export const pageVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: transitions.normal
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: transitions.fast
    },
};

export const fadeVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: transitions.normal },
    exit: { opacity: 0, transition: transitions.fast },
};





export const modalOverlayVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: transitions.fast },
    exit: { opacity: 0, transition: transitions.fast },
};

export const modalContentVariants: Variants = {
    initial: { opacity: 0, scale: 0.96, y: 10 },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: transitions.spring
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        y: 10,
        transition: transitions.fast
    },
};





export const dropdownVariants: Variants = {
    initial: { opacity: 0, y: -8, scale: 0.96 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: transitions.fast
    },
    exit: {
        opacity: 0,
        y: -8,
        scale: 0.96,
        transition: { duration: 0.1 }
    },
};





export const staggerContainerVariants: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

export const staggerItemVariants: Variants = {
    initial: { opacity: 0, y: 15 },
    animate: {
        opacity: 1,
        y: 0,
        transition: transitions.normal
    },
};





export const cardHoverVariants: Variants = {
    initial: { y: 0, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' },
    hover: {
        y: -2,
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        transition: transitions.normal
    },
    tap: {
        scale: 0.98,
        transition: transitions.fast
    },
};





export const buttonVariants: Variants = {
    initial: { scale: 1 },
    hover: { scale: 1.02, transition: transitions.fast },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
};

export const buttonLoadingVariants: Variants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: transitions.fast
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.1 }
    },
};





export const sidebarVariants: Variants = {
    expanded: {
        width: 256,
        transition: transitions.normal
    },
    collapsed: {
        width: 64,
        transition: transitions.normal
    },
};

export const sidebarTextVariants: Variants = {
    expanded: {
        opacity: 1,
        x: 0,
        transition: transitions.fast
    },
    collapsed: {
        opacity: 0,
        x: -10,
        transition: { duration: 0.1 }
    },
};





export const toastVariants: Variants = {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: transitions.spring
    },
    exit: {
        opacity: 0,
        x: 100,
        transition: transitions.fast
    },
};





export const progressVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
        opacity: 1,
        y: 0,
        transition: transitions.springGentle
    },
    exit: {
        opacity: 0,
        y: 10,
        transition: transitions.fast
    },
};





export const tooltipVariants: Variants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.1 }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.075 }
    },
};
