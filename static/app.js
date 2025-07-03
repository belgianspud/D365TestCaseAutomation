/**
 * Main application controller for D365 Test Platform
 */
class D365TestApp {
    constructor() {
        this.currentUser = null;
        this.currentView = 'auth';
        this.authToken = localStorage.getItem('authToken');
        this.apiBaseURL = '/api';
        
        // Initialize axios defaults
        this.setupAxiosInterceptors();
        
        // Initialize components
        this.authForm = null;
        this.testBuilder = null;
        this.testRunner = null;
        this.resultsViewer = null;
        
        // Initialize app
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        
        if (this.authToken) {
            try {
                await this.verifyToken();
                this.showDashboard();
            } catch (error) {
                this.logout();
            }
        } else {
            this.showAuth();
        }
    }
    
    setupAxiosInterceptors() {
        // Request interceptor to add auth token
        axios.interceptors.request.use(
            (config) => {
                if (this.authToken) {
                    config.headers.Authorization = `Bearer ${this.authToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
        
        // Response interceptor to handle auth errors
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.logout();
                }
                return Promise.reject(error);
            }
        );
    }
    
    setupEventListeners() {
        // Navigation buttons
        document.getElementById('btn-new-test')?.addEventListener('click', () => {
            this.showTestBuilder();
        });
        
        document.getElementById('btn-view-tests')?.addEventListener('click', () => {
            this.showTestManagement();
        });
        
        document.getElementById('btn-view-results')?.addEventListener('click', () => {
            this.showResults();
        });
    }
    
    async verifyToken() {
        try {
            const response = await axios.get(`${this.apiBaseURL}/auth/me`);
            this.currentUser = response.data;
            return true;
        } catch (error) {
            console.error('Token verification failed:', error);
            throw error;
        }
    }
    
    async login(username, password) {
        try {
            this.showLoading(true);
            
            const response = await axios.post(`${this.apiBaseURL}/auth/login`, {
                username,
                password
            });
            
            this.authToken = response.data.access_token;
            localStorage.setItem('authToken', this.authToken);
            
            await this.verifyToken();
            this.showDashboard();
            this.showToast('Login successful!', 'success');
            
        } catch (error) {
            this.showToast(
                error.response?.data?.detail || 'Login failed',
                'error'
            );
        } finally {
            this.showLoading(false);
        }
    }
    
    async register(username, email, password) {
        try {
            this.showLoading(true);
            
            await axios.post(`${this.apiBaseURL}/auth/register`, {
                username,
                email,
                password
            });
            
            this.showToast('Registration successful! Please log in.', 'success');
            
            // Auto-login after registration
            await this.login(username, password);
            
        } catch (error) {
            this.showToast(
                error.response?.data?.detail || 'Registration failed',
                'error'
            );
        } finally {
            this.showLoading(false);
        }
    }
    
    logout() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        this.showAuth();
        this.showToast('Logged out successfully', 'info');
    }
    
    showAuth() {
        this.hideAllSections();
        document.getElementById('auth-section').classList.remove('hidden');
        this.updateNavigation();
        
        if (!this.authForm) {
            this.authForm = new AuthForm(
                document.getElementById('auth-form-container'),
                {
                    onLogin: (username, password) => this.login(username, password),
                    onRegister: (username, email, password) => this.register(username, email, password)
                }
            );
        }
        
        this.currentView = 'auth';
    }
    
    async showDashboard() {
        this.hideAllSections();
        document.getElementById('dashboard-section').classList.remove('hidden');
        this.updateNavigation();
        
        try {
            await this.loadDashboardData();
        } catch (error) {
            this.showToast('Failed to load dashboard data', 'error');
        }
        
        this.currentView = 'dashboard';
    }
    
    showTestBuilder(testCase = null) {
        this.hideAllSections();
        document.getElementById('test-builder-section').classList.remove('hidden');
        this.updateNavigation();
        
        if (!this.testBuilder) {
            this.testBuilder = new TestBuilder(
                document.getElementById('test-builder-container'),
                {
                    onSave: (testCase) => this.saveTestCase(testCase),
                    onCancel: () => this.showDashboard()
                }
            );
        }
        
        if (testCase) {
            this.testBuilder.loadTestCase(testCase);
        } else {
            this.testBuilder.reset();
        }
        
        this.currentView = 'test-builder';
    }
    
    showTestManagement() {
        this.hideAllSections();
        document.getElementById('test-management-section').classList.remove('hidden');
        this.updateNavigation();
        
        this.loadTestCases();
        this.currentView = 'test-management';
    }
    
    showResults() {
        this.hideAllSections();
        document.getElementById('results-section').classList.remove('hidden');
        this.updateNavigation();
        
        if (!this.resultsViewer) {
            this.resultsViewer = new ResultsViewer(
                document.getElementById('results-container'),
                {
                    onBack: () => this.showDashboard()
                }
            );
        }
        
        this.resultsViewer.loadResults();
        this.currentView = 'results';
    }
    
    hideAllSections() {
        const sections = [
            'auth-section',
            'dashboard-section',
            'test-builder-section',
            'test-management-section',
            'results-section'
        ];
        
        sections.forEach(sectionId => {
            document.getElementById(sectionId).classList.add('hidden');
        });
    }
    
    updateNavigation() {
        const navMenu = document.getElementById('nav-menu');
        
        if (!this.currentUser) {
            navMenu.innerHTML = '';
            return;
        }
        
        navMenu.innerHTML = `
            <div class="flex items-center space-x-4">
                <span class="text-sm">Welcome, ${this.currentUser.username}</span>
                <button id="nav-dashboard" class="hover:bg-blue-700 px-3 py-2 rounded">
                    <i class="fas fa-chart-line mr-1"></i>Dashboard
                </button>
                <button id="nav-logout" class="hover:bg-blue-700 px-3 py-2 rounded">
                    <i class="fas fa-sign-out-alt mr-1"></i>Logout
                </button>
            </div>
        `;
        
        // Add navigation event listeners
        document.getElementById('nav-dashboard')?.addEventListener('click', () => {
            this.showDashboard();
        });
        
        document.getElementById('nav-logout')?.addEventListener('click', () => {
            this.logout();
        });
    }
    
    async loadDashboardData() {
        try {
            const response = await axios.get(`${this.apiBaseURL}/results/dashboard`);
            this.renderDashboardStats(response.data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }
    
    renderDashboardStats(data) {
        const statsContainer = document.getElementById('dashboard-stats');
        
        statsContainer.innerHTML = `
            <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">${data.total_test_cases}</div>
                <div class="text-sm text-gray-600">Total Test Cases</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-green-600">${data.total_test_runs}</div>
                <div class="text-sm text-gray-600">Total Test Runs</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-purple-600">${data.success_rate}%</div>
                <div class="text-sm text-gray-600">Success Rate</div>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-yellow-600">${data.average_execution_time}s</div>
                <div class="text-sm text-gray-600">Avg Execution Time</div>
            </div>
        `;
        
        // Render recent runs
        const recentRunsContainer = document.getElementById('recent-runs');
        if (data.recent_runs && data.recent_runs.length > 0) {
            recentRunsContainer.innerHTML = data.recent_runs.map(run => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center">
                        <span class="status-badge status-${run.status}">${run.status}</span>
                        <span class="ml-3 text-sm text-gray-600">Test Case #${run.test_case_id}</span>
                    </div>
                    <div class="text-sm text-gray-500">
                        ${run.execution_time ? `${run.execution_time}s` : 'N/A'}
                    </div>
                </div>
            `).join('');
        } else {
            recentRunsContainer.innerHTML = '<p class="text-gray-500 text-center">No recent test runs</p>';
        }
    }
    
    async loadTestCases() {
        try {
            this.showLoading(true);
            const response = await axios.get(`${this.apiBaseURL}/tests/`);
            this.renderTestCases(response.data);
        } catch (error) {
            this.showToast('Failed to load test cases', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    renderTestCases(testCases) {
        const container = document.getElementById('test-list-container');
        
        if (testCases.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-flask text-gray-400 text-4xl mb-4"></i>
                    <p class="text-gray-500 mb-4">No test cases found</p>
                    <button class="btn-primary" onclick="app.showTestBuilder()">
                        Create Your First Test
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="mb-4 flex justify-between items-center">
                <div class="flex space-x-2">
                    <input type="text" id="search-tests" placeholder="Search tests..." 
                           class="form-input w-64">
                    <button id="btn-search" class="btn-secondary">Search</button>
                </div>
                <button class="btn-success" onclick="app.showTestBuilder()">
                    <i class="fas fa-plus mr-2"></i>New Test
                </button>
            </div>
            <div class="space-y-4">
                ${testCases.map(testCase => this.renderTestCaseCard(testCase)).join('')}
            </div>
        `;
    }
    
    renderTestCaseCard(testCase) {
        return `
            <div class="card">
                <div class="card-body">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">${testCase.name}</h3>
                            <p class="text-gray-600 mt-1">${testCase.description || 'No description'}</p>
                            <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                <span><i class="fas fa-list mr-1"></i>${testCase.steps?.length || 0} steps</span>
                                <span><i class="fas fa-calendar mr-1"></i>${new Date(testCase.created_at).toLocaleDateString()}</span>
                                ${testCase.tags ? `<span><i class="fas fa-tags mr-1"></i>${testCase.tags}</span>` : ''}
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button class="btn-primary" onclick="app.runTestCase(${testCase.id})">
                                <i class="fas fa-play mr-1"></i>Run
                            </button>
                            <button class="btn-secondary" onclick="app.editTestCase(${testCase.id})">
                                <i class="fas fa-edit mr-1"></i>Edit
                            </button>
                            <button class="btn-danger" onclick="app.deleteTestCase(${testCase.id})">
                                <i class="fas fa-trash mr-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async saveTestCase(testCaseData) {
        try {
            this.showLoading(true);
            
            if (testCaseData.id) {
                // Update existing test case
                await axios.put(`${this.apiBaseURL}/tests/${testCaseData.id}`, testCaseData);
                this.showToast('Test case updated successfully!', 'success');
            } else {
                // Create new test case
                await axios.post(`${this.apiBaseURL}/tests/`, testCaseData);
                this.showToast('Test case created successfully!', 'success');
            }
            
            this.showDashboard();
            
        } catch (error) {
            this.showToast(
                error.response?.data?.detail || 'Failed to save test case',
                'error'
            );
        } finally {
            this.showLoading(false);
        }
    }
    
    async runTestCase(testCaseId) {
        try {
            this.showLoading(true);
            
            const response = await axios.post(`${this.apiBaseURL}/tests/${testCaseId}/run`, {
                test_case_id: testCaseId
            });
            
            this.showToast('Test execution started!', 'info');
            
            // Poll for results
            this.pollTestRun(response.data.id);
            
        } catch (error) {
            this.showToast(
                error.response?.data?.detail || 'Failed to start test execution',
                'error'
            );
        } finally {
            this.showLoading(false);
        }
    }
    
    async pollTestRun(runId) {
        const maxAttempts = 60; // 5 minutes
        let attempts = 0;
        
        const poll = async () => {
            try {
                const response = await axios.get(`${this.apiBaseURL}/results/runs/${runId}`);
                const run = response.data;
                
                if (run.status === 'running' || run.status === 'pending') {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(poll, 5000); // Poll every 5 seconds
                    } else {
                        this.showToast('Test execution timed out', 'warning');
                    }
                } else {
                    // Test completed
                    const status = run.status === 'passed' ? 'success' : 'error';
                    this.showToast(`Test ${run.status}!`, status);
                    
                    // Refresh dashboard if we're on it
                    if (this.currentView === 'dashboard') {
                        this.loadDashboardData();
                    }
                }
            } catch (error) {
                console.error('Failed to poll test run:', error);
            }
        };
        
        poll();
    }
    
    async editTestCase(testCaseId) {
        try {
            this.showLoading(true);
            const response = await axios.get(`${this.apiBaseURL}/tests/${testCaseId}`);
            this.showTestBuilder(response.data);
        } catch (error) {
            this.showToast('Failed to load test case', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async deleteTestCase(testCaseId) {
        if (!confirm('Are you sure you want to delete this test case?')) {
            return;
        }
        
        try {
            this.showLoading(true);
            await axios.delete(`${this.apiBaseURL}/tests/${testCaseId}`);
            this.showToast('Test case deleted successfully!', 'success');
            this.loadTestCases(); // Refresh the list
        } catch (error) {
            this.showToast('Failed to delete test case', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} fade-in`;
        
        const icons = {
            success: 'fas fa-check-circle text-green-600',
            error: 'fas fa-exclamation-circle text-red-600',
            warning: 'fas fa-exclamation-triangle text-yellow-600',
            info: 'fas fa-info-circle text-blue-600'
        };
        
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="${icons[type]} mr-3"></i>
                <span>${message}</span>
                <button class="ml-auto pl-3" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times text-gray-400 hover:text-gray-600"></i>
                </button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new D365TestApp();
});
