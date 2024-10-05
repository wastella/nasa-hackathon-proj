// gemini api info LOOK INTO GOOGLE CLOUD API
const API_KEY = 'AIzaSyBiBPDlmTw09OF5SbGubI8nW_lCr_j1B9M';

// meteometics api info
// User: nasaspacehackathon_stella_william
// Password: 8fWk82EJEv
const apiUrl = 'https://api.meteomatics.com/2024-10-04T11:00:00.000-04:00--2024-10-05T11:00:00.000-04:00:PT5M/t_0m:C/41.3897764,-81.4412259/csv?model=mix';

const llmForm = document.getElementById("llm-form");
const llmPrompt11 = "I have a user prompt that is in plain text, they are a farmer and they want an analysis of their problem using data, the current data we have is in temperature, minimum temperature, maximum temperature, and precipitation. Please pick which data type is most relevant to the user's prompt. You should only return the data type as a string and exactly as shown below in terms of capitalization, please do not add any other characters or whitespace. Your options are: \n Temperature \n Temperature Min \n Temperature Max \n Precipitation \n The user's prompt is: "
const llmPrompt21 = "I have csv data about" 
const llmPrompt22 = "over a period of time. I also have three different functions that render different types of graphs. I want you to take the csv data and the three functions and return the code that will render the type of graph you think is appropriate for the data. The functions are called: renderLineGraph which takes in chart_name, data, x_ax_name, and y_ax_name. renderHistogram which takes in chart_name, data, x_ax_name, and y_ax_name. renderScatterPlot which takes in chart_name, data, x_ax_name, and y_ax_name. I also have the data in a variable called userData that you can reference. In the code section of your response I want the valid javascript code that you made for the function call. In the graph type section I want the name of the graph type you decided to use. In the analysis section of your response I want a full anaylis referencing the graph that answers the user's question. \n The csv data is: \n";
const llmPrompt23 = "\n The user's prompt is: \n"

const llmTextarea = document.getElementById("llm-textarea");
const datatypeLabel = document.getElementById("datatype-label");
const llmSelectDatatype = document.getElementById("llm_select_datatype");

async function recommendDataType(prompt) {
  if (!prompt.trim()) {
    datatypeLabel.textContent = "Select your data type...";
    return;
  }

  const fullPrompt = llmPrompt11 + prompt;

  try {
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
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();
    const recommendedDataType = result.candidates[0].content.parts[0].text.trim();

    datatypeLabel.textContent = `Recommended: ${recommendedDataType}`;
    
    // Find and select the option that matches the recommended data type
    const option = Array.from(llmSelectDatatype.options).find(opt => opt.text === recommendedDataType);
    if (option) {
      option.selected = true;
    }
  } catch (error) {
    console.error('Error:', error);
    datatypeLabel.textContent = "Error recommending data type";
  }
}

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Add event listener to textarea with debounce
llmTextarea.addEventListener('input', debounce(() => {
  recommendDataType(llmTextarea.value);
}, 500)); // Wait for 500ms of inactivity before making the API call

function buildURL(date_start, date_end, lat, long, data_type) {
  //2024-10-04T11:00:00.000-04:00--2024-10-05T11:00:00.000-04:00:PT5M example
  //2024-10-04T11:00:00.000--2024-10-05T11:00:00.000:PT5M
  if (data_type == "Temperature") {
    return `https://api.meteomatics.com/${date_start}--${date_end}:PT5M/t_0m:C/${lat},${long}/csv?model=mix`;
  } else if (data_type == "Precipitation") {
    return `https://api.meteomatics.com/${date_start}--${date_end}:PT5M/precip_10min:in/41.3897764,-81.4412259/csv?model=mix`;
  }
}
function renderLineGraph(chart_name, data, x_ax_name, y_ax_name) {
  // Clear existing content
  const container = d3.select("#d3-container");
  container.html("");

  // Create SVG with increased size
  const svg = container.append("svg")
      .attr("width", 700)  // Increased width
      .attr("height", 500);  // Increased height

  const margin = { top: 40, right: 40, bottom: 60, left: 60 };  // Increased margins
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
      .attr("stroke-width", 1.5)
      .attr("d", line);

  // Add data points
  g.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => x(d.x))
      .attr("cy", d => y(d.y))
      .attr("r", 1)
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
      .style("font-size", "18px")  // Increased font size
      .text(chart_name);
}

function renderHistogram(chart_name, data, x_ax_name, y_ax_name) {
    // Clear existing content
    const container = d3.select("#d3-container");
    container.html("");

    // Create SVG with increased size
    const svg = container.append("svg")
        .attr("width", 700)  // Increased width
        .attr("height", 500);  // Increased height

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };  // Increased margins
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
        .style("font-size", "18px")  // Increased font size
        .text(chart_name);
}

function renderScatterPlot(chart_name, data, x_ax_name, y_ax_name) {
    // Clear existing content
    const container = d3.select("#d3-container");
    container.html("");

    // Create SVG with increased size
    const svg = container.append("svg")
        .attr("width", 700)  // Increased width
        .attr("height", 500);  // Increased height

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };  // Increased margins
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
        .style("font-size", "18px")  // Increased font size
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
  
  var datetime_start = llmForm.elements.datetime_start.value; 
  var datetime_end = llmForm.elements.datetime_end.value;
  var data_type = llmForm.elements.llm_select_datatype.value;

  const userURL = buildURL(datetime_start+":00.000-04:00", datetime_end+":00.000-04:00", llmForm.elements.lat.value, llmForm.elements.long.value, data_type);
  
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
    const fullPrompt = llmPrompt11 + llmPrompt22 + userData + llmPrompt23 + llmForm.elements.prompt.value;

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
              code: {type: "STRING"},
              graph_type: {type: "STRING"},
              analysis: {type: "STRING"}
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
    document.getElementById("result").innerText = parsedResult.code + "\n" + parsedResult.graph_type + "\n" + parsedResult.analysis;
    
    // Execute the generated code, replacing userData with parsedData
    const modifiedCode = parsedResult.code.replace(/userData/g, 'parsedData');
    const chart_name = parsedResult.graph_type;
    const analysis = parsedResult.analysis;
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