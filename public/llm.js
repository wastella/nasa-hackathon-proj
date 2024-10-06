let API_KEY;

// Fetch the API key from the backend
fetch('/api/config')
  .then(response => response.json())
  .then(config => {
    API_KEY = config.API_KEY;
    // Initialize your GoogleGenerativeAI here or anywhere else you need the API_KEY
  })
  .catch(error => console.error('Error fetching config:', error));

// meteometics api info
// User: nasaspacehackathon_stella_william
// Password: 8fWk82EJEv
const apiUrl = 'https://api.meteomatics.com/2024-10-04T11:00:00.000-04:00--2024-10-05T11:00:00.000-04:00:PT5M/t_0m:C/41.3897764,-81.4412259/csv?model=mix';

const llmForm = document.getElementById("llm-form");
const llmPrompt11 = "I have a user prompt that is in plain text, they are a farmer and they want an analysis of their problem using data. The current data we have is in temperature, wind speed close to the ground, wind speed high up, wind direction, humidity, cloud cover, uv index, and precipitation. Please pick which (can have multiple) data type(s) are most relevant to the user's prompt. You should return a list of data types, all in quotes, using the exact names as shown below. To be clear, a sample output would be: [\"Temperature\", \"Precipitation\"] put as many or as little in the list as you see fit. That is the only thing you should be outputting, with no extra whitespace. Your options are:\nTemperature\nPrecipitation\nWind Speed Close to the Ground\nWind Speed High Up\nWind Direction\nHumidity\nCloud Cover\nUV Index\nThe user's prompt is: ";
const llmPrompt22 = "I have csv data about multiple weather parameters over a period of time. The data is formatted with headers for each data type, followed by the data in CSV format (timestamp,value). I also have three different functions that render different types of graphs for multiple datasets. I want you to take the csv data and the three functions and return the code that will render the type of graph you think is appropriate for comparing the data. The functions are called: renderLineGraph, renderHistogram, and renderScatterPlot. They all take in chart_name, datasets (an array of data arrays), x_ax_name, and y_ax_name. I also have the data in a variable called userData that you can reference. The only thing that should be in the data parameter is userData with no other variants. If the user doesnt specify that they dont want a graph, in the code section of your response I want the valid javascript code that you made for the function call. If the user specifies that they dont want a graph then just leave the code section blank. To be clear, default to making a graph. In the graph type section I want the name of the graph type you decided to use. In the analysis section of your response I want a full analysis referencing the graph that answers the user's question and compares the different datasets, when you are talking about dates use the daty and time in human format, for example: October 5th, 9:15 AM. Feel free to reference the graph and/or the data in your analysis. Use only new lines for formatting, no other special formatting (no bold, italics, or asterisks). Provide a conclusive answer if possible. \n The formatted data is: \n";
const llmPrompt23 = "\n The user's prompt is: \n"

const llmTextarea = document.getElementById("llm-textarea");
const datatypeLabel = document.getElementById("datatype-label");
const llmSelectDatatype = document.getElementById("llm_select_datatype");

const respondButton = document.getElementById("respond-button");
const chatContainer = document.getElementById("chat-container");
const chatMessages = document.getElementById("chat-messages");
const userMessageInput = document.getElementById("user-message");
const sendMessageButton = document.getElementById("send-message");

let originalData = "";
let originalPrompt = "";
let previousAnalysis = "";

// Add these functions at the beginning of the file
function showLoadingAnimation() {
  document.getElementById('loading-progress').style.display = 'block';
  document.querySelector('.results-container').style.display = 'none';
}

function hideLoadingAnimation() {
  document.getElementById('loading-progress').style.display = 'none';
  document.querySelector('.results-container').style.display = 'block';
}

async function recommendDataType(prompt) {
  if (!prompt.trim()) {
    datatypeLabel.textContent = "Reccomended: ";
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
    datatypeLabel.textContent = "Recommended:";
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
      case "Wind Direction": return "wind_dir_mean_10m_5min:d";
      case "Humidity": return "absolute_humidity_2m:gm3";
      case "Cloud Cover": return "total_cloud_cover_mean_1h:octas";
      case "UV Index": return "uv_max_1h:idx";
    }
  }).join(',');
  return `${baseUrl}/${dataTypeParams}/${location}/csv?model=mix`;
}

function formatTooltipContent(d, dataType) {
  const dateFormatter = d3.timeFormat("%Y-%m-%d %H:%M:%S");
  return `<strong>${dataType}</strong><br>
          <strong>Date:</strong> ${dateFormatter(d.x)}<br>
          <strong>Value:</strong> ${d.y.toFixed(2)}`;
}

