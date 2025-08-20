# Organization & User Search Bookmarklet

This directory contains the code for a bookmarklet that provides the same functionality as the Chrome extension, but can be run on any `*.appneta.com` page directly from a browser bookmark.

## `bookmarklet.js`

This file contains all the necessary HTML, CSS, and JavaScript to create and run the search tool. The code is self-contained and designed to be used to create a bookmarklet.

## How to Create the Bookmarklet

Because the script is too large to be placed directly in a bookmark's URL field, you need to use a simple "loader" bookmarklet that fetches and executes the script from a hosted location.

1.  **Host `bookmarklet.js`:**
    You need to host the `bookmarklet.js` file on a server that is accessible from your browser. This could be a personal web server, a service like GitHub Gist, or a company's internal server. Let's assume you host it at `https://example.com/path/to/bookmarklet.js`.

2.  **Create a New Bookmark:**
    Create a new bookmark in your browser with the following code in the "URL" or "Location" field:

    ```javascript
    javascript:(function(){
        var script=document.createElement('script');
        script.src='https://example.com/path/to/bookmarklet.js';
        document.body.appendChild(script);
    })();
    ```

3.  **Update the URL:**
    Replace `https://example.com/path/to/bookmarklet.js` in the code above with the actual URL where you are hosting the file.

## How to Use the Bookmarklet

1.  Log in to your AppNeta environment.
2.  Navigate to any page within the `*.appneta.com` domain.
3.  Click the bookmarklet you created.
4.  A search panel will appear on the page.
