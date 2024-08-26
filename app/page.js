'use client'
import { Box, Stack, TextField, Button, Container } from "@mui/material"
import { useState } from "react"
import ReactMarkdown from 'react-markdown'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?"
    }
  ])
  const [message, setMessage] = useState('')
  
  const sendMessage = async () => {

    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' }
    ])
    setMessage('')
    
    const response = await fetch('/api/chat', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([...messages, { role: "user", content: message }])
    });

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    let result = ""
    reader.read().then(function processText({ done, value }) {
      if (done) {
        return result
      }
      const text = decoder.decode(value || new Uint8Array(), { stream: true })

      setMessages((messages) => {
        let lastMessage = messages[messages.length - 1]
        let otherMessages = messages.slice(0, messages.length - 1)

        // Safeguard: Ensure lastMessage and its content exist before concatenating
        return [
          ...otherMessages,
          {
            ...lastMessage,
            content: (lastMessage?.content || '') + text
          },
        ]
      })

      return reader.read().then(processText)
    })
  }

  return (
    <Box 
  width="100vw" 
  minHeight="100vh" 
  display="flex" 
  flexDirection="column" 
  justifyContent="flex-start"
  bgcolor="#f5f5f5"
  p={2}
  position="relative" // Make the Box the relative parent
>
  <Container 
    direction="column" 
    width="100%" 
    maxWidth="600px"
    flexGrow={1} 
    display="flex" 
    flexDirection="column"
    justifyContent={messages.length === 0 ? 'center' : 'flex-start'}
    alignItems="center"
    p={2}
    boxShadow={3}
    borderRadius={4}
    bgcolor="white"
    overflow="auto" // Allow the container to scroll independently
  >
    <Stack 
      direction="column" 
      spacing={2} 
      flexGrow={1} 
      width="100%"
      sx={{
        paddingTop: messages.length <= 1 ? '50vh' : '16px',
        transition: 'padding-top 0.3s ease',
      }}
    >
      {messages.map((message, index) => (
        <Box 
          key={index} 
          display="flex" 
          justifyContent={message.role === "assistant" ? "flex-start" : "flex-end"}
        >
          <Box 
            bgcolor={message.role === 'assistant' ? "#f5f5f5" : '#8eaf9d'} 
            color={message.role === 'assistant' ? "black" : 'white'}
            borderRadius={8} 
            p={2} 
            sx={{
              maxWidth: '75%'
            }}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </Box>
        </Box>
      ))}
    </Stack>
  </Container>
  <Box 
    width="100%" 
    maxWidth="1200px"
    position="absolute" 
    bottom={30} 
    p={2}
    justifySelf='center'
    alignSelf='center'
    border="2px solid #e0e0e2"
    borderRadius={6}
  >
    <Stack direction="row" spacing={2}>
      <TextField 
        label="Message" 
        fullWidth 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
        variant="outlined" 
        multiline 
        maxRows={8} 
        sx={{ 
          borderRadius: 2, 
          flexGrow: 1, 
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'transparent', // Remove the outline
            },
            '&:hover fieldset': {
              borderColor: 'transparent', // Remove the hover outline
            },
            '&.Mui-focused fieldset': {
              borderColor: 'transparent', // Remove the focus outline
            },
          },
        }} 
      />
      <Button 
        variant="contained" 
        color="primary" 
        onClick={sendMessage}
        sx={{ 
          borderRadius: 10, 
          padding: '12px 15px',
          minWidth: 'auto', // Keep button size minimal
          bgcolor: "#B1A4D0",
          color: "#f5f5f5"
        }}
      >
        <ArrowUpwardIcon />
      </Button>
    </Stack>
  </Box>

</Box>

  )
}

   

