async function callQwenAPI() {
  const url = "https://sf5gnwidpsultu-644112ad-8000.proxy.runpod.net/chat";

const payload = {
    messages: [
      { role: "user", content: "explain python" }
    ]
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


