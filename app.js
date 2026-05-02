/* =========================================================
   app.js — каталог, карточка товара, заказ
   Этап 1:
   - products.js заменён на fetch("./data/products.json");
   - каталог не скрывает остальные секции;
   - карточка товара раскрывается внутри лендинга;
   - заказ требует email-авторизацию;
   - ввод санитизируется перед обработкой.
   ========================================================= */

(function () {
    "use strict";

    const App = {
        products: [],
        selectedProduct: null,

        elements: {
            grid: null,
            detail: null,
            orderPanel: null,
            orderForm: null,
            orderTitle: null,
            orderPrice: null,
            orderProductId: null,
            authMiniPanel: null,
            toast: null
        },

        async init() {
            this.cacheElements();
            this.bindEvents();
            this.updateAuthPanel();

            await this.loadProducts();
            this.renderCatalog();
        },

        cacheElements() {
            this.elements.grid = document.getElementById("product-grid");
            this.elements.detail = document.getElementById("product-detail");
            this.elements.orderPanel = document.getElementById("order-panel");
            this.elements.orderForm = document.getElementById("order-form");
            this.elements.orderTitle = document.getElementById("order-product-title");
            this.elements.orderPrice = document.getElementById("order-product-price");
            this.elements.orderProductId = document.getElementById("order-product-id");
            this.elements.authMiniPanel = document.getElementById("auth-mini-panel");
            this.elements.toast = document.getElementById("toast");
        },

        bindEvents() {
            document.addEventListener("click", (event) => {
                const productButton = event.target.closest("[data-product-id]");
                const actionButton = event.target.closest("[data-action]");
                const openAuthButton = event.target.closest("#open-auth-btn");
                const logoutInlineButton = event.target.closest("#logout-inline-btn");
                const closeOrderButton = event.target.closest("#close-order-panel");

                if (productButton && !actionButton) {
                    const productId = productButton.getAttribute("data-product-id");
                    this.openProductDetail(productId);
                    return;
                }

                if (actionButton) {
                    const action = actionButton.getAttribute("data-action");
                    const productId = actionButton.getAttribute("data-product-id");

                    if (action === "open-product") {
                        this.openProductDetail(productId);
                    }

                    if (action === "buy-product") {
                        this.startOrder(productId);
                    }

                    return;
                }

                if (openAuthButton && window.AppAuth) {
                    window.AppAuth.openModal();
                    return;
                }

                if (logoutInlineButton && window.AppAuth) {
                    window.AppAuth.logout();
                    this.showToast("Вы вышли из аккаунта.");
                    return;
                }

                if (closeOrderButton) {
                    this.closeOrderPanel();
                }
            });

            if (this.elements.orderForm) {
                this.elements.orderForm.addEventListener("submit", (event) => {
                    event.preventDefault();
                    this.submitOrder();
                });
            }

            document.addEventListener("auth:changed", () => {
                this.updateAuthPanel();
            });
        },

        async loadProducts() {
            if (!this.elements.grid) {
                return;
            }

            try {
                const response = await fetch("./data/products.json", {
                    cache: "no-store"
                });

                if (!response.ok) {
                    throw new Error("Ошибка загрузки products.json: " + response.status);
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error("products.json должен содержать массив товаров.");
                }

                this.products = data.map((product) => this.normalizeProduct(product));
            } catch (error) {
                console.error("[НЕАЛИТ] Ошибка каталога:", error);

                this.elements.grid.innerHTML = `
                    <div class="loading-card">
                        Не удалось загрузить каталог. Проверьте файл data/products.json и запуск через Live Server.
                    </div>
                `;
            }
        },

        normalizeProduct(product) {
            return {
                id: this.cleanText(product.id),
                name: this.cleanText(product.name),
                price: Number(product.price) || 0,
                material: this.cleanText(product.material),
                image: this.cleanText(product.image),
                category: this.cleanText(product.category),
                description: this.cleanText(product.description),
                details: this.cleanText(product.details)
            };
        },

        renderCatalog() {
            if (!this.elements.grid) {
                return;
            }

            if (!this.products.length) {
                this.elements.grid.innerHTML = `
                    <div class="loading-card">
                        В каталоге пока нет товаров.
                    </div>
                `;
                return;
            }

            this.elements.grid.innerHTML = this.products.map((product) => {
                const imageMarkup = product.image
                    ? `<img src="${this.escapeAttr(product.image)}" alt="${this.escapeAttr(product.name)}" onerror="this.remove();">`
                    : "";

                return `
                    <article class="product-card" data-product-id="${this.escapeAttr(product.id)}">
                        <div class="product-media">
                            ${imageMarkup}
                        </div>

                        <div class="product-content">
                            <div class="product-meta">
                                <span>${this.escapeHTML(product.category)}</span>
                                <span>${this.escapeHTML(product.material)}</span>
                            </div>

                            <h3>${this.escapeHTML(product.name)}</h3>

                            <div class="product-price">${this.formatPrice(product.price)}</div>

                            <p class="product-description">
                                ${this.escapeHTML(product.description)}
                            </p>

                            <div class="product-actions">
                                <button class="ghost-button" type="button" data-action="open-product" data-product-id="${this.escapeAttr(product.id)}">
                                    Подробнее
                                </button>

                                <button class="primary-button" type="button" data-action="buy-product" data-product-id="${this.escapeAttr(product.id)}">
                                    Купить сейчас
                                </button>
                            </div>
                        </div>
                    </article>
                `;
            }).join("");
        },

        openProductDetail(productId) {
            const product = this.getProductById(productId);

            if (!product || !this.elements.detail) {
                return;
            }

            const imageMarkup = product.image
                ? `<img src="${this.escapeAttr(product.image)}" alt="${this.escapeAttr(product.name)}" onerror="this.remove();">`
                : "";

            this.selectedProduct = product;

            this.elements.detail.innerHTML = `
                <div class="product-detail__grid">
                    <div class="product-detail__image">
                        ${imageMarkup}
                    </div>

                    <div class="product-detail__content">
                        <p class="section-eyebrow">${this.escapeHTML(product.category)}</p>
                        <h3>${this.escapeHTML(product.name)}</h3>

                        <div class="product-price">${this.formatPrice(product.price)}</div>

                        <p>
                            ${this.escapeHTML(product.details || product.description)}
                        </p>

                        <p>
                            Материал: <strong>${this.escapeHTML(product.material)}</strong>
                        </p>

                        <button class="primary-button" type="button" data-action="buy-product" data-product-id="${this.escapeAttr(product.id)}">
                            Купить сейчас
                        </button>
                    </div>
                </div>
            `;

            this.elements.detail.classList.remove("is-hidden");

            window.setTimeout(() => {
                this.elements.detail.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }, 80);
        },

        startOrder(productId) {
            const product = this.getProductById(productId);

            if (!product) {
                this.showToast("Товар не найден.");
                return;
            }

            this.selectedProduct = product;

            if (!window.AppAuth || !window.AppAuth.isAuthorized()) {
                window.AppAuth.openModal(() => {
                    this.openOrderPanel(product);
                });
                return;
            }

            this.openOrderPanel(product);
        },

        openOrderPanel(product) {
            if (!this.elements.orderPanel) {
                return;
            }

            if (this.elements.orderTitle) {
                this.elements.orderTitle.textContent = product.name;
            }

            if (this.elements.orderPrice) {
                this.elements.orderPrice.textContent = this.formatPrice(product.price);
            }

            if (this.elements.orderProductId) {
                this.elements.orderProductId.value = product.id;
            }

            this.elements.orderPanel.classList.add("is-open");
            this.elements.orderPanel.setAttribute("aria-hidden", "false");
        },

        closeOrderPanel() {
            if (!this.elements.orderPanel) {
                return;
            }

            this.elements.orderPanel.classList.remove("is-open");
            this.elements.orderPanel.setAttribute("aria-hidden", "true");
        },

        submitOrder() {
            if (!this.selectedProduct) {
                this.showToast("Сначала выберите товар.");
                return;
            }

            const nameInput = document.getElementById("customer-name");
            const phoneInput = document.getElementById("customer-phone");
            const addressInput = document.getElementById("customer-address");

            const name = this.cleanText(nameInput ? nameInput.value : "");
            const phone = this.cleanText(phoneInput ? phoneInput.value : "");
            const address = this.cleanText(addressInput ? addressInput.value : "");

            if (name.length < 2) {
                this.showToast("Введите имя.");
                return;
            }

            if (phone.length < 7) {
                this.showToast("Введите корректный телефон.");
                return;
            }

            if (address.length < 5) {
                this.showToast("Введите адрес доставки.");
                return;
            }

            const session = window.AppAuth ? window.AppAuth.getSession() : null;

            const order = {
                productId: this.selectedProduct.id,
                productName: this.selectedProduct.name,
                price: this.selectedProduct.price,
                customerName: name,
                customerPhone: phone,
                customerAddress: address,
                customerEmail: session ? session.email : "",
                createdAt: new Date().toISOString()
            };

            console.log("[НЕАЛИТ] Новый заказ:", order);

            this.showToast("Заказ создан. Данные выведены в консоль для демонстрации.");
            this.closeOrderPanel();

            if (this.elements.orderForm) {
                this.elements.orderForm.reset();
            }
        },

        updateAuthPanel() {
            if (!this.elements.authMiniPanel) {
                return;
            }

            const session = window.AppAuth ? window.AppAuth.getSession() : null;

            if (!session) {
                this.elements.authMiniPanel.innerHTML = `
                    <button id="open-auth-btn" class="ghost-button" type="button">
                        Войти по email
                    </button>
                `;
                return;
            }

            this.elements.authMiniPanel.innerHTML = `
                <span>Вы вошли как <strong>${this.escapeHTML(session.email)}</strong></span>
                <button id="logout-inline-btn" class="ghost-button" type="button">
                    Выйти
                </button>
            `;
        },

        getProductById(productId) {
            return this.products.find((product) => product.id === productId);
        },

        formatPrice(value) {
            const number = Number(value) || 0;

            return number.toLocaleString("be-BY", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }) + " Br";
        },

        cleanText(value) {
            return String(value || "")
                .replace(/[<>]/g, "")
                .trim();
        },

        escapeHTML(value) {
            return String(value || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        },

        escapeAttr(value) {
            return this.escapeHTML(value).replace(/`/g, "&#096;");
        },

        showToast(message) {
            if (!this.elements.toast) {
                return;
            }

            this.elements.toast.textContent = message;
            this.elements.toast.classList.add("is-visible");

            window.clearTimeout(this.toastTimer);

            this.toastTimer = window.setTimeout(() => {
                this.elements.toast.classList.remove("is-visible");
            }, 3200);
        }
    };

    window.NealitApp = App;

    document.addEventListener("DOMContentLoaded", function () {
        App.init();
    });
}());