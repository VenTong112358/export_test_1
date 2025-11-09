# WebSocket Streaming API Test Guide

## Overview

This guide explains how to use the new **Content Search Streaming** page in your Expo app to test WebSocket-based LLM streaming responses.

## What's New

A new tab called **"Content Search"** has been added to the app that allows you to:
- Connect to a FastAPI WebSocket endpoint
- Send content for LLM processing (translation, analysis, etc.)
- Receive and display streaming token responses in real-time
- Test both authenticated and unauthenticated requests

## Getting Started

### 1. Start Your FastAPI Server

Make sure your FastAPI server with the WebSocket endpoint is running. The endpoint should be at:

```
ws://localhost:8000/content_search/{category}
```

**Categories:**
- `word_group`: For English word/phrase to Chinese translation
- `phrase`: For English sentence to Chinese translation with context

### 2. Using the Content Search Page

#### Connect to the Server

1. Open the app and navigate to the **"Content Search"** tab (magnifying glass icon)
2. Enter your WebSocket server URL (default: `ws://localhost:8000`)
3. Select the appropriate category:
   - **Word/Phrase (词组)**: For translating English words/phrases to Chinese
   - **Phrase Context (句子)**: For translating English sentences with context to Chinese

#### Send a Request

1. **Enter content** in the "Content to Search" field:
   - For word_group: `beautiful`
   - For phrase: `This is a beautiful day`

2. **Add authentication** (if required):
   - Optional authorization token/header value
   - Leave empty for unauthenticated requests

3. Click **"Start Stream"** to begin the request

#### Monitor the Response

- **Status Panel**: Shows connection status and progress
- **Streaming Output**: Displays tokens as they arrive from the LLM
- Automatically closes connection when receiving `[END]` marker

#### Control the Stream

- **Disconnect**: Manually close the WebSocket connection
- **Clear**: Clear all output and status messages

## How It Works

### Client Flow

```
1. User fills in form (server URL, category, content, token)
                ↓
2. Click "Start Stream"
                ↓
3. Create WebSocket connection with Authorization header
                ↓
4. Send JSON payload: {"content": "..."}
                ↓
5. Receive streaming text tokens from server
                ↓
6. Display each token in real-time
                ↓
7. When [END] received or connection closes, cleanup
```

### Server Requirements

Your FastAPI server should implement the WebSocket endpoint like this:

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from openai import AsyncOpenAI
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/content_search/{category}")
async def ws_llm_stream(websocket: WebSocket, category: str):
    """WebSocket streaming for content_search."""
    
    # Accept connection
    await websocket.accept()
    
    # Get auth token from headers
    token = websocket.headers.get("Authorization")
    if not token:
        await websocket.close(code=4001)  # Missing auth
        return
    
    try:
        # Verify auth token
        current_user = get_current_user(token)
    except Exception:
        await websocket.close(code=4003)  # Invalid auth
        return
    
    try:
        # Receive request
        first_msg = await websocket.receive_text()
        data = json.loads(first_msg)
        req_content = (data.get("content") or "").strip()
        
        if not req_content:
            await websocket.send_text("Error: 'content' is required")
            await websocket.close(code=4002)
            return
        
        # Build prompt based on category
        if category == "word_group":
            prompt = f"请给出这个英文词组的中文翻译: {req_content}"
        else:  # phrase
            prompt = f"请猜测语境并给出这个英文句子的中文翻译: {req_content}"
        
        # Create LLM client and stream
        client = AsyncOpenAI(
            api_key="your-api-key",
            base_url="your-base-url"
        )
        
        stream = await client.chat.completions.create(
            model="deepseek-v3",
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )
        
        # Stream tokens back to client
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                text = chunk.choices[0].delta.content
                await websocket.send_text(text)
        
        # Mark end of stream
        await websocket.send_text("[END]")
        
    except WebSocketDisconnect:
        logger.warning(f"Client disconnected for category={category}")
    except Exception as e:
        logger.exception(f"Error in ws_llm_stream: {e}")
        try:
            await websocket.send_text(f"Error: {e}")
            await websocket.close(code=1011)
        except:
            pass
