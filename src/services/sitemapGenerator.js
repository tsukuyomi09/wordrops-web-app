const { client } = require("../database/db");

const staticUrlsXml = [
    {
        loc: "https://wordrops.com/",
        lastmod: "2025-04-17T19:03:28+00:00",
        priority: "1.00",
    },
    {
        loc: "https://wordrops.com/privacy-policy",
        lastmod: "2025-04-17T19:03:28+00:00",
        priority: "0.80",
    },
    {
        loc: "https://wordrops.com/terms-and-conditions",
        lastmod: "2025-04-17T19:03:28+00:00",
        priority: "0.80",
    },
];

function staticUrlsToXml(urls) {
    return urls
        .map(
            ({ loc, lastmod, priority }) => `
            <url>
                <loc>${loc}</loc>
                <lastmod>${lastmod}</lastmod>
                <priority>${priority}</priority>
            </url>`
        )
        .join("");
}

async function sitemapGenerator(req, res) {
    try {
        const result = await client.query(
            "SELECT id, title, finished_at FROM games_completed WHERE publish = 'publish'"
        );

        const urlsXml = result.rows
            .map((row) => {
                const slug = generateSlug(row.title);
                return `
                <url>
                    <loc>https://wordrops.com/storia/${row.id}-${slug}</loc>
                    <lastmod>${row.finished_at.toISOString()}</lastmod>
                    <priority>0.8</priority>
                </url>`;
            })
            .join("");

        const staticUrlsXmlString = staticUrlsToXml(staticUrlsXml);

        const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
            <urlset
            xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                                http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
            <url>
                <loc>https://wordrops.com/</loc>
                <lastmod>${new Date().toISOString()}</lastmod>
                <priority>1.0</priority>
            </url>
            ${staticUrlsXmlString} 
            ${urlsXml}      
            </urlset>`;

        res.setHeader("Content-Type", "application/xml");
        res.send(sitemapXml);
    } catch (error) {
        console.error("Error generating sitemap:", error);
        res.status(500).send("Internal Server Error");
    }
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 50);
}
module.exports = { sitemapGenerator };
