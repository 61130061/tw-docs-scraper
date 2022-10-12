const puppeteer = require('puppeteer');
const fs = require('fs');

function saveFile (path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
} 

async function launch() {
  let json = [];

  const pup = await puppeteer.launch({
    headless: false,
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-sandbox",
    ]
  });

  const page = await pup.newPage();
  await page.setViewport({
    width: 0,
    height: 0,
  });
  await page.goto('https://tailwindcss.com/docs/installation', {waitUntil: 'networkidle2'});

  for (let z = 13; z <= 26; z++) {
    const catEle = await page.$x(`//*[@id="nav"]/ul/li[${z}]/h5`);
    const category = await page.evaluate(el => {
      return el.innerText;
    }, catEle[0]);
    const result = [];

    console.log(z);
    const linksEle = await page.$x(`//*[@id="nav"]/ul/li[${z}]/ul`);
    const linksLength = await page.evaluate(el => {
      return el.childNodes.length;
    }, linksEle[0]);

    for (let i = 1; i <= linksLength; i++) {
      const link = await page.$x(`//*[@id="nav"]/ul/li[${z}]/ul/li[${i}]/a`);
      await page.waitForXPath(`//*[@id="nav"]/ul/li[${z}]/ul/li[${i}]/a`);
      await link[0].click();
      const name = await page.evaluate(el => {
        return el.innerText;
      }, link[0]);

      await page.waitForXPath(`//*[@id="__next"]/div[3]/div/div[2]/div/div[1]/div/table`);
      const table = await page.$x(`//*[@id="__next"]/div[3]/div/div[2]/div/div[1]/div/table`);

      const tableData = await page.evaluate(el => {
        const data = [];
        const header = [];

        // Get table header
        const headerCells = el.rows.item(0).cells;
        console.dir(headerCells);
        for (let i = 0; i < headerCells.length; i++) {
          let text = headerCells.item(i).firstChild.innerHTML;
          header.push(text);
        }

        for (let i = 1; i < el.rows.length; i++) {
          let objCells = el.rows.item(i).cells;

          let values = {};
          for (var j = 0; j < objCells.length; j++) {
            let text = objCells.item(j).innerText;
            values[header[j]] = text;
          }
          data.push(values);
        }

        return data;
      }, table[0])

      result.push({ name, table: tableData });
    }

    //console.log(result);
    saveFile(`./output/${category}.json`, result);
  }
  
  await pup.close();
}

try {
  launch();
} catch (err) {
  console.log(err);
}