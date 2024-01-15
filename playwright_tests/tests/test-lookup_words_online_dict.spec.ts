import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

async function expectCloseButton(page, locatorQuery: string) {
  try {
    // waitForSelector and then(), refer to: https://stackoverflow.com/questions/53235577/catching-waitforselector-errors
    // css selector using attribute to locate element, refer to: https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors
    await page.waitForSelector(locatorQuery, { state: 'visible', timeout: 10 * 1000 }).then(() => {
      console.log('close button is found');
    }, e => {
      console.log('close button is not found: ', e);
    })

    // const closeButton = page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true })
    // closeButton.waitFor({ state: 'visible', timeout: 10*1000 });
    // console.log('close button is found')
  } catch (error) {
    console.log('expectCloseButton: ', error)
  }
}

async function clickCloseButton(page, locatorQuery: string) {
  try {
    // css selector using attribute to locate element, refer to: https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors
    page.locator(locatorQuery).isVisible().then((val: boolean) => {
      // page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).isVisible().then((val:boolean) => {
      console.log('close button: val= ', val)
      if (val) {
        page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click({ timeout: 1 * 1000 });
        console.log('close button is clicked')
      }
    })
  } catch (error) {
    console.log('clickCloseButton: ', error)
  }
}

test('lookup_word_in_cambridge_dict', async ({ page }) => {
  test.setTimeout(120 * 1000);
  page.setViewportSize({ width: 1920, height: 1200 });

  const inFile: string = './input/input-test-lookup_words.txt'
  const wordsTxt: string = readFileSync(inFile, 'utf-8')
  console.log(`wordsTxt: ${wordsTxt}`)

  const outFile: string = './output/output-test-lookup_words.txt'
  writeFileSync(outFile, "", { flag: 'w' }) // clear the content of the file

  await page.goto('https://dictionary.cambridge.org/dictionary/english/');
  // await page.goto('https://dictionary.cambridge.org/dictionary/learner-english/');

  // how to understand await, async, refer to: https://www.programsbuzz.com/article/async-and-await-playwright
  const closeButtonInDialog: string = 'div[aria-modal="true" i][role="dialog" i] button[aria-label="close" i]'
  await expectCloseButton(page, closeButtonInDialog);
  await clickCloseButton(page, closeButtonInDialog);

  // await page.getByLabel('Choose a dictionary').click();
  // await page.locator('li').filter({ hasText: 'Recent and Recommended' }).getByLabel('Set dictionary search to English', { exact: true }).click();

  // await clickCloseButton(page);

  let words: string[] = wordsTxt.split('\n')
  for (var i = 0; i < words.length; i++) {

    const wordOrPhrase: string = words[i]
    console.log(`wordOrPhrase: ${wordOrPhrase}`)
    // let wordOrPhrase: string = 'lose the plot'

    // placeholder may be 'Search English' or 'Search Learner's Dictionary'
    // await page.getByPlaceholder('Search English').fill(wordOrPhrase);
    await page.getByPlaceholder('Search').fill(wordOrPhrase);

    // add first() to eliminate the error "link for word: breeze is not shown locator.waitFor: Error: strict mode violation: getByRole('link', { name: 'breeze' }) resolved to 4 elements:"
    const linkOption = page.getByRole('link', { name: wordOrPhrase }).first()
    try {
      // "[Question] After the search operation, how can I wait for the searched row in the table to come and verify searched name is correct? #19569" refer to: https://github.com/microsoft/playwright/issues/19569
      await linkOption.waitFor({ state: 'visible', timeout: 2 * 1000 })
      const linkCount = await linkOption.count()
      const isVisible = await linkOption.isVisible()
      console.log(`link option count: ${linkCount}, wordOrPhrase: ${wordOrPhrase}`)
      // refer to: https://www.programsbuzz.com/article/playwright-select-first-or-last-element
      // "PLAYWRIGHT testing - How to skip to the next action if a click on a button is not possible (is not present)?", refer to: https://stackoverflow.com/questions/69476762/playwright-testing-how-to-skip-to-the-next-action-if-a-click-on-a-button-is-no
      if (isVisible) {
        console.log('link option found')
        await linkOption.click();

        // how to use RegExp in TypeScript, refer to: https://medium.com/@dingezzz/how-to-use-regex-in-typescript-870d8e27fe09
        // how to replace all searchString, refer to: https://www.spguides.com/typescript-string-replaces-all-occurrences/
        const newPageURL: RegExp = new RegExp(".*" + wordOrPhrase.replace(new RegExp(' ', 'g'), '.*') + ".*", "i")
        console.log(`newPageURL: ${newPageURL}`)
        // after navigating to a new URL, waitForURL should be used, 
        // refer to: 
        // 1, https://playwright.dev/docs/api/class-page#page-wait-for-url
        // 2, https://playwright.dev/docs/navigations#waiting-for-navigation
        await page.waitForURL(newPageURL, { timeout: 3 * 1000 })
      }
    } catch (e) {
      // "How to format strings in TypeScript?", refer to: https://www.tutorialspoint.com/how-to-format-strings-in-typescript
      console.log(`link for word: ${wordOrPhrase} is not shown`, e)

      await page.locator('button[type="submit"][title="search" i]').first().click();
    }


    // await page.locator('div.entry div.di-title').innerText()
    // locate an element by two classes: https://stackoverflow.com/questions/3772290/css-selector-that-applies-to-elements-with-two-classes
    // await page.locator('div.pos-header.dpos-h').innerText()
    // await page.locator('div.di-body').first().innerText().then((value: string) => {
    //   console.log('def: \n', value)
    // })

    // write to a file, refer to: https://bobbyhadz.com/blog/typescript-write-to-a-file
    writeFileSync(outFile,
      `\n\nDefinition: =====${wordOrPhrase}=====\n`,
      { flag: 'a+' })
    // for (const element of await page.locator('div.di-body').all()) {
    //   writeFileSync(outFile,
    //     `\n==================================\ninnerText:\n${await element.innerText()}\n==================================\n`,
    //     { flag: 'a+' })
    //   // console.log('innerHTML: ', await element.innerHTML())
    // }

    // const element = page.locator('div.di-body').first()
    // await element.waitFor({ state: 'visible', timeout: 1 * 1000 }).then(() => {
    //   console.log(`data div for wordOrPhrase is found: ${wordOrPhrase}`)
    // }, e => {
    //   console.log(`not data div for wordOrPhrase: ${wordOrPhrase}`)
    // })
    // const defDivCount: number = await element.count()
    // const defDivVisible: boolean = await element.isVisible()
    // const defInnerText: string = await element.innerText()
    // console.log(`data div wordOrPhrase: defDivCount=${defDivCount}, defDivVisible=${defDivVisible}, defInnerText=${defInnerText}`)
    // if (defDivCount > 0 && defDivVisible) {
    //   writeFileSync(outFile,
    //     `\n==================================\ninnerText:\n${defInnerText}\n==================================\n`,
    //     { flag: 'a+' })
    // }

    const wordDiv = page.getByRole('tabpanel').first().locator('div.pos-header')
    console.log('wordAndPronunciation: ', await wordDiv.innerText())

    const def = page.getByRole('tabpanel').first().locator('div.def-block div.ddef_h div.ddef_d')
    console.log('wordDefinition: ')

    for (const p of await def.all()) {
      console.log('textContent: ', await p.textContent())
    }

    // for (const p of await def.allTextContents()) {
    //   console.log('textContent: ', p)
    // }
    // for (const p of await def.allInnerTexts()) {
    //   console.log('inText: ', p)
    // }

    // console.log('combined textContent: ', await def.textContent()) // too many elements
    // console.log('combined innerText: ', await def.innerText())

    // try {
    //   const element = page.locator('div.di-body').first()
    //   await element.waitFor({ state: 'visible', timeout: 1 * 1000 });
    //   const defInnerText: string = await element.innerText();
    //   console.log(`data div wordOrPhrase=${wordOrPhrase}, defInnerText=${defInnerText}`)
    //   writeFileSync(outFile,
    //     `\n==================================\ninnerText:\n${defInnerText}\n==================================\n`,
    //     { flag: 'a+' });
    // } catch (e) {
    //   console.log(`not data div for wordOrPhrase: ${wordOrPhrase}`)
    // };
  }
});

test('smaller_lookup_word_in_cambridge_dict', async ({ page }) => {
  test.setTimeout(120 * 1000);
  page.setViewportSize({ width: 1920, height: 1200 });

  await page.goto('https://dictionary.cambridge.org/dictionary/english/bottomless');

  // const wordSpanArray = page.getByRole('tabpanel').first().locator('//div[contains(@class,"pos-header")]//span')
  // const wordSpanArray = page.getByRole('tabpanel').first().locator('div.pos-header span')
  const wordSpanArray = page.getByRole('tabpanel').first().locator('div.pos-header')
  console.log('wordAndPronunciation: ')
  const spanLen = await wordSpanArray.count()
  console.log('spanLen: ', spanLen)

  const allChildren = await wordSpanArray.all()
  for (const p of allChildren) {
    console.log('textContent: ', await p.textContent()) // ugly format
  }
  for (const p of allChildren) {
    console.log('innerText: ', await p.innerText()) // better format
  }

  const def = page.getByRole('tabpanel').first().locator('div.def-block div.ddef_h div.ddef_d')
  console.log('wordDefinition: ')

  for (const p of await def.all()) {
    console.log('textContent: ', await p.textContent())
  }
});