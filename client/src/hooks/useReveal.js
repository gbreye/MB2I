import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import {
  REVEAL_DURATION,
  REVEAL_EASE,
  gsap,
  prefersReducedMotion,
} from '../lib/gsap'

const VARIANTS = {
  up: (y) => ({ autoAlpha: 0, y }),
  left: () => ({ autoAlpha: 0, x: -24 }),
  right: () => ({ autoAlpha: 0, x: 24 }),
  scale: () => ({ autoAlpha: 0, scale: 0.94 }),
  fade: () => ({ autoAlpha: 0 }),
}

/**
 * Anima em cascata todos os elementos com `data-reveal` dentro do escopo.
 * O valor do atributo escolhe a direção: `up`, `left`, `right`, `scale` ou `fade`.
 * Retorna a ref que deve ser aplicada ao container.
 */
export function useReveal({
  stagger = 0.07,
  y = 18,
  duration = REVEAL_DURATION,
} = {}) {
  const scope = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion() || !scope.current) return

      const targets = gsap.utils.toArray('[data-reveal]', scope.current)

      if (targets.length === 0) return

      targets.forEach((target, index) => {
        const variant =
          VARIANTS[target.dataset.reveal] || VARIANTS.up

        gsap.from(target, {
          ...variant(y),
          duration,
          ease: REVEAL_EASE,
          delay: index * stagger,
          clearProps: 'opacity,visibility,transform',
        })
      })
    },
    { scope },
  )

  return scope
}