function renderLineGraph(chart_name, datasets, x_ax_name, y_ax_name, dataTypes) {
  // Clear existing content
  const container = d3.select("#d3-container");
  container.html("");

  // Set dimensions based on the container's size
  const containerRect = container.node().getBoundingClientRect();
  const width = containerRect.width;
  const height = Math.min(containerRect.height, 500); // Cap the height at 500px

  const margin = { top: 50, right: 150, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create SVG
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up scales
  const x = d3.scaleTime().range([0, innerWidth]);
  const y = d3.scaleLinear().range([innerHeight, 0]);

  // Create color scale
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Set domains
  const allData = datasets.flat();
  x.domain(d3.extent(allData, d => d.x));
  y.domain([d3.min(allData, d => d.y), d3.max(allData, d => d.y)]);

  // Create line generator
  const line = d3.line()
    .x(d => x(d.x))
    .y(d => y(d.y));

  // Create tooltip
  const tooltip = createTooltip();

  // Add lines and points for each dataset
  datasets.forEach((data, i) => {
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color(i))
      .attr("stroke-width", 1.5)
      .attr("d", line);

    g.selectAll(`.dot-${i}`)
      .data(data)
      .enter().append("circle")
      .attr("class", `dot-${i}`)
      .attr("cx", d => x(d.x))
      .attr("cy", d => y(d.y))
      .attr("r", 3)
      .attr("fill", color(i))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(formatTooltipContent(d, dataTypes[i]))
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });
  });

  // Add x-axis
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))
    .append("text")
    .attr("x", innerWidth / 2)
    .attr("y", margin.bottom - 10)
    .attr("fill", "white")
    .attr("text-anchor", "middle")
    .text(x_ax_name);

  // Add y-axis
  g.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 10)
    .attr("x", -innerHeight / 2)
    .attr("dy", "0.71em")
    .attr("fill", "white")
    .attr("text-anchor", "middle")
    .text(y_ax_name);

  // Add chart title
  svg.append("text")
    .attr("x", width / 2)
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
    .data(dataTypes)
    .enter().append("g")
    .attr("transform", (d, i) => `translate(${width - margin.right + 10},${i * 20 + margin.top})`);

  legend.append("rect")
    .attr("x", 0)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", (d, i) => color(i));

  legend.append("text")
    .attr("x", -5)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(d => d);
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

  // Create a div for the tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");

  // Add scatter points with hover effect
  g.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.x))
    .attr("cy", d => y(d.y))
    .attr("r", 5)
    .attr("fill", "steelblue")
    .on("mouseover", (event, d) => {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(`Date: ${d.x.toLocaleString()}<br/>Value: ${d.y}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
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
    .style("font-size", "18px")  // Increased font size
    .text(chart_name);
}

async function fetchDataFromUrl(url) {
  try {
    console.log("Fetching data from URL:", url);
    const response = await fetch('/api/fetch-data', {
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

  showLoadingAnimation();

  const d3cont = document.getElementById("d3-container");
  d3cont.innerHTML = "";
  document.getElementById("result").innerText = "";
  
  // Hide the results container initially
  document.querySelector('.results-container').style.display = 'none';

  // Get current date and time
  const now = new Date();
  // Get date and time 24 hours ago
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Format dates for the API
  const date_end = now.toISOString().slice(0, 19) + ".000-04:00";
  const date_start = yesterday.toISOString().slice(0, 19) + ".000-04:00";

  var data_types = Array.from(llmForm.elements.llm_select_datatype.selectedOptions).map(option => option.value);

  const userURL = buildURL(date_start, date_end, llmForm.elements.lat.value, llmForm.elements.long.value, data_types);
  
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
    
    // Show the results container
    document.querySelector('.results-container').style.display = 'block';

    // Store the original data and prompt
    originalData = formattedData;
    originalPrompt = llmForm.elements.prompt.value;

    // Store the previous analysis
    previousAnalysis = parsedResult.analysis;

    // Show the respond button
    respondButton.style.display = "block";

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
          renderLineGraph(chart_name, parsedDatasets, x_ax_name, y_ax_name, data_types);
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
    // Show the results container even if there's an error
    document.querySelector('.results-container').style.display = 'block';
  } finally {
    hideLoadingAnimation();
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

// Add event listener for the respond button
respondButton.addEventListener("click", () => {
  chatContainer.style.display = "block";
  respondButton.style.display = "none";
});

// Add event listener for the send message button
sendMessageButton.addEventListener("click", async () => {
  const userMessage = userMessageInput.value.trim();
  if (userMessage) {
    addMessageToChat("User", userMessage);
    userMessageInput.value = "";

    try {
      const aiResponse = await getAIResponse(userMessage);
      addMessageToChat("AI", aiResponse);
    } catch (error) {
      console.error('Error getting AI response:', error);
      addMessageToChat("AI", "Sorry, I encountered an error while processing your request.");
    }
  }
});

function addMessageToChat(sender, message) {
  const messageElement = document.createElement("p");
  messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function getAIResponse(userMessage) {
  showLoadingAnimation();

  try {
    const fullPrompt = `Original Data:\n${originalData}\n\nOriginal Prompt:\n${originalPrompt}\n\nPrevious Analysis:\n${previousAnalysis}\n\nNew User Message:\n${userMessage}\n\nPlease provide a response to the user's new message, taking into account the original data, prompt, and previous analysis. Use only new lines for formatting, no other special formatting (no bold, italics, or asterisks). Provide a conclusive answer if possible.`;

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
    return result.candidates[0].content.parts[0].text;
  } finally {
    hideLoadingAnimation();
  }
}

// Make sure to use async/await when adding the event listener
llmForm.addEventListener('submit', async (event) => await getFormText(event));

function createTooltip() {
  return d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("font-size", "14px")
    .style("pointer-events", "none");
}