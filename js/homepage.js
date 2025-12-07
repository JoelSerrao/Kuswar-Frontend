// Homepage specific functionality
let cart = {};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initHomepage();
});

async function initHomepage() {
    try {
        console.log('Initializing homepage...');
        
        // Initialize cart from localStorage
        initCart();
        
        // Load products (using fallback method since API endpoint might not exist)
        await loadProducts();
        
        // Update UI
        updateCheckoutButton();
        loadCartItems();
        
        // Setup accordion
        setupCategoryAccordion();
        
        // Setup event listeners
        setupCartEventListeners();
        
    } catch (error) {
        console.error('Error initializing homepage:', error);
        loadSampleProducts(); // Load sample data on error
    }
}

// Initialize cart from localStorage
function initCart() {
    const savedCart = localStorage.getItem('kuswar_cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            updateCartCount();
        } catch (e) {
            cart = {};
            localStorage.removeItem('kuswar_cart');
        }
    }
    updateCartCount();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('kuswar_cart', JSON.stringify(cart));
    updateCartCount();
    
    // Update UI
    loadCartItems();
    updateCheckoutButton();
    updateAllProductQuantityDisplays();
}

// Update cart count in navigation
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = Object.values(cart).reduce((sum, item) => sum + (item.quantity || 0), 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

// Setup event listeners
function setupCartEventListeners() {
    // Listen for cart updates
    window.addEventListener('cartUpdated', function() {
        loadCartItems();
        updateCheckoutButton();
        updateAllProductQuantityDisplays();
    });
}

// Update all product quantity displays
function updateAllProductQuantityDisplays() {
    for (const productId in cart) {
        const input = document.querySelector(`input[data-product-id="${productId}"]`);
        if (input) {
            input.value = cart[productId].quantity;
        }
    }
}

// Load products
async function loadProducts() {
    try {
        // Try multiple endpoints
        const endpoints = [
            '/api/products/grouped-by-category',
            '/api/products/by-category/all',
            '/api/products'
        ];
        
        let data = null;
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        data = result.data;
                        console.log(`Loaded products from ${endpoint}`);
                        break;
                    }
                }
            } catch (e) {
                console.log(`Failed to load from ${endpoint}:`, e.message);
            }
        }
        
        if (data) {
            // Check data structure and render
            if (Array.isArray(data)) {
                // If data is array, group by category
                renderCategories(groupProductsByCategory(data));
            } else if (typeof data === 'object') {
                // If data is already grouped by category
                renderCategories(data);
            } else {
                throw new Error('Invalid data format');
            }
        } else {
            throw new Error('No data received');
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        loadSampleProducts();
    }
}

// Group products by category
function groupProductsByCategory(products) {
    const grouped = {};
    products.forEach(product => {
        const category = product.Category || 'Uncategorized';
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push({
            ProductID: product.ProductID || product.id,
            ProductName: product.ProductName || product.name,
            UniPrice: product.UniPrice || product.price || 0,
            Stock: product.Stock || product.stock || 10,
            Description: product.Description || ''
        });
    });
    return grouped;
}

// Load sample products for demo
function loadSampleProducts() {
    console.log('Loading sample products...');
    const sampleProducts = {
        'Hamper': [
            { ProductID: '1', ProductName: 'Family Pack', UniPrice: 1999, Stock: 10, Description: 'Premium hamper for family' },
            { ProductID: '2', ProductName: 'Festival Hamper', UniPrice: 1499, Stock: 5, Description: 'Festival special hamper' },
            { ProductID: '3', ProductName: 'Corporate Hamper', UniPrice: 2999, Stock: 8, Description: 'Corporate gifting hamper' }
        ],
        'Box': [
            { ProductID: '4', ProductName: 'Chocolate Box', UniPrice: 599, Stock: 20, Description: 'Assorted chocolates' },
            { ProductID: '5', ProductName: 'Dry Fruit Box', UniPrice: 899, Stock: 15, Description: 'Premium dry fruits' },
            { ProductID: '6', ProductName: 'Sweets Box', UniPrice: 499, Stock: 25, Description: 'Traditional sweets' }
        ],
        'Goodies': [
            { ProductID: '7', ProductName: 'Cookies Pack', UniPrice: 299, Stock: 30, Description: 'Homemade cookies' },
            { ProductID: '8', ProductName: 'Biscuit Tin', UniPrice: 399, Stock: 18, Description: 'Assorted biscuits' },
            { ProductID: '9', ProductName: 'Snack Pack', UniPrice: 249, Stock: 22, Description: 'Mixed snacks' }
        ]
    };
    
    renderCategories(sampleProducts);
}

