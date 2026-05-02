/* =========================================================
   state.js — управление состоянием интерфейса НЕАЛИТ
   Этап 1:
   - вход по любой клавише и клику;
   - защита от повторного запуска;
   - плавный скролл к секциям;
   - Intersection Observer для анимаций;
   - JS-параллакс фонового изображения.
   ========================================================= */

(function () {
    "use strict";

    const AppState = {
        isEntered: false,
        isTransitioning: false,
        currentSection: "catalog",
        headerHeight: 150
    };

    const SELECTORS = {
        preloader: "#preloader",
        intro: "#intro-screen",
        introLogo: "#intro-3d-logo",
        introTitle: "#intro-brand-title",
        prompt: "#enter-prompt",
        header: "#site-header",
        main: "#site-main",
        navLinks: ".nav-link",
        revealSections: ".reveal-section"
    };

    function getElement(selector) {
        return document.querySelector(selector);
    }

    function getElements(selector) {
        return Array.from(document.querySelectorAll(selector));
    }

    function lockScroll() {
        document.body.classList.add("no-scroll");
    }

    function unlockScroll() {
        document.body.classList.remove("no-scroll");
    }

    function hidePreloader() {
        const preloader = getElement(SELECTORS.preloader);

        if (!preloader) {
            return;
        }

        window.setTimeout(function () {
            preloader.classList.add("is-hidden");
        }, 450);
    }

    function markNavigationActive(sectionId) {
        AppState.currentSection = sectionId;

        getElements(SELECTORS.navLinks).forEach(function (link) {
            const target = link.getAttribute("data-target");
            link.classList.toggle("is-active", target === sectionId);
        });
    }

    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);

        if (!section) {
            return;
        }

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        markNavigationActive(sectionId);
    }

    function completeEnterTransition() {
        const intro = getElement(SELECTORS.intro);

        if (intro) {
            intro.classList.add("is-hidden");
        }

        document.body.classList.add("is-entered");
        unlockScroll();

        AppState.isTransitioning = false;

        if (window.NealitLogo && typeof window.NealitLogo.setIntroFinished === "function") {
            window.NealitLogo.setIntroFinished();
        }

        if (window.NealitLogo && typeof window.NealitLogo.refreshAll === "function") {
            window.NealitLogo.refreshAll();
        }

        window.setTimeout(function () {
            scrollToSection("catalog");
        }, 120);
    }

    function startExperience() {
        const intro = getElement(SELECTORS.intro);
        const prompt = getElement(SELECTORS.prompt);
        const header = getElement(SELECTORS.header);
        const main = getElement(SELECTORS.main);
        const introLogo = getElement(SELECTORS.introLogo);
        const introTitle = getElement(SELECTORS.introTitle);

        if (AppState.isEntered || AppState.isTransitioning) {
            return;
        }

        AppState.isEntered = true;
        AppState.isTransitioning = true;

        if (header) {
            header.classList.remove("is-hidden");
            header.classList.add("is-visible");
        }

        if (main) {
            main.classList.remove("is-hidden");
        }

        if (typeof gsap !== "undefined") {
            gsap.set(header, { autoAlpha: 0, y: -24 });
            gsap.set(main, { autoAlpha: 0, y: 26 });

            const timeline = gsap.timeline({
                defaults: {
                    ease: "power3.inOut"
                },
                onComplete: completeEnterTransition
            });

            timeline
                .to(prompt, {
                    autoAlpha: 0,
                    y: 12,
                    duration: 0.35
                }, 0)
                .to(introLogo, {
                    scale: 0.72,
                    y: -26,
                    duration: 1.1
                }, 0)
                .to(introTitle, {
                    autoAlpha: 0,
                    y: -80,
                    duration: 0.95
                }, 0.12)
                .to(intro, {
                    autoAlpha: 0,
                    duration: 0.78
                }, 0.78)
                .to(header, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.72
                }, 0.92)
                .to(main, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.72
                }, 1.02);

            return;
        }

        if (prompt) {
            prompt.style.opacity = "0";
        }

        if (intro) {
            intro.style.opacity = "0";
        }

        if (header) {
            header.style.opacity = "1";
        }

        if (main) {
            main.style.opacity = "1";
        }

        window.setTimeout(completeEnterTransition, 650);
    }

    function handleEnterEvent(event) {
        if (event.type === "keydown") {
            const ignoredKeys = ["Shift", "Control", "Alt", "Meta", "Tab", "CapsLock"];

            if (ignoredKeys.includes(event.key)) {
                return;
            }

            event.preventDefault();
        }

        startExperience();
    }

    function bindEnterEvents() {
        const intro = getElement(SELECTORS.intro);
        const prompt = getElement(SELECTORS.prompt);

        document.addEventListener("keydown", handleEnterEvent);

        if (intro) {
            intro.addEventListener("click", handleEnterEvent);
        }

        if (prompt) {
            prompt.addEventListener("click", handleEnterEvent);
        }
    }

