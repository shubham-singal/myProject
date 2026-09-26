async function callQwenAPI() {
  const url = "http://3.23.52.112:8000/chat";

const payload = {
    messages: [
      { role: "user", content: "Give me a short poem!" }
    ],
    // "max_tokens": 100,
    // "temperature": 0.9
  };


 try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", data);
    return data;
  } catch (error) {
    console.error("Error calling API:", error);
  }
}


callQwenAPI();