// Render categories and products
function renderCategories(groupedProducts) {
    const accordion = document.getElementById('categoriesAccordion');
    if (!accordion) return;
    
    // Clear loading spinner
    accordion.innerHTML = '';
    
    // Get categories sorted alphabetically
    const categories = Object.keys(groupedProducts).sort();
    
    if (categories.length === 0) {
        accordion.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> No products available at the moment.
            </div>
        `;
        return;
    }
    
    // Create accordion items for each category
    categories.forEach((category, index) => {
        const products = groupedProducts[category];
        const accordionId = `category-${index}`;
        const isFirst = index === 0;
        
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item shadow-sm mb-3';
        
        accordionItem.innerHTML = `
            <h2 class="accordion-header" id="heading-${accordionId}">
                <button class="accordion-button ${isFirst ? '' : 'collapsed'}" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#collapse-${accordionId}"
                        aria-expanded="${isFirst ? 'true' : 'false'}"
                        aria-controls="collapse-${accordionId}">
                    <i class="fas fa-folder me-2"></i>
                    <strong>${category}</strong>
                    <span class="badge bg-primary rounded-pill ms-2">${products.length}</span>
                </button>
            </h2>
            <div id="collapse-${accordionId}" 
                 class="accordion-collapse collapse ${isFirst ? 'show' : ''}"
                 aria-labelledby="heading-${accordionId}"
                 data-bs-parent="#categoriesAccordion">
                <div class="accordion-body p-3">
                    <div class="row g-3" id="products-${accordionId}">
                        <!-- Products will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        accordion.appendChild(accordionItem);
        
        // Render products for this category
        renderProducts(`products-${accordionId}`, products, category);
    });
}

