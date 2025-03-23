// Global function to fetch hierarchy data and update the visualization
async function fetchHierarchyData() {
    console.log("Fetching hierarchy data");
    try {
        const response = await fetch('/api/hierarchy');
        const data = await response.json();
        console.log("Hierarchy data fetched:", data);
        
        // Store globally for reference in edit forms
        window.hierarchyData = data;
        
        // Update value checkboxes for goal form
        updateCheckboxes(data);
        
        // Update visualization with new data
        updateVisualization(data);
    } catch (error) {
        console.error('Error fetching hierarchy data:', error);
    }
}

// Helper function to update checkboxes
function updateCheckboxes(data) {
    // Update value checkboxes for goal form
    const valueCheckboxes = document.getElementById('valueCheckboxes');
    if (valueCheckboxes) {
        valueCheckboxes.innerHTML = '';
        data.values.forEach(value => {
            valueCheckboxes.innerHTML += `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${value.id}" id="value-${value.id}">
                    <label class="form-check-label" for="value-${value.id}">${value.name}</label>
                </div>
            `;
        });
    }
    
    // Update goal checkboxes for metric form
    const goalCheckboxes = document.getElementById('goalCheckboxes');
    if (goalCheckboxes) {
        goalCheckboxes.innerHTML = '';
        data.goals.forEach(goal => {
            goalCheckboxes.innerHTML += `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${goal.id}" id="goal-${goal.id}">
                    <label class="form-check-label" for="goal-${goal.id}">${goal.name}</label>
                </div>
            `;
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded - initializing application");
    
    // Global data store
    let hierarchyData = {
        values: [],
        goals: [],
        metrics: []
    };
    
    // References to DOM elements
    const valueForm = document.getElementById('value-form');
    const goalForm = document.getElementById('goal-form');
    const metricForm = document.getElementById('metric-form');
    const goalValuesSelect = document.getElementById('goal-values');
    const metricGoalsSelect = document.getElementById('metric-goals');
    const editModal = new bootstrap.Modal(document.getElementById('editModal'));
    const resetButton = document.getElementById('resetButton');
    
    // Initialize form handlers
    initForms();
    
    // Fetch initial data
    fetchHierarchyData();
    
    // Form event listeners
    valueForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('valueName').value;
        const description = document.getElementById('valueDescription').value;
        
        try {
            const response = await fetch('/api/value', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, description }),
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log("Value created successfully:", data);
                document.getElementById('valueName').value = '';
                document.getElementById('valueDescription').value = '';
                await fetchHierarchyData();
            } else {
                console.error("Error creating value:", await response.text());
            }
        } catch (error) {
            console.error('Error adding value:', error);
        }
    });
    goalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('goalName').value;
        const description = document.getElementById('goalDescription').value;
        const valueIds = Array.from(document.querySelectorAll('#valueCheckboxes input:checked'))
            .map(checkbox => parseInt(checkbox.value));
        
        console.log("Selected value IDs:", valueIds);
        
        try {
            const response = await fetch('/api/goal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, description, value_ids: valueIds }),
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log("Goal created successfully:", data);
                document.getElementById('goalName').value = '';
                document.getElementById('goalDescription').value = '';
                document.querySelectorAll('#valueCheckboxes input:checked').forEach(checkbox => checkbox.checked = false);
                await fetchHierarchyData();
            } else {
                console.error("Error creating goal:", await response.text());
            }
        } catch (error) {
            console.error('Error adding goal:', error);
        }
    });
    metricForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('metricName').value;
        const description = document.getElementById('metricDescription').value;
        const goalIds = Array.from(document.querySelectorAll('#goalCheckboxes input:checked'))
            .map(checkbox => parseInt(checkbox.value));
        
        console.log("Selected goal IDs:", goalIds);
        
        try {
            const response = await fetch('/api/metric', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, description, goal_ids: goalIds }),
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log("Metric created successfully:", data);
                document.getElementById('metricName').value = '';
                document.getElementById('metricDescription').value = '';
                document.querySelectorAll('#goalCheckboxes input:checked').forEach(checkbox => checkbox.checked = false);
                await fetchHierarchyData();
            } else {
                console.error("Error creating metric:", await response.text());
            }
        } catch (error) {
            console.error('Error adding metric:', error);
        }
    });
    document.getElementById('saveEdit').addEventListener('click', async () => {
        const id = document.getElementById('editId').value;
        const type = document.getElementById('editType').value;
        const name = document.getElementById('editName').value;
        const description = document.getElementById('editDescription').value;
        
        // Get selected connections
        const connections = Array.from(document.querySelectorAll('#editConnections input:checked'))
            .map(checkbox => parseInt(checkbox.value));
        
        try {
            const response = await fetch(`/api/${type}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, description, connections }),
            });
            
            if (response.ok) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
                modal.hide();
                fetchHierarchyData();
            }
        } catch (error) {
            console.error('Error updating item:', error);
        }
    });
    document.getElementById('delete-button').addEventListener('click', handleDeleteItem);
    resetButton.addEventListener('click', handleResetData);
    
    // Update select options in forms
    function updateSelectOptions() {
        // Clear existing options
        goalValuesSelect.innerHTML = '';
        metricGoalsSelect.innerHTML = '';
        
        // Populate value options for goal form
        hierarchyData.values.forEach(value => {
            const option = document.createElement('option');
            option.value = value.id;
            option.textContent = value.name;
            goalValuesSelect.appendChild(option);
        });
        
        // Populate goal options for metric form
        hierarchyData.goals.forEach(goal => {
            const option = document.createElement('option');
            option.value = goal.id;
            option.textContent = goal.name;
            metricGoalsSelect.appendChild(option);
        });
    }
    
    // Open edit modal for an item
    window.openEditModal = function(type, id) {
        console.log(`Opening edit modal for ${type} with ID ${id}`);
        
        const item = findItemById(type, id);
        if (!item) {
            console.error(`Item not found: ${type} ${id}`);
            return;
        }
        
        document.getElementById('editId').value = item.id;
        document.getElementById('editType').value = type;
        document.getElementById('editName').value = item.name;
        document.getElementById('editDescription').value = item.description || '';
        
        // Show the appropriate connection options based on item type
        updateEditConnections(item, type);
        
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();
    };
    
    // Handle delete button in edit modal
    function handleDeleteItem() {
        const id = document.getElementById('edit-id').value;
        const type = document.getElementById('edit-type').value;
        
        if (confirm(`Are you sure you want to delete this ${type}?`)) {
            fetch(`/api/${type}/${id}`, {
                method: 'DELETE',
            })
            .then(response => response.json())
            .then(data => {
                console.log(`${type} deleted:`, data);
                editModal.hide();
                fetchHierarchyData();
            })
            .catch(error => console.error(`Error deleting ${type}:`, error));
        }
    }
    
    // Handle reset data button
    function handleResetData() {
        if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
            fetch('/api/reset', {
                method: 'POST',
            })
            .then(response => response.json())
            .then(data => {
                console.log("Data reset:", data);
                fetchHierarchyData();
            })
            .catch(error => console.error('Error resetting data:', error));
        }
    }
    
    // Expose updateVisualization globally
    window.updateHierarchyVisualization = function() {
        updateVisualization(hierarchyData);
    };
});

// Function to initialize forms with event handlers
function initForms() {
    console.log("Initializing form handlers");
    
    // Value form submission
    const valueForm = document.getElementById('valueForm');
    if (valueForm) {
        valueForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log("Value form submitted");
            
            const name = document.getElementById('valueName').value;
            const description = document.getElementById('valueDescription').value;
            
            try {
                const response = await fetch('/api/value', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, description }),
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("Value created successfully:", data);
                    document.getElementById('valueName').value = '';
                    document.getElementById('valueDescription').value = '';
                    
                    // Immediately fetch updated data and refresh the visualization
                    await fetchHierarchyData();
                } else {
                    console.error("Error creating value:", await response.text());
                }
            } catch (error) {
                console.error('Error adding value:', error);
            }
        });
    }
    
    // Goal form submission
    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log("Goal form submitted");
            
            const name = document.getElementById('goalName').value;
            const description = document.getElementById('goalDescription').value;
            const valueIds = Array.from(document.querySelectorAll('#valueCheckboxes input:checked'))
                .map(checkbox => parseInt(checkbox.value));
            
            console.log("Selected value IDs:", valueIds);
            
            try {
                const response = await fetch('/api/goal', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, description, value_ids: valueIds }),
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("Goal created successfully:", data);
                    document.getElementById('goalName').value = '';
                    document.getElementById('goalDescription').value = '';
                    document.querySelectorAll('#valueCheckboxes input:checked').forEach(checkbox => checkbox.checked = false);
                    
                    // Immediately fetch updated data and refresh the visualization
                    await fetchHierarchyData();
                } else {
                    console.error("Error creating goal:", await response.text());
                }
            } catch (error) {
                console.error('Error adding goal:', error);
            }
        });
    }
    
    // Metric form submission
    const metricForm = document.getElementById('metricForm');
    if (metricForm) {
        metricForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log("Metric form submitted");
            
            const name = document.getElementById('metricName').value;
            const description = document.getElementById('metricDescription').value;
            const goalIds = Array.from(document.querySelectorAll('#goalCheckboxes input:checked'))
                .map(checkbox => parseInt(checkbox.value));
            
            console.log("Selected goal IDs:", goalIds);
            
            try {
                const response = await fetch('/api/metric', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, description, goal_ids: goalIds }),
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("Metric created successfully:", data);
                    document.getElementById('metricName').value = '';
                    document.getElementById('metricDescription').value = '';
                    document.querySelectorAll('#goalCheckboxes input:checked').forEach(checkbox => checkbox.checked = false);
                    
                    // Immediately fetch updated data and refresh the visualization
                    await fetchHierarchyData();
                } else {
                    console.error("Error creating metric:", await response.text());
                }
            } catch (error) {
                console.error('Error adding metric:', error);
            }
        });
    }
    
    // Save changes button
    const saveEditBtn = document.getElementById('saveEdit');
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', async function() {
            const id = document.getElementById('editId').value;
            const type = document.getElementById('editType').value;
            const name = document.getElementById('editName').value;
            const description = document.getElementById('editDescription').value;
            
            // Get selected connections
            const connections = Array.from(document.querySelectorAll('#editConnections input:checked'))
                .map(checkbox => parseInt(checkbox.value));
            
            try {
                const response = await fetch(`/api/${type}/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, description, connections }),
                });
                
                if (response.ok) {
                    console.log(`${type} updated successfully`);
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
                    modal.hide();
                    await fetchHierarchyData();
                } else {
                    console.error(`Error updating ${type}:`, await response.text());
                }
            } catch (error) {
                console.error(`Error updating ${type}:`, error);
            }
        });
    }
    
    // Delete button
    const deleteBtn = document.getElementById('deleteItem');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async function() {
            if (!confirm('Are you sure you want to delete this item?')) {
                return;
            }
            
            const id = document.getElementById('editId').value;
            const type = document.getElementById('editType').value;
            
            console.log(`Deleting ${type} ${id}`);
            
            try {
                const response = await fetch(`/api/${type}/${id}`, {
                    method: 'DELETE',
                });
                
                if (response.ok) {
                    console.log(`${type} deleted successfully`);
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
                    modal.hide();
                    await fetchHierarchyData();
                } else {
                    console.error(`Error deleting ${type}:`, await response.text());
                }
            } catch (error) {
                console.error(`Error deleting ${type}:`, error);
            }
        });
    }
    
    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async function() {
            if (!confirm('Are you sure you want to reset all data? This cannot be undone!')) {
                return;
            }
            
            console.log("Resetting all data");
            
            try {
                const response = await fetch('/api/reset', {
                    method: 'POST',
                });
                
                if (response.ok) {
                    console.log("Data reset successfully");
                    await fetchHierarchyData();
                } else {
                    console.error("Error resetting data:", await response.text());
                }
            } catch (error) {
                console.error("Error resetting data:", error);
            }
        });
    }
}