```

## Features

### ✅ Real-time Streaming
- Tokens arrive and display immediately as they're generated
- No buffering or artificial delays

### ✅ Authentication Support
- Authorization header support for native platforms
- Optional authentication - leave blank for public endpoints

### ✅ Cross-Platform
- Works on iOS, Android, and Web
- Automatic host translation for Android emulator (`localhost` → `10.0.2.2`)

### ✅ Status Monitoring
- Real-time connection status
- Error messages with helpful debugging info
- WebSocket close codes and reasons

### ✅ User-Friendly Interface
- Clean, intuitive form layout
- Helpful hints and instructions
- Large output display for easy reading
- Easy-to-use category dropdown

## Troubleshooting

### Connection Failed

**Problem**: "Error: Connection error. Check host/port/firewall/auth."

**Solutions**:
- Verify your FastAPI server is running
- Check the URL: `ws://localhost:8000` (not `http://`)
- For Android emulator, it automatically translates `localhost` to `10.0.2.2`
- Check firewall settings on your host machine
- Ensure authentication token is correct (if required)

### Empty Response

**Problem**: No output appears, but connection was established

**Solutions**:
- Check your LLM API key and base URL in FastAPI server
- Verify the LLM model name is correct (e.g., `deepseek-v3`)
- Check server logs for errors
- Try with a simpler prompt to test

### Authentication Error (Code 4003)

**Problem**: WebSocket closes with code 4003 (Invalid Auth)

**Solutions**:
- Verify your authorization token is correct
- Check the token format (Bearer token, JWT, API key, etc.)
- Ensure the server's `get_current_user()` function is working
- Try without auth token if not required

### Android Emulator Issues

**Problem**: Can't connect on Android emulator

**Solutions**:
- The app automatically translates `localhost` to `10.0.2.2`
- No action needed - should work automatically
- If still failing, check your PC firewall
- Try running on a physical Android device

## Advanced Usage

### Custom Prompts

To modify the prompts used for different categories, edit the backend server code:

```python
# For word_group
prompt = f"Custom prompt for words: {req_content}"

# For phrase
prompt = f"Custom prompt for phrases: {req_content}"
```

### Adding New Categories

1. Add new category type to the frontend:
```typescript
type SearchCategory = 'word_group' | 'phrase' | 'your_category';
```

2. Add Picker option:
```typescript
<Picker.Item label="Your Category" value="your_category" />
```

3. Add backend handling:
```python
elif category == "your_category":
    prompt = "Your custom prompt..."
```

### Custom Error Handling

The frontend displays errors in multiple ways:
- Status panel (real-time updates)
- Output box (appended with [ERROR] prefix)
- Connection close codes and reasons

Customize these by modifying the event handlers in `content-search.tsx`.

## Implementation Details

### Key State Variables

- `serverBaseUrl`: WebSocket server URL
- `category`: Selected category (word_group or phrase)
- `content`: User input text
- `authToken`: Optional authorization header
- `isConnecting`: Connection in progress
- `isStreaming`: Currently receiving stream
- `streamOutput`: Accumulated response text
- `status`: Current status message

### WebSocket Events

- **onopen**: Connection established, request is sent
- **onmessage**: Tokens received, appended to output
- **onerror**: Connection error occurred
- **onclose**: Connection closed (with code and reason)

### Platform-Specific Handling

- **Native (iOS/Android)**: Uses WebSocket headers for authorization
- **Web**: WebSocket headers not supported; would need query params
- **Android Emulator**: Auto-translates localhost addresses

## File Structure

```
app/
├── (tabs)/
│   ├── _layout.tsx                 # Tab navigator (modified)
│   ├── content-search.tsx          # New streaming page
│   ├── ws.tsx                      # Existing WS page
│   ├── index.tsx                   # Home
│   └── explore.tsx                 # Explore
```

## Testing Checklist

- [ ] FastAPI server is running
- [ ] WebSocket endpoint is accessible
- [ ] Authorization (if required) is working
- [ ] App connects and receives tokens
- [ ] Tokens display in real-time
- [ ] Connection closes on [END] marker
- [ ] Error handling works correctly
- [ ] Cross-platform testing (iOS, Android, Web)

## Next Steps

1. **Deploy your FastAPI server** with the WebSocket endpoint
2. **Update the default URL** in `content-search.tsx` if needed
3. **Test with your LLM provider** (OpenAI, DeepSeek, etc.)
4. **Customize prompts** for your use case
5. **Add additional categories** as needed

## Support

For issues or questions:
- Check the troubleshooting section
- Review server logs and WebSocket error codes
- Verify all configuration values
- Test with a simple curl/ws client first

---

**Happy testing! 🚀**
