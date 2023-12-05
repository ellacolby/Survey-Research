document.addEventListener('DOMContentLoaded', function() {
    // Set the dimensions and margins of the diagram
    const margin = {top: 20, right: 200, bottom: 20, left: 200};
    const width = document.getElementById('tree-diagram').clientWidth - margin.left - margin.right;
    const height = 900 - margin.top - margin.bottom;

    // Declare variable to store the clicked column
    let clickedColumn;
    let clickedNode;
  
    // Append the svg object to the div with id "tree-diagram"
    const svg = d3.select("#tree-diagram").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
    // Create the tree layout
    const treemap = d3.tree().size([height, width]);
  
    function drawTree(treeData) {
        // Create a hierarchy from the data
        let root = d3.hierarchy(treeData);
    
        // Create a tree layout
        let treeLayout = d3.tree().size([width, height]);
    
        // Generate the tree
        treeLayout(root);
    
        // Select the SVG element
        let svg = d3.select('svg');
    
        // Draw the links (lines between nodes)
        svg.selectAll('.link')
            .data(root.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y));
    
        // Draw the nodes
        svg.selectAll('.node')
            .data(root.descendants())
            .enter()
            .append('circle')
            .attr('class', 'node')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 5);
    
        // Add labels to the nodes
        svg.selectAll('.label')
            .data(root.descendants())
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .text(d => d.data.name);
    }
  
    // Draw the initial tree with just the Total Population node
    drawTree({ name: "Total Population", children: [] });

    // Add event listener to column headers
    document.querySelectorAll('.column-header').forEach(header => {
        header.addEventListener('click', () => {
            // Store the clicked column
            clickedColumn = header.textContent;

            // Create a new tree data with the entries as children of the root node
            let treeData = {
                name: header.textContent,
                children: entries.map(entry => ({ name: entry }))
            };

            // Create a new object with the key being the column header and the value being null
            let obj = {};
            obj[header.textContent] = null;
        
            // Push this object onto the stack
            stack.push(obj);
            });

            drawTree(treeData)
    });

    // Add event listener to nodes
    document.querySelectorAll('.node').forEach(node => {
        node.addEventListener('click', () => {
            clickedNode = node;
            let poppedNode;

            if (node === root) {
                let treeData = {
                    name: "Total Population",
                    children: []
                };
                drawTree(treeData)
                return;
            }

            // Pop elements from the stack until you find an object whose key equals the clicked node's key
            do {
                poppedNode = stack.pop();
            } while (poppedNode && !poppedNode.hasOwnProperty(node.key));

            if (JSON.stringify(poppedNode) === JSON.stringify(node)) {
                // Update the value of this object to be the node label
                poppedNode[node.key] = node.label;

                // Push it back onto the stack
                stack.push(poppedNode);
            }
            });
    });
});