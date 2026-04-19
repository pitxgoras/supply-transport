// SUPPLY TRANSPORT - MAIN JAVASCRIPT

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todas las funcionalidades
    initHeaderScroll();
    initMobileMenu();
    initSmoothScroll();
    initScrollAnimations();
    initStatCounter();
    initContactForm();
});

// Header scroll effect
function initHeaderScroll() {
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Menu mobile
function initMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const menu = document.getElementById('navMenu');
    
    if (toggle && menu) {
        toggle.addEventListener('click', function() {
            this.classList.toggle('active');
            menu.classList.toggle('active');
        });
        
        // Cerrar menu al hacer click en un enlace
        const links = menu.querySelectorAll('.nav-link');
        links.forEach(link => {
            link.addEventListener('click', function() {
                toggle.classList.remove('active');
                menu.classList.remove('active');
            });
        });
    }
}

// Smooth scroll para enlaces internos
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// Animaciones al hacer scroll
function initScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(element => {
        observer.observe(element);
    });
    
    // Activar elementos visibles al cargar
    elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
            element.classList.add('visible');
        }
    });
}

// Contador de estadisticas animado
function initStatCounter() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const targetNumber = parseInt(target.getAttribute('data-target'));
                let current = 0;
                const duration = 2000;
                const step = targetNumber / (duration / 16);
                
                const counter = setInterval(() => {
                    current += step;
                    
                    if (current >= targetNumber) {
                        target.textContent = targetNumber;
                        clearInterval(counter);
                    } else {
                        target.textContent = Math.floor(current);
                    }
                }, 16);
                
                observer.unobserve(target);
            }
        });
    }, {
        threshold: 0.5
    });
    
    statNumbers.forEach(number => {
        observer.observe(number);
    });
}

// Formulario de contacto
function initContactForm() {
    const form = document.getElementById('contactForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simular envio
            const submitBtn = form.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                alert('Mensaje enviado correctamente. Nos pondremos en contacto pronto.');
                form.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    }
}

// Actualizar enlace activo en navegacion
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href').substring(1);
        
        if (href === currentSection) {
            link.classList.add('active');
        }
    });
}

// Escuchar scroll para actualizar enlace activo
window.addEventListener('scroll', updateActiveNavLink);
window.addEventListener('load', updateActiveNavLink);