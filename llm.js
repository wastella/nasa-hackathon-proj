const API_KEY = 'AIzaSyBiBPDlmTw09OF5SbGubI8nW_lCr_j1B9M';

const llmForm = document.getElementById("llm-form");

function renderHistogram(chart-name, data, x-ax-name, y-ax-name, )

function getFormText(event) {
    event.preventDefault();

    const d3cont = document.getElementById("d3-container");
    d3cont.innerHTML = "";
    
    const userPrompt = llmForm.elements.prompt.value;
    
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate JavaScript code to create a ${userPrompt} plot using d3.js. Return the code in a JSON structure with a 'code' field containing the JavaScript as a string. Assume d3.js is imported as d3. Also, the div that you should put the svg in has an id of d3-container.`
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
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(result => {
        const generatedCode = result.candidates[0].content.parts[0].text;
        const parsedResult = JSON.parse(generatedCode);
     //   document.getElementById("result").innerText = parsedResult.code;
        eval(parsedResult.code);
      })
      .catch(error => {
        console.error('Error:', error);
        document.getElementById("result").innerText = "An error occurred while fetching the response.";
      });
}

// Update the event listener to pass the event object
llmForm.addEventListener('submit', getFormText);
