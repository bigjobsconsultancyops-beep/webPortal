# Big Jobs Consultancy — Setup Guide

## What's Included

```
bigjobs/
├── index.html              ← Home page
├── favicon.svg             ← Browser tab icon
├── og-image.svg            ← Source for the social-share card
├── og-image.jpg            ← Social-share card (1200×630, generated from the SVG)
├── css/style.css           ← All styling + design tokens
├── pages/
│   ├── about.html          ← About us
│   ├── jobs.html           ← Job listings (pulls from Google Sheets)
│   ├── register.html       ← Candidate registration form
│   ├── employers.html      ← For employers + inquiry form
│   └── contact.html        ← Contact info + form + map
└── SETUP-GUIDE.md          ← This file
```

## Design System

All styling lives in `css/style.css`. Before changing spacing, colors, or corner
radii, look at the `:root` block at the top — everything is driven by tokens:

| Token group | Variables | Use for |
|---|---|---|
| Color | `--navy`, `--amber`, `--text-muted`, `--border`, … | All colors |
| Spacing | `--space-1` … `--space-20` (4px base) | Every margin, padding, and gap |
| Radii | `--radius-sm/md/lg/xl/full` | Every rounded corner |
| Elevation | `--shadow-sm/md/lg` | Every box-shadow |

**Rule of thumb: no inline `style=""` attributes in the HTML.** Repeated blocks
already have classes — `.page-hero` (interior page headers), `.cta-band`
(navy call-to-action strips), `.section-head` (centered label + title + subtitle),
`.steps-grid` (numbered 1-2-3 cards), `.btn-sm` / `.btn-wide` (button sizes).
Add a class to the stylesheet rather than a one-off inline style.

### Icons

Icons are inline SVG in the [Lucide](https://lucide.dev) line style, all carrying
`class="icon"` (or `icon-lg`). They inherit color from their parent via
`currentColor` and are sized by CSS, so **do not use emoji as icons** — they
render differently on every device and break the visual system. To add one, copy
the paths from lucide.dev into:

```html
<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><!-- paths here --></svg>
```

---

## Step 1: Set Up Web3Forms (Email Notifications)

All 3 forms (register, employer, contact) use **Web3Forms** — free, no signup, unlimited submissions.

1. Go to **https://web3forms.com**
2. Enter the email address where you want form submissions to arrive
3. You'll receive an **Access Key** via email
4. Open these 3 files and replace `YOUR_ACCESS_KEY_HERE` with your key:
   - `pages/register.html`
   - `pages/employers.html`
   - `pages/contact.html`

That's it — forms now email you every submission with all fields + resume attachment.

---

## Step 2: Set Up Google Sheets for Job Listings (CMS)

This lets a non-technical person manage job listings by editing a spreadsheet.

1. Create a new Google Sheet
2. In **Row 1**, add these exact headers:

   | A | B | C | D | E | F | G |
   |---|---|---|---|---|---|---|
   | Title | Company | Location | Category | Type | Salary | Posted |

3. Add your job listings in the rows below. Example:

   | Title | Company | Location | Category | Type | Salary | Posted |
   |---|---|---|---|---|---|---|
   | Warehouse Supervisor | Metro Logistics | Delhi NCR | Operations | Full-Time | ₹18,000 – ₹25,000/mo | 2026-08-25 |
   | Data Entry Operator | InfoTech | Noida | Admin | Full-Time | ₹12,000 – ₹18,000/mo | 2026-08-22 |

4. Go to **File → Share → Publish to web**
5. Select **Sheet1** and format **CSV**
6. Click **Publish** and copy the URL
7. Open `pages/jobs.html` and paste the URL in the `SHEET_CSV_URL` variable:
   ```js
   const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv';
   ```

Now whenever someone edits the Google Sheet, the website shows the updated jobs automatically (with a few minutes of cache delay).

---

## Step 3: Google Sheets Backup for Form Submissions (Optional)

If you want form submissions to ALSO log into a Google Sheet:

1. Create a new Google Sheet for submissions
2. Go to **Extensions → Apps Script**
3. Paste this code:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.name || '',
    data.phone || '',
    data.email || '',
    data.qualification || '',
    data.experience || '',
    data.skills || '',
    data.message || ''
  ]);
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'success' })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Deploy → New Deployment → Web App**
5. Set "Execute as" = **Me** and "Who has access" = **Anyone**
6. Copy the deployment URL

