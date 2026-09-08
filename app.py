import streamlit as st
import random
import time
import requests

st.write("Welcome to my AI Chatbot!")

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = [{"role": "assistant", "content": "Let's start chatting! 👇"}]

# Display chat messages from history on app rerun
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Accept user input
if prompt := st.chat_input("What is up?"):
    # Add user message to chat history
    st.session_state.messages.append({"role": "user", "content": prompt})
    # Display user message in chat message container
    with st.chat_message("user"):
        st.markdown(prompt)

    # Display assistant response in chat message container
    with st.chat_message("assistant"):
        res = requests.post("http://localhost:3000/api/sendMsg", json={"message": prompt}, timeout=30)

        full_response = res.json()
        reply = full_response.get("reply", "No reply received.")
        st.markdown(reply)

    # Add assistant response to chat history
    st.session_state.messages.append({"role": "assistant", "content": reply})


