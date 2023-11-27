document.addEventListener('DOMContentLoaded', function() {
  // Set the dimensions and margins of the diagram
  const margin = {top: 20, right: 200, bottom: 20, left: 200};
  const width = document.getElementById('tree-diagram').clientWidth - margin.left - margin.right;
  const height = 900 - margin.top - margin.bottom;

  // Append the svg object to the div with id "tree-diagram"
  const svg = d3.select("#tree-diagram").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Create the tree layout
  const treemap = d3.tree().size([height, width]);

  function drawTree(treeData) {
    console.log(treeData);
    // Clear the previous graph
    svg.selectAll('*').remove();

    // Assigns the structure and recalculates the layout
    const root = d3.hierarchy(treeData, function(d) { return d.children; });
    treemap(root);

    // Add links between nodes
    svg.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1.5)
        .attr("d", d3.linkHorizontal()
            .x(function(d) { return d.y; })
            .y(function(d) { return d.x; }));

    // Add each node as a group
    const node = svg.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", function(d) { 
            return "node" + (d.children ? " node--internal" : " node--leaf"); 
        })
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Add a circle to represent each node
    const nodeEnter = node.append("circle")
        .attr("r", 0) // initial radius 0
        .attr("fill", "#fff")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5);

    // Transition nodes to their new size
    nodeEnter.transition()
        .duration(750)
        .attr("r", 7);

    // Add a label to each node
    node.append("text")
        .attr("dy", "0.31em")
        .attr("x", function(d) { 
            return d.children ? -8 : 8; 
        })
        .style("text-anchor", function(d) {
            return d.children ? "end" : "start";
        })
        .text(function(d) { return d.data ? d.data.name : ''; }) // Add the check here
        .style("fill-opacity", 0)
        .transition()
        .duration(750)
        .style("fill-opacity", 1);


    // Variable to keep track of the currently selected node
    let selectedNode = null;

    // Store the original tree data
    let originalTreeData = treeData;

    // Start with a single root node
    let data = {
      name: 'Root',
      children: []
    };

    // Add a click event listener to each node
    node.on('click', function(event, d) {
      console.log(treeData.children[d - 1].name);
      if (!d.children) {
        // If the node is selected
        if (selectedNode === this) {
          d3.select(this).select('circle')
            .style('fill', '#fff'); // Change color back to white
          selectedNode = null; // Deselect node
          // Redraw the original tree
          drawTree(originalTreeData);
        } else {
          selectedNode = this; // Update the currently selected node
          // Store the original tree data
          originalTreeData = treeData;

          // Create a new tree with the clicked node as the root
          const newTreeData = {
            name: treeData.children[d - 1].name,
            children: []
          };

          // Select this node and change its color to red
          d3.select(this).select('circle')
            .style('fill', 'red');

          // Redraw the tree with the new data
          drawTree(newTreeData);
        }
      }
    });
  }

  // Function to update the graph based on the column index
  function updateGraphBasedOnColumn(columnIndex) {
    // Fetch the data from DataTable
    const table = $('#myTable').DataTable();
    const columnData = table.column(columnIndex).data().toArray();

    // Process the column data to count the occurrences, excluding empty strings
    const counts = columnData.reduce((acc, val) => {
      if (val.trim() !== '') {  // Check if the value is not an empty string
        acc[val] = (acc[val] || 0) + 1;
      }
      return acc;
    }, {});

    // Convert the counts to an array of objects, sort by count descending
    const subpopulations = Object.entries(counts).map(([name, count]) => ({
      name: name,
      count: count
    }));

    // Sort subpopulations in descending order of count
    subpopulations.sort((a, b) => b.count - a.count);

    // Map the sorted subpopulations to the required format for the tree diagram
    const subpopulationNodes = subpopulations.map(sp => ({
      name: sp.name + " (" + sp.count + ")"
    }));

    // Calculate the total population count by summing the values of the counts object
    const totalCount = subpopulations.reduce((acc, subpop) => acc + subpop.count, 0);

    // Define the total population node with the calculated count
    const treeData = {
      name: "Total Population (" + totalCount + ")",
      children: subpopulationNodes
    };

    drawTree(treeData);
  }

  // Draw the initial tree with just the Total Population node
  drawTree({ name: "Total Population", children: [] });

  // Wait until the DataTable is fully initialized
  $('#myTable').on('init.dt', function() {
    // Attach a click listener to each column header in the DataTable
    $("body").on("click", "td", function() {
      var index = $(this).index();
      // Call the function to update the graph based on the clicked column index
      updateGraphBasedOnColumn(index);
    });
  });
});
