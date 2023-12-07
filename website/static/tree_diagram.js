// Define a global array to hold the maps
let globalVector = [];
let network; // Define network here
let previousClickedNode = null; // Add this line outside of your function

let tableData = [];
let tableArray = [];
let headersArray = [];

$(document).ready(function() {
    function initialize() {
        // Get the DataTable
        let table = $('#myTable').DataTable();

        // Get the number of rows
        let rowCount = table.rows().count();

        // Get the number of columns
        let colCount = table.columns().count();

        // Get the headers
        table.columns().header().each(function(header) {
            // Get the text of the header and add it to the headers array
            headersArray.push($(header).text());
        });

        // Iterate over each row
        for (let i = 0; i < rowCount; i++) {
            // Initialize an empty array for this row
            let rowArray = [];

            // Iterate over each column
            for (let j = 0; j < colCount; j++) {
                // Get the cell value
                let cellValue = table.cell(i, j).data();

                // Add the cell value to the row array
                rowArray.push(cellValue);
            }

            // Add the row array to the table array
            tableArray.push(rowArray);
        }

        // Now, tableArray is a 2D array of your DataTable
        console.log(tableArray);
        console.log(headersArray);
    }
    // Define the custom filtering function
    function filterTableArray(tableArray, globalVector, headersArray) {
        return tableArray.filter(function(row) {
            for (let map of globalVector) {
                let column = Object.keys(map)[0];
                let value = map[column];
                let columnIndex = headersArray.indexOf(column);
                // debug
                console.log(columnIndex);
                
                if (row[columnIndex] !== value) {
                    return false; // Exclude this row
                }
            }
            return true; // Include this row
        });
    }

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
            color:'#97C2FC', // Default color is 'lightblue
            originalColor: '#97C2FC',
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
        let options = {
            layout: {
              hierarchical: {
                direction: "UD", // From up to down
                sortMethod: "directed" // Directed sorting method
              }
            }
          };
          
        network = new vis.Network(container, data, options); // Assign to the global network variable

        // Add a click handler to the network
        network.on("click", function(params) {
            // Check if a node was clicked
            if (params.nodes.length > 0) {
                // Get the clicked node id
                let clickedNodeId = params.nodes[0];

                // Get the clicked node
                let clickedNode = network.body.data.nodes.get(clickedNodeId);

                // Call the nodeClicked function with the clicked node
                nodeClicked(clickedNode);
            }
        });
    }

    function colClicked(colIndex) {
        // Define a new map
        let newMap = {};
        // Get the DataTable
        let table = $('#myTable').DataTable(); 

        // Get the column header
        let columnHeader = table.column(colIndex).header().innerHTML;

        // Add the column header and an ampersand to the map
        newMap[columnHeader] = '*';

        // Add the map to the global array
        globalVector.push(newMap);

        // Create an object to hold the counts
        let counts = {};
      
        // Initialize an empty array for the column data
        let columnData = [];

        // Iterate over each row
        for (let i = 0; i < tableArray.length; i++) {
            // Get the cell value
            let cellValue = tableArray[i][colIndex];

            // Add the cell value to the column data array
            columnData.push(cellValue);
        }
      
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

      function nodeClicked(clickedNode) {
        console.log(headersArray);
        // Check if a node was clicked
        if (clickedNode) {
            // If there was a previously clicked node, reset its color
            if (previousClickedNode) {
                network.body.data.nodes.update([{ id: previousClickedNode.id, color: previousClickedNode.originalColor }]);
            }
    
            // Get the clicked node id
            let clickedNodeId = clickedNode.id;
    
            // Get the current color of the clicked node
            let currentColor = clickedNode.color;
    
            // Get the original color of the clicked node
            let originalColor = clickedNode.originalColor;
    
            // Determine the new color
            let newColor = currentColor === 'red' ? originalColor : 'red';
    
            // Update the color of the clicked node
            network.body.data.nodes.update([{ id: clickedNodeId, color: newColor }]);
    
            // Get the updated node
            let updatedNode = network.body.data.nodes.get(clickedNodeId);
    
            // Assign the clicked node to the global variable root only if its color is red
            if (updatedNode.color === 'red') {
                root = updatedNode;
                if (globalVector.length > 0) {
                    let lastMap = globalVector[globalVector.length - 1];
                    for (let key in lastMap) {
                        lastMap[key] = clickedNode.id;
                    }
                }

                console.log(globalVector);

                filterTableArray(tableArray, globalVector, headersArray);
             
                // Get the DataTable
                let table = $('#myTable').DataTable(); 

                // Get the DataTable
                let headers = table.columns().header().toArray().map(header => $(header).text());
                console.log(headers);

                // Clear the previous search functions
                $.fn.dataTable.ext.search.pop();

                // Define the custom filtering function
                $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
                    for (let map of globalVector) {
                        let column = Object.keys(map)[0];
                        let value = map[column];
                        // Get the column index by its name from the headers array
                        let columnIndex = headers.indexOf(column);
                        // debug
                        console.log(columnIndex);
                        
                        if (data[columnIndex] !== value) {
                            return false; // Exclude this row
                        }
                    }
                    return true; // Include this row
                });
                // Redraw the table
                table.draw();
            } else {
                root = TreeData; // Default to the root of the tree
            }
    
            // Update the previously clicked node
            previousClickedNode = updatedNode;
        }
    }

    let TreeData = {
        name: "Total Population",
        count: 1,
        children: []
    };

    let root = TreeData
      
  // Call the function with your TreeData
  drawTree(TreeData);
  $('#initializeButton').click(function() {
    initialize();
});

  $("#myTable th").click(function() {
    colClicked($(this).index());
  });
});