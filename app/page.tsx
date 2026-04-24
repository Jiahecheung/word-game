'use client'

import { useEffect, useRef } from 'react'

// Sakura petal SVG path
const PetalSVG = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2C8 2 4 5 4 9c0 2.5 1.3 4.7 3.2 6L12 22l4.8-7C18.7 13.7 20 11.5 20 9c0-4-4-7-8-7z" />
  </svg>
)

const PETALS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: 10 + Math.random() * 10,
  duration: `${12 + Math.random() * 16}s`,
  swayDuration: `${4 + Math.random() * 4}s`,
  delay: `${Math.random() * 20}s`,
}))

const NAV_LINKS = [
  { href: '#study',   label: 'Study' },
  { href: '#grammar', label: 'Grammar' },
  { href: '#vocab',   label: 'Vocab' },
  { href: '#about',   label: 'About' },
]

const CARDS = [
  {
    jp: '文法',
    title: 'Grammar',
    desc: 'Structured guides from N5 to N1 — particles, verb conjugations, and sentence patterns explained with care.',
    href: '/grammar',
  },
  {
    jp: '単語',
    title: 'Vocabulary',
    desc: 'Curated word lists by theme and JLPT level. Kanji readings, example sentences, and memory aids.',
    href: '/vocabulary',
  },
  {
    jp: '読解',
    title: 'Reading',
    desc: 'Annotated texts from beginner manga to literary passages. Read, look up, and absorb naturally.',
    href: '/reading',
  },
  {
    jp: '文化',
    title: 'Culture',
    desc: 'Language lives in culture. Explore idioms, seasonal expressions, and the aesthetics behind the words.',
    href: '/culture',
  },
]

export default function HomePage() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const ring = ringRef.current
    if (!cursor || !ring) return

    let ringX = 0, ringY = 0
    let mouseX = 0, mouseY = 0

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      cursor.style.left = `${mouseX}px`
      cursor.style.top = `${mouseY}px`
    }

    const animate = () => {
      ringX += (mouseX - ringX) * 0.12
      ringY += (mouseY - ringY) * 0.12
      ring.style.left = `${ringX}px`
      ring.style.top = `${ringY}px`
      requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove)
    animate()

    // Hover effect on interactive elements
    const interactives = document.querySelectorAll('a, button, .card')
    interactives.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(2.5)'
        cursor.style.opacity = '0.5'
        ring.style.transform = 'translate(-50%, -50%) scale(1.5)'
      })
      el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)'
        cursor.style.opacity = '1'
        ring.style.transform = 'translate(-50%, -50%) scale(1)'
      })
    })

    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <>
      {/* Custom cursor */}
      <div className="cursor" ref={cursorRef} />
      <div className="cursor-ring" ref={ringRef} />

      {/* Grain overlay */}
      <div className="noise" aria-hidden />

      {/* Sakura petals */}
      {PETALS.map(p => (
        <div
          key={p.id}
          className="petal"
          style={{
            left: p.left,
            animationDuration: `${p.duration}, ${p.swayDuration}`,
            animationDelay: `${p.delay}, ${p.delay}`,
          }}
        >
          <PetalSVG size={p.size} />
        </div>
      ))}

      <div className="page-wrapper">
        {/* Navigation */}
        <nav>
          <a href="/" className="nav-logo">neshama.site</a>
          <ul className="nav-links">
            {NAV_LINKS.map(l => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div className="orb orb-1" aria-hidden />
          <div className="orb orb-2" aria-hidden />
          <div className="orb orb-3" aria-hidden />
          <div className="kanji-bg" aria-hidden>日本語</div>

          <p className="hero-eyebrow">日本語の学び場</p>

          <h1 className="hero-title">
            Learn Japanese<br />
            <em>beautifully.</em>
          </h1>

          <span className="hero-title-jp">美しく、日本語を学ぶ</span>

          <p className="hero-desc">
            A personal sanctuary for exploring the Japanese language —
            its grammar, its characters, its poetry, its soul.
          </p>

          <div className="hero-cta">
            <a href="#study" className="btn-primary">
              Begin the journey →
            </a>
            <a href="#about" className="btn-secondary">
              About this space
            </a>
          </div>

          <div className="scroll-hint" aria-hidden>
            <span>Scroll</span>
            <div className="scroll-line" />
          </div>
        </section>

        {/* Divider */}
        <div className="divider">
          <div className="divider-line" />
          <span className="divider-icon">桜</span>
          <div className="divider-line" />
        </div>

        {/* Study sections */}
        <section className="section" id="study">
          <p className="section-label">学習コンテンツ &nbsp;/&nbsp; Study Content</p>
          <h2 className="section-title">
            Every resource,<br />
            <em>thoughtfully crafted.</em>
          </h2>
          <p className="section-sub">
            From your first hiragana to advanced literary readings —
            structured paths that grow with you.
          </p>

          <div className="cards-grid">
            {CARDS.map(card => (
              <a key={card.jp} href={card.href} className="card">
                <div className="card-jp">{card.jp}</div>
                <h3 className="card-title">{card.title}</h3>
                <p className="card-desc">{card.desc}</p>
                <span className="card-arrow">↗</span>
              </a>
            ))}
          </div>
        </section>

        {/* Quote section */}
        <div className="quote-section">
          <blockquote className="quote-text">
            "Language is the road map of a culture.<br />
            It tells you where its people come from<br />
            and where they are going."
          </blockquote>
          <p className="quote-jp">言語は文化への道標</p>
        </div>

        {/* Divider */}
        <div className="divider">
          <div className="divider-line" />
          <span className="divider-icon">雪</span>
          <div className="divider-line" />
        </div>

        {/* Footer */}
        <footer>
          <p>© {new Date().getFullYear()} neshama.site — All rights reserved</p>
          <span className="footer-jp">日本語を愛して</span>
        </footer>
      </div>
    </>
  )
}
