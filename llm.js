// gemini api info LOOK INTO GOOGLE CLOUD API
const API_KEY = 'AIzaSyBiBPDlmTw09OF5SbGubI8nW_lCr_j1B9M';

// meteometics api info
// User: nasaspacehackathon_stella_william
// Password: 8fWk82EJEv
const apiUrl = 'https://api.meteomatics.com/2024-10-04T11:00:00.000-04:00--2024-10-05T11:00:00.000-04:00:PT5M/t_0m:C/41.3897764,-81.4412259/csv?model=mix';

const llmForm = document.getElementById("llm-form");
const llmPrompt11 = "I have a user prompt that is in plain text, they are a farmer and they want an analysis of their problem using data. The current data we have is in temperature, wind speed close to the ground, wind speed high up, humidity, cloud cover, uv index, and precipitation. Please pick which (can have multiple) data type(s) are most relevant to the user's prompt. You should return a list of data types, all in quotes, using the exact names as shown below. To be clear, a sample output would be: [\"Temperature\", \"Precipitation\"] put as many or as little in the list as you see fit. That is the only thing you should be outputting, with no extra whitespace. Your options are:\nTemperature\nPrecipitation\nWind Speed Close to the Ground\nWind Speed High Up\nHumidity\nCloud Cover\nUV Index\nThe user's prompt is: ";
const llmPrompt21 = "I have csv data about" 
const llmPrompt22 = "I have csv data about multiple weather parameters over a period of time. The data is formatted with headers for each data type, followed by the data in CSV format (timestamp,value). I also have three different functions that render different types of graphs for multiple datasets. I want you to take the csv data and the three functions and return the code that will render the type of graph you think is appropriate for comparing the data. The functions are called: renderLineGraph, renderHistogram, and renderScatterPlot. They all take in chart_name, datasets (an array of data arrays), x_ax_name, and y_ax_name. I also have the data in a variable called userData that you can reference. The only thing that should be in the data parameter is userData with no other variants. If the user doesnt specify that they dont want a graph, in the code section of your response I want the valid javascript code that you made for the function call. If the user specifies that they dont want a graph then just leave the code section blank. To be clear, default to making a graph. In the graph type section I want the name of the graph type you decided to use. In the analysis section of your response I want a full analysis referencing the graph that answers the user's question and compares the different datasets. \n The formatted data is: \n";
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
    const recommendedDataTypesString = result.candidates[0].content.parts[0].text.trim();
    
    // Parse the JSON string to get the array of recommended data types
    const recommendedDataTypes = JSON.parse(recommendedDataTypesString);

    datatypeLabel.textContent = `Recommended: ${recommendedDataTypes.join(', ')}`;
    
    // Deselect all options first
    Array.from(llmSelectDatatype.options).forEach(option => option.selected = false);

    // Select the recommended options
    recommendedDataTypes.forEach(dataType => {
      const option = Array.from(llmSelectDatatype.options).find(opt => opt.value === dataType);
      if (option) {
        option.selected = true;
      } else {
        console.warn(`Recommended data type "${dataType}" not found in selector options`);
      }
    });

    // Trigger a change event on the select element
    llmSelectDatatype.dispatchEvent(new Event('change'));

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

function buildURL(date_start, date_end, lat, long, data_types) {
  const baseUrl = `https://api.meteomatics.com/${date_start}--${date_end}:PT5M`;
  const location = `${lat},${long}`;
  const dataTypeParams = data_types.map(type => {
    switch(type) {
      case "Temperature": return "t_0m:C";
      case "Precipitation": return "precip_10min:in";
      case "Wind Speed Close to the Ground": return "wind_speed_10m:mph";
      case "Wind Speed High Up": return "wind_speed_100m:mph";
      case "Humidity": return "absolute_humidity_2m:gm3";
      case "Cloud Cover": return "total_cloud_cover_mean_1h:octas";
      case "UV Index": return "uv_max_1h:idx";
    }
  }).join(',');
  return `${baseUrl}/${dataTypeParams}/${location}/csv?model=mix`;
}

function renderLineGraph(chart_name, datasets, x_ax_name, y_ax_name) {
  // Error checking
  if (!Array.isArray(datasets) || datasets.length === 0) {
    console.error("Invalid or empty datasets provided to renderLineGraph");
    return;
  }

  // Filter out any undefined or empty datasets
  const validDatasets = datasets.filter(dataset => Array.isArray(dataset) && dataset.length > 0);

  if (validDatasets.length === 0) {
    console.error("No valid datasets to render");
    return;
  }

  // Clear existing content
  const container = d3.select("#d3-container");
  container.html("");

  // Create SVG with increased size
  const svg = container.append("svg")
      .attr("width", 700)
      .attr("height", 500);

  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;

  const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up scales
  const x = d3.scaleTime()
      .range([0, width])
      .domain(d3.extent(validDatasets.flat(), d => d.x));

  const y = d3.scaleLinear()
      .range([height, 0])
      .domain([
        d3.min(validDatasets.flat(), d => d.y),
        d3.max(validDatasets.flat(), d => d.y)
      ]);

  // Create line generator
  const line = d3.line()
      .x(d => x(d.x))
      .y(d => y(d.y));

  // Color scale for multiple datasets
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Add lines for each dataset
  validDatasets.forEach((data, i) => {
    g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color(i))
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // Add data points
    g.selectAll(`.dot-${i}`)
        .data(data)
        .enter().append("circle")
        .attr("class", `dot-${i}`)
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", 3)
        .attr("fill", color(i));
  });

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
      .style("font-size", "18px")
      .text(chart_name);

  // Add legend
  const legend = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .selectAll("g")
      .data(validDatasets.map((_, i) => color(i)))
      .enter().append("g")
      .attr("transform", (d, i) => `translate(0,${i * 20})`);

  legend.append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", d => d);

  legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text((d, i) => `Dataset ${i + 1}`);
}

