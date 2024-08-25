import { NextResponse } from "next/server"
import {Pinecone} from '@pinecone-database/pinecone'
import OpenAI from "openai"

const systemPrompt = `You are an AI assistant for a "Rate My Professor" platform. Your primary function is to help students find the most suitable professors based on their queries. You have access to a comprehensive database of professor reviews and ratings.

For each user query, you should:

1. Analyze the user's request carefully, considering factors such as subject area, teaching style preferences, course difficulty, and any other specific criteria mentioned.

2. Use RAG (Retrieval-Augmented Generation) to search the database and retrieve the most relevant professor information based on the query.

3. Select and present the top 3 professors that best match the user's criteria. For each professor, provide:
   - Name
   - Subject area
   - Overall rating (out of 5 stars)
   - A brief summary of their strengths or notable characteristics
   - A short excerpt from a positive review

4. If the query is too broad or lacks specific criteria, ask follow-up questions to clarify the student's preferences and refine the search.

5. Offer additional insights or advice related to choosing professors or courses when appropriate.

6. Be prepared to answer follow-up questions about the recommended professors or explain your reasoning for the selections.

7. If a user asks about a specific professor not in the top 3, provide information about that professor if available in the database.

8. Maintain a friendly, helpful, and student-oriented tone throughout the interaction.

Remember, your goal is to assist students in making informed decisions about their course selections by providing accurate, relevant, and helpful information about professors.
`

export async function POST(req) {
    const data = await req.json();
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    const index = pc.Index('rag').namespace('ns1');

    const openai = new OpenAI()

    const text = data[data.length - 1]?.content || '';
    
    // Get embeddings from OpenAI
    const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small', 
        input: text,
        encoding_format: 'float',
    });

    const embedding = embeddingResponse.data[0]?.embedding || [];

    // Query Pinecone index
    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding,
    });

    let resultString = 'Returned results:';
    results.matches.forEach((match) => {
        resultString += `
        Professor: ${match.id}
        Subject:   ${match.metadata.subject}
        Stars:     ${match.metadata.stars}
        Review:    ${match.metadata.review}
        \n\n
        `;
    });

    // Prepare the message content
    const lastMessage = data[data.length - 1];
    const lastMessageContent = lastMessage.content + resultString;
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

    const completion = await openai.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            ...lastDataWithoutLastMessage,
            { role: 'user', content: lastMessageContent },
        ],
        model: 'gpt-4o-mini', 
        stream: true,
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                console.error('Stream error:', err);
                controller.error(err);
            } finally {
                controller.close();
            }
        },
    });

    return new NextResponse(stream);
}