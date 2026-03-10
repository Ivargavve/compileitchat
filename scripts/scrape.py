import asyncio
import json
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

PAGES = [
    "https://compileit.com",
    "https://compileit.com/vara-tjanster",
    "https://compileit.com/uppdrag",
    "https://compileit.com/om-oss",
    "https://compileit.com/karriar",
    "https://compileit.com/nyheter",
    "https://compileit.com/kontakt",
]

async def scrape_all():
    browser_config = BrowserConfig(headless=True)
    crawler_config = CrawlerRunConfig()

    results = []

    async with AsyncWebCrawler(config=browser_config) as crawler:
        for url in PAGES:
            print(f"Scraping: {url}")
            result = await crawler.arun(url=url, config=crawler_config)

            if result.success:
                results.append({
                    "url": url,
                    "title": result.metadata.get("title", ""),
                    "content": result.markdown,
                })
                print(f"  OK - {len(result.markdown)} chars")
            else:
                print(f"  FAILED: {result.error_message}")

    return results

async def main():
    print("Starting scrape of compileit.com...")
    data = await scrape_all()

    output_path = "backend/data/knowledge.json"
    import os
    os.makedirs("backend/data", exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(data)} pages to {output_path}")

if __name__ == "__main__":
    asyncio.run(main())