function bindNavigation() {
    const navLinks = getElements(SELECTORS.navLinks);

    navLinks.forEach(function (link) {
        link.addEventListener("click", function () {
            // Убираем подсветку с других кнопок
            navLinks.forEach(function (btn) {
                btn.classList.remove("is-active");
            });

            // Добавляем подсветку на кликнутую кнопку
            link.classList.add("is-active");

            const target = link.getAttribute("data-target");

            if (!target) {
                return;
            }

            // Плавная прокрутка к нужной секции
            scrollToSection(target);
        });
    });
}

    function initRevealObserver() {
        const sections = getElements(SELECTORS.revealSections);

        if (!("IntersectionObserver" in window)) {
            sections.forEach(function (section) {
                section.classList.add("is-visible");
            });
            return;
        }

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                }
            });
        }, {
            threshold: 0.18,
            rootMargin: "0px 0px -8% 0px"
        });

        sections.forEach(function (section) {
            observer.observe(section);
        });
    }

    function initNavigationObserver() {
        const sections = ["catalog", "about", "author", "contacts"]
            .map(function (id) {
                return document.getElementById(id);
            })
            .filter(Boolean);

        if (!("IntersectionObserver" in window)) {
            return;
        }

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    markNavigationActive(entry.target.id);
                }
            });
        }, {
            threshold: 0.22,
            rootMargin: "-42% 0px -46% 0px"
        });

        sections.forEach(function (section) {
            observer.observe(section);
        });
    }

/* Функция для изменения прозрачности затемнения при прокрутке */

function updateBackgroundOpacity() {
    const scrollPosition = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const opacity = Math.min(1, scrollPosition / maxScroll);  // Вычисляем прозрачность в зависимости от прокрутки

    // Устанавливаем прозрачность на псевдо-элемент
    document.body.style.setProperty('--background-opacity', opacity);
}

/* Функция для изменения позиции фона при прокрутке */
function updateBackgroundPosition() {
    const offset = Math.round(window.scrollY * -0.12);  // Для плавного параллакса фона
    document.body.style.backgroundPosition = `center ${offset}px`;

    updateBackgroundOpacity();  // Обновляем прозрачность затемнения
}

function initBackgroundParallax() {
    let ticking = false;

    window.addEventListener("scroll", function () {
        if (ticking) {
            return;
        }

        ticking = true;
        window.requestAnimationFrame(updateBackgroundPosition);
    }, { passive: true });
}

    function init() {
        lockScroll();
        hidePreloader();
        bindEnterEvents();
        bindNavigation();
        initRevealObserver();
        initNavigationObserver();
        initBackgroundParallax();
    }

    window.AppState = AppState;
    window.NealitState = {
        startExperience: startExperience,
        scrollToSection: scrollToSection,
        markNavigationActive: markNavigationActive
    };

    document.addEventListener("DOMContentLoaded", init);
}());