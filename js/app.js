// Configuration
const CONFIG = {
    API_BASE_URL: "https://kuswar-backend.onrender.com" //Render backend URL For test "http://localhost:5500"
};

// Global variables
let cart = {};

// Show notification
function showNotification(message, type = 'info') {
    console.log(`Notification (${type}): ${message}`);
    
    // Check if we're in a browser environment
    if (typeof document === 'undefined') return;
    
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
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize and show toast
    if (typeof bootstrap !== 'undefined') {
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', function() {
            toast.remove();
        });
    } else {
        // Fallback: remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Load cities for dropdown
async function loadCities(selectElementId) {
    try {
        const select = document.getElementById(selectElementId);
        if (!select) {
            console.error(`Select element with ID ${selectElementId} not found`);
            return;
        }
        
        // Try to load from API
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/cities`);
            const data = await response.json();
            
            if (data.success && data.data) {
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
                return;
            }
        } catch (apiError) {
            console.log('Failed to load cities from API:', apiError.message);
        }
        
        // Fallback to sample cities
        const sampleCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];
        
        // Clear existing options except the first one
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add sample city options
        sampleCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            select.appendChild(option);
        });
        
        console.log('Loaded sample cities');
        
    } catch (error) {
        console.error('Error loading cities:', error);
    }
}

// Load areas for selected city
async function loadAreasForCity(city, areaInputId, areaDatalistId) {
    const areaInput = document.getElementById(areaInputId);
    const areaDatalist = document.getElementById(areaDatalistId);
    
    if (!city || !areaInput || !areaDatalist) return;
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/areas/${encodeURIComponent(city)}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            // Clear previous suggestions
            areaDatalist.innerHTML = '';
            
            // Add areas to datalist
            data.data.forEach(area => {
                const option = document.createElement('option');
                option.value = area;
                areaDatalist.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading areas:', error);
        // No fallback needed - user can type freely
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if Bootstrap is loaded
    if (typeof bootstrap !== 'undefined') {
        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(tooltipTriggerEl => {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Log that app.js loaded
    console.log('Shared app.js loaded successfully');
});

// Make functions available globally
window.loadCities = loadCities;
window.loadAreasForCity = loadAreasForCity;
window.showNotification = showNotification;