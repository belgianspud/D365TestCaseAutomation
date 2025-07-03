/**
 * Test case builder component with drag-and-drop interface
 */
class TestBuilder {
    constructor(container, callbacks) {
        this.container = container;
        this.callbacks = callbacks;
        this.testCase = {
            id: null,
            name: '',
            description: '',
            steps: [],
            expected_result: 'pass',
            tags: ''
        };
        this.draggedStep = null;
        this.stepCounter = 0;
        
        this.render();
        this.setupEventListeners();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="test-builder">
                <!-- Test Case Info -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div class="lg:col-span-2">
                        <div class="form-group">
                            <label for="test-name" class="form-label">Test Case Name *</label>
                            <input type="text" id="test-name" class="form-input" 
                                   placeholder="e.g., Create New Customer Record" 
                                   value="${this.testCase.name}">
                        </div>
                        
                        <div class="form-group">
                            <label for="test-description" class="form-label">Description</label>
                            <textarea id="test-description" class="form-textarea" rows="3" 
                                      placeholder="Describe what this test case validates...">${this.testCase.description}</textarea>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div class="form-group">
                                <label for="test-result" class="form-label">Expected Result</label>
                                <select id="test-result" class="form-select">
                                    <option value="pass" ${this.testCase.expected_result === 'pass' ? 'selected' : ''}>Should Pass</option>
                                    <option value="fail" ${this.testCase.expected_result === 'fail' ? 'selected' : ''}>Should Fail</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="test-tags" class="form-label">Tags</label>
                                <input type="text" id="test-tags" class="form-input" 
                                       placeholder="e.g., smoke, regression"
                                       value="${this.testCase.tags}">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Step Toolbox -->
                    <div class="toolbox">
                        <h3 class="font-semibold text-gray-800 mb-3">
                            <i class="fas fa-toolbox mr-2"></i>
                            Step Types
                        </h3>
                        <div id="step-toolbox">
                            ${this.renderToolboxItems()}
                        </div>
                    </div>
                </div>
                
                <!-- Test Steps -->
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-list-ol mr-2"></i>
                        Test Steps (${this.testCase.steps.length})
                    </h3>
                    
                    <div id="test-steps-container" class="min-h-64 border-2 border-dashed border-gray-300 rounded-lg p-4 ${this.testCase.steps.length === 0 ? 'drag-zone empty' : ''}">
                        ${this.testCase.steps.length === 0 ? this.renderEmptyState() : this.renderTestSteps()}
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="flex justify-between">
                    <button id="btn-cancel" class="btn-secondary">
                        <i class="fas fa-times mr-2"></i>
                        Cancel
                    </button>
                    
                    <div class="space-x-3">
                        <button id="btn-validate" class="btn-secondary">
                            <i class="fas fa-check-circle mr-2"></i>
                            Validate
                        </button>
                        <button id="btn-save" class="btn-success">
                            <i class="fas fa-save mr-2"></i>
                            ${this.testCase.id ? 'Update' : 'Save'} Test Case
                        </button>
                    </div>
                </div>
                
                <!-- Step Editor Modal -->
                <div id="step-editor-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
                    <div class="flex items-center justify-center min-h-screen p-4">
                        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
                            <div id="step-editor-content"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderToolboxItems() {
        const stepTypes = [
            { type: 'navigate', icon: 'fas fa-globe', label: 'Navigate to URL', description: 'Navigate to a web page' },
            { type: 'click', icon: 'fas fa-mouse-pointer', label: 'Click Element', description: 'Click on a button or link' },
            { type: 'fill', icon: 'fas fa-keyboard', label: 'Fill Field', description: 'Enter text into an input field' },
            { type: 'verify', icon: 'fas fa-eye', label: 'Verify Element', description: 'Check if element exists or has text' },
            { type: 'wait', icon: 'fas fa-clock', label: 'Wait/Delay', description: 'Wait for specified time' },
            { type: 'screenshot', icon: 'fas fa-camera', label: 'Take Screenshot', description: 'Capture screen for debugging' }
        ];
        
        return stepTypes.map(step => `
            <div class="toolbox-item" draggable="true" data-step-type="${step.type}">
                <div class="flex items-center mb-1">
                    <i class="${step.icon} text-blue-600 mr-2"></i>
                    <span class="font-medium text-sm">${step.label}</span>
                </div>
                <p class="text-xs text-gray-600">${step.description}</p>
            </div>
        `).join('');
    }
    
    renderEmptyState() {
        return `
            <div class="text-center py-8">
                <i class="fas fa-plus-circle text-gray-400 text-4xl mb-4"></i>
                <p class="text-gray-500 mb-2">No test steps yet</p>
                <p class="text-sm text-gray-400">Drag step types from the toolbox to build your test</p>
            </div>
        `;
    }
    
    renderTestSteps() {
        return this.testCase.steps.map((step, index) => this.renderTestStep(step, index)).join('');
    }
    
    renderTestStep(step, index) {
        const stepIcons = {
            navigate: 'fas fa-globe',
            click: 'fas fa-mouse-pointer',
            fill: 'fas fa-keyboard',
            verify: 'fas fa-eye',
            wait: 'fas fa-clock',
            screenshot: 'fas fa-camera'
        };
        
        return `
            <div class="test-step" draggable="true" data-step-index="${index}">
                <div class="test-step-header">
                    <div class="flex items-center">
                        <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3">
                            ${index + 1}
                        </span>
                        <i class="${stepIcons[step.type] || 'fas fa-cog'} text-gray-600 mr-2"></i>
                        <span class="test-step-type">${step.type.toUpperCase()}</span>
                        <span class="ml-3 text-gray-700">${step.description || this.getStepDescription(step)}</span>
                    </div>
                    <div class="test-step-actions">
                        <button class="text-blue-600 hover:text-blue-800" onclick="testBuilder.editStep(${index})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800" onclick="testBuilder.deleteStep(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="text-gray-600 hover:text-gray-800 cursor-move drag-handle">
                            <i class="fas fa-grip-vertical"></i>
                        </button>
                    </div>
                </div>
                
                <div class="mt-2 text-sm text-gray-600">
                    ${this.renderStepDetails(step)}
                </div>
            </div>
        `;
    }
    
    renderStepDetails(step) {
        const details = [];
        
        if (step.selector) {
            details.push(`<strong>Selector:</strong> ${step.selector}`);
        }
        if (step.value) {
            details.push(`<strong>Value:</strong> ${step.value}`);
        }
        if (step.expected) {
            details.push(`<strong>Expected:</strong> ${step.expected}`);
        }
        if (step.timeout && step.timeout !== 5000) {
            details.push(`<strong>Timeout:</strong> ${step.timeout}ms`);
        }
        
        return details.join(' | ') || 'No additional configuration';
    }
    
    getStepDescription(step) {
        switch (step.type) {
            case 'navigate':
                return `Navigate to ${step.value || 'URL'}`;
            case 'click':
                return `Click on ${step.selector || 'element'}`;
            case 'fill':
                return `Fill "${step.selector || 'field'}" with "${step.value || 'value'}"`;
            case 'verify':
                return `Verify ${step.selector || 'element'} ${step.expected || 'exists'}`;
            case 'wait':
                return `Wait ${step.value || '1000'}ms`;
            case 'screenshot':
                return 'Take screenshot';
            default:
                return step.type;
        }
    }
    
    setupEventListeners() {
        // Form inputs
        document.getElementById('test-name').addEventListener('input', (e) => {
            this.testCase.name = e.target.value;
        });
        
        document.getElementById('test-description').addEventListener('input', (e) => {
            this.testCase.description = e.target.value;
        });
        
        document.getElementById('test-result').addEventListener('change', (e) => {
            this.testCase.expected_result = e.target.value;
        });
        
        document.getElementById('test-tags').addEventListener('input', (e) => {
            this.testCase.tags = e.target.value;
        });
        
        // Action buttons
        document.getElementById('btn-cancel').addEventListener('click', () => {
            this.callbacks.onCancel();
        });
        
        document.getElementById('btn-save').addEventListener('click', () => {
            this.saveTestCase();
        });
        
        document.getElementById('btn-validate').addEventListener('click', () => {
            this.validateTestCase();
        });
        
        // Drag and drop for toolbox items
        document.querySelectorAll('.toolbox-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.stepType);
            });
        });
        
        // Drag and drop for test steps container
        const container = document.getElementById('test-steps-container');
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
        });
        
        container.addEventListener('dragleave', (e) => {
            if (!container.contains(e.relatedTarget)) {
                container.classList.remove('drag-over');
            }
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            const stepType = e.dataTransfer.getData('text/plain');
            if (stepType) {
                this.addStep(stepType);
            }
        });
        
        // Step reordering
        this.setupStepReordering();
        
        // Modal close
        document.getElementById('step-editor-modal').addEventListener('click', (e) => {
            if (e.target.id === 'step-editor-modal') {
                this.closeStepEditor();
            }
        });
        
        // Store reference for callback access
        window.testBuilder = this;
    }
    
    setupStepReordering() {
        // Implement step reordering with drag and drop
        const container = document.getElementById('test-steps-container');
        
        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('test-step')) {
                this.draggedStep = parseInt(e.target.dataset.stepIndex);
                e.target.classList.add('dragging');
            }
        });
        
        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('test-step')) {
                e.target.classList.remove('dragging');
                this.draggedStep = null;
            }
        });
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            const draggingElement = document.querySelector('.dragging');
            
            if (afterElement == null) {
                container.appendChild(draggingElement);
            } else {
                container.insertBefore(draggingElement, afterElement);
            }
        });
    }
    
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.test-step:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    addStep(stepType) {
        const newStep = {
            type: stepType,
            description: '',
            selector: '',
            value: '',
            expected: 'visible',
            timeout: 5000
        };
        
        this.testCase.steps.push(newStep);
        this.updateStepsDisplay();
        
        // Auto-open editor for new step
        this.editStep(this.testCase.steps.length - 1);
    }
    
    editStep(stepIndex) {
        const step = this.testCase.steps[stepIndex];
        if (!step) return;
        
        const modal = document.getElementById('step-editor-modal');
        const content = document.getElementById('step-editor-content');
        
        content.innerHTML = this.renderStepEditor(step, stepIndex);
        modal.classList.remove('hidden');
        
        // Setup step editor event listeners
        this.setupStepEditorListeners(stepIndex);
    }
    
    renderStepEditor(step, stepIndex) {
        const commonFields = `
            <div class="form-group">
                <label class="form-label">Description</label>
                <input type="text" id="step-description" class="form-input" 
                       value="${step.description || ''}" 
                       placeholder="Optional description for this step">
            </div>
        `;
        
        let specificFields = '';
        
        switch (step.type) {
            case 'navigate':
                specificFields = `
                    <div class="form-group">
                        <label class="form-label">URL *</label>
                        <input type="url" id="step-value" class="form-input" 
                               value="${step.value || ''}" 
                               placeholder="https://example.dynamics.com"
                               required>
                    </div>
                `;
                break;
                
            case 'click':
                specificFields = `
                    <div class="form-group">
                        <label class="form-label">Element Selector *</label>
                        <input type="text" id="step-selector" class="form-input" 
                               value="${step.selector || ''}" 
                               placeholder="button[data-id='new-record']"
                               required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Timeout (ms)</label>
                        <input type="number" id="step-timeout" class="form-input" 
                               value="${step.timeout || 5000}" min="1000" max="30000">
                    </div>
                `;
                break;
                
            case 'fill':
                specificFields = `
                    <div class="form-group">
                        <label class="form-label">Field Selector *</label>
                        <input type="text" id="step-selector" class="form-input" 
                               value="${step.selector || ''}" 
                               placeholder="input[data-id='name']"
                               required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Value to Enter *</label>
                        <input type="text" id="step-value" class="form-input" 
                               value="${step.value || ''}" 
                               placeholder="Test Customer Name"
                               required>
                    </div>
                `;
                break;
                
            case 'verify':
                specificFields = `
                    <div class="form-group">
                        <label class="form-label">Element Selector *</label>
                        <input type="text" id="step-selector" class="form-input" 
                               value="${step.selector || ''}" 
                               placeholder="[data-id='success-message']"
                               required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Verification Type</label>
                        <select id="step-expected" class="form-select">
                            <option value="visible" ${step.expected === 'visible' ? 'selected' : ''}>Should be visible</option>
                            <option value="hidden" ${step.expected === 'hidden' ? 'selected' : ''}>Should be hidden</option>
                            <option value="text" ${step.expected && step.expected !== 'visible' && step.expected !== 'hidden' ? 'selected' : ''}>Should contain text</option>
                        </select>
                    </div>
                    <div class="form-group" id="expected-text-group" ${step.expected === 'text' || (step.expected && step.expected !== 'visible' && step.expected !== 'hidden') ? '' : 'style="display: none;"'}>
                        <label class="form-label">Expected Text</label>
                        <input type="text" id="step-expected-text" class="form-input" 
                               value="${step.expected && step.expected !== 'visible' && step.expected !== 'hidden' ? step.expected : ''}" 
                               placeholder="Expected text content">
                    </div>
                `;
                break;
                
            case 'wait':
                specificFields = `
                    <div class="form-group">
                        <label class="form-label">Wait Time (milliseconds) *</label>
                        <input type="number" id="step-value" class="form-input" 
                               value="${step.value || 1000}" 
                               min="100" max="10000" required>
                    </div>
                `;
                break;
                
            case 'screenshot':
                specificFields = `
                    <p class="text-gray-600 text-sm mb-4">
                        This step will capture a screenshot for debugging purposes.
                    </p>
                `;
                break;
        }
        
        return `
            <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                    Edit ${step.type.toUpperCase()} Step
                </h3>
                
                <form id="step-editor-form">
                    ${commonFields}
                    ${specificFields}
                </form>
                
                <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button type="button" id="btn-cancel-step" class="btn-secondary">
                        Cancel
                    </button>
                    <button type="button" id="btn-save-step" class="btn-primary">
                        Save Step
                    </button>
                </div>
            </div>
        `;
    }
    
    setupStepEditorListeners(stepIndex) {
        // Cancel button
        document.getElementById('btn-cancel-step').addEventListener('click', () => {
            this.closeStepEditor();
        });
        
        // Save button
        document.getElementById('btn-save-step').addEventListener('click', () => {
            this.saveStep(stepIndex);
        });
        
        // Verification type change
        const expectedSelect = document.getElementById('step-expected');
        if (expectedSelect) {
            expectedSelect.addEventListener('change', (e) => {
                const textGroup = document.getElementById('expected-text-group');
                if (e.target.value === 'text') {
                    textGroup.style.display = 'block';
                } else {
                    textGroup.style.display = 'none';
                }
            });
        }
        
        // Focus first input
        setTimeout(() => {
            const firstInput = document.querySelector('#step-editor-form input, #step-editor-form select');
            firstInput?.focus();
        }, 100);
    }
    
    saveStep(stepIndex) {
        const step = this.testCase.steps[stepIndex];
        
        // Get form values
        const description = document.getElementById('step-description')?.value || '';
        const selector = document.getElementById('step-selector')?.value || '';
        const value = document.getElementById('step-value')?.value || '';
        const timeout = document.getElementById('step-timeout')?.value || 5000;
        const expected = document.getElementById('step-expected')?.value || 'visible';
        const expectedText = document.getElementById('step-expected-text')?.value || '';
        
        // Validate required fields
        if (step.type === 'navigate' && !value) {
            alert('URL is required for navigate steps');
            return;
        }
        
        if ((step.type === 'click' || step.type === 'fill' || step.type === 'verify') && !selector) {
            alert('Element selector is required');
            return;
        }
        
        if (step.type === 'fill' && !value) {
            alert('Value is required for fill steps');
            return;
        }
        
        if (step.type === 'wait' && (!value || parseInt(value) < 100)) {
            alert('Wait time must be at least 100ms');
            return;
        }
        
        // Update step
        step.description = description;
        step.selector = selector;
        step.value = value;
        step.timeout = parseInt(timeout);
        
        if (step.type === 'verify') {
            step.expected = expected === 'text' ? expectedText : expected;
        }
        
        this.closeStepEditor();
        this.updateStepsDisplay();
    }
    
    closeStepEditor() {
        document.getElementById('step-editor-modal').classList.add('hidden');
    }
    
    deleteStep(stepIndex) {
        if (confirm('Are you sure you want to delete this step?')) {
            this.testCase.steps.splice(stepIndex, 1);
            this.updateStepsDisplay();
        }
    }
    
    updateStepsDisplay() {
        const container = document.getElementById('test-steps-container');
        
        if (this.testCase.steps.length === 0) {
            container.className = 'min-h-64 border-2 border-dashed border-gray-300 rounded-lg p-4 drag-zone empty';
            container.innerHTML = this.renderEmptyState();
        } else {
            container.className = 'min-h-64 border-2 border-dashed border-gray-300 rounded-lg p-4';
            container.innerHTML = this.renderTestSteps();
        }
        
        // Re-setup event listeners for new elements
        this.setupStepReordering();
        
        // Update step counter in heading
        const heading = document.querySelector('h3');
        if (heading) {
            heading.innerHTML = `
                <i class="fas fa-list-ol mr-2"></i>
                Test Steps (${this.testCase.steps.length})
            `;
        }
    }
    
    validateTestCase() {
        const errors = [];
        
        if (!this.testCase.name.trim()) {
            errors.push('Test case name is required');
        }
        
        if (this.testCase.steps.length === 0) {
            errors.push('At least one test step is required');
        }
        
        // Validate individual steps
        this.testCase.steps.forEach((step, index) => {
            if (step.type === 'navigate' && !step.value) {
                errors.push(`Step ${index + 1}: URL is required for navigate steps`);
            }
            
            if ((step.type === 'click' || step.type === 'fill' || step.type === 'verify') && !step.selector) {
                errors.push(`Step ${index + 1}: Element selector is required`);
            }
            
            if (step.type === 'fill' && !step.value) {
                errors.push(`Step ${index + 1}: Value is required for fill steps`);
            }
        });
        
        if (errors.length > 0) {
            alert('Validation Errors:\n\n' + errors.join('\n'));
            return false;
        }
        
        alert('Test case validation passed!');
        return true;
    }
    
    saveTestCase() {
        if (!this.validateTestCase()) {
            return;
        }
        
        // Update test case with current form values
        this.testCase.name = document.getElementById('test-name').value;
        this.testCase.description = document.getElementById('test-description').value;
        this.testCase.expected_result = document.getElementById('test-result').value;
        this.testCase.tags = document.getElementById('test-tags').value;
        
        this.callbacks.onSave(this.testCase);
    }
    
    loadTestCase(testCase) {
        this.testCase = { ...testCase };
        this.render();
        this.setupEventListeners();
    }
    
    reset() {
        this.testCase = {
            id: null,
            name: '',
            description: '',
            steps: [],
            expected_result: 'pass',
            tags: ''
        };
        this.render();
        this.setupEventListeners();
    }
}
