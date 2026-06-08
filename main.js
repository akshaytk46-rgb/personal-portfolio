/* ==========================================
   INTERACTIVE NETWORK TOPOLOGY BACKGROUND
   ========================================== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let devices = [];
let packets = [];
const maxDevices = 50;

// Mouse coordinates
let mouse = {
  x: null,
  y: null,
  radius: 120
};

window.addEventListener('mousemove', (event) => {
  mouse.x = event.x;
  mouse.y = event.y;
});

window.addEventListener('mouseout', () => {
  mouse.x = null;
  mouse.y = null;
});

// Resize Canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initNetwork();
}
window.addEventListener('resize', resizeCanvas);

// Define Network Device Types
const DEVICE_TYPES = {
  SERVER: 'server',
  ROUTER: 'router',
  CLIENT: 'client'
};

class NetworkDevice {
  constructor(type, x, y) {
    this.type = type;
    this.x = x || Math.random() * canvas.width;
    this.y = y || Math.random() * canvas.height;
    
    // Movement velocities
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    
    // Core sizing & colors
    if (type === DEVICE_TYPES.SERVER) {
      this.radius = 8;
      this.pulseRate = 0.05;
      this.pulseValue = 0;
      this.color = '--primary'; // Indigo/Primary
    } else if (type === DEVICE_TYPES.ROUTER) {
      this.radius = 5.5;
      this.color = '--accent'; // Teal/Accent
    } else {
      this.radius = 3.5;
      this.color = '--text-muted'; // Grey/Muted
    }
  }

  draw() {
    let colorValue = getComputedStyle(document.body).getPropertyValue(this.color).trim();
    ctx.fillStyle = colorValue;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Pulse effect for servers and routers
    if (this.type === DEVICE_TYPES.SERVER) {
      this.pulseValue += this.pulseRate;
      let waveRadius = this.radius + Math.sin(this.pulseValue) * 6;
      ctx.strokeStyle = colorValue;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(this.x, this.y, waveRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  update() {
    // Keep servers nearly stationary near coordinates
    if (this.type === DEVICE_TYPES.SERVER) {
      this.x += (Math.random() - 0.5) * 0.08;
      this.y += (Math.random() - 0.5) * 0.08;
    } else {
      // Wall boundary collision
      if (this.x < 20 || this.x > canvas.width - 20) this.vx = -this.vx;
      if (this.y < 20 || this.y > canvas.height - 20) this.vy = -this.vy;
      
      this.x += this.vx;
      this.y += this.vy;
    }

    // Mouse influence
    if (mouse.x !== null && mouse.y !== null) {
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let dist = Math.hypot(dx, dy);
      if (dist < mouse.radius && this.type === DEVICE_TYPES.CLIENT) {
        let force = (mouse.radius - dist) / mouse.radius;
        // Float away from mouse cursor
        this.x -= (dx / dist) * force * 1.2;
        this.y -= (dy / dist) * force * 1.2;
      }
    }
  }
}

// Data Packet class representing network traffic flow
class DataPacket {
  constructor(startDevice, endDevice) {
    this.startX = startDevice.x;
    this.startY = startDevice.y;
    this.endX = endDevice.x;
    this.endY = endDevice.y;
    this.progress = 0;
    this.speed = Math.random() * 0.02 + 0.01;
    this.color = getComputedStyle(document.body).getPropertyValue('--accent-light').trim();
  }

  draw() {
    // Calculate current coordinates along the path
    let currentX = this.startX + (this.endX - this.startX) * this.progress;
    let currentY = this.startY + (this.endY - this.startY) * this.progress;
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(currentX, currentY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  update() {
    this.progress += this.speed;
    return this.progress >= 1; // Returns true if packet arrived
  }
}

function initNetwork() {
  devices = [];
  packets = [];

  // Create core enterprise Server nodes
  devices.push(new NetworkDevice(DEVICE_TYPES.SERVER, canvas.width * 0.3, canvas.height * 0.4));
  devices.push(new NetworkDevice(DEVICE_TYPES.SERVER, canvas.width * 0.7, canvas.height * 0.45));
  devices.push(new NetworkDevice(DEVICE_TYPES.SERVER, canvas.width * 0.5, canvas.height * 0.6));

  // Create core Router nodes
  for (let i = 0; i < 6; i++) {
    devices.push(new NetworkDevice(DEVICE_TYPES.ROUTER));
  }

  // Create Client nodes
  for (let i = 0; i < maxDevices - 9; i++) {
    devices.push(new NetworkDevice(DEVICE_TYPES.CLIENT));
  }
}

function connectNetwork() {
  let primaryColorRaw = getComputedStyle(document.body).getPropertyValue('--primary-raw').trim();
  let borderRaw = getComputedStyle(document.body).getPropertyValue('--border-color-raw').trim();

  for (let i = 0; i < devices.length; i++) {
    let d1 = devices[i];

    // Find links for clients to routers, and routers to servers
    if (d1.type === DEVICE_TYPES.CLIENT) {
      // Find closest router
      let closestRouter = null;
      let minDist = Infinity;
      
      devices.forEach(d2 => {
        if (d2.type === DEVICE_TYPES.ROUTER) {
          let dist = Math.hypot(d1.x - d2.x, d1.y - d2.y);
          if (dist < minDist) {
            minDist = dist;
            closestRouter = d2;
          }
        }
      });

      if (closestRouter && minDist < 240) {
        ctx.strokeStyle = `rgba(${borderRaw}, 0.25)`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(d1.x, d1.y);
        ctx.lineTo(closestRouter.x, closestRouter.y);
        ctx.stroke();

        // Spawn mock traffic packet along active link
        if (Math.random() < 0.0015) {
          packets.push(new DataPacket(d1, closestRouter));
        }
      }
    }

    if (d1.type === DEVICE_TYPES.ROUTER) {
      // Connect to closest Server
      let closestServer = null;
      let minDist = Infinity;

      devices.forEach(d2 => {
        if (d2.type === DEVICE_TYPES.SERVER) {
          let dist = Math.hypot(d1.x - d2.x, d1.y - d2.y);
          if (dist < minDist) {
            minDist = dist;
            closestServer = d2;
          }
        }
      });

      if (closestServer) {
        ctx.strokeStyle = `rgba(${primaryColorRaw}, 0.2)`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(d1.x, d1.y);
        ctx.lineTo(closestServer.x, closestServer.y);
        ctx.stroke();

        // Spawn traffic packet from router to server
        if (Math.random() < 0.003) {
          packets.push(new DataPacket(d1, closestServer));
        }
      }
    }
  }

  // Draw active mouse hub connections
  if (mouse.x !== null && mouse.y !== null) {
    devices.forEach(device => {
      let dist = Math.hypot(device.x - mouse.x, device.y - mouse.y);
      if (dist < mouse.radius && (device.type === DEVICE_TYPES.ROUTER || device.type === DEVICE_TYPES.SERVER)) {
        ctx.strokeStyle = `rgba(${primaryColorRaw}, 0.35)`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(device.x, device.y);
        ctx.stroke();
      }
    });
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update & Draw Devices
  devices.forEach(device => {
    device.update();
    device.draw();
  });

  // Connect Topology
  connectNetwork();

  // Update & Draw Traffic Packets
  for (let i = packets.length - 1; i >= 0; i--) {
    let packet = packets[i];
    packet.draw();
    let arrived = packet.update();
    if (arrived) {
      packets.splice(i, 1); // Remove packet once it arrives
    }
  }

  requestAnimationFrame(animate);
}

// Initial Kick-off
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
initNetwork();
animate();


/* ==========================================
   LIGHT / DARK THEME SYSTEM
   ========================================== */
