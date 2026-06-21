/* ============================================
   DXIO Portfolio — script.js
   Handles: nav scroll, blobs, particles,
   orbit ring, scroll reveal, tilt cards
============================================ */

// ——— Utility ———
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ——— Nav: add glass on scroll ———
const nav = $('#nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ——— Animated blobs (organic SVG morphing) ———
// Spline-based blob generator
function blobPath(cx, cy, r, numPoints, seed) {
  const angleStep = (Math.PI * 2) / numPoints;
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const rand = 0.7 + 0.6 * Math.sin(seed + i * 1.9) * Math.sin(seed * 0.7 + i * 2.3);
    const pr = r * rand;
    points.push([
      cx + pr * Math.cos(angle),
      cy + pr * Math.sin(angle)
    ]);
  }
  // Build smooth closed path
  let d = '';
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const pn = points[(i + 1) % points.length];
    const pm = points[(i - 1 + points.length) % points.length];
    if (i === 0) d += `M ${p[0].toFixed(1)} ${p[1].toFixed(1)} `;
    const cp1x = p[0] + (pn[0] - pm[0]) * 0.18;
    const cp1y = p[1] + (pn[1] - pm[1]) * 0.18;
    const cp2x = pn[0] - (points[(i + 2) % points.length][0] - p[0]) * 0.18;
    const cp2y = pn[1] - (points[(i + 2) % points.length][1] - p[1]) * 0.18;
    d += `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${pn[0].toFixed(1)} ${pn[1].toFixed(1)} `;
  }
  return d + 'Z';
}

// Animate each blob independently
const blobDefs = [
  { el: $('#blob1Path'), seed: 0,    speed: 0.00018, cx: 200, cy: 200, r: 155, pts: 8 },
  { el: $('#blob2Path'), seed: 2.1,  speed: 0.00013, cx: 200, cy: 200, r: 150, pts: 7 },
  { el: $('#blob3Path'), seed: 4.3,  speed: 0.00020, cx: 200, cy: 200, r: 145, pts: 8 },
  { el: $('#blob4Path'), seed: 1.4,  speed: 0.00015, cx: 200, cy: 200, r: 140, pts: 9 },
];

function animateBlobs(t) {
  blobDefs.forEach(b => {
    if (b.el) {
      b.el.setAttribute('d', blobPath(b.cx, b.cy, b.r, b.pts, b.seed + t * b.speed));
    }
  });
  requestAnimationFrame(animateBlobs);
}
requestAnimationFrame(animateBlobs);

// ——— Parallax blobs on mouse move ———
let mouse = { x: 0.5, y: 0.5 };
let smoothMouse = { x: 0.5, y: 0.5 };

document.addEventListener('mousemove', e => {
  mouse.x = e.clientX / window.innerWidth;
  mouse.y = e.clientY / window.innerHeight;
}, { passive: true });

const blobEls = [
  { el: $('.blob-1'), factorX: 30,  factorY: 20  },
  { el: $('.blob-2'), factorX: -25, factorY: -18 },
  { el: $('.blob-3'), factorX: 20,  factorY: -25 },
  { el: $('.blob-4'), factorX: -20, factorY: 20  },
];

function lerpMouse() {
  smoothMouse.x += (mouse.x - smoothMouse.x) * 0.05;
  smoothMouse.y += (mouse.y - smoothMouse.y) * 0.05;
  const dx = smoothMouse.x - 0.5;
  const dy = smoothMouse.y - 0.5;
  blobEls.forEach(b => {
    if (b.el) {
      b.el.style.transform = `translate(${dx * b.factorX}px, ${dy * b.factorY}px)`;
    }
  });
  requestAnimationFrame(lerpMouse);
}
requestAnimationFrame(lerpMouse);

// ——— Profile ring SVG (morphing outline) ———
const ringPath = $('#ringPath');
function profileRingPath(seed) {
  return blobPath(110, 110, 98, 7, seed);
}

let ringSeed = 0;
function animateRing(t) {
  ringSeed += 0.0003;
  if (ringPath) ringPath.setAttribute('d', profileRingPath(ringSeed + t * 0.0001));
  requestAnimationFrame(animateRing);
}
requestAnimationFrame(animateRing);

// ——— Particles canvas ———
const canvas = $('#particlesCanvas');
const ctx2d = canvas ? canvas.getContext('2d') : null;

let particles = [];
const PARTICLE_COUNT = 38;

function resizeCanvas() {
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const colors = ['#A78BFA', '#FF6B6B', '#FFB347', '#6EE7B7', '#60A5FA'];

function createParticle() {
  return {
    x:  Math.random() * (canvas ? canvas.width  : 800),
    y:  Math.random() * (canvas ? canvas.height : 600),
    r:  1.2 + Math.random() * 2.2,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
    alpha: 0.3 + Math.random() * 0.5,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.01 + Math.random() * 0.02
  };
}

for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());

function drawParticles() {
  if (!canvas || !ctx2d) return;
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.pulse += p.pulseSpeed;
    const pulseAlpha = p.alpha * (0.75 + 0.25 * Math.sin(p.pulse));

    // Wrap
    if (p.x < -10) p.x = canvas.width + 10;
    if (p.x > canvas.width + 10) p.x = -10;
    if (p.y < -10) p.y = canvas.height + 10;
    if (p.y > canvas.height + 10) p.y = -10;

    ctx2d.save();
    ctx2d.globalAlpha = pulseAlpha;
    ctx2d.fillStyle = p.color;
    ctx2d.beginPath();
    ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.restore();
  });

  // Draw subtle connecting lines between close particles
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        ctx2d.save();
        ctx2d.globalAlpha = (1 - dist / 100) * 0.08;
        ctx2d.strokeStyle = particles[i].color;
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        ctx2d.moveTo(particles[i].x, particles[i].y);
        ctx2d.lineTo(particles[j].x, particles[j].y);
        ctx2d.stroke();
        ctx2d.restore();
      }
    }
  }

  requestAnimationFrame(drawParticles);
}
requestAnimationFrame(drawParticles);

// ——— Scroll Reveal ———
const revealEls = $$('.reveal');

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => observer.observe(el));

// Staggered reveal for skill cards
$$('.skill-card').forEach((card, i) => {
  card.classList.add('reveal');
  card.style.transitionDelay = `${i * 0.08}s`;
  observer.observe(card);
});

// Staggered reveal for project cards
$$('.project-card').forEach((card, i) => {
  card.classList.add('reveal');
  card.style.transitionDelay = `${i * 0.12}s`;
  observer.observe(card);
});

// Reveal about grid children
$$('.about-headline, .about-body').forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = `${i * 0.15}s`;
  observer.observe(el);
});

// Reveal section titles
$$('.section-title, .section-label').forEach((el, i) => {
  el.classList.add('reveal');
  observer.observe(el);
});

// ——— Subtle 3D Tilt on project cards ———
$$('[data-tilt]').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `perspective(800px) rotateY(${dx * 5}deg) rotateX(${-dy * 4}deg) translateY(-4px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease, border-color 0.3s';
    setTimeout(() => { card.style.transition = ''; }, 500);
  });
});

// ——— Smooth active nav link highlight ———
const sections = $$('section[id], footer');
const navLinks = $$('.nav-links a');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.style.color = '');
      const link = navLinks.find(a => a.getAttribute('href') === `#${e.target.id}`);
      if (link) link.style.color = 'var(--ink)';
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));
