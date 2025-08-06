// Main application JavaScript
class FFBApp {
    constructor() {
        this.currentData = [];
        this.categories = new Set();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboard();
        this.loadData();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Data management
        document.getElementById('add-record-btn').addEventListener('click', () => {
            this.showModal();
        });

        document.getElementById('record-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRecord();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.hideModal();
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.hideModal();
        });

        // Search and filter
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterData();
        });

        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filterData();
        });

        // Calculations
        document.getElementById('calculate-btn').addEventListener('click', () => {
            this.performBasicCalculation();
        });

        document.getElementById('stats-btn').addEventListener('click', () => {
            this.performStatisticalAnalysis();
        });

        document.getElementById('evaluate-btn').addEventListener('click', () => {
            this.evaluateCustomFormula();
        });

        document.getElementById('add-variable-btn').addEventListener('click', () => {
            this.addVariableInput();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('record-modal');
            if (e.target === modal) {
                this.hideModal();
            }
        });
    }

    switchTab(tabName) {
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Load specific tab data
        if (tabName === 'dashboard') {
            this.loadDashboard();
        } else if (tabName === 'data') {
            this.loadData();
        }
    }

    async loadDashboard() {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            
            this.updateDashboardStats(data);
            this.updateRecentActivity(data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    updateDashboardStats(data) {
        document.getElementById('total-records').textContent = data.length;
        
        const categories = new Set(data.map(item => item.category));
        document.getElementById('categories').textContent = categories.size;
        
        if (data.length > 0) {
            const values = data.map(item => item.value);
            const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
            const maxValue = Math.max(...values);
            
            document.getElementById('avg-value').textContent = avgValue.toFixed(2);
            document.getElementById('max-value').textContent = maxValue.toFixed(2);
        }
    }

    updateRecentActivity(data) {
        const activityContainer = document.getElementById('recent-activity');
        const recentData = data.slice(0, 5);
        
        if (recentData.length === 0) {
            activityContainer.innerHTML = '<p class="empty-state">No recent activity</p>';
            return;
        }
        
        activityContainer.innerHTML = recentData.map(item => `
            <div class="stat-item">
                <span class="stat-label">${item.title}</span>
                <span class="stat-value">${item.value}</span>
            </div>
        `).join('');
    }

    async loadData() {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            
            this.currentData = data;
            this.updateDataTable(data);
            this.updateCategoryFilter(data);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    updateDataTable(data) {
        const tbody = document.getElementById('data-table-body');
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #a0aec0;">No data available</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${this.escapeHtml(item.title)}</td>
                <td>${item.value}</td>
                <td>${this.escapeHtml(item.category)}</td>
                <td>${new Date(item.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="app.editRecord(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteRecord(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateCategoryFilter(data) {
        const categories = [...new Set(data.map(item => item.category))];
        const filter = document.getElementById('category-filter');
        
        // Keep the "All Categories" option
        filter.innerHTML = '<option value="">All Categories</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filter.appendChild(option);
        });
    }

    filterData() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        
        const filteredData = this.currentData.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm) ||
                                item.category.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            
            return matchesSearch && matchesCategory;
        });
        
        this.updateDataTable(filteredData);
    }

    showModal(record = null) {
        const modal = document.getElementById('record-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('record-form');
        
        if (record) {
            title.textContent = 'Edit Record';
            document.getElementById('title-input').value = record.title;
            document.getElementById('value-input').value = record.value;
            document.getElementById('category-input').value = record.category;
            document.getElementById('description-input').value = record.description || '';
            form.dataset.editId = record.id;
        } else {
            title.textContent = 'Add New Record';
            form.reset();
            delete form.dataset.editId;
        }
        
        modal.style.display = 'block';
    }

    hideModal() {
        document.getElementById('record-modal').style.display = 'none';
    }

    async saveRecord() {
        const form = document.getElementById('record-form');
        const formData = new FormData(form);
        
        const recordData = {
            title: formData.get('title-input') || document.getElementById('title-input').value,
            value: parseFloat(formData.get('value-input') || document.getElementById('value-input').value),
            category: formData.get('category-input') || document.getElementById('category-input').value,
            description: formData.get('description-input') || document.getElementById('description-input').value
        };
        
        const editId = form.dataset.editId;
        const url = editId ? `/api/data/${editId}` : '/api/data';
        const method = editId ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recordData)
            });
            
            if (response.ok) {
                this.hideModal();
                this.loadData();
                this.loadDashboard();
                this.showNotification('Record saved successfully!', 'success');
            } else {
                throw new Error('Failed to save record');
            }
        } catch (error) {
            console.error('Error saving record:', error);
            this.showNotification('Error saving record', 'error');
        }
    }

    async deleteRecord(id) {
        if (!confirm('Are you sure you want to delete this record?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/data/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.loadData();
                this.loadDashboard();
                this.showNotification('Record deleted successfully!', 'success');
            } else {
                throw new Error('Failed to delete record');
            }
        } catch (error) {
            console.error('Error deleting record:', error);
            this.showNotification('Error deleting record', 'error');
        }
    }

    async editRecord(id) {
        const record = this.currentData.find(item => item.id === id);
        if (record) {
            this.showModal(record);
        }
    }

    async performBasicCalculation() {
        const operation = document.getElementById('operation-select').value;
        const valuesText = document.getElementById('values-input').value;
        
        if (!valuesText.trim()) {
            this.showResult('basic-result', 'Please enter values', 'error');
            return;
        }
        
        const values = this.parseValues(valuesText);
        
        try {
            const response = await fetch('/api/calculations/basic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ operation, values })
            });
            
            const result = await response.json();
            this.showResult('basic-result', result, result.success ? 'success' : 'error');
        } catch (error) {
            console.error('Error performing calculation:', error);
            this.showResult('basic-result', 'Error performing calculation', 'error');
        }
    }

    async performStatisticalAnalysis() {
        const valuesText = document.getElementById('stats-input').value;
        
        if (!valuesText.trim()) {
            this.showResult('stats-result', 'Please enter values', 'error');
            return;
        }
        
        const values = this.parseValues(valuesText);
        
        try {
            const response = await fetch('/api/calculations/stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ values })
            });
            
            const result = await response.json();
            this.showResult('stats-result', result, result.success ? 'success' : 'error');
        } catch (error) {
            console.error('Error performing statistical analysis:', error);
            this.showResult('stats-result', 'Error performing analysis', 'error');
        }
    }

    async evaluateCustomFormula() {
        const formula = document.getElementById('formula-input').value;
        const variables = this.getVariables();
        
        if (!formula.trim()) {
            this.showResult('formula-result', 'Please enter a formula', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/calculations/formula', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ formula, variables })
            });
            
            const result = await response.json();
            this.showResult('formula-result', result, result.success ? 'success' : 'error');
        } catch (error) {
            console.error('Error evaluating formula:', error);
            this.showResult('formula-result', 'Error evaluating formula', 'error');
        }
    }

    parseValues(text) {
        // Parse comma-separated or newline-separated values
        return text.split(/[,\n]/)
            .map(val => val.trim())
            .filter(val => val)
            .map(val => parseFloat(val))
            .filter(val => !isNaN(val));
    }

    getVariables() {
        const variables = {};
        document.querySelectorAll('.variable-input').forEach(input => {
            const nameInput = input.querySelector('.var-name');
            const valueInput = input.querySelector('.var-value');
            
            if (nameInput.value && valueInput.value) {
                variables[nameInput.value] = parseFloat(valueInput.value);
            }
        });
        return variables;
    }

    addVariableInput() {
        const container = document.getElementById('variables-container');
        const newInput = document.createElement('div');
        newInput.className = 'variable-input';
        newInput.innerHTML = `
            <input type="text" placeholder="Variable name" class="var-name">
            <input type="number" placeholder="Value" class="var-value">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(newInput);
    }

    showResult(elementId, result, type) {
        const element = document.getElementById(elementId);
        
        if (typeof result === 'object') {
            if (result.success) {
                element.innerHTML = this.formatResult(result);
                element.className = 'result-display success';
            } else {
                element.innerHTML = `<strong>Error:</strong> ${result.error}`;
                element.className = 'result-display error';
            }
        } else {
            element.innerHTML = result;
            element.className = `result-display ${type}`;
        }
    }

    formatResult(result) {
        if (result.operation) {
            return `
                <strong>${result.operation.toUpperCase()}:</strong> ${result.result}<br>
                <small>Input count: ${result.input_count}</small>
            `;
        } else if (result.count) {
            return `
                <strong>Statistical Analysis:</strong><br>
                Count: ${result.count}<br>
                Mean: ${result.mean.toFixed(2)}<br>
                Median: ${result.median.toFixed(2)}<br>
                Std Dev: ${result.std_dev.toFixed(2)}<br>
                Min: ${result.min.toFixed(2)}<br>
                Max: ${result.max.toFixed(2)}
            `;
        } else if (result.formula) {
            return `
                <strong>Formula:</strong> ${result.formula}<br>
                <strong>Result:</strong> ${result.result}<br>
                <small>Variables: ${JSON.stringify(result.variables)}</small>
            `;
        }
        return JSON.stringify(result, null, 2);
    }

    showNotification(message, type) {
        // Simple notification - could be enhanced with a proper notification system
        alert(`${type.toUpperCase()}: ${message}`);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FFBApp();
});