const themeToggleBtn = document.getElementById('theme-toggle-btn');

const currentTheme = localStorage.getItem('theme');

if (currentTheme === 'dark') {
  document.body.classList.remove('light-theme');
} else {
  document.body.classList.add('light-theme');
}

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  let theme = 'dark';
  if (document.body.classList.contains('light-theme')) {
    theme = 'light';
  }
  localStorage.setItem('theme', theme);
  
  // Re-generate nodes to capture color updates
  initNetwork();
});


/* ==========================================
   MOBILE MENU TOGGLE
   ========================================== */
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navigationMenu = document.getElementById('navigation-menu');
const navLinks = document.querySelectorAll('.nav-link');
const backToTopBtn = document.getElementById('back-to-top-btn');

mobileMenuBtn.addEventListener('click', () => {
  mobileMenuBtn.classList.toggle('open');
  navigationMenu.classList.toggle('open');
});

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileMenuBtn.classList.remove('open');
    navigationMenu.classList.remove('open');
  });
});

document.addEventListener('click', event => {
  if (!navigationMenu.contains(event.target) && !mobileMenuBtn.contains(event.target) && navigationMenu.classList.contains('open')) {
    mobileMenuBtn.classList.remove('open');
    navigationMenu.classList.remove('open');
  }
});

