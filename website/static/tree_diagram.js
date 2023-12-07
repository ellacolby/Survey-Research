document.addEventListener('DOMContentLoaded', function() {
    function drawTree(TreeData) {
        // Create an array to hold the nodes
        let nodes = [];
    
        // Create an array to hold the edges
        let edges = [];
    
        // Recursive function to process the TreeData
        function processNode(node, parentId = null) {
        // Create a new node
        let newNode = {
            id: node.name,
            label: `${node.name} (${node.count})`,
        };
    
        // Add the node to the nodes array
        nodes.push(newNode);
    
        // If this node has a parent, create an edge
        if (parentId) {
            edges.push({
            from: parentId,
            to: node.name,
            });
        }
    
        // Process the children
        node.children.forEach((child) => processNode(child, node.name));
        }
    
        // Start processing with the root node
        processNode(TreeData);
    
        // Create a network
        let container = document.getElementById("mynetwork");
        let data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges),
        };
        let options = {};
        let network = new vis.Network(container, data, options);
    }

    function colClicked(colIndex) {
        // Create an object to hold the counts
        let counts = {};
      
        // Get the DataTable
        let table = $('#myTable').DataTable();
      
        // Get the data for the clicked column
        let columnData = table.column(colIndex).data().toArray();
      
        // Iterate over each value in the column
        columnData.forEach(function(cellValue) {
          // If the cell value is not empty
          if (cellValue) {
            // If this value is not already in the counts object, add it
            if (!counts[cellValue]) {
              counts[cellValue] = {
                name: cellValue,
                count: 0,
                children: []
              };
            }
      
            // Increment the count
            counts[cellValue].count++;
          }
        });
      
        // Convert the counts object to an array of TreeData objects
        let treeDataArray = Object.values(counts);
      
        // Clear the children of the root node
        root.children = [];
      
        // Add the new TreeData objects as children of the root
        root.children = root.children.concat(treeDataArray);
      
        // Draw the tree
        drawTree(root);
      }

    let TreeData = {
        name: "Total Population",
        count: 1,
        children: []
    };

    let root = TreeData
      
  // Call the function with your TreeData
  drawTree(TreeData);

  $(document).ready(function() {
    $('#myTable').DataTable();
  });

  $("#myTable th").click(function() {
    colClicked($(this).index());
  });
});