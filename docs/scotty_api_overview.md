# Scotty API Overview

## Introduction

Scotty provides a RESTful API for programmatic access to your team's data. The API is team-scoped and requires API key authentication.

## Base URL

```
https://your-domain.vercel.app/api/external/v1
```

## Authentication

All API requests must include an API key in the `Authorization` header.

**Supported formats:**
- `Authorization: Bearer <api-key>`
- `Authorization: Api-Key <api-key>`

### Getting an API Key

1. Sign in to Scotty
2. Go to Team Settings
3. Open the "API Keys" section
4. Click "Create Key"
5. Give it a descriptive name
6. Copy the key immediately (it won't be shown again)

### Security

- **Never share your API keys publicly**
- **Never commit API keys to version control**
- **Revoke keys immediately if compromised**
- API keys are team-scoped and can only access data for their team

## Endpoints

### List Posts

Get a list of published changelog posts for your team.

**Request:**
```http
GET /api/external/v1/posts?limit=50&offset=0
Authorization: Bearer scotty_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Query Parameters:**
- `limit` (optional): Number of posts to return (default: 50, max: 100)
- `offset` (optional): Number of posts to skip (default: 0)

**Response:**
```json
{
  "posts": [
    {
      "id": "post-id-123",
      "title": "New Feature Release",
      "content": "<p>We've added a new feature...</p>",
      "category": "FEATURE",
      "status": "published",
      "views": 42,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "publishedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

### Create Post

Create a new changelog post for your team.

**Request:**
```http
POST /api/external/v1/posts
Authorization: Bearer scotty_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json

{
  "title": "New Feature Announcement",
  "content": "<p>We're excited to announce...</p>",
  "category": "FEATURE",
  "status": "published"
}
```

**Request Body:**
- `title` (required): Post title
- `content` (required): Post content (HTML supported)
- `category` (optional): Post category (default: "NOTIFICATION")
  - `NOTIFICATION`
  - `FEATURE`
  - `IMPROVEMENT`
  - `BUG_FIX`
  - `ANNOUNCEMENT`
- `status` (optional): Post status (default: "published")
  - `published`
  - `draft`
  - `scheduled`

**Response:**
```json
{
  "post": {
    "id": "new-post-id-456",
    "title": "New Feature Announcement",
    "content": "<p>We're excited to announce...</p>",
    "category": "FEATURE",
    "status": "published",
    "views": 0,
    "createdAt": "2024-01-15T12:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z",
    "publishedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message"
}
```

### Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Invalid or missing API key
- `403 Forbidden` - Feature not available on current plan
- `405 Method Not Allowed` - HTTP method not supported
- `500 Internal Server Error` - Server error

### Example Error Response

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key. Provide it in the Authorization header as \"Bearer <key>\" or \"Api-Key <key>\"."
}
```

## Rate Limits

Currently, there are no explicit rate limits, but we reserve the right to implement them. Best practices:

- Don't make more than 100 requests per minute per API key
- Use pagination for large datasets
- Cache responses when appropriate

## Team Scoping

All API operations are automatically scoped to the team associated with the API key. You cannot:

- Access data from other teams
- Create posts for other teams
- Modify team settings via API

## Feature Flags

Some API endpoints may require specific features to be enabled on your team's plan. If a feature is not available, you'll receive a `403 Forbidden` response with details about which plan is required.

## Examples

### cURL

```bash
# List posts
curl -X GET \
  'https://your-domain.vercel.app/api/external/v1/posts?limit=10' \
  -H 'Authorization: Bearer scotty_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

# Create post
curl -X POST \
  'https://your-domain.vercel.app/api/external/v1/posts' \
  -H 'Authorization: Bearer scotty_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "New Update",
    "content": "<p>This is a new update</p>",
    "category": "FEATURE"
  }'
```

### JavaScript/TypeScript

```typescript
const API_KEY = 'scotty_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const BASE_URL = 'https://your-domain.vercel.app/api/external/v1';

// List posts
const response = await fetch(`${BASE_URL}/posts?limit=10`, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
  },
});
const data = await response.json();

// Create post
const createResponse = await fetch(`${BASE_URL}/posts`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'New Update',
    content: '<p>This is a new update</p>',
    category: 'FEATURE',
  }),
});
const newPost = await createResponse.json();
```

### Python

```python
import requests

API_KEY = 'scotty_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
BASE_URL = 'https://your-domain.vercel.app/api/external/v1'

# List posts
response = requests.get(
    f'{BASE_URL}/posts',
    params={'limit': 10},
    headers={'Authorization': f'Bearer {API_KEY}'}
)
posts = response.json()

# Create post
create_response = requests.post(
    f'{BASE_URL}/posts',
    headers={
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json',
    },
    json={
        'title': 'New Update',
        'content': '<p>This is a new update</p>',
        'category': 'FEATURE',
    }
)
new_post = create_response.json()
```

## Support

For API support or to report issues:
- Check the documentation
- Review error messages for guidance
- Contact support if you need assistance

