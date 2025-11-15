// Welcome Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('themeToggle');
  const particles = document.getElementById('particles');

  function applyTheme(theme) {
    const icon = themeToggle?.querySelector('i');
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      icon?.classList.remove('fa-moon');
      icon?.classList.add('fa-sun');
    } else {
      document.body.classList.remove('dark-mode');
      icon?.classList.remove('fa-sun');
      icon?.classList.add('fa-moon');
    }
  }

  const savedTheme = localStorage.getItem('os-visualizer-theme') || 'light';
  applyTheme(savedTheme);

  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(newTheme);
      localStorage.setItem('os-visualizer-theme', newTheme);
    });
  }

  // Create particles
  function createParticles() {
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.width = particle.style.height = Math.random() * 4 + 2 + 'px';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
      particles.appendChild(particle);
    }
  }

  // Feature card click handlers
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach(card => {
    card.addEventListener('click', function() {
      const link = this.dataset.link;
      if (link) {
        window.location.href = link;
      }
    });
  });

  // Initialize
  createParticles();
});

