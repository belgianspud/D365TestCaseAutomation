/**
 * Results viewer component for displaying test execution history and reports
 */
class ResultsViewer {
    constructor(container, callbacks) {
        this.container = container;
        this.callbacks = callbacks;
        this.currentView = 'overview';
        this.currentResults = [];
        this.filters = {
            status: '',
            dateRange: 7, // days
            testCase: ''
        };
        
        this.render();
        this.setupEventListeners();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="results-viewer">
                <!-- Navigation Tabs -->
                <div class="flex border-b border-gray-200 mb-6">
                    <button class="tab-button active" data-view="overview">
                        <i class="fas fa-chart-line mr-2"></i>
                        Overview
                    </button>
                    <button class="tab-button" data-view="history">
                        <i class="fas fa-history mr-2"></i>
                        Test History
                    </button>
                    <button class="tab-button" data-view="trends">
                        <i class="fas fa-chart-bar mr-2"></i>
                        Trends
                    </button>
                    <button class="tab-button" data-view="failures">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Failures
                    </button>
                </div>
                
                <!-- Overview Tab -->
                <div id="overview-tab" class="tab-content">
                    <!-- Summary Stats -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="text-2xl font-bold text-blue-600" id="total-runs">-</div>
                            <div class="text-sm text-gray-600">Total Test Runs</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="text-2xl font-bold text-green-600" id="success-rate">-</div>
                            <div class="text-sm text-gray-600">Success Rate</div>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-lg">
                            <div class="text-2xl font-bold text-yellow-600" id="avg-duration">-</div>
                            <div class="text-sm text-gray-600">Avg Duration</div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <div class="text-2xl font-bold text-purple-600" id="total-test-cases">-</div>
                            <div class="text-sm text-gray-600">Test Cases</div>
                        </div>
                    </div>
                    
                    <!-- Recent Results -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">
                            <i class="fas fa-clock mr-2"></i>
                            Recent Test Runs
                        </h3>
                        <div id="recent-results" class="space-y-3">
                            <!-- Recent results will be populated here -->
                        </div>
                    </div>
                </div>
                
                <!-- History Tab -->
                <div id="history-tab" class="tab-content hidden">
                    <!-- Filters -->
                    <div class="bg-white rounded-lg shadow p-4 mb-6">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div class="form-group">
                                <label class="form-label">Status Filter</label>
                                <select id="status-filter" class="form-select">
                                    <option value="">All Statuses</option>
                                    <option value="passed">Passed</option>
                                    <option value="failed">Failed</option>
                                    <option value="error">Error</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Date Range</label>
                                <select id="date-filter" class="form-select">
                                    <option value="7">Last 7 days</option>
                                    <option value="30">Last 30 days</option>
                                    <option value="90">Last 3 months</option>
                                    <option value="365">Last year</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Search Tests</label>
                                <input type="text" id="test-search" class="form-input" 
                                       placeholder="Search by test name...">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">&nbsp;</label>
                                <button id="btn-apply-filters" class="btn-primary w-full">
                                    <i class="fas fa-filter mr-2"></i>
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Results Table -->
                    <div class="bg-white rounded-lg shadow overflow-hidden">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <h3 class="text-lg font-semibold text-gray-800">
                                <i class="fas fa-table mr-2"></i>
                                Test Execution History
                            </h3>
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Test Case</th>
                                        <th>Status</th>
                                        <th>Duration</th>
                                        <th>Executed At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="history-table-body">
                                    <!-- Table rows will be populated here -->
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Pagination -->
                        <div class="px-6 py-4 border-t border-gray-200">
                            <div class="flex items-center justify-between">
                                <div class="text-sm text-gray-600" id="pagination-info">
                                    Showing 0 to 0 of 0 results
                                </div>
                                <div class="flex space-x-2" id="pagination-controls">
                                    <!-- Pagination buttons will be added here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Trends Tab -->
                <div id="trends-tab" class="tab-content hidden">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Success Rate Chart -->
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-chart-line mr-2"></i>
                                Success Rate Trend
                            </h3>
                            <div id="success-rate-chart" class="h-64 flex items-center justify-center text-gray-500">
                                <i class="fas fa-chart-line text-4xl mb-2"></i>
                                <p>Chart will be displayed here</p>
                            </div>
                        </div>
                        
                        <!-- Execution Time Chart -->
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-clock mr-2"></i>
                                Average Execution Time
                            </h3>
                            <div id="execution-time-chart" class="h-64 flex items-center justify-center text-gray-500">
                                <i class="fas fa-chart-bar text-4xl mb-2"></i>
                                <p>Chart will be displayed here</p>
                            </div>
                        </div>
                        
                        <!-- Test Volume Chart -->
                        <div class="bg-white rounded-lg shadow p-6 lg:col-span-2">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-chart-area mr-2"></i>
                                Test Execution Volume
                            </h3>
                            <div id="volume-chart" class="h-64 flex items-center justify-center text-gray-500">
                                <i class="fas fa-chart-area text-4xl mb-2"></i>
                                <p>Chart will be displayed here</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Failures Tab -->
                <div id="failures-tab" class="tab-content hidden">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Failure Summary -->
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-exclamation-triangle mr-2"></i>
                                Failure Analysis
                            </h3>
                            <div id="failure-summary" class="space-y-3">
                                <!-- Failure summary will be populated here -->
                            </div>
                        </div>
                        
                        <!-- Common Errors -->
                        <div class="bg-white rounded-lg shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-bug mr-2"></i>
                                Common Error Messages
                            </h3>
                            <div id="common-errors" class="space-y-2">
                                <!-- Common errors will be populated here -->
                            </div>
                        </div>
                        
                        <!-- Recent Failures -->
                        <div class="bg-white rounded-lg shadow p-6 lg:col-span-2">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">
                                <i class="fas fa-times-circle mr-2"></i>
                                Recent Failures
                            </h3>
                            <div id="recent-failures" class="space-y-3">
                                <!-- Recent failures will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Result Detail Modal -->
                <div id="result-detail-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
                    <div class="flex items-center justify-center min-h-screen p-4">
                        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-96 overflow-y-auto">
                            <div id="result-detail-content">
                                <!-- Result details will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.view);
            });
        });
        
        // Filters
        document.getElementById('btn-apply-filters').addEventListener('click', () => {
            this.applyFilters();
        });
        
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
        });
        
        document.getElementById('date-filter').addEventListener('change', (e) => {
            this.filters.dateRange = parseInt(e.target.value);
        });
        
        document.getElementById('test-search').addEventListener('input', (e) => {
            this.filters.testCase = e.target.value;
        });
        
        // Modal close
        document.getElementById('result-detail-modal').addEventListener('click', (e) => {
            if (e.target.id === 'result-detail-modal') {
                this.closeResultDetail();
            }
        });
        
        // Store reference for callback access
        window.resultsViewer = this;
    }
    
    switchTab(view) {
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        // Show/hide tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${view}-tab`).classList.remove('hidden');
        
        this.currentView = view;
        
        // Load content for the active tab
        switch (view) {
            case 'overview':
                this.loadOverviewData();
                break;
            case 'history':
                this.loadHistoryData();
                break;
            case 'trends':
                this.loadTrendsData();
                break;
            case 'failures':
                this.loadFailuresData();
                break;
        }
    }
    
    async loadOverviewData() {
        try {
            const response = await axios.get('/api/results/dashboard');
            this.renderOverview(response.data);
        } catch (error) {
            console.error('Failed to load overview data:', error);
            app.showToast('Failed to load overview data', 'error');
        }
    }
    
    renderOverview(data) {
        // Update summary stats
        document.getElementById('total-runs').textContent = data.total_test_runs || 0;
        document.getElementById('success-rate').textContent = `${data.success_rate || 0}%`;
        document.getElementById('avg-duration').textContent = `${data.average_execution_time || 0}s`;
        document.getElementById('total-test-cases').textContent = data.total_test_cases || 0;
        
        // Render recent results
        const recentContainer = document.getElementById('recent-results');
        if (data.recent_runs && data.recent_runs.length > 0) {
            recentContainer.innerHTML = data.recent_runs.map(run => 
                this.renderResultItem(run)
            ).join('');
        } else {
            recentContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-history text-3xl mb-2"></i>
                    <p>No recent test runs</p>
                </div>
            `;
        }
    }
    
    renderResultItem(run) {
        const statusClass = run.status === 'passed' ? 'text-green-600' : 
                           run.status === 'failed' ? 'text-red-600' : 'text-yellow-600';
        const statusIcon = run.status === 'passed' ? 'fas fa-check-circle' : 
                          run.status === 'failed' ? 'fas fa-times-circle' : 'fas fa-exclamation-circle';
        
        return `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                 onclick="resultsViewer.showResultDetail(${run.id})">
                <div class="flex items-center">
                    <i class="${statusIcon} ${statusClass} mr-3 text-lg"></i>
                    <div>
                        <div class="font-medium text-gray-800">Test Case #${run.test_case_id}</div>
                        <div class="text-sm text-gray-600">${new Date(run.created_at).toLocaleString()}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-sm ${statusClass} font-medium">${run.status.toUpperCase()}</div>
                    <div class="text-xs text-gray-500">${run.execution_time ? `${run.execution_time.toFixed(2)}s` : 'N/A'}</div>
                </div>
            </div>
        `;
    }
    
    async loadHistoryData() {
        try {
            const params = new URLSearchParams();
            if (this.filters.status) params.append('status_filter', this.filters.status);
            
            const response = await axios.get(`/api/results/runs?${params.toString()}`);
            this.currentResults = response.data;
            this.renderHistoryTable(response.data);
        } catch (error) {
            console.error('Failed to load history data:', error);
            app.showToast('Failed to load test history', 'error');
        }
    }
    
    renderHistoryTable(results) {
        const tbody = document.getElementById('history-table-body');
        
        if (results.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-8 text-gray-500">
                        <i class="fas fa-history text-3xl mb-2"></i>
                        <p>No test results found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = results.map(result => `
            <tr class="hover:bg-gray-50">
                <td>
                    <div class="font-medium text-gray-800">Test Case #${result.test_case_id}</div>
                </td>
                <td>
                    <span class="status-badge status-${result.status}">${result.status}</span>
                </td>
                <td class="text-sm text-gray-600">
                    ${result.execution_time ? `${result.execution_time.toFixed(2)}s` : 'N/A'}
                </td>
                <td class="text-sm text-gray-600">
                    ${new Date(result.created_at).toLocaleString()}
                </td>
                <td>
                    <button class="text-blue-600 hover:text-blue-800 text-sm"
                            onclick="resultsViewer.showResultDetail(${result.id})">
                        <i class="fas fa-eye mr-1"></i>View
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Update pagination info
        document.getElementById('pagination-info').textContent = 
            `Showing 1 to ${results.length} of ${results.length} results`;
    }
    
    async loadTrendsData() {
        try {
            const response = await axios.get('/api/results/trends');
            this.renderTrends(response.data);
        } catch (error) {
            console.error('Failed to load trends data:', error);
            app.showToast('Failed to load trends data', 'error');
        }
    }
    
    renderTrends(data) {
        // For now, display a simple trend summary
        // In a real implementation, you would use a charting library like Chart.js
        const trendsData = data.trends || [];
        
        if (trendsData.length === 0) {
            document.getElementById('success-rate-chart').innerHTML = `
                <div class="text-center text-gray-500">
                    <i class="fas fa-chart-line text-4xl mb-2"></i>
                    <p>No trend data available</p>
                </div>
            `;
            return;
        }
        
        // Calculate trend summary
        const totalRuns = trendsData.reduce((sum, day) => sum + day.total_runs, 0);
        const avgSuccessRate = trendsData.reduce((sum, day) => sum + day.success_rate, 0) / trendsData.length;
        
        document.getElementById('success-rate-chart').innerHTML = `
            <div class="text-center">
                <div class="text-3xl font-bold text-green-600 mb-2">${avgSuccessRate.toFixed(1)}%</div>
                <div class="text-gray-600">Average Success Rate</div>
                <div class="text-sm text-gray-500 mt-2">Over ${data.period_days} days</div>
            </div>
        `;
        
        document.getElementById('execution-time-chart').innerHTML = `
            <div class="text-center">
                <div class="text-3xl font-bold text-blue-600 mb-2">${totalRuns}</div>
                <div class="text-gray-600">Total Test Runs</div>
                <div class="text-sm text-gray-500 mt-2">Over ${data.period_days} days</div>
            </div>
        `;
        
        document.getElementById('volume-chart').innerHTML = `
            <div class="space-y-2">
                ${trendsData.slice(-7).map(day => `
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">${day.date}</span>
                        <div class="flex items-center space-x-2">
                            <div class="w-32 bg-gray-200 rounded-full h-2">
                                <div class="bg-green-600 h-2 rounded-full" style="width: ${day.success_rate}%"></div>
                            </div>
                            <span class="text-sm text-gray-600">${day.total_runs} runs</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    async loadFailuresData() {
        try {
            const response = await axios.get('/api/results/runs?status_filter=failed');
            const failures = response.data;
            this.renderFailures(failures);
        } catch (error) {
            console.error('Failed to load failures data:', error);
            app.showToast('Failed to load failures data', 'error');
        }
    }
    
    renderFailures(failures) {
        // Failure summary
        const summaryContainer = document.getElementById('failure-summary');
        const totalFailures = failures.length;
        const recentFailures = failures.filter(f => {
            const failureDate = new Date(f.created_at);
            const daysDiff = (new Date() - failureDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7;
        }).length;
        
        summaryContainer.innerHTML = `
            <div class="text-center">
                <div class="text-3xl font-bold text-red-600 mb-2">${totalFailures}</div>
                <div class="text-gray-600">Total Failures</div>
            </div>
            <div class="text-center mt-4">
                <div class="text-2xl font-bold text-orange-600 mb-2">${recentFailures}</div>
                <div class="text-gray-600">Last 7 Days</div>
            </div>
        `;
        
        // Common errors
        const errorMessages = failures
            .filter(f => f.error_message)
            .map(f => f.error_message)
            .reduce((acc, error) => {
                acc[error] = (acc[error] || 0) + 1;
                return acc;
            }, {});
        
        const commonErrors = Object.entries(errorMessages)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        document.getElementById('common-errors').innerHTML = commonErrors.length > 0 
            ? commonErrors.map(([error, count]) => `
                <div class="p-2 bg-red-50 border border-red-200 rounded text-sm">
                    <div class="font-medium text-red-800">${error.substring(0, 80)}${error.length > 80 ? '...' : ''}</div>
                    <div class="text-red-600">${count} occurrence${count > 1 ? 's' : ''}</div>
                </div>
            `).join('')
            : '<p class="text-gray-500 text-center">No error patterns found</p>';
        
        // Recent failures
        const recentFailuresContainer = document.getElementById('recent-failures');
        const recentFailuresList = failures.slice(0, 10);
        
        recentFailuresContainer.innerHTML = recentFailuresList.length > 0
            ? recentFailuresList.map(failure => this.renderResultItem(failure)).join('')
            : '<p class="text-gray-500 text-center">No recent failures</p>';
    }
    
    applyFilters() {
        this.loadHistoryData();
    }
    
    async showResultDetail(runId) {
        try {
            const response = await axios.get(`/api/results/runs/${runId}`);
            const result = response.data;
            this.renderResultDetail(result);
        } catch (error) {
            console.error('Failed to load result details:', error);
            app.showToast('Failed to load result details', 'error');
        }
    }
    
    renderResultDetail(result) {
        const modal = document.getElementById('result-detail-modal');
        const content = document.getElementById('result-detail-content');
        
        const statusClass = result.status === 'passed' ? 'text-green-600' : 
                           result.status === 'failed' ? 'text-red-600' : 'text-yellow-600';
        
        content.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-start mb-6">
                    <h3 class="text-xl font-semibold text-gray-800">
                        Test Run Details #${result.id}
                    </h3>
                    <button onclick="resultsViewer.closeResultDetail()" 
                            class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-3">Execution Info</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Test Case ID:</span>
                                <span class="font-medium">#${result.test_case_id}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Status:</span>
                                <span class="font-medium ${statusClass}">${result.status.toUpperCase()}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Execution Time:</span>
                                <span class="font-medium">${result.execution_time ? `${result.execution_time.toFixed(2)}s` : 'N/A'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Started:</span>
                                <span class="font-medium">${result.started_at ? new Date(result.started_at).toLocaleString() : 'N/A'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Completed:</span>
                                <span class="font-medium">${result.completed_at ? new Date(result.completed_at).toLocaleString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-3">Artifacts</h4>
                        <div class="space-y-2">
                            ${result.screenshot_path ? `
                                <div class="flex items-center text-sm text-blue-600">
                                    <i class="fas fa-camera mr-2"></i>
                                    <span>Screenshot available</span>
                                </div>
                            ` : ''}
                            ${result.trace_path ? `
                                <div class="flex items-center text-sm text-blue-600">
                                    <i class="fas fa-file-code mr-2"></i>
                                    <span>Trace file available</span>
                                </div>
                            ` : ''}
                            ${!result.screenshot_path && !result.trace_path ? `
                                <div class="text-sm text-gray-500">No artifacts available</div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                ${result.error_message ? `
                    <div class="mb-6">
                        <h4 class="font-semibold text-gray-800 mb-3">Error Details</h4>
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <pre class="text-sm text-red-800 whitespace-pre-wrap">${result.error_message}</pre>
                        </div>
                    </div>
                ` : ''}
                
                ${result.result ? `
                    <div class="mb-6">
                        <h4 class="font-semibold text-gray-800 mb-3">Execution Output</h4>
                        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                            <pre class="text-sm text-gray-800 whitespace-pre-wrap">${result.result}</pre>
                        </div>
                    </div>
                ` : ''}
                
                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button onclick="resultsViewer.closeResultDetail()" class="btn-secondary">
                        Close
                    </button>
                    <button onclick="resultsViewer.rerunTest(${result.test_case_id})" class="btn-primary">
                        <i class="fas fa-redo mr-2"></i>
                        Re-run Test
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }
    
    closeResultDetail() {
        document.getElementById('result-detail-modal').classList.add('hidden');
    }
    
    async rerunTest(testCaseId) {
        this.closeResultDetail();
        
        try {
            await axios.post(`/api/tests/${testCaseId}/run`, {
                test_case_id: testCaseId
            });
            app.showToast('Test execution started!', 'info');
        } catch (error) {
            app.showToast('Failed to start test execution', 'error');
        }
    }
    
    // Public methods for external access
    async loadResults() {
        this.loadOverviewData();
    }
    
    refresh() {
        switch (this.currentView) {
            case 'overview':
                this.loadOverviewData();
                break;
            case 'history':
                this.loadHistoryData();
                break;
            case 'trends':
                this.loadTrendsData();
                break;
            case 'failures':
                this.loadFailuresData();
                break;
        }
    }
}

// Add CSS for tab styling
const style = document.createElement('style');
style.textContent = `
    .tab-button {
        @apply px-4 py-2 border-b-2 border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-colors;
    }
    .tab-button.active {
        @apply text-blue-600 border-blue-600;
    }
`;
document.head.appendChild(style);