document.addEventListener('keyup', event => {
  if (event.key === 'Escape' && navigationMenu.classList.contains('open')) {
    mobileMenuBtn.classList.remove('open');
    navigationMenu.classList.remove('open');
  }
});


/* ==========================================
   HEADER SCROLL & SCROLL SPY
   ========================================== */
const mainHeader = document.getElementById('main-header');
const sections = document.querySelectorAll('section');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    mainHeader.classList.add('header-scrolled');
  } else {
    mainHeader.classList.remove('header-scrolled');
  }

  if (window.scrollY > 600) {
    backToTopBtn.classList.add('visible');
  } else {
    backToTopBtn.classList.remove('visible');
  }
});

backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const spyOptions = {
  root: null,
  rootMargin: '-30% 0px -60% 0px',
  threshold: 0
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${id}`) {
          link.classList.add('active');
        }
      });
    }
  });
}, spyOptions);

sections.forEach(section => observer.observe(section));


/* ==========================================
   PORTFOLIO CATEGORY FILTER
   ========================================== */
const filterButtons = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const filterValue = button.getAttribute('data-filter');

    projectCards.forEach(card => {
      const category = card.getAttribute('data-category');
      
      if (filterValue === 'all' || category === filterValue) {
        card.style.display = 'flex';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        }, 50);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.style.display = 'none';
        }, 300);
      }
    });
  });
});


/* ==========================================
   CONTACT FORM SUBMISSION FEEDBACK
   ========================================== */
const contactForm = document.getElementById('portfolio-contact-form');
const formStatus = document.getElementById('form-status-message');
const submitBtn = document.getElementById('form-submit-btn');

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();

  formStatus.className = 'form-status';
  formStatus.style.display = 'none';
  
  const name = document.getElementById('form-name').value.trim();
  const email = document.getElementById('form-email').value.trim();
  const subject = document.getElementById('form-subject').value.trim();
  const message = document.getElementById('form-message').value.trim();

  if (!name || !email || !subject || !message) {
    showFormStatus('Please fill in all form fields.', 'error');
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showFormStatus('Please provide a valid email address.', 'error');
    return;
  }

  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.7';
  submitBtn.innerHTML = 'Sending Ticket...';

  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.innerHTML = originalBtnText;

    showFormStatus('Ticket submitted successfully! I will contact you shortly.', 'success');
    contactForm.reset();
  }, 1500);
});

function showFormStatus(text, type) {
  formStatus.innerText = text;
  formStatus.classList.add(type);
  formStatus.style.display = 'block';
  formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


/* ==========================================
   SCROLL REVEAL ANIMATIONS
   ========================================== */
document.documentElement.classList.add('js-enabled');

document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, {
    root: null,
    threshold: 0.05,
    rootMargin: '0px 0px -100px 0px'
  });

  revealElements.forEach(element => revealObserver.observe(element));
});
