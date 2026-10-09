# Blubstore admin guide

You can change Blubstore's products, prices, photos and main text without touching any code. Edits are made in **Pages CMS**, a free web editor that signs in with GitHub.

## Who can edit

Two people get editor access:

- **Lisa Marak** (owner): lisamarak219@gmail.com
- **malaakedits@gmail.com**

Whoever owns the site's GitHub repository signs in to Pages CMS with GitHub, then invites the other admin as a **collaborator** by email (in Pages CMS, open the repository's **Collaborators** settings). A collaborator gets a sign-in link by email and doesn't need a GitHub account. Collaborators can edit products, text and photos, but can't change the editor setup.

Customer orders always go by email to **lisamarak219@gmail.com**.

## Opening the editor

1. Go to **https://app.pagescms.org**. Sign in with GitHub, or use the email link if you were invited as a collaborator.
2. Pick the Blubstore repository.
3. On the left you'll see **Products** and **Site text**.

Every time you click **Save**, Pages CMS saves the change to the site. The live site updates once it has been republished, which usually happens automatically within a minute or two.

## Add a product

1. Open **Products** and click **Add an entry** at the bottom of the list.
2. Fill in:
   - **Product ID**: a short code in lowercase with no spaces, e.g. `linen-shirt`. Every product needs a different one. Don't change it once people have ordered the item.
   - **Name** and **Short description**.
   - **Photo**: click it and upload a picture. Square photos on a plain light background look best (about 1200×1200).
   - **Price (USD $)**, **Price (INR ₹)** and **Price (MVR)**: enter all three. The site shows whichever currency the customer picks. It does **not** convert prices for you.
   - **Badge** (optional): *New*, *Flagship* or *Sold out*.
   - **In stock**: leave it switched on.
3. Click **Save**. The new product shows up in the shop grid.

To change the order of products in the shop, drag them up or down in the list.

## Change a photo

1. Open **Products** and expand the product.
2. Click the **Photo**, then upload a new image or pick one you've already uploaded.
3. Click **Save**.

Photos are stored in `assets/products/`. To change the big image in the scroll story, go to **Site text → Scroll story → Story image**. A wide (16:9) picture works best there.

## Change prices

Open **Products**, expand the product, edit the three price boxes and click **Save**. Prices are just numbers: type `3199`, not `₹3,199`. The site adds the currency symbol itself.

> Tip: as a starting point, the prices were set at roughly 1 USD = 84 INR = 15.42 MVR, then rounded.

## Mark something sold out

Open **Products**, expand the product, and either switch **In stock** off or set **Badge** to **Sold out**. Then click **Save**.

The product stays visible with a *Sold out* label, and its **Add to bag** button is turned off. When it's back in stock, switch **In stock** on again and clear the badge.

To remove a product completely, delete its entry from the list.

## Change the headline or About text

Open **Site text**:

- **Top of page**: the small line, the big headline and the text under it. Put a word between stars to make it blue italic, e.g. `Soft *blue* everyday.`
- **Scroll story**: which product appears at the end of the story (enter its Product ID), the story image, and the four detail cards.
- **About section**: the heading and its paragraphs.

## How orders work

- Customers add items to their bag, choose a currency (USD, INR or MVR), and fill in the checkout form: name, phone, email, address, payment method (cash on delivery or bank transfer) and notes.
- The order arrives as an email at **lisamarak219@gmail.com**. It lists the items, the total and the currency.
- **The first order ever** triggers an activation email from FormSubmit to lisamarak219@gmail.com. Click the link in it once, or orders won't be delivered.
- Lisa then confirms each order with the customer by email or phone, and sends bank details if they chose bank transfer.
