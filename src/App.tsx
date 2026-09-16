import { useEffect, useRef, useState } from 'react'
import { animated, to, useSpring } from '@react-spring/web'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faFacebook,
  faInstagram,
  faPinterest,
  faTwitter,
} from '@fortawesome/free-brands-svg-icons'

/** Horizontal gap between buttons, in SVG viewBox units. */
const BUTTON_SPACING = 90
/** How deep the wave dips below the bar, in viewBox units. */
const WAVE_DEPTH = 35

const NAV_ITEMS: { icon: IconDefinition; label: string }[] = [
  { icon: faInstagram, label: 'Instagram' },
  { icon: faFacebook, label: 'Facebook' },
  { icon: faTwitter, label: 'Twitter' },
  { icon: faPinterest, label: 'Pinterest' },
]

/** X coordinate the wave should be centred on for a given tab. */
const anchorFor = (index: number) => (index + 1) * BUTTON_SPACING

type Anchors = readonly [from: number, to: number]

interface IconButtonProps {
  icon: IconDefinition
  label: string
  index: number
  currentIndex: number
  onSelect: (index: number) => void
}

const IconButton = ({
  icon,
  label,
  index,
  currentIndex,
  onSelect,
}: IconButtonProps) => {
  const isActive = index === currentIndex

  const style = useSpring({
    from: { z: 0, y: 0, color: '#888' },
    to: {
      z: isActive ? 1 : 0,
      y: isActive ? -20 : 0,
      color: isActive ? '#333' : '#888',
    },
    delay: 200,
  })

  return (
    <animated.button
      type="button"
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onSelect(index)}
      style={{
        transform: style.y.to((y) => `translateY(${y}px)`),
        color: style.color,
        boxShadow: style.z
          .to([0, 0.8, 1], [0, 0, 10])
          .to((z) => `0 0 ${z}px rgba(0, 0, 0, 0.3)`),
      }}
    >
      <FontAwesomeIcon icon={icon} />
    </animated.button>
  )
}

/**
 * Path for the bar with a notch carved out, centred near `x` and dipping to `y`.
 */
const wave = (x: number, y: number) => `M0,0 L0,60 L360,60 L360,0
  L${x},0
  C${x - 20},0 ${x - 20},${y} ${x - 45},${y}
  S${x - 70},0 ${x - 90},0
  `

interface WaveProps {
  anchors: Anchors
  previousAnchors: Anchors
}

const Wave = ({ anchors, previousAnchors }: WaveProps) => {
  // The notch animates in from flat on the very first paint only. A ref keeps
  // this per-instance; the original used a module-level global, which stayed
  // false forever once any instance had mounted.
  const isFirstRender = useRef(true)
  useEffect(() => {
    isFirstRender.current = false
  }, [])

  const spring = useSpring({
    from: { x: 0, y: 0 },
    to: { x: 1, y: 1 },
    reset: true,
  })

  // Latch: hold the notch at its previous anchor until the x spring actually
  // starts moving, so the wave doesn't jump ahead of the animation.
  let holdingAtPrevious = true
  const holdUntilMoving = (x: number, y: number) => {
    if (x === anchors[1] && holdingAtPrevious) {
      return wave(previousAnchors[1], y)
    }
    if (x !== anchors[1]) holdingAtPrevious = false
    return wave(x, y)
  }

  const distance = Math.abs(anchors[1] - anchors[0])

  let d
  if (isFirstRender.current) {
    // Drop the notch straight down into place.
    d = to(
      [spring.x.to([0, 1], anchors), spring.y.to([0, 1], [0, WAVE_DEPTH])],
      wave,
    )
  } else if (distance <= BUTTON_SPACING) {
    // Adjacent tab: slide across at full depth.
    d = to(
      [
        spring.x.to([0, 1], anchors),
        spring.y.to([0, 1], [WAVE_DEPTH, WAVE_DEPTH]),
      ],
      holdUntilMoving,
    )
  } else {
    // Distant tab: lift the notch out and set it back down on arrival.
    d = to(
      [
        spring.x.to([0, 1], anchors),
        spring.y.to([0, 0.5, 1], [WAVE_DEPTH, 0, WAVE_DEPTH]),
      ],
      holdUntilMoving,
    )
  }

  return (
    <div className="svgWrapper">
      <svg id="Svg" preserveAspectRatio="none" viewBox="0 0 360 60">
        <animated.path d={d} fill="white" />
      </svg>
    </div>
  )
}

export default function App() {
  const [index, setIndex] = useState(0)
  const [anchors, setAnchors] = useState<Anchors>([
    anchorFor(0),
    anchorFor(0),
  ])
  const [previousAnchors, setPreviousAnchors] = useState<Anchors>([
    anchorFor(0),
    anchorFor(0),
  ])

  const handleSelect = (next: number) => {
    setIndex(next)
    setPreviousAnchors(anchors)
    setAnchors([anchors[1], anchorFor(next)])
  }

  return (
    <>
      <div className="Container" />
      <nav className="AppBar">
        {NAV_ITEMS.map((item, i) => (
          <IconButton
            key={item.label}
            icon={item.icon}
            label={item.label}
            index={i}
            currentIndex={index}
            onSelect={handleSelect}
          />
        ))}
      </nav>
      <Wave anchors={anchors} previousAnchors={previousAnchors} />
    </>
  )
}
