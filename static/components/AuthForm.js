/**
 * Authentication form component
 */
class AuthForm {
    constructor(container, callbacks) {
        this.container = container;
        this.callbacks = callbacks;
        this.isLoginMode = true;
        
        this.render();
        this.setupEventListeners();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="auth-form">
                <!-- Toggle Buttons -->
                <div class="flex mb-6 bg-gray-100 rounded-lg p-1">
                    <button id="btn-login" class="flex-1 py-2 px-4 rounded-md transition-colors ${this.isLoginMode ? 'bg-white shadow text-blue-600' : 'text-gray-600'}">
                        Login
                    </button>
                    <button id="btn-register" class="flex-1 py-2 px-4 rounded-md transition-colors ${!this.isLoginMode ? 'bg-white shadow text-blue-600' : 'text-gray-600'}">
                        Register
                    </button>
                </div>
                
                <!-- Form -->
                <form id="auth-form">
                    <div class="form-group">
                        <label for="username" class="form-label">Username</label>
                        <input type="text" id="username" name="username" class="form-input" required>
                    </div>
                    
                    ${!this.isLoginMode ? `
                    <div class="form-group">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" id="email" name="email" class="form-input" required>
                    </div>
                    ` : ''}
                    
                    <div class="form-group">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" id="password" name="password" class="form-input" required>
                    </div>
                    
                    ${!this.isLoginMode ? `
                    <div class="form-group">
                        <label for="confirmPassword" class="form-label">Confirm Password</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" class="form-input" required>
                    </div>
                    ` : ''}
                    
                    <button type="submit" class="w-full btn-primary">
                        <i class="fas fa-sign-in-alt mr-2"></i>
                        ${this.isLoginMode ? 'Login' : 'Register'}
                    </button>
                </form>
                
                <!-- Demo Info -->
                <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 class="font-semibold text-blue-800 mb-2">
                        <i class="fas fa-info-circle mr-2"></i>
                        Getting Started
                    </h4>
                    <p class="text-blue-700 text-sm">
                        Create an account to start building automated tests for your Dynamics 365 applications. 
                        You'll be able to create, run, and manage test cases with our visual builder.
                    </p>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Toggle buttons
        document.getElementById('btn-login').addEventListener('click', () => {
            this.isLoginMode = true;
            this.render();
            this.setupEventListeners();
        });
        
        document.getElementById('btn-register').addEventListener('click', () => {
            this.isLoginMode = false;
            this.render();
            this.setupEventListeners();
        });
        
        // Form submission
        document.getElementById('auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // Focus first input
        setTimeout(() => {
            document.getElementById('username')?.focus();
        }, 100);
    }
    
    handleSubmit() {
        const formData = new FormData(document.getElementById('auth-form'));
        const username = formData.get('username');
        const password = formData.get('password');
        const email = formData.get('email');
        const confirmPassword = formData.get('confirmPassword');
        
        // Validation
        if (!username || !password) {
            this.showError('Please fill in all required fields');
            return;
        }
        
        if (!this.isLoginMode) {
            if (!email) {
                this.showError('Email is required');
                return;
            }
            
            if (password !== confirmPassword) {
                this.showError('Passwords do not match');
                return;
            }
            
            if (password.length < 6) {
                this.showError('Password must be at least 6 characters long');
                return;
            }
        }
        
        // Clear any previous errors
        this.clearError();
        
        // Call appropriate callback
        if (this.isLoginMode) {
            this.callbacks.onLogin(username, password);
        } else {
            this.callbacks.onRegister(username, email, password);
        }
    }
    
    showError(message) {
        this.clearError();
        
        const form = document.getElementById('auth-form');
        const errorDiv = document.createElement('div');
        errorDiv.id = 'auth-error';
        errorDiv.className = 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-circle mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        form.insertBefore(errorDiv, form.firstChild);
    }
    
    clearError() {
        const errorDiv = document.getElementById('auth-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
    
    reset() {
        document.getElementById('auth-form')?.reset();
        this.clearError();
    }
}
