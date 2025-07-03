/**
 * Test runner component for executing and monitoring tests
 */
class TestRunner {
    constructor(container, callbacks) {
        this.container = container;
        this.callbacks = callbacks;
        this.currentRun = null;
        this.pollInterval = null;
        this.environments = [];
        
        this.render();
        this.setupEventListeners();
        this.loadEnvironments();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="test-runner">
                <!-- Run Configuration -->
                <div class="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-play-circle mr-2"></i>
                        Test Execution
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div class="form-group">
                            <label for="environment-select" class="form-label">Environment</label>
                            <select id="environment-select" class="form-select">
                                <option value="">Select environment...</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="custom-url" class="form-label">Custom URL (optional)</label>
                            <input type="url" id="custom-url" class="form-input" 
                                   placeholder="https://your-d365-instance.dynamics.com">
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <button id="btn-run-single" class="btn-success">
                            <i class="fas fa-play mr-2"></i>
                            Run Selected Test
                        </button>
                        <button id="btn-run-suite" class="btn-primary">
                            <i class="fas fa-list mr-2"></i>
                            Run Test Suite
                        </button>
                        <button id="btn-stop-run" class="btn-danger hidden">
                            <i class="fas fa-stop mr-2"></i>
                            Stop Execution
                        </button>
                    </div>
                </div>
                
                <!-- Test Selection -->
                <div class="bg-white rounded-lg shadow p-6 mb-6" id="test-selection-section">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-list-check mr-2"></i>
                        Select Tests to Run
                    </h3>
                    
                    <div class="mb-4 flex items-center space-x-4">
                        <input type="text" id="test-search" class="form-input flex-1" 
                               placeholder="Search test cases...">
                        <button id="btn-select-all" class="btn-secondary">Select All</button>
                        <button id="btn-deselect-all" class="btn-secondary">Deselect All</button>
                    </div>
                    
                    <div id="test-list" class="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                        <!-- Test list will be populated here -->
                    </div>
                </div>
                
                <!-- Execution Status -->
                <div class="bg-white rounded-lg shadow p-6 mb-6" id="execution-status" style="display: none;">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-cog fa-spin mr-2"></i>
                        Execution Status
                    </h3>
                    
                    <div id="execution-progress" class="mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-gray-600">Progress</span>
                            <span id="progress-text" class="text-sm text-gray-600">0 / 0</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div id="progress-bar" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                    </div>
                    
                    <div id="current-test" class="bg-gray-50 p-4 rounded-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-medium text-gray-800" id="current-test-name">No test running</div>
                                <div class="text-sm text-gray-600" id="current-test-status">Idle</div>
                            </div>
                            <div class="text-right">
                                <div class="text-sm text-gray-600">Elapsed Time</div>
                                <div class="font-medium" id="elapsed-time">00:00</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Real-time Results -->
                <div class="bg-white rounded-lg shadow p-6" id="realtime-results" style="display: none;">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-chart-line mr-2"></i>
                        Real-time Results
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-600" id="total-tests">0</div>
                            <div class="text-sm text-gray-600">Total Tests</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600" id="passed-tests">0</div>
                            <div class="text-sm text-gray-600">Passed</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-red-600" id="failed-tests">0</div>
                            <div class="text-sm text-gray-600">Failed</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-yellow-600" id="pending-tests">0</div>
                            <div class="text-sm text-gray-600">Pending</div>
                        </div>
                    </div>
                    
                    <div id="test-results-list" class="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                        <!-- Test results will be populated here -->
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Run buttons
        document.getElementById('btn-run-single').addEventListener('click', () => {
            this.runSelectedTests();
        });
        
        document.getElementById('btn-run-suite').addEventListener('click', () => {
            this.runTestSuite();
        });
        
        document.getElementById('btn-stop-run').addEventListener('click', () => {
            this.stopExecution();
        });
        
        // Test selection
        document.getElementById('btn-select-all').addEventListener('click', () => {
            this.selectAllTests(true);
        });
        
        document.getElementById('btn-deselect-all').addEventListener('click', () => {
            this.selectAllTests(false);
        });
        
        document.getElementById('test-search').addEventListener('input', (e) => {
            this.filterTests(e.target.value);
        });
        
        // Environment selection
        document.getElementById('environment-select').addEventListener('change', (e) => {
            if (e.target.value) {
                document.getElementById('custom-url').value = '';
            }
        });
        
        document.getElementById('custom-url').addEventListener('input', (e) => {
            if (e.target.value) {
                document.getElementById('environment-select').value = '';
            }
        });
    }
    