function renderHistogram(chart_name, data, x_ax_name, y_ax_name) {
    // Clear existing content
    const container = d3.select("#d3-container");
    container.html("");

    // Create SVG with increased size
    const svg = container.append("svg")
        .attr("width", 700)
        .attr("height", 500);

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Extract only the y values
    const values = data.map(d => d.y);

    // Set up scales
    const x = d3.scaleLinear()
        .range([0, width])
        .domain([d3.min(values), d3.max(values)]);

    // Create histogram generator
    const histogram = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(20));

    // Generate bins
    const bins = histogram(values);

    // Set up y scale
    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(bins, d => d.length)]);

    // Create bars
    g.selectAll(".bar")
        .data(bins)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.x0) + 1)
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
        .attr("fill", "black")
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
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text(y_ax_name);

    // Add chart title
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
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
  d3cont.innerHTML = "";
  document.getElementById("result").innerText = "";
  var datetime_start = llmForm.elements.datetime_start.value; 
  var datetime_end = llmForm.elements.datetime_end.value;
  var data_types = Array.from(llmForm.elements.llm_select_datatype.selectedOptions).map(option => option.value);

  const userURL = buildURL(datetime_start+":00.000-04:00", datetime_end+":00.000-04:00", llmForm.elements.lat.value, llmForm.elements.long.value, data_types);
  
  try {
    console.log("User entered URL:", userURL);
    const userData = await fetchDataFromUrl(userURL);
    console.log("Received userData:", userData ? userData.substring(0, 100) + "..." : "undefined");
    
    if (!userData) {
      throw new Error("No data received from the server");
    }
    
    // Parse CSV data
    const parsedDatasets = parseCSV(userData, data_types);
    console.log("Parsed datasets:", parsedDatasets);

    if (parsedDatasets.length === 0) {
      throw new Error("No valid data parsed from the CSV");
    }
    
    // Prepare formatted data for the LLM prompt
    let formattedData = "";
    data_types.forEach((dataType, index) => {
      if (parsedDatasets[index] && parsedDatasets[index].length > 0) {
        formattedData += `${dataType}:\n`;
        formattedData += parsedDatasets[index].map(d => `${d.x.toISOString()},${d.y}`).join('\n');
        formattedData += '\n\n';
      } else {
        console.warn(`No valid data for ${dataType}`);
      }
    });
    
    // Prepare the prompt for Gemini API
    const fullPrompt = `${llmPrompt11}${llmPrompt22}${formattedData}${llmPrompt23}${llmForm.elements.prompt.value}\nSelected data types: ${data_types.join(', ')}`;

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
    
    // Display the analysis
    document.getElementById("result").innerText = parsedResult.analysis;
    
    // Check if the code section is not empty (user wants a graph)
    if (parsedResult.code && parsedResult.code.trim() !== "") {
      // Determine the graph type
      let graphType = parsedResult.graph_type.toLowerCase();
      if (!['line graph', 'histogram', 'scatter plot'].includes(graphType)) {
        graphType = 'line graph'; // Default to line graph if not specified or invalid
      }
      
      // Render the graph
      const chart_name = `${graphType.charAt(0).toUpperCase() + graphType.slice(1)} of ${data_types.join(' vs ')}`;
      const x_ax_name = "Time";
      const y_ax_name = data_types.length > 1 ? "Value" : data_types[0];

      switch (graphType) {
        case 'line graph':
          renderLineGraph(chart_name, parsedDatasets, x_ax_name, y_ax_name);
          break;
        case 'histogram':
          renderHistogram(chart_name, parsedDatasets, x_ax_name, y_ax_name);
          break;
        case 'scatter plot':
          renderScatterPlot(chart_name, parsedDatasets, x_ax_name, y_ax_name);
          break;
      }
    } else {
      console.log("User requested no graph, skipping graph rendering.");
    }

  } catch (error) {
    console.error('Error:', error);
    document.getElementById("result").innerText = "An error occurred: " + error.message;
  }
}

// Function to parse CSV data for multiple datasets
function parseCSV(csvString, dataTypes) {
  try {
    const commaCSV = csvString.replace(/;/g, ',');
    const parsedData = d3.csvParse(commaCSV);
    
    const datasets = dataTypes.map((dataType, index) => {
      const dataset = parsedData.map(d => ({
        x: new Date(d[Object.keys(d)[0]]),
        y: parseFloat(d[Object.keys(d)[index + 1]])
      })).filter(d => !isNaN(d.y) && !isNaN(d.x.getTime()));

      console.log(`Parsed ${dataset.length} valid data points for ${dataType}`);
      console.log("Sample data:", dataset.slice(0, 5));

      return dataset;
    });

    return datasets.filter(dataset => dataset.length > 0); // Remove empty datasets
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return [];
  }
}

// Make sure to use async/await when adding the event listener
llmForm.addEventListener('submit', async (event) => await getFormText(event));