document.addEventListener('DOMContentLoaded', function() {
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
    
    // Form event listeners
    valueForm.addEventListener('submit', handleValueSubmit);
    goalForm.addEventListener('submit', handleGoalSubmit);
    metricForm.addEventListener('submit', handleMetricSubmit);
    document.getElementById('save-button').addEventListener('click', handleSaveEdit);
    document.getElementById('delete-button').addEventListener('click', handleDeleteItem);
    resetButton.addEventListener('click', handleResetData);
    
    // Initial data load
    fetchHierarchyData();
    
    // Fetch hierarchy data from API
    function fetchHierarchyData() {
        fetch('/api/hierarchy')
            .then(response => response.json())
            .then(data => {
                hierarchyData = data;
                console.log("Fetched hierarchy data:", hierarchyData);
                console.log("Goals data:", hierarchyData.goals);
                updateSelectOptions();
                updateVisualization(hierarchyData);
            })
            .catch(error => console.error('Error fetching hierarchy data:', error));
    }
    
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
    
    // Handle value form submission
    function handleValueSubmit(event) {
        event.preventDefault();
        const valueName = document.getElementById('value-name').value;
        
        fetch('/api/value', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: valueName
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log("Value created:", data);
            valueForm.reset();
            fetchHierarchyData();
        })
        .catch(error => console.error('Error creating value:', error));
    }
    
    // Handle goal form submission
    function handleGoalSubmit(event) {
        event.preventDefault();
        const goalName = document.getElementById('goal-name').value;
        const goalDescription = document.getElementById('goal-description').value;
        
        // Get selected values
        const selectedValueIds = Array.from(goalValuesSelect.selectedOptions).map(option => parseInt(option.value));
        
        fetch('/api/goal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: goalName,
                description: goalDescription,
                value_ids: selectedValueIds
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log("Goal created:", data);
            goalForm.reset();
            fetchHierarchyData();
        })
        .catch(error => console.error('Error creating goal:', error));
    }
    
    // Handle metric form submission
    function handleMetricSubmit(event) {
        event.preventDefault();
        const metricName = document.getElementById('metric-name').value;
        
        // Get selected goals
        const selectedGoalIds = Array.from(metricGoalsSelect.selectedOptions).map(option => parseInt(option.value));
        
        fetch('/api/metric', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: metricName,
                goal_ids: selectedGoalIds
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log("Metric created:", data);
            metricForm.reset();
            fetchHierarchyData();
        })
        .catch(error => console.error('Error creating metric:', error));
    }
    
    // Open edit modal for an item
    window.openEditModal = function(type, id) {
        const editId = document.getElementById('edit-id');
        const editType = document.getElementById('edit-type');
        const editName = document.getElementById('edit-name');
        
        const editValueSection = document.getElementById('edit-value-section');
        const editGoalSection = document.getElementById('edit-goal-section');
        const editMetricSection = document.getElementById('edit-metric-section');
        
        // Reset all sections
        editValueSection.style.display = 'none';
        editGoalSection.style.display = 'none';
        editMetricSection.style.display = 'none';
        
        // Find the item in the hierarchy data
        let item;
        if (type === 'value') {
            item = hierarchyData.values.find(v => v.id === id);
            editValueSection.style.display = 'block';
            
            // Populate goal options for value
            const editValueGoals = document.getElementById('edit-value-goals');
            editValueGoals.innerHTML = '';
            
            hierarchyData.goals.forEach(goal => {
                const option = document.createElement('option');
                option.value = goal.id;
                option.textContent = goal.name;
                option.selected = item.goal_ids.includes(goal.id);
                editValueGoals.appendChild(option);
            });
        } else if (type === 'goal') {
            item = hierarchyData.goals.find(g => g.id === id);
            editGoalSection.style.display = 'block';
            
            // Populate value options for goal
            const editGoalValues = document.getElementById('edit-goal-values');
            editGoalValues.innerHTML = '';
            
            hierarchyData.values.forEach(value => {
                const option = document.createElement('option');
                option.value = value.id;
                option.textContent = value.name;
                option.selected = item.value_ids.includes(value.id);
                editGoalValues.appendChild(option);
            });
            
            // Populate metric options for goal
            const editGoalMetrics = document.getElementById('edit-goal-metrics');
            editGoalMetrics.innerHTML = '';
            
            hierarchyData.metrics.forEach(metric => {
                const option = document.createElement('option');
                option.value = metric.id;
                option.textContent = metric.name;
                option.selected = item.metric_ids.includes(metric.id);
                editGoalMetrics.appendChild(option);
            });
        } else if (type === 'metric') {
            item = hierarchyData.metrics.find(m => m.id === id);
            editMetricSection.style.display = 'block';
            
            // Populate goal options for metric
            const editMetricGoals = document.getElementById('edit-metric-goals');
            editMetricGoals.innerHTML = '';
            
            hierarchyData.goals.forEach(goal => {
                const option = document.createElement('option');
                option.value = goal.id;
                option.textContent = goal.name;
                option.selected = item.goal_ids.includes(goal.id);
                editMetricGoals.appendChild(option);
            });
        }
        
        if (item) {
            editId.value = id;
            editType.value = type;
            editName.value = item.name;
            editModal.show();
        }
    };
    
    // Handle save button in edit modal
    function handleSaveEdit() {
        const id = parseInt(document.getElementById('edit-id').value);
        const type = document.getElementById('edit-type').value;
        
        let selectedIds = [];
        
        if (type === 'value') {
            const goals = document.getElementById('edit-value-goals');
            selectedIds = Array.from(goals.selectedOptions).map(option => parseInt(option.value));
            
            updateConnections(type, id, { goal_ids: selectedIds });
        } else if (type === 'goal') {
            const values = document.getElementById('edit-goal-values');
            const metrics = document.getElementById('edit-goal-metrics');
            
            const valueIds = Array.from(values.selectedOptions).map(option => parseInt(option.value));
            const metricIds = Array.from(metrics.selectedOptions).map(option => parseInt(option.value));
            
            updateConnections(type, id, { value_ids: valueIds, metric_ids: metricIds });
        } else if (type === 'metric') {
            const goals = document.getElementById('edit-metric-goals');
            selectedIds = Array.from(goals.selectedOptions).map(option => parseInt(option.value));
            
            updateConnections(type, id, { goal_ids: selectedIds });
        }
    }
    
    // Update connections between items
    function updateConnections(itemType, itemId, connections) {
        const data = {
            item_type: itemType,
            item_id: itemId,
            ...connections
        };
        
        fetch('/api/connections', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(data => {
            console.log("Connections updated:", data);
            editModal.hide();
            fetchHierarchyData();
        })
        .catch(error => console.error('Error updating connections:', error));
    }
    
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