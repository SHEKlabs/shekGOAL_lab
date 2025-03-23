// D3.js Hierarchy Visualization
function updateVisualization(hierarchyData) {
    console.log("Updating visualization with:", hierarchyData);
    
    // Clear previous visualization
    const visualizationDiv = document.getElementById('visualization');
    visualizationDiv.innerHTML = '';
    
    // Exit early if no data
    if (!hierarchyData || (!hierarchyData.values.length && !hierarchyData.goals.length && !hierarchyData.metrics.length)) {
        console.log("No data to visualize");
        visualizationDiv.innerHTML = '<div class="alert alert-info m-3">No data yet. Add values, goals, and metrics to visualize them.</div>';
        return;
    }
    
    // Get container dimensions
    const container = visualizationDiv.getBoundingClientRect();
    const width = container.width || 800;
    const height = 600;
    
    // Create SVG
    const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'hierarchy-svg');
    
    // Constants for spacing and dimensions
    const rowHeight = height / 4;
    const boxHeight = 80;
    const boxWidth = 180;
    const boxMargin = 20;
    
    // Row positions
    const valueY = rowHeight;
    const goalY = rowHeight * 2;
    const metricY = rowHeight * 3;
    
    // Create box positions
    const values = hierarchyData.values || [];
    const goals = hierarchyData.goals || [];
    const metrics = hierarchyData.metrics || [];
    
    console.log("Values:", values.length, "Goals:", goals.length, "Metrics:", metrics.length);
    
    // Create boxes with positions
    const valueBoxes = values.map((value, i) => {
        const totalWidth = Math.max(values.length * (boxWidth + boxMargin) - boxMargin, 10);
        const startX = (width - totalWidth) / 2;
        return {
            ...value,
            x: startX + i * (boxWidth + boxMargin),
            y: valueY,
            width: boxWidth,
            height: boxHeight
        };
    });
    
    const goalBoxes = goals.map((goal, i) => {
        const totalWidth = Math.max(goals.length * (boxWidth + boxMargin) - boxMargin, 10);
        const startX = (width - totalWidth) / 2;
        return {
            ...goal,
            x: startX + i * (boxWidth + boxMargin),
            y: goalY,
            width: boxWidth,
            height: boxHeight
        };
    });
    
    const metricBoxes = metrics.map((metric, i) => {
        const totalWidth = Math.max(metrics.length * (boxWidth + boxMargin) - boxMargin, 10);
        const startX = (width - totalWidth) / 2;
        return {
            ...metric,
            x: startX + i * (boxWidth + boxMargin),
            y: metricY,
            width: boxWidth,
            height: boxHeight
        };
    });
    
    // Create connections between elements
    const connections = [];
    
    // Value-Goal connections
    valueBoxes.forEach(value => {
        console.log("Processing value:", value.name, "with goals:", value.goals);
        if (value.goals && Array.isArray(value.goals)) {
            value.goals.forEach(goalRef => {
                const goal = goalBoxes.find(g => g.id === goalRef.id);
                if (goal) {
                    connections.push({
                        source: value,
                        target: goal
                    });
                    console.log(`Created connection: Value ${value.name} -> Goal ${goal.name}`);
                }
            });
        } else if (value.goal_ids && Array.isArray(value.goal_ids)) {
            value.goal_ids.forEach(goalId => {
                const goal = goalBoxes.find(g => g.id === goalId);
                if (goal) {
                    connections.push({
                        source: value,
                        target: goal
                    });
                    console.log(`Created connection: Value ${value.name} -> Goal ${goal.name} (using goal_ids)`);
                }
            });
        }
    });
    
    // Goal-Metric connections
    goalBoxes.forEach(goal => {
        console.log("Processing goal:", goal.name, "with metrics:", goal.metrics);
        if (goal.metrics && Array.isArray(goal.metrics)) {
            goal.metrics.forEach(metricRef => {
                const metric = metricBoxes.find(m => m.id === metricRef.id);
                if (metric) {
                    connections.push({
                        source: goal,
                        target: metric
                    });
                    console.log(`Created connection: Goal ${goal.name} -> Metric ${metric.name}`);
                }
            });
        } else if (goal.metric_ids && Array.isArray(goal.metric_ids)) {
            goal.metric_ids.forEach(metricId => {
                const metric = metricBoxes.find(m => m.id === metricId);
                if (metric) {
                    connections.push({
                        source: goal,
                        target: metric
                    });
                    console.log(`Created connection: Goal ${goal.name} -> Metric ${metric.name} (using metric_ids)`);
                }
            });
        }
    });
    
    // Draw connections
    connections.forEach(connection => {
        const sourceX = connection.source.x + connection.source.width / 2;
        const sourceY = connection.source.y + connection.source.height;
        const targetX = connection.target.x + connection.target.width / 2;
        const targetY = connection.target.y;
        
        // Create a curve path
        const points = [
            [sourceX, sourceY],
            [sourceX, sourceY + (targetY - sourceY) / 3],
            [targetX, sourceY + 2 * (targetY - sourceY) / 3],
            [targetX, targetY]
        ];
        
        const lineGenerator = d3.line()
            .x(d => d[0])
            .y(d => d[1])
            .curve(d3.curveBasis);
        
        svg.append('path')
            .attr('class', 'link')
            .attr('d', lineGenerator(points))
            .style("fill", "none")
            .style("stroke", "#999")
            .style("stroke-width", "3")
            .style("opacity", 0.6);
    });
    
    console.log("Creating boxes:", {valueBoxes, goalBoxes, metricBoxes});
    
    // Add row labels
    svg.append('text')
        .attr('x', 20)
        .attr('y', valueY - 20)
        .style('fill', '#333')
        .style('font-weight', 'bold')
        .text('Values');
        
    svg.append('text')
        .attr('x', 20)
        .attr('y', goalY - 20)
        .style('fill', '#333')
        .style('font-weight', 'bold')
        .text('Goals');
        
    svg.append('text')
        .attr('x', 20)
        .attr('y', metricY - 20)
        .style('fill', '#333')
        .style('font-weight', 'bold')
        .text('Metrics');
    
    // Create value nodes
    const valueNodes = svg.selectAll('.value-node')
        .data(valueBoxes)
        .enter()
        .append('g')
        .attr('class', 'node value')
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .on('click', function(event, d) {
            openEditModal('value', d.id);
        });
    
    valueNodes.append('rect')
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('rx', 5)
        .attr('ry', 5)
        .style('fill', '#4CAF50')
        .style('stroke', '#fff')
        .style('stroke-width', 2);
    
    valueNodes.append('text')
        .attr('x', d => d.width / 2)
        .attr('y', d => d.height / 3)
        .style('fill', '#fff')
        .style('font-weight', 'bold')
        .style('text-anchor', 'middle')
        .text(d => d.name);
    
    valueNodes.append('text')
        .attr('x', d => d.width / 2)
        .attr('y', d => d.height * 2 / 3)
        .style('fill', '#fff')
        .style('font-size', '12px')
        .style('text-anchor', 'middle')
        .text(d => d.description || "No description");
    
    // Create goal nodes
    const goalNodes = svg.selectAll('.goal-node')
        .data(goalBoxes)
        .enter()
        .append('g')
        .attr('class', 'node goal')
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .on('click', function(event, d) {
            openEditModal('goal', d.id);
        });
    
    goalNodes.append('rect')
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('rx', 5)
        .attr('ry', 5)
        .style('fill', '#2196F3')
        .style('stroke', '#fff')
        .style('stroke-width', 2);
    
    goalNodes.append('text')
        .attr('x', d => d.width / 2)
        .attr('y', d => d.height / 3)
        .style('fill', '#fff')
        .style('font-weight', 'bold')
        .style('text-anchor', 'middle')
        .text(d => d.name);
    
    goalNodes.append('text')
        .attr('x', d => d.width / 2)
        .attr('y', d => d.height * 2 / 3)
        .style('fill', '#fff')
        .style('font-size', '12px')
        .style('text-anchor', 'middle')
        .text(d => d.description || "No description");
    
    // Create metric nodes
    const metricNodes = svg.selectAll('.metric-node')
        .data(metricBoxes)
        .enter()
        .append('g')
        .attr('class', 'node metric')
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .on('click', function(event, d) {
            openEditModal('metric', d.id);
        });
    
    metricNodes.append('rect')
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('rx', 5)
        .attr('ry', 5)
        .style('fill', '#FFC107')
        .style('stroke', '#fff')
        .style('stroke-width', 2);
    
    metricNodes.append('text')
        .attr('x', d => d.width / 2)
        .attr('y', d => d.height / 3)
        .style('fill', '#fff')
        .style('font-weight', 'bold')
        .style('text-anchor', 'middle')
        .text(d => d.name);
    
    metricNodes.append('text')
        .attr('x', d => d.width / 2)
        .attr('y', d => d.height * 2 / 3)
        .style('fill', '#fff')
        .style('font-size', '12px')
        .style('text-anchor', 'middle')
        .text(d => d.description || "No description");
} 