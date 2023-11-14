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

      // Calculate the total population count
    // let totalCount = 0;
    // const subpopulations = [];
    // for (let i = 1; i <= 3; i++) {
    //   const name = document.getElementById('subpopulation' + i).value;
    //   const count = parseInt(document.getElementById('count' + i).value, 10);
    //   if(name && !isNaN(count)) {
    //     subpopulations.push({ name: name + " (" + count + ")", count: count });
    //     totalCount += count;
    //   }
    // }

    // Define the total population node with the calculated count
    // const treeData = {
    //   name: "Total Population (" + totalCount + ")",
    //   children: subpopulations
    // };

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
        .text(function(d) { return d.data.name; })
        .style("fill-opacity", 0)
        .transition()
        .duration(750)
        .style("fill-opacity", 1);


    // Variable to keep track of the currently selected node
    let selectedNode = null;

    // Add a click event listener to each node
    node.on('click', function(event, d) {
      // Check if it is a leaf node
      if (!d.children) {
        // If there is a selected node and it's this node, deselect it
        if (selectedNode === this) {
          d3.select(this).select('circle')
            .style('fill', '#fff'); // Change color back to white
          selectedNode = null; // Deselect node
        } else {
          // If there is a selected node, change its color back to white
          if (selectedNode) {
            d3.select(selectedNode).select('circle')
              .style('fill', '#fff');
          }
          // Select this node and change its color to red
          d3.select(this).select('circle')
            .style('fill', 'red');
          selectedNode = this; // Update the currently selected node
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

    // Convert the counts to a tree structure
    // const subpopulations = Object.keys(counts).map(key => {
    //   return { name: key + " (" + counts[key] + ")" };
    // });

    // // Calculate the total population count by summing the values of the counts object
    // const totalCount = Object.values(counts).reduce((acc, count) => acc + count, 0);
    // const treeData = {
    //   name: "Total Population (" + totalCount + ")",
    //   children: subpopulations
    // };

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

  // Event listener for the draw tree button
  document.getElementById('draw-tree-button').addEventListener('click', function() {
    // Get the column index from the input field
    const columnIndexInput = document.getElementById('column-index');
    const columnIndex = parseInt(columnIndexInput.value, 10) - 1; // Convert input to 0-based index

    // Check if the entered index is a number
    if (!isNaN(columnIndex) && columnIndex >= 0) {
      updateGraphBasedOnColumn(columnIndex);
      getTableContext(columnIndex);
    } else {
      alert("Please enter a valid column index.");
    }
  });

  // Draw the initial tree with just the Total Population node
  drawTree({ name: "Total Population", children: [] });
});
