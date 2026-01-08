# PixelVault API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints support optional authentication via:
- Header: `Authorization: Bearer <token>`
- Header: `x-user-id: <user_id>` (for development)

## Endpoints

### Images

#### GET /api/images
Get list of images with filters and pagination.

**Query Parameters:**
- `category` (string, optional): Filter by category
- `q` or `search` (string, optional): Search query
- `orientation` (string, optional): 'landscape' | 'portrait' | 'square' | 'all'
- `sort` (string, optional): 'recent' | 'popular' | 'trending'
- `limit` (number, optional): Results per page (default: 40)
- `offset` (number, optional): Pagination offset (default: 0)
- `tags` (string, optional): Comma-separated tags

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 1000,
    "limit": 40,
    "offset": 0,
    "hasMore": true
  }
}
```

#### GET /api/images/[id]
Get image by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "url": "...",
    "title": "...",
    ...
  }
}
```

#### GET /api/images/[id]/related
Get related images based on tags.

**Response:**
```json
{
  "success": true,
  "data": [...]
}
```

#### POST /api/images/upload
Upload a new image.

**Request:**
- FormData with:
  - `file`: Image file
  - `title` (optional): Image title
  - `category` (optional): Category
  - `tags` (optional): Comma-separated tags

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/filename.jpg",
    "filename": "...",
    ...
  }
}
```

#### PATCH /api/images/metadata
Update image metadata.

**Request Body:**
```json
{
  "imageId": 1,
  "title": "New Title",
  "tags": ["tag1", "tag2"],
  "category": "nature"
}
```

### Search

#### GET /api/search
Full-text search across images.

**Query Parameters:**
- `q` or `query` (required): Search query
- `category` (optional): Filter by category
- `limit` (optional): Results limit
- `offset` (optional): Pagination offset

### Favorites

#### GET /api/favorites
Get user's favorites.

**Headers:**
- `x-user-id`: User ID

#### POST /api/favorites
Add image to favorites.

**Request Body:**
```json
{
  "imageId": 1
}
```

#### DELETE /api/favorites?imageId=1
Remove image from favorites.

### Collections

#### GET /api/collections
Get user's collections.

#### POST /api/collections
Create a new collection.

**Request Body:**
```json
{
  "name": "My Collection",
  "description": "Optional description"
}
```

#### POST /api/collections/[id]
Add or remove image from collection.

**Request Body:**
```json
{
  "imageId": 1,
  "action": "add" // or "remove"
}
```

#### DELETE /api/collections/[id]
Delete a collection.

### Authentication

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

#### POST /api/auth/login
Login user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /api/auth/logout
Logout user.

#### GET /api/auth/me
Get current user info.

### Analytics

#### POST /api/images/analytics
Track image view or download.

**Request Body:**
```json
{
  "imageId": 1,
  "action": "view" // or "download"
}
```

## Rate Limiting

- Most endpoints: 100 requests per minute
- Authentication endpoints: 10 requests per minute
- Registration: 5 requests per minute

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

Status codes:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error
