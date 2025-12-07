// Configuration
const CONFIG = {
    API_BASE_URL: "https://kuswar-backend.onrender.com", //Render backend URL For test "http://localhost:5500"
    CART_STORAGE_KEY: "kuswar_cart"
};

// Global variables
let cart = {};

// Load cities for dropdown
async function loadCities(selectElementId) {
    try {
        console.log('Loading cities...');
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/cities`);
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById(selectElementId);
            if (!select) {
                console.error(`Select element with ID ${selectElementId} not found`);
                return;
            }
            
            // Clear existing options except the first one
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Add city options
            data.data.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                select.appendChild(option);
            });
            
            console.log(`Loaded ${data.data.length} cities`);
        } else {
            console.error('Failed to load cities:', data.error);
            loadSampleCities(selectElementId);
        }
    } catch (error) {
        console.error('Error loading cities:', error);
        loadSampleCities(selectElementId);
    }
}

// Load sample cities for demo
function loadSampleCities(selectElementId) {
    const select = document.getElementById(selectElementId);
    if (!select) return;
    
    const sampleCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];
    
    sampleCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        select.appendChild(option);
    });
    
    console.log('Loaded sample cities');
}

// Load areas for selected city
async function loadAreasForCity(city, areaInputId, areaDatalistId) {
    const areaInput = document.getElementById(areaInputId);
    const areaDatalist = document.getElementById(areaDatalistId);
    
    if (!city || !areaInput || !areaDatalist) return;
    
    try {
        console.log(`Loading areas for ${city}...`);
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/areas/${encodeURIComponent(city)}`);
        const data = await response.json();
        
        if (data.success) {
            // Clear previous suggestions
            areaDatalist.innerHTML = '';
            
            // Add areas to datalist
            data.data.forEach(area => {
                const option = document.createElement('option');
                option.value = area;
                areaDatalist.appendChild(option);
            });
            
            console.log(`Loaded ${data.data.length} areas for ${city}`);
        } else {
            console.error('Failed to load areas:', data.error);
            loadSampleAreas(city, areaDatalist);
        }
    } catch (error) {
        console.error('Error loading areas:', error);
        loadSampleAreas(city, areaDatalist);
    }
}

// Load sample areas for demo
function loadSampleAreas(city, areaDatalist) {
    const sampleAreas = {
        'Mumbai': ['Andheri', 'Bandra', 'Colaba', 'Dadar', 'Juhu'],
        'Delhi': ['Connaught Place', 'Karol Bagh', 'Rohini', 'Dwarka', 'Saket'],
        'Bangalore': ['Koramangala', 'Indiranagar', 'Whitefield', 'MG Road', 'JP Nagar'],
        'Hyderabad': ['Banjara Hills', 'Gachibowli', 'Hitech City', 'Secunderabad'],
        'Chennai': ['Anna Nagar', 'T Nagar', 'Adyar', 'Velachery'],
        'Kolkata': ['Salt Lake', 'Park Street', 'Howrah', 'New Town']
    };
    
    const areas = sampleAreas[city] || ['Area 1', 'Area 2', 'Area 3'];
    
    areas.forEach(area => {
        const option = document.createElement('option');
        option.value = area;
        areaDatalist.appendChild(option);
    });
    
    console.log(`Loaded sample areas for ${city}`);
}

// Show notification
function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Create toast if not exists
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize Bootstrap Toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips if Bootstrap is loaded
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Check API health
    checkAPIHealth();
});

// Check API health
async function checkAPIHealth() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/health`);
        const data = await response.json();
        
        if (data.status !== 'healthy') {
            console.warn('API is not healthy:', data);
        }
    } catch (error) {
        console.warn('Cannot connect to API, using offline mode:', error);
    }
}

// Make functions available globally
window.loadCities = loadCities;
window.loadAreasForCity = loadAreasForCity;
window.showNotification = showNotification;