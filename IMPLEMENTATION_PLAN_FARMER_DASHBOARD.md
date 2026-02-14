# Implementation Plan - Farmer Dashboard & CRUD

## Features Implemented
1.  **Farmer Dashboard**:
    -   Displays user profile information (Name, Phone, Location, Rating, Avatar).
    -   Lists active negotiations.
    -   Lists farmer's own products (if user is a FARMER).
2.  **Product CRUD**:
    -   **Create**: Add new products with images.
    -   **Read**: View list of own products with status and details.
    -   **Update**: Edit existing products (prices, quantity, description, etc.).
    -   **Delete**: Remove products from the listing.
3.  **Image Handling**:
    -   Support for multiple image uploads (up to 5) per product.
    -   Display of product thumbnails in the dashboard table.
    -   Display of user avatar.
4.  **API Client Updates**:
    -   Added methods for `get_my_products`, `create_product`, `update_product`, `delete_product`, `get_user_profile`.
    -   Implemented multipart request support for file uploads.

## Files Modified
1.  `realtime_gateway/lib/realtime_gateway/services/api_client.ex`:
    -   Added CRUD functions.
    -   Added multipart support using `HTTPoison`.
    -   Fixed profile endpoint path.
2.  `realtime_gateway/lib/realtime_gateway_web/live/dashboard_live.ex`:
    -   Completely rewritten to include profile, negotiations, and product management.
    -   Added `load_dashboard_data` to fetch rigorous data.
    -   Added Modal for Product Form.
    -   Added `handle_event` for CRUD actions.
3.  `realtime_gateway/mix.exs`:
    -   (No changes needed as `HTTPoison` and `Jason` were already present).

## Verification
-   **Dashboard Loading**: Upon login, the dashboard fetches profile, negotiations, and products.
-   **Profile**: Correctly displays user info from backend.
-   **Product Table**: Shows products for farmers.
-   **Add Product**: Opens modal, allows file selection, sends multipart POST.
-   **Edit Product**: Pre-fills modal, allows file updates, sends multipart PUT.
-   **Delete Product**: Sends DELETE request and refreshes list.