    async loadEnvironments() {
        try {
            // For now, we'll use a default environment
            // In the future, this could load from an environments API
            const environmentSelect = document.getElementById('environment-select');
            environmentSelect.innerHTML = `
                <option value="">Select environment...</option>
                <option value="https://org.crm.dynamics.com">Production</option>
                <option value="https://org-dev.crm.dynamics.com">Development</option>
                <option value="https://org-test.crm.dynamics.com">Testing</option>
            `;
        } catch (error) {
            console.error('Failed to load environments:', error);
        }
    }
    
    async loadTestCases() {
        try {
            const response = await axios.get('/api/tests/');
            this.renderTestList(response.data);
        } catch (error) {
            console.error('Failed to load test cases:', error);
            app.showToast('Failed to load test cases', 'error');
        }
    }
    
    renderTestList(testCases) {
        const container = document.getElementById('test-list');
        
        if (testCases.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-flask text-2xl mb-2"></i>
                    <p>No test cases available</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = testCases.map(testCase => `
            <label class="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer">
                <input type="checkbox" class="test-checkbox mr-3" value="${testCase.id}" data-name="${testCase.name}">
                <div class="flex-1">
                    <div class="font-medium text-gray-800">${testCase.name}</div>
                    <div class="text-sm text-gray-600">${testCase.description || 'No description'}</div>
                    <div class="text-xs text-gray-500">${testCase.steps?.length || 0} steps</div>
                </div>
                <div class="text-sm text-gray-500">
                    ${new Date(testCase.created_at).toLocaleDateString()}
                </div>
            </label>
        `).join('');
    }
    
    selectAllTests(select) {
        const checkboxes = document.querySelectorAll('.test-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = select;
        });
    }
    
