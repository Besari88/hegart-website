/* Studiolicht: a soft light layer behind each content section (styles in css/studiolicht.css).
   The light follows the pointer; on touch screens it drifts slowly; with reduced motion it stays put. */
(() => {
  const SKIP = ".hero, .page-hero"
  const secs = [...document.querySelectorAll("section")].filter((s) => !s.matches(SKIP))
  if (!secs.length) return

  const isDark = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g)
      if (m && (m.length < 4 || +m[3] > 0)) return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2] < 110
    }
    return false
  }

  const items = secs.map((s) => {
    const layer = document.createElement("div")
    layer.className = "sl " + (isDark(s) ? "sl-dark" : "sl-light")
    layer.setAttribute("aria-hidden", "true")
    if (getComputedStyle(s).position === "static") s.style.position = "relative"
    s.classList.add("sl-host")
    s.append(layer)
    return { s, layer, x: 50, y: 35, on: false }
  })

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const touch = !matchMedia("(hover: hover)").matches

  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const it = items.find((i) => i.s === e.target)
    if (it) it.on = e.isIntersecting
  }))
  items.forEach((i) => io.observe(i.s))

  let px = innerWidth / 2, py = innerHeight * 0.35, running = false
  const start = () => { if (!running) { running = true; requestAnimationFrame(tick) } }
  addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; start() }, { passive: true })
  addEventListener("scroll", start, { passive: true })

  function tick(now) {
    let moving = touch
    items.forEach((it, i) => {
      if (!it.on) return
      const r = it.s.getBoundingClientRect()
      let tx, ty
      if (touch) {
        const a = now / 9000 + i
        tx = 50 + Math.sin(a) * 25
        ty = 40 + Math.cos(a * 0.7) * 18
      } else {
        tx = ((px - r.left) / r.width) * 100
        ty = ((py - r.top) / r.height) * 100
      }
      it.x += (tx - it.x) * 0.08
      it.y += (ty - it.y) * 0.08
      if (Math.abs(tx - it.x) + Math.abs(ty - it.y) > 0.05) moving = true
      it.layer.style.setProperty("--mx", it.x.toFixed(2) + "%")
      it.layer.style.setProperty("--my", it.y.toFixed(2) + "%")
    })
    if (moving) requestAnimationFrame(tick)
    else running = false
  }
  start()
})()
