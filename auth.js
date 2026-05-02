/* =========================================================
   auth.js — email-авторизация НЕАЛИТ
   Этап 1:
   - пользователь вводит email;
   - код имитируется через console.log;
   - пользователь вводит код;
   - сессия сохраняется в localStorage или sessionStorage;
   - есть "помни меня" и "выйти".
   ========================================================= */

(function () {
    "use strict";

    const STORAGE_KEYS = {
        session: "nealit_user_session",
        sendAttempts: "nealit_auth_send_attempts",
        verification: "nealit_auth_verification"
    };

    const CONFIG = {
        codeTtlMs: 5 * 60 * 1000,
        sessionTtlMs: 30 * 24 * 60 * 60 * 1000,
        maxSendAttempts: 3,
        maxVerifyAttempts: 3,
        sendWindowMs: 15 * 60 * 1000
    };

    let successCallback = null;

    function getElement(id) {
        return document.getElementById(id);
    }

    function sanitizeEmail(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[<>"'`\\]/g, "");
    }

    function sanitizeCode(value) {
        return String(value || "").replace(/\D/g, "").slice(0, 6);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function generateCode() {
        return String(Math.floor(100000 + Math.random() * 900000));
    }

    function generateToken() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return "nealit_" + window.crypto.randomUUID();
        }

        return "nealit_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    }

    function safeParse(value, fallback) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function getRecentSendAttempts() {
        const now = Date.now();
        const attempts = safeParse(localStorage.getItem(STORAGE_KEYS.sendAttempts), []);

        return attempts.filter(function (timestamp) {
            return now - timestamp < CONFIG.sendWindowMs;
        });
    }

    function saveSendAttempt() {
        const attempts = getRecentSendAttempts();
        attempts.push(Date.now());
        localStorage.setItem(STORAGE_KEYS.sendAttempts, JSON.stringify(attempts));
    }

    function setMessage(text, type) {
        const message = getElement("auth-message");

        if (!message) {
            return;
        }

        message.textContent = text || "";
        message.classList.remove("is-error", "is-success");

        if (type) {
            message.classList.add("is-" + type);
        }
    }

    function openModal(callback) {
        const modal = getElement("auth-modal");
        const emailInput = getElement("auth-email");

        successCallback = typeof callback === "function" ? callback : null;

        if (!modal) {
            return;
        }

        modal.classList.remove("is-hidden");
        modal.setAttribute("aria-hidden", "false");

        setMessage("", "");

        window.setTimeout(function () {
            if (emailInput) {
                emailInput.focus();
            }
        }, 80);
    }

    function closeModal() {
        const modal = getElement("auth-modal");

        if (!modal) {
            return;
        }

        modal.classList.add("is-hidden");
        modal.setAttribute("aria-hidden", "true");
    }

    function saveVerification(email, code) {
        const verification = {
            email: email,
            code: code,
            createdAt: Date.now(),
            expiresAt: Date.now() + CONFIG.codeTtlMs,
            verifyAttempts: 0
        };

        sessionStorage.setItem(STORAGE_KEYS.verification, JSON.stringify(verification));
    }

    function getVerification() {
        return safeParse(sessionStorage.getItem(STORAGE_KEYS.verification), null);
    }

    function updateVerification(verification) {
        sessionStorage.setItem(STORAGE_KEYS.verification, JSON.stringify(verification));
    }

    function clearVerification() {
        sessionStorage.removeItem(STORAGE_KEYS.verification);
    }

    function sendCode() {
        const emailInput = getElement("auth-email");
        const codeRow = getElement("auth-code-row");
        const codeInput = getElement("auth-code");
        const email = sanitizeEmail(emailInput ? emailInput.value : "");

        if (!isValidEmail(email)) {
            setMessage("Введите корректный email.", "error");
            return;
        }

        const attempts = getRecentSendAttempts();

        if (attempts.length >= CONFIG.maxSendAttempts) {
            setMessage("Слишком много запросов кода. Повторите позже.", "error");
            return;
        }

        const code = generateCode();

        saveSendAttempt();
        saveVerification(email, code);

        console.log("%c[НЕАЛИТ] Код авторизации для " + email + ": " + code, "color:#9cc8ff;font-weight:bold;");

        if (codeRow) {
            codeRow.classList.remove("is-hidden");
        }

        if (codeInput) {
            codeInput.value = "";
            codeInput.focus();
        }

        setMessage("Код создан. Откройте консоль браузера: F12 → Console.", "success");
    }

    function saveSession(email, remember) {
        const session = {
            email: email,
            token: generateToken(),
            createdAt: Date.now(),
            expiresAt: Date.now() + CONFIG.sessionTtlMs
        };

        const storage = remember ? localStorage : sessionStorage;

        localStorage.removeItem(STORAGE_KEYS.session);
        sessionStorage.removeItem(STORAGE_KEYS.session);

        storage.setItem(STORAGE_KEYS.session, JSON.stringify(session));

        document.dispatchEvent(new CustomEvent("auth:changed", {
            detail: session
        }));

        return session;
    }

    function getSession() {
        const localSession = safeParse(localStorage.getItem(STORAGE_KEYS.session), null);
        const sessionSession = safeParse(sessionStorage.getItem(STORAGE_KEYS.session), null);
        const session = localSession || sessionSession;

        if (!session || !session.token || !session.email || !session.expiresAt) {
            return null;
        }

        if (Date.now() > Number(session.expiresAt)) {
            logout();
            return null;
        }

        return session;
    }

    function isAuthorized() {
        return Boolean(getSession());
    }

    function verifyCode() {
        const codeInput = getElement("auth-code");
        const rememberInput = getElement("auth-remember");
        const enteredCode = sanitizeCode(codeInput ? codeInput.value : "");
        const verification = getVerification();

        if (!verification) {
            setMessage("Сначала запросите код.", "error");
            return;
        }

        if (Date.now() > Number(verification.expiresAt)) {
            clearVerification();
            setMessage("Код устарел. Запросите новый код.", "error");
            return;
        }

        if (verification.verifyAttempts >= CONFIG.maxVerifyAttempts) {
            clearVerification();
            setMessage("Превышено количество попыток. Запросите новый код.", "error");
            return;
        }

        if (enteredCode.length !== 6) {
            setMessage("Введите 6 цифр кода.", "error");
            return;
        }

        if (enteredCode !== verification.code) {
            verification.verifyAttempts += 1;
            updateVerification(verification);
            setMessage("Неверный код. Осталось попыток: " + (CONFIG.maxVerifyAttempts - verification.verifyAttempts) + ".", "error");
            return;
        }

        const remember = rememberInput ? rememberInput.checked : true;
        const session = saveSession(verification.email, remember);

        clearVerification();
        setMessage("Вход выполнен: " + session.email, "success");
        updateAuthButtons();

        window.setTimeout(function () {
            closeModal();

            if (typeof successCallback === "function") {
                successCallback(session);
            }

            successCallback = null;
        }, 450);
    }

    function logout() {
        localStorage.removeItem(STORAGE_KEYS.session);
        sessionStorage.removeItem(STORAGE_KEYS.session);
        clearVerification();

        document.dispatchEvent(new CustomEvent("auth:changed", {
            detail: null
        }));

        updateAuthButtons();
    }

    function updateAuthButtons() {
        const logoutButton = getElement("auth-logout-btn");
        const session = getSession();

        if (!logoutButton) {
            return;
        }

        logoutButton.classList.toggle("is-hidden", !session);
    }

    function bindEvents() {
        const sendButton = getElement("auth-send-code-btn");
        const verifyButton = getElement("auth-verify-code-btn");
        const logoutButton = getElement("auth-logout-btn");
        const codeInput = getElement("auth-code");

        document.querySelectorAll("[data-auth-close]").forEach(function (element) {
            element.addEventListener("click", closeModal);
        });

        if (sendButton) {
            sendButton.addEventListener("click", sendCode);
        }

        if (verifyButton) {
            verifyButton.addEventListener("click", verifyCode);
        }

        if (logoutButton) {
            logoutButton.addEventListener("click", function () {
                logout();
                setMessage("Вы вышли из аккаунта.", "success");
            });
        }

        if (codeInput) {
            codeInput.addEventListener("input", function () {
                codeInput.value = sanitizeCode(codeInput.value);
            });

            codeInput.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    verifyCode();
                }
            });
        }

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeModal();
            }
        });

        updateAuthButtons();
    }

    window.AppAuth = {
        openModal: openModal,
        closeModal: closeModal,
        sendCode: sendCode,
        verifyCode: verifyCode,
        logout: logout,
        getSession: getSession,
        isAuthorized: isAuthorized
    };

    document.addEventListener("DOMContentLoaded", bindEvents);
}());