    filterTests(searchTerm) {
        const testItems = document.querySelectorAll('#test-list label');
        const term = searchTerm.toLowerCase();
        
        testItems.forEach(item => {
            const name = item.querySelector('.font-medium').textContent.toLowerCase();
            const description = item.querySelector('.text-sm').textContent.toLowerCase();
            
            if (name.includes(term) || description.includes(term)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    getSelectedTests() {
        const checkboxes = document.querySelectorAll('.test-checkbox:checked');
        return Array.from(checkboxes).map(checkbox => ({
            id: parseInt(checkbox.value),
            name: checkbox.dataset.name
        }));
    }
    
    getEnvironmentUrl() {
        const environmentSelect = document.getElementById('environment-select');
        const customUrl = document.getElementById('custom-url');
        
        return customUrl.value || environmentSelect.value || null;
    }
    
    async runSelectedTests() {
        const selectedTests = this.getSelectedTests();
        
        if (selectedTests.length === 0) {
            app.showToast('Please select at least one test to run', 'warning');
            return;
        }
        
        const environmentUrl = this.getEnvironmentUrl();
        if (!environmentUrl) {
            app.showToast('Please select an environment or enter a custom URL', 'warning');
            return;
        }
        
        this.startExecution(selectedTests, environmentUrl);
    }
    
    async runTestSuite() {
        // For now, run all available tests
        // In the future, this could select predefined test suites
        this.selectAllTests(true);
        await this.runSelectedTests();
    }
    
    async startExecution(tests, environmentUrl) {
        this.currentRun = {
            tests: tests,
            environmentUrl: environmentUrl,
            results: [],
            startTime: new Date(),
            currentTestIndex: 0
        };
        
        // Show execution sections
        document.getElementById('execution-status').style.display = 'block';
        document.getElementById('realtime-results').style.display = 'block';
        document.getElementById('btn-run-single').classList.add('hidden');
        document.getElementById('btn-run-suite').classList.add('hidden');
        document.getElementById('btn-stop-run').classList.remove('hidden');
        
        // Initialize progress
        this.updateProgress();
        this.updateStats();
        this.startTimer();
        
        // Run tests sequentially
        for (let i = 0; i < tests.length; i++) {
            if (!this.currentRun) break; // Execution was stopped
            
            this.currentRun.currentTestIndex = i;
            await this.runSingleTest(tests[i]);
        }
        
        this.completeExecution();
    }
    
    async runSingleTest(test) {
        try {
            // Update current test display
            document.getElementById('current-test-name').textContent = test.name;
            document.getElementById('current-test-status').textContent = 'Running...';
            
            // Start test execution
            const response = await axios.post(`/api/tests/${test.id}/run`, {
                test_case_id: test.id,
                environment_url: this.currentRun.environmentUrl
            });
            
            const runId = response.data.id;
            
            // Poll for results
            const result = await this.pollTestResult(runId);
            
            // Add result to current run
            this.currentRun.results.push({
                testId: test.id,
                testName: test.name,
                runId: runId,
                ...result
            });
            
            // Update displays
            this.updateProgress();
            this.updateStats();
            this.addResultToList(test.name, result);
            
        } catch (error) {
            console.error('Test execution failed:', error);
            
            // Add error result
            this.currentRun.results.push({
                testId: test.id,
                testName: test.name,
                status: 'error',
                error_message: error.message,
                execution_time: 0
            });
            
            this.updateProgress();
            this.updateStats();
            this.addResultToList(test.name, {
                status: 'error',
                error_message: error.message,
                execution_time: 0
            });
        }
    }
    
    async pollTestResult(runId, maxAttempts = 60) {
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            try {
                const response = await axios.get(`/api/results/runs/${runId}`);
                const run = response.data;
                
                if (run.status === 'running' || run.status === 'pending') {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                    attempts++;
                } else {
                    return run;
                }
            } catch (error) {
                console.error('Failed to poll test result:', error);
                return {
                    status: 'error',
                    error_message: 'Failed to get test result',
                    execution_time: 0
                };
            }
        }
        
        return {
            status: 'error',
            error_message: 'Test execution timed out',
            execution_time: 0
        };
    }
    
    updateProgress() {
        if (!this.currentRun) return;
        
        const completed = this.currentRun.results.length;
        const total = this.currentRun.tests.length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        
        document.getElementById('progress-bar').style.width = `${percentage}%`;
        document.getElementById('progress-text').textContent = `${completed} / ${total}`;
    }
    
    updateStats() {
        if (!this.currentRun) return;
        
        const results = this.currentRun.results;
        const total = results.length;
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed' || r.status === 'error').length;
        const pending = this.currentRun.tests.length - total;
        
        document.getElementById('total-tests').textContent = this.currentRun.tests.length;
        document.getElementById('passed-tests').textContent = passed;
        document.getElementById('failed-tests').textContent = failed;
        document.getElementById('pending-tests').textContent = pending;
    }
    
    addResultToList(testName, result) {
        const container = document.getElementById('test-results-list');
        const statusClass = result.status === 'passed' ? 'text-green-600' : 
                           result.status === 'failed' ? 'text-red-600' : 'text-yellow-600';
        const statusIcon = result.status === 'passed' ? 'fas fa-check-circle' : 
                          result.status === 'failed' ? 'fas fa-times-circle' : 'fas fa-exclamation-circle';
        
        const resultElement = document.createElement('div');
        resultElement.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
        resultElement.innerHTML = `
            <div class="flex items-center">
                <i class="${statusIcon} ${statusClass} mr-3"></i>
                <div>
                    <div class="font-medium text-gray-800">${testName}</div>
                    ${result.error_message ? `<div class="text-sm text-red-600">${result.error_message}</div>` : ''}
                </div>
            </div>
            <div class="text-right">
                <div class="text-sm ${statusClass} font-medium">${result.status.toUpperCase()}</div>
                <div class="text-xs text-gray-500">${result.execution_time ? `${result.execution_time.toFixed(2)}s` : 'N/A'}</div>
            </div>
        `;
        
        container.appendChild(resultElement);
        container.scrollTop = container.scrollHeight;
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (!this.currentRun) return;
            
            const elapsed = new Date() - this.currentRun.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            document.getElementById('elapsed-time').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    stopExecution() {
        if (confirm('Are you sure you want to stop the test execution?')) {
            this.currentRun = null;
            this.completeExecution();
            app.showToast('Test execution stopped', 'warning');
        }
    }
    
    completeExecution() {
        // Clear timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Update UI
        document.getElementById('current-test-status').textContent = 'Completed';
        document.getElementById('btn-run-single').classList.remove('hidden');
        document.getElementById('btn-run-suite').classList.remove('hidden');
        document.getElementById('btn-stop-run').classList.add('hidden');
        
        // Show completion message
        if (this.currentRun && this.currentRun.results.length > 0) {
            const results = this.currentRun.results;
            const passed = results.filter(r => r.status === 'passed').length;
            const total = results.length;
            
            app.showToast(
                `Execution completed: ${passed}/${total} tests passed`,
                passed === total ? 'success' : 'warning'
            );
        }
        
        this.currentRun = null;
    }
    
    // Public methods for external access
    async initialize() {
        await this.loadTestCases();
    }
    
    reset() {
        this.stopExecution();
        document.getElementById('test-results-list').innerHTML = '';
        document.getElementById('execution-status').style.display = 'none';
        document.getElementById('realtime-results').style.display = 'none';
    }
}
