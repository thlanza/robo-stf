const puppeteer = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
require("dotenv").config();

puppeteerExtra.use(pluginStealth());

function timeout(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

module.exports = { 
    scrapperFunction: async function(numero, idAcao) {
    console.log('começando o scrap.');
    // const chromeArgs = [
    //     '--disable-background-timer-throttling',
    //     '--disable-backgrounding-occluded-windows',
    //     '--disable-renderer-backgrounding'
    //   ];
      const browser = await puppeteerExtra.launch({
        args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote"
        ],
        executablePath: process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath()
      });

    try {
        
          const context = await browser.createIncognitoBrowserContext();
        
          if (context.isIncognito()) {
            console.log('Modo navegação anônima ativado')
          }
        
          const page = await browser.newPage();  
          console.log('depois de page'); 
          await page.setRequestInterception(true)
            page.on('request', (request) => {
            if(request.resourceType() === 'stylesheet' || request.resourceType() === 'font' || request.resourceType() === 'image'){
                return request.abort();
            }
            if(request.url().includes('www.google-analytics.com')){
                return request.abort();
            }
            else request.continue()
            })
          page.setDefaultNavigationTimeout(0);
          await page.goto('https://portal.stf.jus.br/', {
            waitUntil: 'domcontentloaded',
          });
          console.log('depois de carregado')
        //   console.log("página", (await page.content()));
          await page.type('input[name="pesquisaPrincipalClasseNumero"]', numero);
          console.log('depois de digitar');
          const buttonSelector = '#btnPesquisar';
          const navigationPromise = page.waitForNavigation();
          await page.click(buttonSelector);
          await navigationPromise;
          console.log('depois de clicar no botão de submit');
          const acceptCookiesSelector = '#acceptCookies';
          await page.click(acceptCookiesSelector);
          await timeout(350);
          const navigationPromise2 = page.waitForNavigation();
          const linkIdAcao = await page.$x(`//a[contains(., '${idAcao}')]`);
            if (linkIdAcao) {
            await linkIdAcao[0].click();
            await navigationPromise2;
            } else {
                alert("LINK NÃO ENCONTRADO")
            }
          console.log('depois de clicar no link')
          console.log('depois de esperar a navegação após o link')
          await timeout(350);
         const processoPartesSelector = '.processo-partes'
         const processoPartes = await page.$$eval(processoPartesSelector,
            elements => elements.map(item => item.textContent));
         const numeroProcessoSelector = '.processo-rotulo';
         const processoClasseSelector = '.processo-classe';
         const processoDadosSelector = '.processo-dados';
    
        //  async function evalAndLog(selector) {
        //     const array = await page.$$eval(selector, elements => elements.map(item => item.textContent));
        //     console.log(selector, array);
        //  }
    
         async function arraySelectors(selector) {
            const array = await page.$$eval(selector, elements => elements.map(item => item.textContent));
            return array;
         }
    
          const arrayProcessoRotulo = await arraySelectors(numeroProcessoSelector);
          const stringProcessoRotulo = arrayProcessoRotulo[0];
          const [_, numeroProcesso ] = stringProcessoRotulo.split(':');
          const numeroProcessoTrimmed = numeroProcesso.trim();
          const arrayClasseDeProcesso = await arraySelectors(processoClasseSelector);
          const tipoDeProcesso = arrayClasseDeProcesso[1];
          const arrayProcessoDados = await arraySelectors(processoDadosSelector);
          const relatorString = arrayProcessoDados[1];
          const [__, relator] = relatorString.split(':');
          const relatorTrimmed = relator.trim();
          const origemString = arrayProcessoDados[0];
          const [___, origem] = origemString.split(':');
          const origemFormatada = origem.replace('\n', '');
          const origemTrimmed = origemFormatada.trim();
     
         let autorNome = processoPartes[1];
         let advogadosAutor = processoPartes[3];
         let reus = processoPartes[5];
         let advogadoReus = processoPartes[7].trim();
    
         const andamentoDetalheArray = await arraySelectors(".andamento-detalhe");

         function cleanStr(str) {
            let lines = str.split('\n');
            for (let i = 0; i < lines.length; i++) {
                lines[i] = lines[i].trim();
            }
            lines = lines.filter(element => element !== '');
            lines.join(' ');
            return lines;
        }

        let arrayDatas = andamentoDetalheArray.map(element => {
            let item = cleanStr(element);
            return {
                data: item[0],
                acao: item[1],
                detalhe: item[2] || '(sem detalhe)'
            }
        })
       
         let objetoFinal = {
            numeroProcesso: numeroProcessoTrimmed,
            tipoDeProcesso,
            origem: origemTrimmed,
            relator: relatorTrimmed,
            autorNome,
            advogadosAutor,
            reus,
            advogadoReus,
            andamento: arrayDatas
         }
         return objetoFinal;
        } catch(err) {
            console.log("stack, erro na função de scrap", err.stack);
            throw new Error('Erro na função scrap', err);
        } finally {
            await browser.close();
        }
    }
}



    
    