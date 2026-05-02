// js/state.js
// =========================================
// УПРАВЛЕНИЕ СОСТОЯНИЕМ ПРИЛОЖЕНИЯ И ПЕРЕХОДАМИ
// Исправлено: заголовок появляется на месте, идеальное выравнивание
// =========================================

const AppState = {
    isEntered: false,
    currentSection: 'catalog',
    bgLayer: null,
    brandTitle: null,

    init() {
        this.cacheElements();
        this.bindEvents();
        this.hidePreloader();
        this.initParallax();
    },

    cacheElements() {
        this.preloader = document.getElementById('preloader');
        this.brandTitle = document.querySelector('.brand-title');
        this.enterPrompt = document.getElementById('enter-prompt');
        this.logoWrapper = document.getElementById('logo-wrapper');
        this.header = document.getElementById('site-header');
        this.mainContent = document.getElementById('main-content');
        this.sections = document.querySelectorAll('.content-section');
        this.navLinks = document.querySelectorAll('#main-nav a');
        this.backBtn = document.getElementById('back-to-catalog');
        this.bgLayer = document.getElementById('bg-layer');
        this.body = document.body;
    },

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.isEntered) this.enterSite();
        });
        this.enterPrompt.addEventListener('click', () => {
            if (!this.isEntered) this.enterSite();
        });
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(link.dataset.section);
            });
        });
        this.backBtn.addEventListener('click', () => {
            this.switchSection('catalog');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    },

    hidePreloader() {
        setTimeout(() => {
            this.preloader.classList.add('fade-out');
            setTimeout(() => { this.preloader.style.display = 'none'; }, 600);
            
            // 🔹 ЗАГОЛОВОК ПРОСТО ПРОЯВЛЯЕТСЯ (opacity), не двигаясь
            // Он уже стоит в CSS на позиции top: 50%, transform: -260px (над логотипом)
            gsap.to(this.brandTitle, { 
                opacity: 1, 
                duration: 1.5, 
                ease: 'power2.out', 
                delay: 0.3 
            });
        }, 800);
    },

    initParallax() {
        if (!this.bgLayer) return;
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const offset = window.scrollY * 0.4;
                    this.bgLayer.style.backgroundPosition = `center ${-offset}px`;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    },

    enterSite() {
        if (this.isEntered) return;
        this.isEntered = true;
        this.body.style.overflow = 'auto';

        const tl = gsap.timeline();

        // 1. Исчезновение подсказки
        tl.to(this.enterPrompt, { opacity: 0, y: 30, duration: 0.5, ease: 'power2.in' }, 0);

        // 2. 📜 Заголовок поднимается в верхний ряд шапки
        // Header height = 130px. Row 1 is top.
        tl.to(this.brandTitle, { 
            top: '18px', 
            transform: 'translate(-50%, 0)', // Сбрасываем смещение Y
            duration: 1.4, 
            ease: 'power3.inOut' 
        }, 0.2);

        // 3. 🔄 Сброс камеры + эффект уменьшения (Z: 5 -> Z: 9.5)
        if (window.Logo3D) {
            const controls = window.Logo3D.controls;
            const camera = window.Logo3D.camera;

            controls.enabled = false;
            controls.enableDamping = false;
            controls.autoRotate = false;
            controls.update();

            tl.to(camera.position, { x: 0, y: 0, z: 9.5, duration: 1.2, ease: "power2.inOut" }, 0.2);
            tl.to(controls.target, { x: 0, y: 0, z: 0, duration: 1.2, ease: "power2.inOut" }, 0.2);
        }

        // 4. 🕊 Перелёт логотипа в центральный ряд шапки
        // Header height = 130px. Middle is approx 65px. Logo size 46px. Top = ~42px.
        tl.to(this.logoWrapper, {
            top: '42px', left: '50%', scale: 0.115, xPercent: -50,
            duration: 1.8, ease: 'power4.inOut',
            onUpdate: () => { if(window.Logo3D) window.Logo3D.onResize(); },
            onComplete: () => { this.logoWrapper.style.pointerEvents = 'none'; }
        }, 1.4);

        if (window.Logo3D) {
            tl.to(window.Logo3D.camera.position, { z: 5, duration: 1.8, ease: 'power4.inOut' }, 1.4);
        }

        // 5. Появление интерфейса
        tl.to([this.header, this.mainContent], {
            opacity: 1, transform: 'translateY(0)', duration: 1.0, ease: 'power2.out', stagger: 0.2
        }, 2.2);

        tl.fromTo(this.sections, { opacity: 0, y: 40 }, {
            opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out'
        }, 2.4);

        // 6. Разблокировка и режим шапки
        tl.call(() => {
            if (window.Logo3D) {
                window.Logo3D.controls.enabled = true;
                window.Logo3D.controls.enableDamping = true;
                window.Logo3D.controls.update();
                window.Logo3D.setMode('header');
            }
        }, null, "+=0.1");
    },

    switchSection(sectionId) {
        this.sections.forEach(sec => { sec.classList.remove('visible'); sec.style.display = 'none'; });
        const target = document.getElementById(`${sectionId}-section`);
        if (target) {
            target.style.display = 'block';
            setTimeout(() => target.classList.add('visible'), 50);
        }
        this.navLinks.forEach(link => {
            link.style.opacity = link.dataset.section === sectionId ? '1' : '0.6';
            link.style.fontWeight = link.dataset.section === sectionId ? '600' : '500';
        });
        this.currentSection = sectionId;
    }
};

document.addEventListener('DOMContentLoaded', () => { AppState.init(); });