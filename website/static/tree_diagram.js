// Define a global array to hold the maps
let globalVector = [];
let network; // Define network here
let previousClickedNode = null; // Add this line outside of your function

let tableArray = [];
let headersArray = [];

let levelCount = 0

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
    }
    // Define the custom filtering function
    function filterTableArray(tableArray, globalVector, headersArray) {
        return tableArray.filter(function(row) {
            for (let map of globalVector) {
                let column = Object.keys(map)[0];
                let value = map[column];
                let columnIndex = headersArray.indexOf(column);
                
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
    function processNode(node, parentId = null, level = 0) {
        // Create a new node
        let newNode = {
            id: node.id,
            name: node.name,
            label: `${node.name} (${node.count})`,
            color:'#97C2FC',
            originalColor: '#97C2FC',
            level: level, // Set the level of the node
            physics: {
                gravitationalConstant: -50,
            },
        };

        // Add the node to the nodes array
        nodes.push(newNode);

        // If this node has a parent, create an edge
        if (parentId) {
            edges.push({
                from: parentId,
                to: newNode.id,
            });
        }

        // Process the children
        node.children.forEach((child) => processNode(child, newNode.id, level + 1)); // Increment the level for children
    }

        // Start processing with the root node
        processNode(TreeData, null, 0);
    
        // Create a network
        let container = document.getElementById("mynetwork");
        let data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges),
        };
        let options = {
            layout: {
                hierarchical: {
                    direction: "UD",
                    sortMethod: "directed"
                }
            },
            physics: {
                hierarchicalRepulsion: {
                    springLength: 200, // Increase this value to make the nodes more resistant to movement
                    springConstant: 0.01, // Increase this value to make the nodes more resistant to movement
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
            // Get the last map without '*' as a value
            let lastMap;
            for (let i = globalVector.length - 1; i >= 0; i--) {
                let map = globalVector[i];
                let value = Object.values(map)[0];
                if (value !== '*') {
                    lastMap = map;
                    break;
                }
            }
            // Get the DataTable
            let table = $('#myTable').DataTable(); 
            
            // Get the DataTable
            let headers = table.columns().header().toArray().map(header => $(header).text());
            
            // Clear the previous search functions
            $.fn.dataTable.ext.search.pop();
            
            // Define the custom filtering function
            $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
                if (lastMap) {
                    for (let i = 0; i < globalVector.length - 1; i++) {
                        let map = globalVector[i];
                        let column = Object.keys(map)[0];
                        let value = map[column];
                        // Get the column index by its name from the headers array
                        let columnIndex = headers.indexOf(column);                
                        if (data[columnIndex] !== value) {
                            return false; // Exclude this row
                        }
                    }
                }
                return true; // Include this row
            });

            console.log(lastMap)
            
            // Redraw the table
            table.draw();

        // Define a new map
        let newMap = {};

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
                        id: Math.random(), // Add a unique identifier
                        name: cellValue,
                        count: 0,
                        children: [],
                        parent: root // Add a parent field
                    };
                }

                // Increment the count
                counts[cellValue].count++;
            }
        });
      
        // Convert the counts object to an array of TreeData objects
        let treeDataArray = Object.values(counts);
      
        // Find the node in TreeData that corresponds to root
        let rootNode = findNode(TreeData, root.id);

        if (rootNode) {
            // Clear the children of the root node
            rootNode.children = [];
    
            // Add the new TreeData objects as children of the root
            rootNode.children = rootNode.children.concat(treeDataArray);
        }
    
        // Draw the tree
        drawTree(TreeData);
      }

      // Recursive function to find a node in the tree
        // Recursive function to find a node in the tree
        function findNode(node, id) { // Use the unique identifier to find the node
            if (node.id === id) {
                return node;
            }

            for (let i = 0; i < node.children.length; i++) {
                let result = findNode(node.children[i], id);
                if (result) {
                    return result;
                }
            }

            return null;
        }

      function nodeClicked(clickedNode) {
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
                        lastMap[key] = clickedNode.name;
                    }
                }

                tableArray = filterTableArray(tableArray, globalVector, headersArray);
             
                drawTable();
            } else {
                root = TreeData; // Default to the root of the tree
            }
    
            // Update the previously clicked node
            previousClickedNode = updatedNode;
        }
    }

    function drawTable(){
        // Get the DataTable
        let table = $('#myTable').DataTable(); 

        // Get the DataTable
        let headers = table.columns().header().toArray().map(header => $(header).text());

        // Clear the previous search functions
        $.fn.dataTable.ext.search.pop();

        // Define the custom filtering function
        $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
            for (let map of globalVector) {
                let column = Object.keys(map)[0];
                let value = map[column];
                // Get the column index by its name from the headers array
                let columnIndex = headers.indexOf(column);                
                if (data[columnIndex] !== value) {
                    return false; // Exclude this row
                }
            }
            return true; // Include this row
        });
        // Redraw the table
        table.draw();
    }

    let TreeData = {
        id: Math.random(), // Add a unique identifier
        name: "Total Population",
        count: 172,
        children: [],
        parent: null // Add a parent field
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