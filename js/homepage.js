// Homepage specific functionality
async function initHomepage() {
    try {
        // Load products grouped by category
        await loadProductsByCategory();
        
        // Update checkout button state
        updateCheckoutButton();
        
        // Load cart items into offcanvas
        loadCartItems();
        
        // Setup category accordion behavior
        setupCategoryAccordion();
        
    } catch (error) {
        console.error('Error initializing homepage:', error);
        showNotification('Failed to load products. Please refresh.', 'danger');
    }
}

// Load products grouped by category
async function loadProductsByCategory() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/products/grouped-by-category`);
        const data = await response.json();
        
        if (data.success) {
            renderCategories(data.data);
        } else {
            throw new Error(data.error || 'Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Failed to load products', 'warning');
    }
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
        const cartQuantity = cart[productId] ? cart[productId].quantity : 0;
        
        const productCard = document.createElement('div');
        productCard.className = 'col-md-6 col-lg-4';
        
        productCard.innerHTML = `
            <div class="card product-card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${product.ProductName}</h5>
                    <p class="card-text text-muted small mb-2">
                        ${product.Description || 'No description available'}
                    </p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="text-primary mb-0">₹${product.UniPrice}</h4>
                        <span class="badge ${product.Stock > 0 ? 'bg-success' : 'bg-danger'}">
                            ${product.Stock > 0 ? `Stock: ${product.Stock}` : 'Out of Stock'}
                        </span>
                    </div>
                    
                    <div class="quantity-control">
                        <div class="input-group">
                            <button class="btn btn-outline-primary" type="button" 
                                    onclick="removeFromCart('${productId}')"
                                    ${cartQuantity === 0 ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            
                            <input type="number" 
                                   class="form-control text-center quantity-input" 
                                   value="${cartQuantity}"
                                   min="0"
                                   max="${product.Stock}"
                                   onchange="updateProductQuantity('${productId}', this.value)"
                                   oninput="validateQuantity(this, ${product.Stock})">
                            
                            <button class="btn btn-outline-primary" type="button" 
                                    onclick="addToCart('${productId}', '${product.ProductName.replace(/'/g, "\\'")}', ${product.UniPrice}, '${category.replace(/'/g, "\\'")}')"
                                    ${product.Stock === 0 ? 'disabled' : ''}>
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

// Update product quantity directly from input
function updateProductQuantity(productId, quantity) {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
        updateCartQuantity(productId, 0);
    } else {
        updateCartQuantity(productId, qty);
    }
    
    // Refresh the display
    loadCartItems();
    updateCheckoutButton();
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
                                    onclick="updateProductQuantity('${item.id}', ${item.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button class="btn btn-outline-secondary" disabled>
                                ${item.quantity}
                            </button>
                            <button class="btn btn-outline-secondary" 
                                    onclick="updateProductQuantity('${item.id}', ${item.quantity + 1})">
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

// Setup category accordion behavior
function setupCategoryAccordion() {
    // Add event listener to all accordion buttons
    document.querySelectorAll('.accordion-button').forEach(button => {
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initHomepage();
    
    // Update cart when it changes
    window.addEventListener('cartUpdated', function() {
        loadCartItems();
        updateCheckoutButton();
    });
});