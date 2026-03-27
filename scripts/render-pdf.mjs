import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  console.log('Starting Puppeteer...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const filePath = `file://${path.resolve('docs/YUVR_Manual_Interactive.html')}`;
  console.log('Loading HTML format:', filePath);
  
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  
  console.log('Generating PDF...');
  await page.pdf({
    path: 'docs/YUVR_Manual_Interactive.pdf',
    printBackground: true,
    width: '210mm',
    height: '297mm',
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  
  await browser.close();
  console.log('Success! PDF saved as docs/YUVR_Manual_Interactive.pdf');
})();
