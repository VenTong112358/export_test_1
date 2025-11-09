# Content Search Streaming - Quick Start

## TL;DR

You now have a new tab in your app called **"Content Search"** that lets you test WebSocket LLM streaming!

### 5-Minute Setup

1. **Start your FastAPI server** with the WebSocket endpoint:
   ```
   ws://localhost:8000/content_search/{category}
   ```

2. **Open the app** and tap the **"Content Search"** tab (magnifying glass icon)

3. **Fill in the form**:
   - Server URL: `ws://localhost:8000`
   - Category: Choose "Word/Phrase" or "Phrase Context"
   - Content: Enter text to translate (e.g., "beautiful")
   - Token: (Optional) Add auth header if needed

4. **Click "Start Stream"** and watch the translation appear in real-time!

---

## Key Features

✅ **Real-time streaming** - Tokens appear as they generate  
✅ **Two categories** - Words or sentences with context  
✅ **Auth support** - Optional authorization headers  
✅ **Cross-platform** - iOS, Android, Web ready  
✅ **Status panel** - See connection status and errors  
✅ **Easy to use** - Clean, intuitive interface  

---

## What the Page Does

```
┌─────────────────────────────────────┐
│  Content Search Streaming           │
│  LLM-powered content analysis       │
├─────────────────────────────────────┤
│  WebSocket Server URL               │
│  [ws://localhost:8000            ]  │
│  Resolved: ws://localhost:8000/...  │
│                                     │
│  Category                           │
│  [Word/Phrase v             ]       │
│                                     │
│  Authorization Token                │
│  [optional auth token         ]     │
│                                     │
│  Content to Search                  │
│  [Enter text here...         ]      │
│                                     │
│  Status: Ready                      │
│  [Start Stream] [Disconnect] [Clear]│
├─────────────────────────────────────┤
│  Streaming Output                   │
│                                     │
│  (Response appears here in real-time)
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  How to Use:                        │
│  1. Ensure FastAPI server running   │
│  2. Enter server URL                │
│  3. Select category                 │
│  4. Enter content                   │
│  5. Add token if needed             │
│  6. Click Start Stream              │
└─────────────────────────────────────┘
```

---

## Example Usage

### Example 1: Translate a Word

```
Server URL: ws://localhost:8000
Category: Word/Phrase (词组)
Content: beautiful
Token: (leave empty)

Click "Start Stream"

Output:
美妙的
或
漂亮的
或
优美的
```

### Example 2: Translate a Sentence

```
Server URL: ws://localhost:8000
Category: Phrase Context (句子)
Content: This is a beautiful day
Token: (leave empty)

Click "Start Stream"

Output:
这是一个美好的一天
或
今天天气很好，真是美丽的一天
```

### Example 3: With Authentication

```
Server URL: ws://localhost:8000
Category: Word/Phrase (词组)
Content: python
Token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Click "Start Stream"

Output:
蟒蛇/Python编程语言
```

---

## WebSocket Message Flow

```
Client                          Server
  │                               │
  ├─ Create WS connection ────────>
  │                               │
  │<───── Connection opened ──────┤
  │                               │
  ├─ Send {"content": "..."}─────>
  │                               │
  │<───── "美" ─────────────────┤
  │<───── "妙" ─────────────────┤
  │<───── "的" ─────────────────┤
  │<───── "[END]" ───────────────┤
  │                               │
  ├─ Close connection ───────────>
  │                               │
```

---

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| "Connection error" | Check FastAPI server is running, URL is correct |
| No response | Check LLM API key/base URL on server, check logs |
| Auth error (4003) | Verify token format and auth logic |
| Android won't connect | App auto-translates localhost→10.0.2.2, should work |
| Empty output | Server may not be sending tokens, check server logs |

---

## Files Modified/Created

```
app/(tabs)/
├── _layout.tsx           ← Modified (added Content Search tab)
├── content-search.tsx    ← NEW (the streaming page)
├── ws.tsx                ← Existing
└── ...

WEBSOCKET_STREAMING_GUIDE.md    ← Detailed guide
QUICK_START_CONTENT_SEARCH.md   ← This file
```

---

## Architecture Overview

**Frontend** (React Native/Expo):
- WebSocket client
- Form inputs
- Real-time display
- Error handling

**Backend** (FastAPI):
- WebSocket endpoint: `/content_search/{category}`
- Auth validation
- LLM integration (async)
- Token streaming

---

## Next Steps

1. ✅ Review the code in `app/(tabs)/content-search.tsx`
2. ✅ Check your FastAPI server implementation
3. ✅ Update the default server URL if needed
4. ✅ Test with different categories
5. ✅ Add authentication if required
6. ✅ Deploy to production

---

## Code Reference

### Start Streaming
```typescript
const handleStartStream = useCallback(() => {
  if (!content.trim()) return;
  
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    ws.send(JSON.stringify({ content }));
  };
  
  ws.onmessage = (event) => {
    const data = event.data;
    if (data === '[END]') {
      ws.close();
    } else {
      appendOutput(data);  // Add token to display
    }
  };
}, [...]);
```

### Listen for Tokens
```typescript
ws.onmessage = (event: WebSocketMessageEvent) => {
  const data = String((event as any).data ?? '');
  
  if (data === '[END]') {
    // Stream complete
    setIsStreaming(false);
    ws.close();
    return;
  }
  
  // Add token to output
  appendOutput(data);
};
```

---

## Support

📚 **Full Guide**: See `WEBSOCKET_STREAMING_GUIDE.md`  
🔧 **Implementation**: See `app/(tabs)/content-search.tsx`  
💬 **Questions**: Check troubleshooting section in full guide

---

**Happy streaming! 🎉**
