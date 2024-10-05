// gemini api info LOOK INTO GOOGLE CLOUD API
const API_KEY = 'AIzaSyBiBPDlmTw09OF5SbGubI8nW_lCr_j1B9M';

// meteometics api info
// User: nasaspacehackathon_stella_william
// Password: 8fWk82EJEv
const apiUrl = 'https://api.meteomatics.com/2024-10-04T11:00:00.000-04:00--2024-10-05T11:00:00.000-04:00:PT5M/t_0m:C/41.3897764,-81.4412259/csv?model=mix';

const llmForm = document.getElementById("llm-form");
const llmPrompt = "I have a csv data about temperature over a period of time. I also have three different functions that render different types of graphs. I want you to take the csv data and the three functions and return the code that will render the type of graph you think is appropriate for the data. The functions are called: renderLineGraph which takes in chart_name, data, x_ax_name, and y_ax_name. renderHistogram which takes in chart_name, data, x_ax_name, and y_ax_name. renderScatterPlot which takes in chart_name, data, x_ax_name, and y_ax_name. I also have the data in a variable called userData that you can reference. Return only the code for the graph, no other text. \n The csv data is: \n";

function renderLineGraph(chart_name, data, x_ax_name, y_ax_name) {
  // Clear existing content
  const container = d3.select("#d3-container");
  container.html("");

  // Create SVG
  const svg = container.append("svg")
      .attr("width", 600)
      .attr("height", 400);

  const margin = { top: 20, right: 20, bottom: 50, left: 50 };
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up scales
  const x = d3.scaleTime()
      .range([0, width])
      .domain(d3.extent(data, d => d.x));

  const y = d3.scaleLinear()
      .range([height, 0])
      .domain([d3.min(data, d => d.y), d3.max(data, d => d.y)]);

  // Create line
  const line = d3.line()
      .x(d => x(d.x))
      .y(d => y(d.y));

  // Add the line path
  g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5) // Set this to a smaller value for a thinner line
      .attr("d", line);

  // Add data points
  g.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => x(d.x))
      .attr("cy", d => y(d.y))
      .attr("r", 1) // Reduced the size of the dots
      .attr("fill", "steelblue");

  // Add x-axis
  g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.bottom - 10)
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text(x_ax_name);

  // Add y-axis
  g.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 10)
      .attr("x", -height / 2)
      .attr("dy", "0.71em")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text(y_ax_name);

  // Add chart title
  svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(chart_name);
}

function renderHistogram(chart_name, data, x_ax_name, y_ax_name) {
    // Clear existing content
    const container = d3.select("#d3-container");
    container.html("");

    // Create SVG
    const svg = container.append("svg")
        .attr("width", 600)
        .attr("height", 400);

    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const x = d3.scaleTime()
        .range([0, width])
        .domain(d3.extent(data, d => d.x));

    const histogram = d3.histogram()
        .value(d => d.y)
        .domain(y.domain())
        .thresholds(x.ticks(20));

    const bins = histogram(data);

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(bins, d => d.length)]);

    // Create bars
    g.selectAll(".bar")
        .data(bins)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.x0))
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("y", d => y(d.length))
        .attr("height", d => height - y(d.length))
        .attr("fill", "steelblue");

    // Add x-axis
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(x_ax_name);

    // Add y-axis
    g.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("x", -height / 2)
        .attr("dy", "0.71em")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(y_ax_name);

    // Add chart title
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(chart_name);
}

function renderScatterPlot(chart_name, data, x_ax_name, y_ax_name) {
    // Clear existing content
    const container = d3.select("#d3-container");
    container.html("");

    // Create SVG
    const svg = container.append("svg")
        .attr("width", 600)
        .attr("height", 400);

    const margin = { top: 20, right: 20, bottom: 50, left: 50 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const x = d3.scaleTime()
        .range([0, width])
        .domain(d3.extent(data, d => d.x));

    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([d3.min(data, d => d.y), d3.max(data, d => d.y)]);

    // Add scatter points
    g.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", 5)
        .attr("fill", "steelblue");

    // Add x-axis
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(x_ax_name);

    // Add y-axis
    g.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("x", -height / 2)
        .attr("dy", "0.71em")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(y_ax_name);

    // Add chart title
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(chart_name);
}

async function fetchDataFromUrl(url) {
    try {
        console.log("Fetching data from URL:", url);
        const response = await fetch('http://localhost:3000/api/fetch-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.text();
        console.log("Received data:", data.substring(0, 100) + "..."); // Log first 100 characters
        return data;
    } catch (error) {
        console.error('There was a problem fetching the data:', error);
        throw error; // Re-throw the error so it can be caught in getFormText
    }
}

// Usage example:

async function getFormText(event) {
  event.preventDefault();

  const d3cont = document.getElementById("d3-container");
  
  const userURL = llmForm.elements.prompt.value;
  
  try {
    console.log("User entered URL:", userURL);
    const userData = await fetchDataFromUrl(userURL);
    console.log("Received userData:", userData ? userData.substring(0, 100) + "..." : "undefined");
    
    if (!userData) {
      throw new Error("No data received from the server");
    }
    
    // Parse CSV data
    const parsedData = parseCSV(userData);
    
    // Prepare the prompt for Gemini API
    const fullPrompt = llmPrompt + userData;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: {
            type: "OBJECT",
            properties: {
              code: {type: "STRING"}
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();
    const generatedCode = result.candidates[0].content.parts[0].text;
    const parsedResult = JSON.parse(generatedCode);
    
    // Display the generated code
    document.getElementById("result").innerText = parsedResult.code;
    
    // Execute the generated code, replacing userData with parsedData
    const modifiedCode = parsedResult.code.replace(/userData/g, 'parsedData');
    eval(modifiedCode);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById("result").innerText = "An error occurred: " + error.message;
  }
}

// Function to parse CSV data
function parseCSV(csvString) {
  // Replace semicolons with commas for d3.csvParse
  const commaCSV = csvString.replace(/;/g, ',');
  
  const parsedData = d3.csvParse(commaCSV, d => {
    return {
      x: new Date(d[Object.keys(d)[0]]), // First column is date/time
      y: parseFloat(d[Object.keys(d)[1]]) // Second column is temperature
    };
  });

  // Filter out any invalid entries
  const validData = parsedData.filter(d => !isNaN(d.y) && !isNaN(d.x.getTime()));

  console.log(`Parsed ${validData.length} valid data points`);
  console.log("Sample data:", validData.slice(0, 5));  // Log first 5 entries for debugging
  return validData;
}

// Make sure to use async/await when adding the event listener
llmForm.addEventListener('submit', async (event) => await getFormText(event));