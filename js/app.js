// js/app.js
// =========================================
// ЛОГИКА КАТАЛОГА, ТОВАРОВ И ОФОРМЛЕНИЯ ЗАКАЗА
// Валюта: BYN (белорусский рубль)
// =========================================

const App = {
    products: [],
    currentProduct: null,

    cacheElements() {
        this.catalogGrid = document.getElementById('catalog-grid');
        this.productView = document.getElementById('product-view');
        this.productDetailsContainer = document.getElementById('product-details-container');
        this.checkoutPanel = document.getElementById('checkout-panel');
        this.closeCheckoutBtn = document.getElementById('close-checkout');
        this.checkoutForm = document.getElementById('checkout-form');
        this.checkoutItemInfo = document.getElementById('checkout-item-info');
    },

    init() {
        this.cacheElements();
        
        if (window.productsData && Array.isArray(window.productsData) && window.productsData.length > 0) {
            this.products = window.productsData;
            console.log('✅ Данные загружены из data/products.js');
        } else {
            console.warn('⚠️ data/products.js не найден или пуст. Используем встроенный резерв.');
            this.products = this.getFallbackData();
        }

        this.renderCatalog();
        this.bindEvents();
    },

    getFallbackData() {
        return [
          { id: 1, name: "Nealit Wind Jacket", price: 145.90, composition: "85% полиамид, 15% эластан, мембрана 3L", description: "Ультралёгкая ветрозащитная куртка.", accentColor: "#4a90e2" },
          { id: 2, name: "Stratus Knit Sweater", price: 89.50, composition: "100% шерсть мериноса, 240 г/м²", description: "Базовый свитер премиум-класса с терморегуляцией.", accentColor: "#87ceeb" },
          { id: 3, name: "Cumulus Trousers", price: 98.00, composition: "96% хлопок, 4% эластан", description: "Брюки свободного кроя с идеальной драпировкой.", accentColor: "#5b9bd5" },
          { id: 4, name: "Horizon Trench Coat", price: 215.00, composition: "100% хлопок, подкладка вискоза", description: "Классический тренч в современной интерпретации.", accentColor: "#2c3e50" },
          { id: 5, name: "Aero Linen Shirt", price: 76.50, composition: "100% французский лён, 140 г/м²", description: "Воздушная рубашка для жаркого климата.", accentColor: "#a0d2db" },
          { id: 6, name: "Zenith Bomber", price: 168.00, composition: "Верх: неопрен, вставки: экокожа премиум", description: "Структурированный бомбер с футуристическим силуэтом.", accentColor: "#1a3b5c" }
        ];
    },

    renderCatalog() {
        this.catalogGrid.innerHTML = '';
        this.products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.id = product.id;
            
            const imgDiv = document.createElement('div');
            imgDiv.className = 'product-img';
            imgDiv.style.background = `linear-gradient(135deg, ${product.accentColor || '#3a6b8c'}, #0a192f)`;
            
            const name = document.createElement('h3');
            name.className = 'product-name';
            name.textContent = product.name;
            
            const price = document.createElement('p');
            price.className = 'product-price';
            // 💰 Форматирование цены в белорусских рублях (Br)
            price.textContent = `${product.price.toLocaleString('be-BY', { minimumFractionDigits: 2 })} Br`;

            card.appendChild(imgDiv);
            card.appendChild(name);
            card.appendChild(price);
            this.catalogGrid.appendChild(card);
        });
    },

    showProduct(productId) {
        const product = this.products.find(p => p.id === parseInt(productId));
        if (!product) return;
        
        this.currentProduct = product;
        this.productDetailsContainer.innerHTML = '';
        
        const imgDiv = document.createElement('div');
        imgDiv.id = 'product-details-img';
        imgDiv.style.background = `linear-gradient(45deg, ${product.accentColor || '#3a6b8c'}, #0a192f)`;
        
        const infoDiv = document.createElement('div');
        infoDiv.id = 'product-details-info';
        // 💰 Форматирование цены в деталях товара
        infoDiv.innerHTML = `
            <h2>${this.sanitize(product.name)}</h2>
            <p class="price">${product.price.toLocaleString('be-BY', { minimumFractionDigits: 2 })} Br</p>
            <p class="composition">${this.sanitize(product.composition)}</p>
            <p style="color:#c4d8e8; line-height:1.6; margin-bottom:30px;">${this.sanitize(product.description)}</p>
            <button class="btn-primary" id="buy-now-btn">КУПИТЬ СЕЙЧАС</button>
        `;
        
        this.productDetailsContainer.appendChild(imgDiv);
        this.productDetailsContainer.appendChild(infoDiv);

        document.getElementById('catalog-section').style.display = 'none';
        this.productView.style.display = 'block';
        this.productView.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    openCheckout() {
        if (!this.currentProduct) return;
        // 💰 Форматирование цены в панели оформления
        this.checkoutItemInfo.innerHTML = `
            <p style="font-weight:500; margin-bottom:5px;">${this.sanitize(this.currentProduct.name)}</p>
            <p style="color:#87ceeb; font-size:0.9rem;">${this.currentProduct.price.toLocaleString('be-BY', { minimumFractionDigits: 2 })} Br</p>
        `;
        this.checkoutForm.reset();
        this.checkoutPanel.classList.add('open');
    },

    closeCheckout() {
        this.checkoutPanel.classList.remove('open');
    },

    sanitize(str) {
        if (typeof str !== 'string') return str;
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    validateForm() {
        const name = this.checkoutForm.querySelector('#checkout-name').value.trim();
        const address = this.checkoutForm.querySelector('#checkout-address').value.trim();
        const card = this.checkoutForm.querySelector('#checkout-card').value.replace(/\s/g, '');
        const exp = this.checkoutForm.querySelector('#checkout-exp').value.trim();
        const cvc = this.checkoutForm.querySelector('#checkout-cvc').value.trim();

        const errors = [];
        if (name.length < 3) errors.push('ФИО должно содержать минимум 3 символа');
        if (address.length < 10) errors.push('Адрес должен быть полным');
        if (!/^\d{16}$/.test(card)) errors.push('Номер карты должен содержать 16 цифр');
        if (!/^\d{2}\/\d{2}$/.test(exp)) errors.push('Формат срока: ММ/ГГ');
        if (!/^\d{3}$/.test(cvc)) errors.push('CVC должен содержать 3 цифры');
        return errors;
    },

    bindEvents() {
        this.catalogGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (card) this.showProduct(card.dataset.id);
        });

        document.addEventListener('click', (e) => {
            if (e.target.id === 'buy-now-btn') this.openCheckout();
        });

        this.closeCheckoutBtn.addEventListener('click', () => this.closeCheckout());
        document.addEventListener('click', (e) => {
            if (this.checkoutPanel.classList.contains('open') && 
                !this.checkoutPanel.contains(e.target) && 
                !e.target.closest('.product-card') && 
                e.target.id !== 'buy-now-btn') {
                this.closeCheckout();
            }
        });

        this.checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const errors = this.validateForm();
            if (errors.length > 0) {
                alert('Ошибка валидации:\n' + errors.join('\n'));
                return;
            }
            const submitBtn = this.checkoutForm.querySelector('.btn-primary');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'ОБРАБОТКА...';
            submitBtn.disabled = true;

            setTimeout(() => {
                alert(`✅ Заказ оформлен!\nТовар: ${this.currentProduct.name}\nДоставка: ${this.checkoutForm.querySelector('#checkout-address').value}\nСумма: ${this.currentProduct.price.toLocaleString('be-BY', { minimumFractionDigits: 2 })} Br`);
                this.closeCheckout();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                document.getElementById('catalog-section').style.display = 'block';
                this.productView.style.display = 'none';
                this.productView.classList.remove('active');
            }, 1500);
        });

        this.checkoutForm.querySelector('#checkout-card').addEventListener('input', function(e) {
            let val = this.value.replace(/\D/g, '').substring(0, 16);
            this.value = val.match(/.{1,4}/g)?.join(' ') || val;
        });
    }
};

document.addEventListener('DOMContentLoaded', () => { App.init(); });