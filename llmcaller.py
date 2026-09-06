import OpenAI from 'openai';
import 'dotenv/config';
 
const ai = new OpenAI({apiKey : process.env.OPENAI_API_KEY});

# keychain, env...

export async function ask(msgs) {
  const r = await ai.chat.completions.create({
    model: 'gpt-4.1-nano',
    messages: [{
		role : 'user',
		content: 'Give me a greeting'	
	}]
  });
  return r.choices[0].message.content;
}