Then add a fetch call in the form's submit handler in `register.html` to POST form data to this URL alongside the Web3Forms submission. This is optional — Web3Forms already emails you everything.

---

## Step 4: Replace Placeholder Content

Search and replace these placeholders across all HTML files:

| Placeholder | Replace with |
|---|---|
| `+91-XXXXX XXXXX` | Your actual phone number |
| `91XXXXXXXXXX` (in WhatsApp links) | Your WhatsApp number (no + or spaces, e.g. `919876543210`) |
| `info@bigjobsconsultancy.com` | Your actual email |
| `Your City, India` / `Your Office Address` | Your actual address |
| `YOUR_ACCESS_KEY_HERE` | Your Web3Forms access key |
| Google Maps iframe | Your actual Google Maps embed (search your address on maps.google.com → Share → Embed) |
| Stats (500+, 50+, 15+) | Your actual numbers (or keep as aspirational) |
| `https://bigjobsconsultancy.in` | Your live domain — appears in each page's `<link rel="canonical">` and `og:` tags |

### Social share card

Every page points `og:image` at `/og-image.jpg` (1200×630), which is what shows up
when someone shares a link on WhatsApp, LinkedIn, or Facebook. To change the
wording or colors, edit `og-image.svg` and regenerate the JPEG:

```bash
sips -s format jpeg -s formatOptions 88 og-image.svg --out og-image.jpg
```

After editing, re-scrape the page at https://developers.facebook.com/tools/debug/
so the old image isn't served from cache.

### Optional: PNG fallback icons

`favicon.svg` covers modern browsers. For older browsers and iOS home-screen
icons, export a 180×180 PNG of the same mark, save it as `apple-touch-icon.png`
in the project root, and add this line to each page's `<head>`:

```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

---

## Step 5: Deploy to Netlify (Free)

### Option A: Drag & Drop (Easiest)

1. Go to **https://app.netlify.com/drop**
2. Drag the entire `bigjobs` folder onto the page
3. Done. You get a live URL like `random-name.netlify.app`

### Option B: Git (Better for Updates)

1. Push the `bigjobs` folder to a GitHub/GitLab repo
2. Sign in to Netlify with your GitHub account
3. Click **"Add New Site" → "Import an Existing Project"**
4. Select your repo → Deploy
5. Future changes: just push to GitHub → Netlify auto-deploys

### Custom Domain

1. Buy a domain (Namecheap, GoDaddy, Hostinger — `.in` domains cost ₹500–800/yr)
2. In Netlify → Site Settings → Domain Management → Add custom domain
3. Update your domain's DNS:
   - Add a **CNAME** record: `www` → `your-site.netlify.app`
   - Or use Netlify DNS (they'll give you nameservers to set at your registrar)
4. Netlify auto-provisions a free SSL certificate

---

## Step 6: Google Maps Embed

1. Go to **Google Maps** → search your office address
2. Click **Share → Embed a map**
3. Copy the iframe code
4. Replace the existing `<iframe>` in `pages/contact.html`

---

## Maintenance

- **Add/remove jobs**: Edit the Google Sheet. No code changes needed.
- **Update content**: Edit the HTML files directly (any text editor works).
- **Check form submissions**: They arrive in your email. Optionally also in Google Sheets.

---

## Cost Summary

| Item | Cost | Frequency |
|---|---|---|
| Domain (.in) | ₹500–800 | Yearly |
| Netlify hosting | ₹0 | Free forever |
| Web3Forms | ₹0 | Free (unlimited submissions) |
| Google Sheets | ₹0 | Free |
| SSL certificate | ₹0 | Auto via Netlify |
| **Total** | **~₹700/year** | |