// Update the connection options in the edit modal
function updateEditConnections(item, itemType) {
    const connectionsDiv = document.getElementById('editConnections');
    connectionsDiv.innerHTML = '';
    
    if (itemType === 'value') {
        // Show goal connections for values
        if (window.hierarchyData?.goals?.length) {
            connectionsDiv.innerHTML = `
                <label class="form-label">Connected Goals:</label>
                <div class="border p-2 rounded" style="max-height: 150px; overflow-y: auto;">
                    ${window.hierarchyData.goals.map(goal => `
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="${goal.id}" id="edit-goal-${goal.id}" 
                                ${item.goals && Array.isArray(item.goals) ? item.goals.some(g => g.id === goal.id) : item.goal_ids.includes(goal.id) ? 'checked' : ''}>
                            <label class="form-check-label" for="edit-goal-${goal.id}">${goal.name}</label>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } else if (itemType === 'goal') {
        // Show value and metric connections for goals
        let html = '';
        
        if (window.hierarchyData?.values?.length) {
            html += `
                <div class="mb-3">
                    <label class="form-label">Connected Values:</label>
                    <div class="border p-2 rounded" style="max-height: 150px; overflow-y: auto;">
                        ${window.hierarchyData.values.map(value => `
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" value="${value.id}" id="edit-value-${value.id}" 
                                    ${item.values && Array.isArray(item.values) ? item.values.some(v => v.id === value.id) : item.value_ids.includes(value.id) ? 'checked' : ''}>
                                <label class="form-check-label" for="edit-value-${value.id}">${value.name}</label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (window.hierarchyData?.metrics?.length) {
            html += `
                <div class="mb-3">
                    <label class="form-label">Connected Metrics:</label>
                    <div class="border p-2 rounded" style="max-height: 150px; overflow-y: auto;">
                        ${window.hierarchyData.metrics.map(metric => `
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" value="${metric.id}" id="edit-metric-${metric.id}" 
                                    ${item.metrics && Array.isArray(item.metrics) ? item.metrics.some(m => m.id === metric.id) : item.metric_ids.includes(metric.id) ? 'checked' : ''}>
                                <label class="form-check-label" for="edit-metric-${metric.id}">${metric.name}</label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        connectionsDiv.innerHTML = html;
    } else if (itemType === 'metric') {
        // Show goal connections for metrics
        if (window.hierarchyData?.goals?.length) {
            connectionsDiv.innerHTML = `
                <label class="form-label">Connected Goals:</label>
                <div class="border p-2 rounded" style="max-height: 150px; overflow-y: auto;">
                    ${window.hierarchyData.goals.map(goal => `
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="${goal.id}" id="edit-goal-${goal.id}" 
                                ${item.goals && Array.isArray(item.goals) ? item.goals.some(g => g.id === goal.id) : item.goal_ids.includes(goal.id) ? 'checked' : ''}>
                            <label class="form-check-label" for="edit-goal-${goal.id}">${goal.name}</label>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
}

// Find an item by its ID and type
function findItemById(type, id) {
    if (!window.hierarchyData) return null;
    
    if (type === 'value') {
        return window.hierarchyData.values.find(v => v.id === id);
    } else if (type === 'goal') {
        return window.hierarchyData.goals.find(g => g.id === id);
    } else if (type === 'metric') {
        return window.hierarchyData.metrics.find(m => m.id === id);
    }
    return null;
} 