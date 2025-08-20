# Organization & User Search Bookmarklet

This directory contains the code for a bookmarklet that provides the same functionality as the Chrome extension, but can be run on any `*.appneta.com` page directly from a browser bookmark.

## Architecture

To solve the browser's cross-origin security (CORS) restrictions, this bookmarklet uses a loader and iframe-based architecture:

1.  **`bookmarklet_loader.js`**: This is the script that you will use to create the bookmarklet. It creates a hidden `iframe` that loads a page from the `provision.pm.appneta.com` domain.
2.  **`bookmarklet_core.js`**: This file contains the full application logic (UI, caching, API calls). The loader script embeds the content of this file as a string.
3.  **Injection**: Once the iframe has loaded (giving it the correct origin), the loader injects the core logic into it. The core logic then runs from within the iframe, but uses `window.parent.document` to create its UI on the main page. This allows the API calls to be same-origin and avoid CORS errors.

## How to Create the Bookmarklet

1.  **Copy the Loader Code:**
    Open the `bookmarklet_loader.js` file and copy its entire content.

2.  **Create a New Bookmark:**
    Create a new bookmark in your browser. In the "URL" or "Location" field, paste the code you copied. Make sure the code starts with `javascript:`.

    *Note: Some browsers might automatically remove the `javascript:` prefix when you paste the code. You may need to type it in manually at the beginning of the URL field.*

3.  **Save the bookmark.**

## How to Use the Bookmarklet

1.  Log in to your AppNeta environment.
2.  Navigate to any page within the `*.appneta.com` domain.
3.  Click the bookmarklet you created.
4.  A search panel will appear on the page.
