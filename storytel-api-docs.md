# Storytel API Package Analysis

The `storytel-api` package is an unofficial API wrapper for Storytel written in TypeScript by Maurits Wilke. It provides programmatic access to Storytel accounts, bookshelves, and reading materials such as audiobooks and ebooks.

> [!WARNING]
> This is an unofficial wrapper still in development (v0.0.1). 

## How It Works

The library exposes a main `Storytel` object to initiate a session by signing in via credentials or token. Once authenticated, a `User` object gives access to the user's bookshelf, and account info. The classes returned provide helper methods.

## API Reference

### 1. `Storytel`
The main entry point class.
- **`constructor()`**
- **`signIn(username: string, password: string) => Promise<User>`**: Authenticates a user using their email and password. Returns a `User` instance.
- **`signInUsingSingleSignToken(token: string) => Promise<User>`**: Authenticates a user using an existing token instead of credentials.

### 2. `User`
Returned after a successful sign-in.
- **`revalidateAccount(token?: string | null) => Promise<LoginResponse>`**: Re-validates the current session.
- **`getSingleSignToken() => SingleSignToken`**: Retrieves the active sign-in token.
- **`getJWT() => JWT`**: Retrieves the JSON Web Token used for authenticated requests.
- **`getBookshelf() => Promise<Book[]>`**: Fetches the user's current bookshelf as an array of `Book` objects.
- **`getAccountInfo() => Promise<Account>`**: Retrieves details about the user's account.

### 3. `Book`
Represents an item on the bookshelf.
- **Properties**: 
  - `metadata`: Raw book types data
  - `title: string`
  - `authors: Author[]`
  - `description: string`
  - `id: number`
  - `consumableID: string`
  - `ebook: Ebook | null`: Returns an `Ebook` instance if an ebook format is available, otherwise null.
  - `audiobook: Audiobook | null`: Returns an `Audiobook` instance if an audiobook format is available, otherwise null.
- **Methods**:
  - **`getBookDetails() => Promise<BookDetails>`**: Fetches extended details for the specific book.
  - **`getAverageRating() => Promise<AverageRating>`**: Returns the book rating.

### 4. `Ebook`
Returned as a property inside `Book` when applicable.
- **`download() => Promise<ArrayBuffer>`**: Initiates a download for the ebook.
- **`getBookmark() => Promise<ResponseBookmark>`**: Retrieves the saved bookmark position.
- **`setBookmark(position: number) => Promise<ResponseBookmark>`**: Sets the user's reading progress bookmark.

### 5. `Audiobook`
Returned as a property inside `Book` when applicable.
- **`download() => Promise<ArrayBuffer>`**: Initiates a download for the audiobook in array buffer format.

## General Usage Example

```typescript
import Storytel from "storytel-api";

async function fetchBooks() {
  const client = new Storytel();

  // 1. Sign In
  const user = await client.signIn("email@example.com", "password123");
  
  // 2. Access the bookshelf
  const bookshelf = await user.getBookshelf();
  
  if(bookshelf.length > 0) {
      const lastBook = bookshelf[0];
      console.log(`Your last book was: ${lastBook.title}`);
      
      // 3. Fetch Book Meta Data
      const rating = await lastBook.getAverageRating();
      console.log(`Average rating: ${rating}`);
      
      // 4. Access Ebook specifics
      if (lastBook.ebook) {
          const bookmark = await lastBook.ebook.getBookmark();
          console.log(bookmark);
      }
  }
}
```
