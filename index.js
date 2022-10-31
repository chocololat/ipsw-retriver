const puppeteer = require('puppeteer');
const fs = require('fs');

let args;

if (process.argv[0].match("node") || process.argv[0].match("npx")) args = process.argv.slice(2)
else args = process.argv.slice(1)

if (!args[0]) {
    console.log("Please specify an ipsw.me listing URL !");
    process.exit(0);
}

(async (url) => {
    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();

    await page.goto(url)
    await page.waitForSelector("body > div.container-fluid > div.selector > div.selector__wizard.selector__wizard--step-3 > table:nth-child(6) > tbody")

    const data = await page.evaluate(() => {
        let arr = [];

        let signed = document.querySelector("body > div.container-fluid > div.selector > div.selector__wizard.selector__wizard--step-3 > table:nth-child(6) > tbody").getElementsByTagName("tr");
        let unsigned = document.querySelector("body > div.container-fluid > div.selector > div.selector__wizard.selector__wizard--step-3 > table:nth-child(9) > tbody").getElementsByTagName("tr");

        for (let i = 0; i < signed.length; i++) {
            arr.push(signed[i]
                .getAttribute("onclick")
                .replace("window.location = '", "https://ipsw.me")
                .replace("';", ""))
        }

        for (let i = 0; i < unsigned.length; i++) {
            arr.push(unsigned[i]
                .getAttribute("onclick")
                .replace("window.location = '", "https://ipsw.me")
                .replace("';", ""))
        }

        let textH3 = document.querySelector("body > div.container-fluid > div.selector > div.selector__wizard.selector__wizard--step-3 > h3")
        let textArr = textH3.textContent.split(" ")
        
        return {
            urls: arr,
            text: textArr.join(" ")
        }
    })

    console.log(`Fetched ${data.urls.length} URLs for the ${data.text} (${url.split("/")[url.split("/").length - 1]}) from ${url}`)

    let downloadURLs = ""

    let i = 0;
    for (const redirect of data.urls) {
        i++;
        console.log(`Loaded URL ${i}/${data.urls.length}`);
        await page.goto(redirect);

        await page.waitForSelector("#CopyDownloadURL")

        let downloadURL = await page.evaluate(() => {
            let input = document.querySelector("#CopyDownloadURL")
            
            return input.getAttribute("value");
        })

        downloadURLs += `${downloadURL}\n`
    }
    
    fs.writeFileSync("urls.txt", downloadURLs)

    console.log("Download URLs have been retrieved and saved to 'urls.txt'");
    process.exit(0);
})(args[0])

// body > div.container-fluid > div.selector > div.selector__wizard.selector__wizard--step-3 > table:nth-child(6)