// Render products in a category
function renderProducts(containerId, products, category) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    products.forEach(product => {
        const productId = product.ProductID;
        const productName = product.ProductName;
        const price = product.UniPrice || 0;
        const stock = product.Stock || 0;
        
        const cartQuantity = cart[productId] ? cart[productId].quantity : 0;
        
        const productCard = document.createElement('div');
        productCard.className = 'col-md-6 col-lg-4';
        
        productCard.innerHTML = `
            <div class="card product-card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${productName}</h5>
                    <p class="card-text text-muted small mb-2">
                        ${product.Description || 'No description available'}
                    </p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="text-primary mb-0">₹${price}</h4>
                        <span class="badge ${stock > 0 ? 'bg-success' : 'bg-danger'}">
                            ${stock > 0 ? `Stock: ${stock}` : 'Out of Stock'}
                        </span>
                    </div>
                    
                    <div class="quantity-control">
                        <div class="input-group">
                            <button class="btn btn-outline-primary" type="button" 
                                    onclick="homepageRemoveFromCart('${productId}')"
                                    ${cartQuantity === 0 ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            
                            <input type="number" 
                                   class="form-control text-center quantity-input" 
                                   data-product-id="${productId}"
                                   value="${cartQuantity}"
                                   min="0"
                                   max="${stock}"
                                   onchange="homepageUpdateQuantity('${productId}', this.value)"
                                   oninput="validateQuantity(this, ${stock})">
                            
                            <button class="btn btn-outline-primary" type="button" 
                                    onclick="homepageAddToCart('${productId}', '${productName.replace(/'/g, "\\'")}', ${price}, '${category.replace(/'/g, "\\'")}')"
                                    ${stock === 0 ? 'disabled' : ''}>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(productCard);
    });
}

// Add to cart function
function homepageAddToCart(productId, productName, price, category) {
    if (!cart[productId]) {
        cart[productId] = {
            id: productId,
            name: productName,
            price: price,
            category: category,
            quantity: 1
        };
    } else {
        cart[productId].quantity += 1;
    }
    
    saveCart();
    showNotification(`${productName} added to cart`, 'success');
}

// Remove from cart function
function homepageRemoveFromCart(productId) {
    const item = cart[productId];
    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            delete cart[productId];
        }
        saveCart();
        showNotification(`${item.name} removed from cart`, 'info');
    }
}

// Update product quantity
function homepageUpdateQuantity(productId, quantity) {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
        if (cart[productId]) {
            delete cart[productId];
        }
    } else if (qty === 0) {
        if (cart[productId]) {
            delete cart[productId];
        }
    } else {
        if (!cart[productId]) {
            // Find product info
            const input = document.querySelector(`input[data-product-id="${productId}"]`);
            if (input) {
                const card = input.closest('.product-card');
                const name = card.querySelector('.card-title').textContent;
                const price = parseFloat(card.querySelector('.text-primary').textContent.replace('₹', ''));
                const category = card.closest('.accordion-item').querySelector('.accordion-button strong').textContent;
                
                cart[productId] = {
                    id: productId,
                    name: name,
                    price: price,
                    category: category,
                    quantity: qty
                };
            }
        } else {
            cart[productId].quantity = qty;
        }
    }
    
    saveCart();
}

// Validate quantity input
function validateQuantity(input, maxStock) {
    let value = parseInt(input.value);
    if (isNaN(value) || value < 0) {
        input.value = 0;
    } else if (value > maxStock) {
        input.value = maxStock;
        showNotification(`Maximum stock available: ${maxStock}`, 'warning');
    }
}

// Load cart items into offcanvas
function loadCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    
    if (!cartItemsContainer || !cartTotalElement) return;
    
    const cartItems = Object.values(cart);
    
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `
            <p class="text-muted text-center py-3">
                <i class="fas fa-shopping-cart fa-2x mb-3"></i><br>
                Your cart is empty
            </p>
        `;
        cartTotalElement.textContent = '₹0.00';
        return;
    }
    
    let total = 0;
    let itemsHTML = '';
    
    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        itemsHTML += `
            <div class="cart-item mb-3 pb-3 border-bottom">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${item.name}</h6>
                        <small class="text-muted">${item.category}</small>
                        <div class="mt-2">
                            <small class="text-muted">₹${item.price} × ${item.quantity}</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <h6 class="text-primary mb-1">₹${itemTotal.toFixed(2)}</h6>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-secondary" 
                                    onclick="homepageUpdateQuantity('${item.id}', ${item.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button class="btn btn-outline-secondary" disabled>
                                ${item.quantity}
                            </button>
                            <button class="btn btn-outline-secondary" 
                                    onclick="homepageUpdateQuantity('${item.id}', ${item.quantity + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = itemsHTML;
    cartTotalElement.textContent = `₹${total.toFixed(2)}`;
}

// Update checkout button state
function updateCheckoutButton() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cartTotalBadge = document.getElementById('cartTotalBadge');
    
    if (!checkoutBtn || !cartTotalBadge) return;
    
    const total = getCartTotal();
    const hasItems = Object.keys(cart).length > 0;
    
    checkoutBtn.disabled = !hasItems;
    cartTotalBadge.textContent = `₹${total.toFixed(2)}`;
    
    if (hasItems) {
        checkoutBtn.classList.remove('btn-secondary');
        checkoutBtn.classList.add('btn-primary');
    } else {
        checkoutBtn.classList.remove('btn-primary');
        checkoutBtn.classList.add('btn-secondary');
    }
}

// Get cart total
function getCartTotal() {
    return Object.values(cart).reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
}

// Proceed to checkout
function proceedToCheckout() {
    if (Object.keys(cart).length === 0) {
        showNotification('Please add items to cart before checkout', 'warning');
        return;
    }
    
    // Save cart for checkout page
    localStorage.setItem('checkout_cart', JSON.stringify(cart));
    
    // Redirect to checkout page
    window.location.href = 'checkout.html';
}

// Clear cart
function clearCart() {
    cart = {};
    saveCart();
    showNotification('Cart cleared', 'info');
}

// Setup category accordion behavior
function setupCategoryAccordion() {
    // Add event listener to all accordion buttons
    const accordionButtons = document.querySelectorAll('.accordion-button');
    accordionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon) {
                if (this.classList.contains('collapsed')) {
                    icon.className = 'fas fa-folder me-2';
                } else {
                    icon.className = 'fas fa-folder-open me-2';
                }
            }
        });
    });
}

// Make functions available globally
window.homepageAddToCart = homepageAddToCart;
window.homepageRemoveFromCart = homepageRemoveFromCart;
window.homepageUpdateQuantity = homepageUpdateQuantity;
window.validateQuantity = validateQuantity;
window.proceedToCheckout = proceedToCheckout;
window.clearCart = clearCart;