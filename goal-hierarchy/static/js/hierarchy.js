// D3.js Hierarchy Visualization
function updateVisualization(hierarchyData) {
    console.log("Updating visualization with data:", hierarchyData);
    
    // Get the container dimensions
    const container = document.getElementById('visualization');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Clear previous SVG
    d3.select('#visualization svg').remove();
    
    // Create SVG element
    const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Constants for spacing and dimensions
    const rowHeight = height / 4;
    const boxHeight = 40;
    const boxWidth = 180;
    const boxMargin = 20;
    
    // Row positions
    const valueY = rowHeight;
    const goalY = rowHeight * 2;
    const metricY = rowHeight * 3;
    
    // Add row labels
    svg.append('text')
        .attr('class', 'row-label')
        .attr('x', 20)
        .attr('y', valueY - boxHeight)
        .text('Values');
    
    svg.append('text')
        .attr('class', 'row-label')
        .attr('x', 20)
        .attr('y', goalY - boxHeight)
        .text('Goals');
    
    svg.append('text')
        .attr('class', 'row-label')
        .attr('x', 20)
        .attr('y', metricY - boxHeight)
        .text('Metrics');
    
    // Calculate positions for the boxes
    const values = hierarchyData.values || [];
    const goals = hierarchyData.goals || [];
    const metrics = hierarchyData.metrics || [];
    
    // Position values
    const valueBoxes = values.map((value, i) => {
        const x = 50 + i * (boxWidth + boxMargin);
        return {
            ...value,
            x: x,
            y: valueY - boxHeight / 2,
            width: boxWidth,
            height: boxHeight
        };
    });
    
    // Position goals
    const goalBoxes = goals.map((goal, i) => {
        const x = 50 + i * (boxWidth + boxMargin);
        return {
            ...goal,
            x: x,
            y: goalY - boxHeight / 2,
            width: boxWidth,
            height: boxHeight
        };
    });
    
    // Position metrics
    const metricBoxes = metrics.map((metric, i) => {
        const x = 50 + i * (boxWidth + boxMargin);
        return {
            ...metric,
            x: x,
            y: metricY - boxHeight / 2,
            width: boxWidth,
            height: boxHeight
        };
    });
    
    // Create links between values and goals
    const valueGoalLinks = [];
    values.forEach(value => {
        if (value.goal_ids && value.goal_ids.length > 0) {
            const valueBox = valueBoxes.find(v => v.id === value.id);
            
            value.goal_ids.forEach(goalId => {
                const goalBox = goalBoxes.find(g => g.id === goalId);
                if (valueBox && goalBox) {
                    valueGoalLinks.push({
                        source: valueBox,
                        target: goalBox
                    });
                }
            });
        }
    });
    
    // Create links between goals and metrics
    const goalMetricLinks = [];
    goals.forEach(goal => {
        if (goal.metric_ids && goal.metric_ids.length > 0) {
            const goalBox = goalBoxes.find(g => g.id === goal.id);
            
            goal.metric_ids.forEach(metricId => {
                const metricBox = metricBoxes.find(m => m.id === metricId);
                if (goalBox && metricBox) {
                    goalMetricLinks.push({
                        source: goalBox,
                        target: metricBox
                    });
                }
            });
        }
    });
    
    // Define curved line generator
    const lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveBasis);
    
    // Draw links between values and goals
    valueGoalLinks.forEach(link => {
        const sourceX = link.source.x + boxWidth / 2;
        const sourceY = link.source.y + boxHeight;
        const targetX = link.target.x + boxWidth / 2;
        const targetY = link.target.y;
        
        const points = [
            { x: sourceX, y: sourceY },
            { x: sourceX, y: sourceY + (targetY - sourceY) / 2 },
            { x: targetX, y: sourceY + (targetY - sourceY) / 2 },
            { x: targetX, y: targetY }
        ];
        
        svg.append('path')
            .attr('class', 'link')
            .attr('d', lineGenerator(points));
    });
    
    // Draw links between goals and metrics
    goalMetricLinks.forEach(link => {
        const sourceX = link.source.x + boxWidth / 2;
        const sourceY = link.source.y + boxHeight;
        const targetX = link.target.x + boxWidth / 2;
        const targetY = link.target.y;
        
        const points = [
            { x: sourceX, y: sourceY },
            { x: sourceX, y: sourceY + (targetY - sourceY) / 2 },
            { x: targetX, y: sourceY + (targetY - sourceY) / 2 },
            { x: targetX, y: targetY }
        ];
        
        svg.append('path')
            .attr('class', 'link')
            .attr('d', lineGenerator(points));
    });
    
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
        .attr('height', d => d.height);
    
    valueNodes.append('text')
        .attr('x', d => d.width / 2)
        .attr('y', d => d.height / 2)
        .text(d => d.name);
    
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
        .attr('height', d => d.height);
    
    goalNodes.append('text')
        .attr('x', d => d.width / 2)
        .attr('y', d => d.height / 2)
        .text(d => d.name);
    
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
        .attr('height', d => d.height);
    
    metricNodes.append('text')
        .attr('x', d => d.width / 2)
        .attr('y', d => d.height / 2)
        .text(d => d.name);
    
    // Adjust SVG size if needed for scrolling
    const maxX = Math.max(
        values.length * (boxWidth + boxMargin),
        goals.length * (boxWidth + boxMargin),
        metrics.length * (boxWidth + boxMargin)
    );
    
    if (maxX > width) {
        svg.attr('width', maxX + 100);
    }
} 